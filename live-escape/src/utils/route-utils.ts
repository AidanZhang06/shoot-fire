/**
 * Route Utilities
 * Helper functions for route calculations and instruction generation
 */

import { Waypoint } from '../types/schemas';
import { GridUtils } from './grid-utils';

export class RouteUtils {
  /**
   * Generate turn-by-turn text instructions from waypoints
   */
  static generateInstructions(waypoints: Waypoint[], currentHeading: number): string[] {
    if (waypoints.length < 2) {
      return ['You have arrived at your destination'];
    }

    const instructions: string[] = [];
    let heading = currentHeading;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];

      const bearing = GridUtils.calculateBearing(from, to);
      const distance = GridUtils.distance(from, to);
      const turn = this.calculateTurnAngle(heading, bearing);

      // Add turn instruction if angle is significant
      if (Math.abs(turn) > 15) {
        const direction = turn > 0 ? 'right' : 'left';
        instructions.push(`Turn ${direction} ${Math.abs(turn).toFixed(0)}°`);
      }

      // Add distance instruction
      if (distance > 1) {
        instructions.push(`Continue straight for ${distance.toFixed(1)}m`);
      }

      heading = bearing;
    }

    instructions.push('You have reached the exit');
    return instructions;
  }

  /**
   * Calculate turn angle from current heading to target bearing
   * Returns angle in degrees (-180 to 180)
   * Negative = turn left, Positive = turn right
   */
  static calculateTurnAngle(currentHeading: number, targetBearing: number): number {
    let turn = targetBearing - currentHeading;

    // Normalize to -180 to 180
    if (turn > 180) turn -= 360;
    if (turn < -180) turn += 360;

    return turn;
  }

  /**
   * Calculate total route distance from waypoints
   */
  static calculateRouteDistance(waypoints: Waypoint[]): number {
    if (waypoints.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDistance += GridUtils.distance(waypoints[i], waypoints[i + 1]);
    }

    return totalDistance;
  }

  /**
   * Estimate time to traverse route
   * @param distance Distance in meters
   * @param averageSpeed Average walking speed in m/s (default: 1.2 m/s)
   * @returns Time in seconds
   */
  static estimateTime(distance: number, averageSpeed: number = 1.2): number {
    return distance / averageSpeed;
  }

  /**
   * Simplify path by removing unnecessary waypoints (Douglas-Peucker style)
   * Keeps waypoints where significant direction changes occur
   */
  static simplifyPath(waypoints: Waypoint[], angleThreshold: number = 15): Waypoint[] {
    if (waypoints.length <= 2) return waypoints;

    const simplified: Waypoint[] = [waypoints[0]];

    for (let i = 1; i < waypoints.length - 1; i++) {
      const prev = waypoints[i - 1];
      const current = waypoints[i];
      const next = waypoints[i + 1];

      const bearing1 = GridUtils.calculateBearing(prev, current);
      const bearing2 = GridUtils.calculateBearing(current, next);
      const angleDiff = Math.abs(this.calculateTurnAngle(bearing1, bearing2));

      // Keep waypoint if direction changes significantly
      if (angleDiff > angleThreshold) {
        simplified.push(current);
      }
    }

    // Always keep the last waypoint (destination)
    simplified.push(waypoints[waypoints.length - 1]);

    return simplified;
  }

  /**
   * Check if a point is close to a waypoint (within threshold distance)
   */
  static isNearWaypoint(position: { x: number; y: number; z: number }, waypoint: Waypoint, threshold: number = 2): boolean {
    return GridUtils.distance(position, waypoint) < threshold;
  }

  /**
   * Find the next waypoint along the route from current position
   */
  static findNextWaypoint(position: { x: number; y: number; z: number }, waypoints: Waypoint[]): Waypoint | null {
    if (waypoints.length === 0) return null;

    // Find first waypoint that we haven't reached yet
    for (let i = 0; i < waypoints.length; i++) {
      if (!this.isNearWaypoint(position, waypoints[i])) {
        return waypoints[i];
      }
    }

    // If all waypoints have been reached, return the last one
    return waypoints[waypoints.length - 1];
  }
}
