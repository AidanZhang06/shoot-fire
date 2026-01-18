/**
 * Path Planner Service
 * A* pathfinding with hazard-aware weight penalties
 */

import createGraph from 'ngraph.graph';
import path from 'ngraph.path';
import { GridCell, Route, Waypoint, Vector3, HazardWarning } from '../types/schemas';
import { GridUtils } from '../utils/grid-utils';
import { RouteUtils } from '../utils/route-utils';

export class PathPlannerService {
  private graph: any;
  private pathfinder: any;

  // Grid configuration
  private readonly GRID_SIZE = 1; // 1 meter per cell

  // Penalty configuration
  private readonly FIRE_MULTIPLIER = 0.5;
  private readonly SMOKE_MULTIPLIER = 0.3;
  private readonly CROWDING_MULTIPLIER = 5;
  private readonly CROWDING_THRESHOLD = 2; // people per cell
  private readonly IMPASSABLE_FIRE_THRESHOLD = 4.5;

  /**
   * Build navigation graph from hazard grid
   * Creates nodes for walkable cells and edges with weighted costs
   */
  buildGraph(
    hazardGrid: Map<string, GridCell>,
    dimensions: { width: number; height: number }
  ): void {
    console.log(`[PathPlanner] Building graph for ${dimensions.width}x${dimensions.height} grid`);

    this.graph = createGraph();

    // Create nodes for each grid cell
    for (let x = 0; x < dimensions.width; x++) {
      for (let y = 0; y < dimensions.height; y++) {
        const key = `${x}_${y}`;
        const cell = hazardGrid.get(key);

        // Skip impassable cells (high-intensity fire)
        if (this.isWalkable(cell)) {
          this.graph.addNode(key, { x, y });
        }
      }
    }

    // Create edges between adjacent nodes
    for (let x = 0; x < dimensions.width; x++) {
      for (let y = 0; y < dimensions.height; y++) {
        const fromKey = `${x}_${y}`;

        if (!this.graph.hasNode(fromKey)) continue;

        const neighbors = GridUtils.getNeighbors(x, y);

        for (const neighbor of neighbors) {
          const { x: nx, y: ny, distance: baseDistance } = neighbor;

          // Check bounds
          if (!GridUtils.isInBounds(nx, ny, dimensions.width, dimensions.height)) {
            continue;
          }

          const toKey = `${nx}_${ny}`;

          if (!this.graph.hasNode(toKey)) continue;

          // Calculate weight with hazard penalties
          const weight = this.calculateWeight(fromKey, toKey, baseDistance, hazardGrid);
          this.graph.addLink(fromKey, toKey, { weight });
        }
      }
    }

    // Initialize A* pathfinder
    this.pathfinder = path.aStar(this.graph, {
      distance: (fromNode: any, toNode: any, link: any) => {
        return link.data.weight;
      }
    });

    console.log(`[PathPlanner] Graph built with ${this.graph.getNodesCount()} nodes and ${this.graph.getLinksCount()} edges`);
  }

  /**
   * Find path from start to end using A*
   */
  findPath(
    start: Vector3,
    end: Vector3,
    hazardGrid: Map<string, GridCell>
  ): Route | null {
    // Convert positions to grid coordinates
    const startKey = GridUtils.positionToKey(start);
    const endKey = GridUtils.positionToKey(end);

    // Check if start and end nodes exist in graph
    if (!this.graph || !this.graph.hasNode(startKey) || !this.graph.hasNode(endKey)) {
      console.warn(`[PathPlanner] Cannot find path: start or end node not in graph (${startKey} -> ${endKey})`);
      return null;
    }

    // Run A* pathfinding
    const pathResult = this.pathfinder.find(startKey, endKey);

    if (!pathResult || pathResult.length === 0) {
      console.warn(`[PathPlanner] No path found from ${startKey} to ${endKey}`);
      return null;
    }

    // Convert path to waypoints
    const waypoints: Waypoint[] = pathResult.map((node: any) => {
      const { x, y } = node.data;
      return {
        x: x + 0.5,
        y: y + 0.5,
        z: 0,
        id: `waypoint-${x}-${y}`,
        type: 'normal' as const
      };
    });

    // Mark the last waypoint as exit
    if (waypoints.length > 0) {
      waypoints[waypoints.length - 1].type = 'exit';
    }

    // Simplify path
    const simplifiedWaypoints = RouteUtils.simplifyPath(waypoints, 15);

    // Calculate distance and time
    const distance = RouteUtils.calculateRouteDistance(simplifiedWaypoints);
    const estimatedTime = RouteUtils.estimateTime(distance);

    // Extract hazard warnings
    const hazardWarnings = this.extractHazardWarnings(simplifiedWaypoints, hazardGrid);

    const route: Route = {
      waypoints: simplifiedWaypoints,
      distance,
      estimatedTime,
      hazardWarnings,
      computedAt: Date.now()
    };

    return route;
  }

  /**
   * Calculate edge weight based on hazards
   * weight = distance * (1 + penalties)
   */
  private calculateWeight(
    fromKey: string,
    toKey: string,
    baseDistance: number,
    hazardGrid: Map<string, GridCell>
  ): number {
    // Get cells for from and to positions
    const fromCell = hazardGrid.get(fromKey);
    const toCell = hazardGrid.get(toKey);

    let totalPenalty = 0;

    // Calculate penalties for both cells (average)
    const cells = [fromCell, toCell].filter(c => c !== undefined);

    for (const cell of cells) {
      if (!cell) continue;

      // Fire penalty: exponential
      if (cell.fire) {
        const firePenalty = Math.exp(cell.fire.intensity * this.FIRE_MULTIPLIER);
        totalPenalty += firePenalty;
      }

      // Smoke penalty: linear
      if (cell.smoke) {
        const smokePenalty = cell.smoke.intensity * this.SMOKE_MULTIPLIER;
        totalPenalty += smokePenalty;
      }

      // Crowding penalty: linear above threshold
      if (cell.crowding && cell.crowding.density > this.CROWDING_THRESHOLD) {
        const crowdingPenalty = (cell.crowding.density - this.CROWDING_THRESHOLD) * this.CROWDING_MULTIPLIER;
        totalPenalty += crowdingPenalty;
      }
    }

    // Average penalties if we checked multiple cells
    if (cells.length > 0) {
      totalPenalty /= cells.length;
    }

    // Apply penalties to base distance
    return baseDistance * (1 + totalPenalty);
  }

  /**
   * Check if a grid cell is walkable (not impassable)
   */
  private isWalkable(cell: GridCell | undefined): boolean {
    if (!cell) return true; // Empty cells are walkable

    // Impassable if fire intensity too high
    if (cell.fire && cell.fire.intensity > this.IMPASSABLE_FIRE_THRESHOLD) {
      return false;
    }

    // Impassable if obstacle is impassable
    const hasImpassableObstacle = cell.obstacles.some(
      obstacle => obstacle.severity === 'impassable'
    );

    return !hasImpassableObstacle;
  }

  /**
   * Extract hazard warnings along the path
   */
  private extractHazardWarnings(
    waypoints: Waypoint[],
    hazardGrid: Map<string, GridCell>
  ): HazardWarning[] {
    const warnings: HazardWarning[] = [];
    const processedCells = new Set<string>();

    for (const waypoint of waypoints) {
      const key = GridUtils.positionToKey(waypoint);

      if (processedCells.has(key)) continue;
      processedCells.add(key);

      const cell = hazardGrid.get(key);
      if (!cell) continue;

      // Fire warning
      if (cell.fire && cell.fire.intensity > 2) {
        warnings.push({
          type: 'fire',
          severity: cell.fire.intensity > 4 ? 'critical' : cell.fire.intensity > 3 ? 'high' : 'medium',
          location: waypoint,
          message: `Fire detected: intensity ${cell.fire.intensity.toFixed(1)}/5`
        });
      }

      // Smoke warning
      if (cell.smoke && cell.smoke.intensity > 2) {
        warnings.push({
          type: 'smoke',
          severity: cell.smoke.intensity > 4 ? 'high' : 'medium',
          location: waypoint,
          message: `Smoke detected: density ${cell.smoke.intensity.toFixed(1)}/5`
        });
      }

      // Obstacle warning
      const difficultObstacles = cell.obstacles.filter(
        o => o.severity === 'difficult' || o.severity === 'impassable'
      );
      if (difficultObstacles.length > 0) {
        warnings.push({
          type: 'obstacle',
          severity: 'low',
          location: waypoint,
          message: `Obstacles ahead: ${difficultObstacles.map(o => o.type).join(', ')}`
        });
      }
    }

    return warnings;
  }

  /**
   * Get graph statistics
   */
  getGraphStats() {
    if (!this.graph) {
      return { nodes: 0, edges: 0 };
    }

    return {
      nodes: this.graph.getNodesCount(),
      edges: this.graph.getLinksCount()
    };
  }
}
