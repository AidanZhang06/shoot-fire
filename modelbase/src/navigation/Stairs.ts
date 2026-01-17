import { NavigationNode } from './types';

// Stairwell definitions for Gates Building
export interface StairwellDefinition {
  id: string;
  floor: number;
  position: [number, number, number]; // x, y (floor height), z
  direction: 'up' | 'down' | 'both';
  connectsTo: number[]; // Floor numbers this connects to
}

// Helper function to calculate stair positions based on building dimensions
function getStairPositions(floorNum: number): { east: number; west: number; south: number; sideWingX: number } {
  const mainWingWidth = 45 - (floorNum - 1) * 1.2;
  const sideWingWidth = 15;
  const sideWingDepth = 35 - (floorNum - 1) * 1;
  const offsetX = floorNum >= 7 ? 2 + (floorNum - 6) * 0.8 : 0;
  
  // Position stairs inside building, 2 units from edges
  // Main wing stairs (east-west)
  const eastX = (mainWingWidth / 2) - 2 + offsetX;
  const westX = -(mainWingWidth / 2) + 2 + offsetX;
  
  // Side wing stairs (north-south)
  const sideWingX = -mainWingWidth / 2 + sideWingWidth / 2 + offsetX;
  const southZ = sideWingDepth / 2 - 2; // 2 units from south edge
  
  return { east: eastX, west: westX, south: southZ, sideWingX };
}

export const stairwells: StairwellDefinition[] = [
  // Main wing - East stairwell - connects all floors
  { id: 'stairs-east-1-2', floor: 1, position: [getStairPositions(1).east, 0, 0], direction: 'up', connectsTo: [2] },
  { id: 'stairs-east-2-3', floor: 2, position: [getStairPositions(2).east, 3.5, 0], direction: 'both', connectsTo: [1, 3] },
  { id: 'stairs-east-3-4', floor: 3, position: [getStairPositions(3).east, 7, 0], direction: 'both', connectsTo: [2, 4] },
  { id: 'stairs-east-4-5', floor: 4, position: [getStairPositions(4).east, 10.5, 0], direction: 'both', connectsTo: [3, 5] },
  { id: 'stairs-east-5-6', floor: 5, position: [getStairPositions(5).east, 14, 0], direction: 'both', connectsTo: [4, 6] },
  { id: 'stairs-east-6-7', floor: 6, position: [getStairPositions(6).east, 17.5, 0], direction: 'both', connectsTo: [5, 7] },
  { id: 'stairs-east-7-8', floor: 7, position: [getStairPositions(7).east, 21, 0], direction: 'both', connectsTo: [6, 8] },
  { id: 'stairs-east-8-9', floor: 8, position: [getStairPositions(8).east, 24.5, 0], direction: 'both', connectsTo: [7, 9] },
  { id: 'stairs-east-9', floor: 9, position: [getStairPositions(9).east, 28, 0], direction: 'down', connectsTo: [8] },

  // Main wing - West stairwell - connects all floors
  { id: 'stairs-west-1-2', floor: 1, position: [getStairPositions(1).west, 0, 0], direction: 'up', connectsTo: [2] },
  { id: 'stairs-west-2-3', floor: 2, position: [getStairPositions(2).west, 3.5, 0], direction: 'both', connectsTo: [1, 3] },
  { id: 'stairs-west-3-4', floor: 3, position: [getStairPositions(3).west, 7, 0], direction: 'both', connectsTo: [2, 4] },
  { id: 'stairs-west-4-5', floor: 4, position: [getStairPositions(4).west, 10.5, 0], direction: 'both', connectsTo: [3, 5] },
  { id: 'stairs-west-5-6', floor: 5, position: [getStairPositions(5).west, 14, 0], direction: 'both', connectsTo: [4, 6] },
  { id: 'stairs-west-6-7', floor: 6, position: [getStairPositions(6).west, 17.5, 0], direction: 'both', connectsTo: [5, 7] },
  { id: 'stairs-west-7-8', floor: 7, position: [getStairPositions(7).west, 21, 0], direction: 'both', connectsTo: [6, 8] },
  { id: 'stairs-west-8-9', floor: 8, position: [getStairPositions(8).west, 24.5, 0], direction: 'both', connectsTo: [7, 9] },
  { id: 'stairs-west-9', floor: 9, position: [getStairPositions(9).west, 28, 0], direction: 'down', connectsTo: [8] },

  // Side wing - South stairwell - connects all floors (in the side wing)
  { id: 'stairs-south-1-2', floor: 1, position: [getStairPositions(1).sideWingX, 0, getStairPositions(1).south], direction: 'up', connectsTo: [2] },
  { id: 'stairs-south-2-3', floor: 2, position: [getStairPositions(2).sideWingX, 3.5, getStairPositions(2).south], direction: 'both', connectsTo: [1, 3] },
  { id: 'stairs-south-3-4', floor: 3, position: [getStairPositions(3).sideWingX, 7, getStairPositions(3).south], direction: 'both', connectsTo: [2, 4] },
  { id: 'stairs-south-4-5', floor: 4, position: [getStairPositions(4).sideWingX, 10.5, getStairPositions(4).south], direction: 'both', connectsTo: [3, 5] },
  { id: 'stairs-south-5-6', floor: 5, position: [getStairPositions(5).sideWingX, 14, getStairPositions(5).south], direction: 'both', connectsTo: [4, 6] },
  { id: 'stairs-south-6-7', floor: 6, position: [getStairPositions(6).sideWingX, 17.5, getStairPositions(6).south], direction: 'both', connectsTo: [5, 7] },
  { id: 'stairs-south-7-8', floor: 7, position: [getStairPositions(7).sideWingX, 21, getStairPositions(7).south], direction: 'both', connectsTo: [6, 8] },
  { id: 'stairs-south-8-9', floor: 8, position: [getStairPositions(8).sideWingX, 24.5, getStairPositions(8).south], direction: 'both', connectsTo: [7, 9] },
  { id: 'stairs-south-9', floor: 9, position: [getStairPositions(9).sideWingX, 28, getStairPositions(9).south], direction: 'down', connectsTo: [8] },
];

export function createStairNode(stairDef: StairwellDefinition): NavigationNode {
  return {
    id: stairDef.id,
    position: stairDef.position,
    floor: stairDef.floor,
    type: 'stair',
    neighbors: [],
    blocked: false,
    smokeLevel: 0
  };
}

