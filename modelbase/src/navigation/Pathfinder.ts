import { NavigationGraphImpl } from './NavigationGraph';
import { Path } from './types';

interface AStarNode {
  id: string;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost
  parent: string | null;
}

export class Pathfinder {
  private graph: NavigationGraphImpl;

  constructor(graph: NavigationGraphImpl) {
    this.graph = graph;
  }

  // A* pathfinding algorithm
  findPath(startId: string, goalId: string): Path | null {
    const startNode = this.graph.getNode(startId);
    const goalNode = this.graph.getNode(goalId);

    if (!startNode || !goalNode) {
      return null;
    }

    if (startNode.blocked || goalNode.blocked) {
      return null;
    }

    const openSet = new Map<string, AStarNode>();
    const closedSet = new Set<string>();

    const start: AStarNode = {
      id: startId,
      g: 0,
      h: this.heuristic(startNode, goalNode),
      f: 0,
      parent: null
    };
    start.f = start.g + start.h;
    openSet.set(startId, start);

    while (openSet.size > 0) {
      // Get node with lowest f score
      let current: AStarNode | null = null;
      let lowestF = Infinity;

      for (const node of openSet.values()) {
        if (node.f < lowestF) {
          lowestF = node.f;
          current = node;
        }
      }

      if (!current) break;

      if (current.id === goalId) {
        // Reconstruct path
        const path: string[] = [];
        let node: AStarNode | null = current;
        while (node) {
          path.unshift(node.id);
          node = node.parent ? openSet.get(node.parent) || null : null;
        }

        const totalCost = current.g;
        const estimatedTime = totalCost * 2; // Assume 2 seconds per unit cost

        return {
          nodes: path,
          totalCost,
          estimatedTime,
          safe: this.isPathSafe(path)
        };
      }

      openSet.delete(current.id);
      closedSet.add(current.id);

      const currentNode = this.graph.getNode(current.id);
      if (!currentNode) continue;

      for (const neighborId of currentNode.neighbors) {
        if (closedSet.has(neighborId)) continue;

        const neighborNode = this.graph.getNode(neighborId);
        if (!neighborNode || neighborNode.blocked) continue;

        const edgeWeight = this.graph.getEffectiveWeight(current.id, neighborId);
        if (edgeWeight === Infinity) continue;

        const tentativeG = current.g + edgeWeight;

        let neighbor = openSet.get(neighborId);
        if (!neighbor) {
          neighbor = {
            id: neighborId,
            g: tentativeG,
            h: this.heuristic(neighborNode, goalNode),
            f: 0,
            parent: current.id
          };
          neighbor.f = neighbor.g + neighbor.h;
          openSet.set(neighborId, neighbor);
        } else if (tentativeG < neighbor.g) {
          neighbor.g = tentativeG;
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current.id;
        }
      }
    }

    return null; // No path found
  }

  // Find path to nearest exit
  findPathToNearestExit(startId: string): Path | null {
    const exits = this.graph.getExits();
    if (exits.length === 0) return null;

    let bestPath: Path | null = null;
    let shortestDistance = Infinity;

    for (const exit of exits) {
      const path = this.findPath(startId, exit.id);
      if (path && path.totalCost < shortestDistance) {
        shortestDistance = path.totalCost;
        bestPath = path;
      }
    }

    return bestPath;
  }

  // Heuristic: Euclidean distance
  private heuristic(nodeA: { position: [number, number, number] }, nodeB: { position: [number, number, number] }): number {
    const dx = nodeA.position[0] - nodeB.position[0];
    const dy = nodeA.position[1] - nodeB.position[1];
    const dz = nodeA.position[2] - nodeB.position[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Check if path is safe (no fire, low smoke)
  private isPathSafe(path: string[]): boolean {
    for (const nodeId of path) {
      const node = this.graph.getNode(nodeId);
      if (node?.blocked || (node?.smokeLevel && node.smokeLevel > 0.7)) {
        return false;
      }
    }
    return true;
  }

  // Get all reachable nodes from a starting point
  getReachableNodes(startId: string, maxDistance: number = Infinity): string[] {
    const visited = new Set<string>();
    const queue: Array<{ id: string; distance: number }> = [{ id: startId, distance: 0 }];

    while (queue.length > 0) {
      const { id, distance } = queue.shift()!;
      
      if (visited.has(id) || distance > maxDistance) continue;
      visited.add(id);

      const node = this.graph.getNode(id);
      if (!node || node.blocked) continue;

      for (const neighborId of node.neighbors) {
        if (!visited.has(neighborId)) {
          const edgeWeight = this.graph.getEffectiveWeight(id, neighborId);
          if (edgeWeight !== Infinity) {
            queue.push({ id: neighborId, distance: distance + edgeWeight });
          }
        }
      }
    }

    return Array.from(visited);
  }
}

