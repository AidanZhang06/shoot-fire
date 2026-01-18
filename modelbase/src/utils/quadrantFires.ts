import { FireLocation } from '../ai/types';

/**
 * Get quadrant positions for a specific floor
 */
export function getQuadrantPositions(floorNum: number): {
  q1: [number, number, number]; // East fire
  q2: [number, number, number]; // Center fire
  q3: [number, number, number]; // North fire
} {
  const floorHeight = 3.5;
  const mainWingWidth = 45 - (floorNum - 1) * 1.2;
  const offsetX = floorNum >= 7 ? 2 + (floorNum - 6) * 0.8 : 0;
  const yPos = (floorNum - 1) * floorHeight;

  return {
    // Q1: East-Center fire
    q1: [-5 + mainWingWidth * 0.4 + offsetX, yPos + 0.5, 0],
    // Q2: Center fire
    q2: [-10 + offsetX, yPos + 1, 0],
    // Q3: North fire
    q3: [5 - mainWingWidth * 0.4 + offsetX, yPos + 0.5, 15],
  };
}

/**
 * Generate fire locations at quadrant positions for a specific floor
 * @param floorNum - Floor number (1-9)
 * @param intensity - Fire intensity (0-1, default: 0.8)
 * @returns Array of FireLocation objects
 */
export function generateQuadrantFires(
  floorNum: number,
  intensity: number = 0.8
): FireLocation[] {
  const positions = getQuadrantPositions(floorNum);

  return [
    {
      position: positions.q1,
      intensity,
      description: 'East fire (Q1)'
    },
    {
      position: positions.q2,
      intensity,
      description: 'Center fire (Q2)'
    },
    {
      position: positions.q3,
      intensity,
      description: 'North fire (Q3)'
    }
  ];
}

/**
 * Generate fires for multiple floors
 * @param floors - Array of floor numbers
 * @param intensity - Fire intensity (0-1, default: 0.8)
 * @returns Array of all FireLocation objects
 */
export function generateFiresForFloors(
  floors: number[],
  intensity: number = 0.8
): FireLocation[] {
  return floors.flatMap(floorNum => generateQuadrantFires(floorNum, intensity));
}

