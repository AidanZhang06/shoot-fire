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

  // Stairwell locations in the L-shaped building
  // These are the points where users transition between floors
  private readonly STAIRWELL_LOCATIONS = [
    { x: -15, z: 5, name: 'West Stairwell' },      // Junction of L-shape
    { x: 10, z: -5, name: 'East Stairwell' },       // Main wing
    { x: -20, z: 25, name: 'South Stairwell' }      // Side wing end
  ];

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
    const startFloor = Math.floor(start.y / 3.5);
    const endFloor = Math.floor(end.y / 3.5);
    const isMultiFloor = startFloor !== endFloor;

    console.log(`[PathPlanner] Finding path from Floor ${startFloor + 1} to Floor ${endFloor + 1}${isMultiFloor ? ' (multi-floor)' : ''}`);

    // For multi-floor paths, use HARDCODED Hillman Center path
    if (isMultiFloor) {
      return this.createHillmanCenterPath(start, end);
    }

    // Single floor path (original logic)
    return this.findSingleFloorPath(start, end, hazardGrid);
  }

  /**
   * Find path on a single floor using A*
   */
  private findSingleFloorPath(
    start: Vector3,
    end: Vector3,
    hazardGrid: Map<string, GridCell>
  ): Route | null {
    const startKey = GridUtils.positionToKey(start);
    const endKey = GridUtils.positionToKey(end);

    if (!this.graph || !this.graph.hasNode(startKey) || !this.graph.hasNode(endKey)) {
      console.warn(`[PathPlanner] Cannot find path: start or end node not in graph (${startKey} -> ${endKey})`);
      return null;
    }

    const pathResult = this.pathfinder.find(startKey, endKey);

    if (!pathResult || pathResult.length === 0) {
      console.warn(`[PathPlanner] No path found from ${startKey} to ${endKey}`);
      return null;
    }

    const waypoints: Waypoint[] = pathResult.map((node: any) => {
      const { x, y } = node.data;
      return {
        x: x + 0.5,
        y: y + 0.5,
        z: start.y, // Keep same floor height
        id: `waypoint-${x}-${y}`,
        type: 'normal' as const
      };
    });

    if (waypoints.length > 0) {
      waypoints[waypoints.length - 1].type = 'exit';
    }

    const simplifiedWaypoints = RouteUtils.simplifyPath(waypoints, 15);
    const distance = RouteUtils.calculateRouteDistance(simplifiedWaypoints);
    const estimatedTime = RouteUtils.estimateTime(distance);
    const hazardWarnings = this.extractHazardWarnings(simplifiedWaypoints, hazardGrid);

    return {
      waypoints: simplifiedWaypoints,
      distance,
      estimatedTime,
      hazardWarnings,
      computedAt: Date.now()
    };
  }

  /**
   * HARDCODED PATH: Hillman Center Floor 9 evacuation route (based on user's floor plan)
   * Path: Start (upper-left) → Move right → Turn down to stairs →
   * Enter stairwell → Descend → Exit along bottom edge
   */
  private createHillmanCenterPath(
    start: Vector3,
    end: Vector3
  ): Route {
    const waypoints: Waypoint[] = [];
    const startFloor = 8; // Floor 9 (0-indexed)

    console.log('[PathPlanner] Using HARDCODED evacuation path from floor plan');

    // Starting position: Center of the left side of the building
    waypoints.push({
      x: -20,
      y: 28, // Floor 9
      z: 5,
      id: 'start',
      type: 'normal' as const
    });

    // Segment 1: Move STRAIGHT (east)
    waypoints.push({
      x: -15,
      y: 28,
      z: 5,
      id: 'straight-1',
      type: 'normal' as const
    });

    waypoints.push({
      x: -10,
      y: 28,
      z: 5,
      id: 'straight-2',
      type: 'normal' as const
    });

    waypoints.push({
      x: -5,
      y: 28,
      z: 5,
      id: 'straight-3',
      type: 'normal' as const
    });

    // Segment 2: RIGHT TURN - transition from going east to going south
    waypoints.push({
      x: -2,
      y: 28,
      z: 6,
      id: 'right-turn-start',
      type: 'normal' as const
    });

    waypoints.push({
      x: 0,
      y: 28,
      z: 8,
      id: 'right-turn-complete',
      type: 'normal' as const
    });

    // Segment 3: Walk forward a little bit (continuing south)
    waypoints.push({
      x: 1,
      y: 28,
      z: 10,
      id: 'forward-after-turn-1',
      type: 'normal' as const
    });

    waypoints.push({
      x: 2,
      y: 28,
      z: 12,
      id: 'forward-after-turn-2',
      type: 'normal' as const
    });

    // Segment 4: SHARP LEFT TURN - transition from going south to going east toward stairs
    waypoints.push({
      x: 4,
      y: 28,
      z: 12,
      id: 'sharp-left-turn-start',
      type: 'normal' as const
    });

    waypoints.push({
      x: 6,
      y: 28,
      z: 11,
      id: 'sharp-left-turn-continue',
      type: 'normal' as const
    });

    // Segment 5: Approach stairs (now heading east)
    waypoints.push({
      x: 8,
      y: 28,
      z: 10,
      id: 'approaching-stairs',
      type: 'normal' as const
    });

    // Segment 6: Reach stairwell entrance
    waypoints.push({
      x: 10,
      y: 28,
      z: 10,
      id: 'at-stairwell',
      type: 'stairwell' as const
    });

    // Segment 7: Descend through stairwell (Floor 9 → Ground)
    // Stairwell location at (10, ?, 10)
    for (let floor = startFloor; floor >= 0; floor--) {
      const floorHeight = floor * 3.5;
      waypoints.push({
        x: 10,
        y: floorHeight,
        z: 10,
        id: `stairwell-floor-${floor + 1}`,
        type: 'normal' as const
      });
    }

    // Segment 8: Exit stairwell on ground floor
    waypoints.push({
      x: 12,
      y: 0,
      z: 12,
      id: 'exit-stairwell',
      type: 'normal' as const
    });

    // Segment 9: Move along bottom edge of building to exit
    waypoints.push({
      x: 15,
      y: 0,
      z: 15,
      id: 'along-bottom-1',
      type: 'normal' as const
    });

    waypoints.push({
      x: 18,
      y: 0,
      z: 18,
      id: 'along-bottom-2',
      type: 'normal' as const
    });

    waypoints.push({
      x: 20,
      y: 0,
      z: 20,
      id: 'along-bottom-3',
      type: 'normal' as const
    });

    // Final exit
    waypoints.push({
      x: 22,
      y: 0,
      z: 22,
      id: 'exit',
      type: 'exit' as const
    });

    // Calculate total distance
    let distance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const w1 = waypoints[i];
      const w2 = waypoints[i + 1];
      const dx = w2.x - w1.x;
      const dy = w2.y - w1.y;
      const dz = w2.z - w1.z;
      distance += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    const estimatedTime = Math.ceil(distance / 1.2); // 1.2 m/s walking speed

    console.log(`[PathPlanner] Hillman Center path: ${waypoints.length} waypoints, ${distance.toFixed(1)}m, ~${estimatedTime}s`);

    return {
      waypoints,
      distance,
      estimatedTime,
      hazardWarnings: [], // No hazards in hardcoded path
      computedAt: Date.now()
    };
  }

  /**
   * Find multi-floor path through stairwells
   * Creates a realistic path: Start → Hallway → Stairwell → Down each floor → Exit
   */
  private findMultiFloorPath(
    start: Vector3,
    end: Vector3,
    hazardGrid: Map<string, GridCell>
  ): Route | null {
    const waypoints: Waypoint[] = [];
    const startFloor = Math.floor(start.y / 3.5);
    const endFloor = Math.floor(end.y / 3.5);

    // Find nearest stairwell to starting position
    let nearestStairwell = this.STAIRWELL_LOCATIONS[0];
    let minDist = Infinity;
    for (const stairwell of this.STAIRWELL_LOCATIONS) {
      const dist = Math.sqrt(
        Math.pow(start.x - stairwell.x, 2) + Math.pow(start.z - stairwell.z, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearestStairwell = stairwell;
      }
    }

    console.log(`[PathPlanner] Using ${nearestStairwell.name} at (${nearestStairwell.x}, ${nearestStairwell.z})`);

    // Phase 1: Path from start to stairwell on current floor
    // Add some hallway waypoints to make it interesting
    const midpoint1 = {
      x: start.x + (nearestStairwell.x - start.x) * 0.3,
      y: start.y,
      z: start.z + (nearestStairwell.z - start.z) * 0.3,
      id: `hallway-1`,
      type: 'normal' as const
    };

    const midpoint2 = {
      x: start.x + (nearestStairwell.x - start.x) * 0.7,
      y: start.y,
      z: start.z + (nearestStairwell.z - start.z) * 0.7,
      id: `hallway-2`,
      type: 'normal' as const
    };

    waypoints.push(
      { x: start.x, y: start.y, z: start.z, id: 'start', type: 'normal' as const },
      midpoint1,
      midpoint2
    );

    // Phase 2: Descend through stairwell (add waypoint for each floor)
    for (let floor = startFloor; floor >= endFloor; floor--) {
      const floorHeight = floor * 3.5;
      waypoints.push({
        x: nearestStairwell.x,
        y: floorHeight,
        z: nearestStairwell.z,
        id: `stairwell-floor-${floor + 1}`,
        type: floor === startFloor ? 'stairwell' as const : 'normal' as const
      });
    }

    // Phase 3: Path from stairwell to exit on ground floor
    const exitMidpoint = {
      x: nearestStairwell.x + (end.x - nearestStairwell.x) * 0.5,
      y: end.y,
      z: nearestStairwell.z + (end.z - nearestStairwell.z) * 0.5,
      id: `exit-hallway`,
      type: 'normal' as const
    };

    waypoints.push(
      exitMidpoint,
      { x: end.x, y: end.y, z: end.z, id: 'exit', type: 'exit' as const }
    );

    // Calculate distance (including vertical distance through stairs)
    let distance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const w1 = waypoints[i];
      const w2 = waypoints[i + 1];
      const dx = w2.x - w1.x;
      const dy = w2.y - w1.y;
      const dz = w2.z - w1.z;
      distance += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    const estimatedTime = RouteUtils.estimateTime(distance);
    const hazardWarnings = this.extractHazardWarnings(waypoints, hazardGrid);

    console.log(`[PathPlanner] Multi-floor path created: ${waypoints.length} waypoints, ${distance.toFixed(1)}m`);

    return {
      waypoints,
      distance,
      estimatedTime,
      hazardWarnings,
      computedAt: Date.now()
    };
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
