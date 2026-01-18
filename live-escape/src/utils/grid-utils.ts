/**
 * Grid Utilities
 * Helper functions for grid coordinate conversions and calculations
 */

import { Vector3 } from '../types/schemas';

export class GridUtils {
  static readonly GRID_SIZE = 1; // 1 meter per cell

  /**
   * Convert continuous position to grid key "x_y"
   */
  static positionToKey(pos: Vector3): string {
    const x = Math.floor(pos.x);
    const y = Math.floor(pos.y);
    return `${x}_${y}`;
  }

  /**
   * Convert grid key to continuous position (center of cell)
   */
  static keyToPosition(key: string): Vector3 {
    const [x, y] = key.split('_').map(Number);
    return {
      x: x + 0.5,
      y: y + 0.5,
      z: 0
    };
  }

  /**
   * Get 8-directional neighbors with distances
   */
  static getNeighbors(x: number, y: number): Array<{ x: number; y: number; distance: number }> {
    return [
      // Orthogonal neighbors (distance = 1)
      { x: x + 1, y, distance: 1 },
      { x: x - 1, y, distance: 1 },
      { x, y: y + 1, distance: 1 },
      { x, y: y - 1, distance: 1 },
      // Diagonal neighbors (distance = √2)
      { x: x + 1, y: y + 1, distance: 1.414 },
      { x: x + 1, y: y - 1, distance: 1.414 },
      { x: x - 1, y: y + 1, distance: 1.414 },
      { x: x - 1, y: y - 1, distance: 1.414 }
    ];
  }

  /**
   * Calculate Euclidean distance between two points
   */
  static distance(a: Vector3, b: Vector3): number {
    return Math.sqrt(
      Math.pow(b.x - a.x, 2) +
      Math.pow(b.y - a.y, 2) +
      Math.pow(b.z - a.z, 2)
    );
  }

  /**
   * Calculate bearing in degrees (0-360, north = 0)
   * Returns angle from point A to point B
   */
  static calculateBearing(from: Vector3, to: Vector3): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const radians = Math.atan2(dx, dy);
    const degrees = (radians * 180 / Math.PI + 360) % 360;
    return degrees;
  }

  /**
   * Check if a grid coordinate is within bounds
   */
  static isInBounds(x: number, y: number, width: number, height: number): boolean {
    return x >= 0 && x < width && y >= 0 && y < height;
  }

  /**
   * Get Manhattan distance (L1 norm) between two grid points
   */
  static manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
  }
}
