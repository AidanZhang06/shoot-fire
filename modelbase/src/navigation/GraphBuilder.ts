import { NavigationGraphImpl } from './NavigationGraph';
import { NavigationNode } from './types';
import { fireExits, createExitNode } from './FireExits';
import { stairwells, createStairNode } from './Stairs';

interface BuildingGeometry {
  floorNumber: number;
  sections: Array<{
    x: number;
    z: number;
    width: number;
    depth: number;
  }>;
  rooms: Array<{
    x: number;
    z: number;
    width: number;
    depth: number;
    label: string;
  }>;
  hasHallways: boolean;
  mainHallwayWidth: number;
  sideHallwayWidth: number;
  offsetX: number;
}

const GRID_RESOLUTION = 0.5; // Grid points every 0.5 units
const WALL_THICKNESS = 0.3;
const FLOOR_HEIGHT = 3.5;

export class GraphBuilder {
  private graph: NavigationGraphImpl;
  private floorHeight: number;

  constructor(floorHeight: number = FLOOR_HEIGHT) {
    this.graph = new NavigationGraphImpl();
    this.floorHeight = floorHeight;
  }

  buildGraph(buildingLevels: BuildingGeometry[]): NavigationGraphImpl {
    // First, add all fire exits - this ensures exits are always in the graph
    fireExits.forEach(exitDef => {
      const exitNode = createExitNode(exitDef);
      this.graph.addNode(exitNode);
    });

    // Add all stairwells to the graph
    stairwells.forEach(stairDef => {
      const stairNode = createStairNode(stairDef);
      this.graph.addNode(stairNode);
    });

    // Build graph for each floor
    buildingLevels.forEach(level => {
      this.buildFloorGraph(level);
    });

    // Connect floors via stairs (simplified - assume stairs at east and west ends)
    this.connectFloors(buildingLevels);

    return this.graph;
  }

  private buildFloorGraph(level: BuildingGeometry): void {
    const floorY = (level.floorNumber - 1) * this.floorHeight;
    const nodes: Map<string, NavigationNode> = new Map();

    // Generate grid points for each section
    level.sections.forEach((section, sectionIndex) => {
      const sectionX = section.x + level.offsetX;
      const sectionZ = section.z;

      // Generate grid points
      const gridPoints: Array<[number, number]> = [];
      
      for (let x = sectionX - section.width / 2; x <= sectionX + section.width / 2; x += GRID_RESOLUTION) {
        for (let z = sectionZ - section.depth / 2; z <= sectionZ + section.depth / 2; z += GRID_RESOLUTION) {
          gridPoints.push([x, z]);
        }
      }

      // Filter out points that are in walls or rooms (keep only hallways and walkable areas)
      gridPoints.forEach(([x, z]) => {
        if (this.isWalkable(x, z, level, sectionIndex)) {
          const nodeId = `node-${level.floorNumber}-${sectionIndex}-${x.toFixed(1)}-${z.toFixed(1)}`;
          const node: NavigationNode = {
            id: nodeId,
            position: [x, floorY, z],
            floor: level.floorNumber,
            type: this.getNodeType(x, z, level, sectionIndex),
            neighbors: [],
            blocked: false,
            smokeLevel: 0
          };
          nodes.set(nodeId, node);
        }
      });
    });

    // Add nodes to graph
    nodes.forEach(node => {
      this.graph.addNode(node);
    });

    // Connect adjacent nodes
    nodes.forEach((node, nodeId) => {
      nodes.forEach((otherNode, otherId) => {
        if (nodeId !== otherId) {
          const distance = Math.sqrt(
            Math.pow(node.position[0] - otherNode.position[0], 2) +
            Math.pow(node.position[2] - otherNode.position[2], 2)
          );
          
          // Connect if within grid resolution distance
          if (distance <= GRID_RESOLUTION * 1.5) {
            const weight = distance;
            this.graph.addEdge(nodeId, otherId, weight);
          }
        }
      });
    });

    // Connect to nearby exits on this floor - ensure exits are accessible
    const floorExits = fireExits.filter(e => e.floor === level.floorNumber);
    floorExits.forEach(exitDef => {
      const exitNode = this.graph.getNode(exitDef.id);
      if (exitNode) {
        // Connect exit to all nearby nodes within reasonable distance
        nodes.forEach((node, nodeId) => {
          const distance = Math.sqrt(
            Math.pow(node.position[0] - exitNode.position[0], 2) +
            Math.pow(node.position[2] - exitNode.position[2], 2)
          );
          
          // Increase connection radius to ensure exits are reachable
          if (distance <= 10) { // Connect exits to nearby nodes (increased from 3 to 10)
            this.graph.addEdge(nodeId, exitDef.id, distance);
          }
        });
        
        // Also connect exit to hallway center if it exists
        if (level.hasHallways) {
          const hallwayCenter: [number, number] = [section.x + level.offsetX, section.z];
          const exitDistance = Math.sqrt(
            Math.pow(exitDef.position[0] - hallwayCenter[0], 2) +
            Math.pow(exitDef.position[2] - hallwayCenter[1], 2)
          );
          
          // Find nearest hallway node
          let nearestHallwayNode: { id: string; distance: number } | null = null;
          nodes.forEach((node, nodeId) => {
            if (node.type === 'hallway') {
              const dist = Math.sqrt(
                Math.pow(node.position[0] - exitDef.position[0], 2) +
                Math.pow(node.position[2] - exitDef.position[2], 2)
              );
              if (!nearestHallwayNode || dist < nearestHallwayNode.distance) {
                nearestHallwayNode = { id: nodeId, distance: dist };
              }
            }
          });
          
          if (nearestHallwayNode) {
            this.graph.addEdge(nearestHallwayNode.id, exitDef.id, nearestHallwayNode.distance);
          }
        }
      }
    });
  }

  private isWalkable(x: number, z: number, level: BuildingGeometry, sectionIndex: number): boolean {
    // Check if point is in a room (not walkable)
    for (const room of level.rooms) {
      const roomLeft = room.x - room.width / 2;
      const roomRight = room.x + room.width / 2;
      const roomTop = room.z + room.depth / 2;
      const roomBottom = room.z - room.depth / 2;

      if (x >= roomLeft && x <= roomRight && z >= roomBottom && z <= roomTop) {
        return false; // Inside a room
      }
    }

    // Check if point is in hallway (walkable)
    if (level.hasHallways) {
      const section = level.sections[sectionIndex];
      const sectionX = section.x + level.offsetX;
      const sectionZ = section.z;

      // Main hallway (horizontal through main wing)
      if (sectionIndex === 0) {
        const hallwayTop = sectionZ + level.mainHallwayWidth / 2;
        const hallwayBottom = sectionZ - level.mainHallwayWidth / 2;
        
        if (z >= hallwayBottom && z <= hallwayTop) {
          return true; // In main hallway
        }
      }

      // Side hallway (vertical through side wing)
      if (sectionIndex === 1) {
        const hallwayLeft = sectionX - level.sideHallwayWidth / 2;
        const hallwayRight = sectionX + level.sideHallwayWidth / 2;
        
        if (x >= hallwayLeft && x <= hallwayRight) {
          return true; // In side hallway
        }
      }
    }

    // For floors without hallways, allow walkable space around rooms
    // This is a simplified check - in reality, you'd need more detailed geometry
    return true;
  }

  private getNodeType(x: number, z: number, level: BuildingGeometry, sectionIndex: number): 'hallway' | 'room' | 'exit' | 'stair' {
    if (level.hasHallways) {
      const section = level.sections[sectionIndex];
      const sectionX = section.x + level.offsetX;
      const sectionZ = section.z;

      // Check if in hallway
      if (sectionIndex === 0) {
        const hallwayTop = sectionZ + level.mainHallwayWidth / 2;
        const hallwayBottom = sectionZ - level.mainHallwayWidth / 2;
        if (z >= hallwayBottom && z <= hallwayTop) {
          return 'hallway';
        }
      }

      if (sectionIndex === 1) {
        const hallwayLeft = sectionX - level.sideHallwayWidth / 2;
        const hallwayRight = sectionX + level.sideHallwayWidth / 2;
        if (x >= hallwayLeft && x <= hallwayRight) {
          return 'hallway';
        }
      }
    }

    return 'room';
  }

  private connectFloors(levels: BuildingGeometry[]): void {
    // Connect floors via stairs using stairwell definitions
    stairwells.forEach(stair => {
      const stairNode = this.graph.getNode(stair.id);
      if (!stairNode) return;

      // Connect to nodes on the same floor near the stairwell
      const sameFloorNodes = this.graph.getNodesOnFloor(stair.floor);
      sameFloorNodes.forEach(node => {
        if (node.id !== stair.id) {
          const distance = Math.sqrt(
            Math.pow(node.position[0] - stair.position[0], 2) +
            Math.pow(node.position[2] - stair.position[2], 2)
          );
          if (distance <= 5) {
            this.graph.addEdge(node.id, stair.id, distance);
          }
        }
      });

      // Connect to stairwells on adjacent floors
      stair.connectsTo.forEach(targetFloor => {
        const targetStairs = stairwells.filter(s => 
          s.floor === targetFloor && 
          Math.abs(s.position[0] - stair.position[0]) < 1 // Same x position (east or west)
        );
        
        targetStairs.forEach(targetStair => {
          const targetNode = this.graph.getNode(targetStair.id);
          if (targetNode) {
            // Stairs cost more (5 units) to represent the effort of going up/down
            this.graph.addEdge(stair.id, targetStair.id, 5);
          }
        });
      });
    });
  }
}

