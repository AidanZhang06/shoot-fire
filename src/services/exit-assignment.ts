/**
 * Exit Assignment Service
 * Uses Hungarian algorithm (Munkres) to assign users to exits optimally
 */

import munkres from 'munkres-js';
import { UserState, ExitInfo, GridCell } from '../types/schemas';
import { GridUtils } from '../utils/grid-utils';

export class ExitAssignmentService {
  private readonly REBALANCE_THRESHOLD = 25; // Standard deviation threshold
  private readonly QUEUE_PENALTY_MULTIPLIER = 100; // Seconds per load ratio

  /**
   * Assign users to exits using Hungarian algorithm
   * Cost = euclidean_distance + queue_penalty
   *
   * @returns Map of userId to exitId
   */
  assignExits(
    users: Map<string, UserState>,
    exits: Map<string, ExitInfo>,
    hazardGrid: Map<string, GridCell>
  ): Map<string, string> {
    const availableExits = this.getAvailableExits(exits);

    if (!availableExits || availableExits.length === 0) {
      console.error('[ExitAssignment] CRITICAL: No available exits');
      throw new Error('No available exits');
    }

    if (users.size === 0) {
      return new Map();
    }

    // Convert maps to arrays for matrix construction
    const userArray = Array.from(users.values());
    const exitArray = availableExits;

    // Build cost matrix
    const costMatrix = this.buildCostMatrix(userArray, exitArray);

    // Apply Munkres algorithm
    const assignments = munkres(costMatrix);

    // Convert assignments to Map
    const assignmentMap = new Map<string, string>();
    for (const [userIndex, exitIndex] of assignments) {
      if (userIndex < userArray.length && exitIndex < exitArray.length) {
        assignmentMap.set(userArray[userIndex].id, exitArray[exitIndex].id);
      }
    }

    // Check load balance
    if (this.isLoadImbalanced(assignmentMap, exits)) {
      console.warn('[ExitAssignment] WARNING: Exit load imbalance detected (std dev > 25)');
    }

    console.log(`[ExitAssignment] Assigned ${assignmentMap.size} users to ${exitArray.length} exits`);

    return assignmentMap;
  }

  /**
   * Build cost matrix for Hungarian algorithm
   * Rows = users, Columns = exits
   * Pads matrix to be square if needed
   */
  private buildCostMatrix(users: UserState[], exits: ExitInfo[]): number[][] {
    const matrix: number[][] = [];
    const size = Math.max(users.length, exits.length);

    for (let i = 0; i < size; i++) {
      const row: number[] = [];
      for (let j = 0; j < size; j++) {
        if (i < users.length && j < exits.length) {
          // Real cost for actual user-exit pair
          const cost = this.calculateCost(users[i].position, exits[j]);
          row.push(cost);
        } else {
          // Padding with large cost for dummy assignments
          row.push(999999);
        }
      }
      matrix.push(row);
    }

    return matrix;
  }

  /**
   * Calculate cost for a user to reach an exit
   * Cost = distance + queue_penalty
   */
  private calculateCost(userPos: { x: number; y: number; z: number }, exit: ExitInfo): number {
    // Euclidean distance
    const distance = GridUtils.distance(userPos, exit.position);

    // Queue penalty based on exit load
    const loadRatio = exit.currentLoad / exit.capacity;
    const queuePenalty = loadRatio * this.QUEUE_PENALTY_MULTIPLIER;

    return distance + queuePenalty;
  }

  /**
   * Check if exit load is imbalanced
   * Returns true if standard deviation > threshold
   */
  private isLoadImbalanced(
    assignments: Map<string, string>,
    exits: Map<string, ExitInfo>
  ): boolean {
    // Count assignments per exit
    const exitLoads = new Map<string, number>();
    for (const exit of exits.values()) {
      exitLoads.set(exit.id, 0);
    }

    for (const exitId of assignments.values()) {
      const currentCount = exitLoads.get(exitId) || 0;
      exitLoads.set(exitId, currentCount + 1);
    }

    // Calculate standard deviation
    const loads = Array.from(exitLoads.values());
    const stdDev = this.calculateLoadStdDev(loads);

    return stdDev > this.REBALANCE_THRESHOLD;
  }

  /**
   * Calculate standard deviation of exit loads
   */
  private calculateLoadStdDev(loads: number[]): number {
    if (loads.length === 0) return 0;

    const mean = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) / loads.length;
    return Math.sqrt(variance);
  }

  /**
   * Get exits that are available (not blocked, has capacity)
   */
  private getAvailableExits(exits: Map<string, ExitInfo>): ExitInfo[] {
    return Array.from(exits.values()).filter(exit =>
      exit.status === 'clear' && exit.currentLoad < exit.capacity
    );
  }

  /**
   * Update exit loads based on current assignments
   */
  updateExitLoads(
    exits: Map<string, ExitInfo>,
    assignments: Map<string, string>
  ): Map<string, ExitInfo> {
    const updatedExits = new Map(exits);

    // Reset all loads to 0
    for (const [exitId, exit] of updatedExits) {
      updatedExits.set(exitId, { ...exit, currentLoad: 0 });
    }

    // Count assignments
    for (const exitId of assignments.values()) {
      const exit = updatedExits.get(exitId);
      if (exit) {
        updatedExits.set(exitId, { ...exit, currentLoad: exit.currentLoad + 1 });
      }
    }

    return updatedExits;
  }
}
