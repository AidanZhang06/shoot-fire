import { NavigationNode } from './types';

// Helper function to calculate exit positions based on building dimensions
function getExitPositions(floorNum: number): { east: number; west: number; south: number } {
  const mainWingWidth = 45 - (floorNum - 1) * 1.2;
  const offsetX = floorNum >= 7 ? 2 + (floorNum - 6) * 0.8 : 0;
  
  // Position exits inside building, near edges but accessible
  const eastX = (mainWingWidth / 2) - 1.5 + offsetX;
  const westX = -(mainWingWidth / 2) + 1.5 + offsetX;
  const southZ = 15; // Inside side wing
  
  return { east: eastX, west: westX, south: southZ };
}

// Fire exit definitions for Gates Building
// These are based on typical building code requirements - exits at ends of corridors and near stairs
export interface FireExitDefinition {
  id: string;
  floor: number;
  position: [number, number, number]; // x, y (floor height), z
  label: string;
  description: string;
}

export const fireExits: FireExitDefinition[] = [
  // Floor 1 - Ground level exits
  {
    id: 'exit-1-east',
    floor: 1,
    position: [getExitPositions(1).east, 0, 0],
    label: 'EXIT 1',
    description: 'East Main Entrance'
  },
  {
    id: 'exit-1-west',
    floor: 1,
    position: [getExitPositions(1).west, 0, 0],
    label: 'EXIT 2',
    description: 'West Main Entrance'
  },
  {
    id: 'exit-1-south',
    floor: 1,
    position: [getExitPositions(1).west, 0, getExitPositions(1).south],
    label: 'EXIT 3',
    description: 'South Side Exit'
  },
  
  // Floor 3 - Public floor
  {
    id: 'exit-3-east',
    floor: 3,
    position: [getExitPositions(3).east, 10.5, 0],
    label: 'EXIT 1',
    description: 'East Stairwell Exit'
  },
  {
    id: 'exit-3-west',
    floor: 3,
    position: [getExitPositions(3).west, 10.5, 0],
    label: 'EXIT 2',
    description: 'West Stairwell Exit'
  },
  
  // Floor 4
  {
    id: 'exit-4-east',
    floor: 4,
    position: [getExitPositions(4).east, 14, 0],
    label: 'EXIT 1',
    description: 'East Stairwell Exit'
  },
  {
    id: 'exit-4-west',
    floor: 4,
    position: [getExitPositions(4).west, 14, 0],
    label: 'EXIT 2',
    description: 'West Stairwell Exit'
  },
  
  // Floor 5
  {
    id: 'exit-5-east',
    floor: 5,
    position: [getExitPositions(5).east, 17.5, 0],
    label: 'EXIT 1',
    description: 'East Stairwell Exit'
  },
  {
    id: 'exit-5-west',
    floor: 5,
    position: [getExitPositions(5).west, 17.5, 0],
    label: 'EXIT 2',
    description: 'West Stairwell Exit'
  },
  
  // Floor 6 - Modular floors
  {
    id: 'exit-6-east',
    floor: 6,
    position: [getExitPositions(6).east, 21, 0],
    label: 'EXIT 1',
    description: 'East Stairwell Exit'
  },
  {
    id: 'exit-6-west',
    floor: 6,
    position: [getExitPositions(6).west, 21, 0],
    label: 'EXIT 2',
    description: 'West Stairwell Exit'
  },
  {
    id: 'exit-6-south',
    floor: 6,
    position: [getExitPositions(6).west, 21, getExitPositions(6).south],
    label: 'EXIT 3',
    description: 'South Side Exit'
  },
  
  // Floor 7
  {
    id: 'exit-7-east',
    floor: 7,
    position: [getExitPositions(7).east, 24.5, 0],
    label: 'EXIT 1',
    description: 'East Stairwell Exit'
  },
  {
    id: 'exit-7-west',
    floor: 7,
    position: [getExitPositions(7).west, 24.5, 0],
    label: 'EXIT 2',
    description: 'West Stairwell Exit'
  },
  
  // Floor 8
  {
    id: 'exit-8-east',
    floor: 8,
    position: [getExitPositions(8).east, 28, 0],
    label: 'EXIT 1',
    description: 'East Stairwell Exit'
  },
  {
    id: 'exit-8-west',
    floor: 8,
    position: [getExitPositions(8).west, 28, 0],
    label: 'EXIT 2',
    description: 'West Stairwell Exit'
  },
  
  // Floor 9
  {
    id: 'exit-9-east',
    floor: 9,
    position: [getExitPositions(9).east, 31.5, 0],
    label: 'EXIT 1',
    description: 'East Stairwell Exit'
  },
  {
    id: 'exit-9-west',
    floor: 9,
    position: [getExitPositions(9).west, 31.5, 0],
    label: 'EXIT 2',
    description: 'West Stairwell Exit'
  }
];

export function createExitNode(exitDef: FireExitDefinition): NavigationNode {
  return {
    id: exitDef.id,
    position: exitDef.position,
    floor: exitDef.floor,
    type: 'exit',
    neighbors: [],
    blocked: false,
    smokeLevel: 0
  };
}
