/**
 * Evacuation Orchestrator
 * Coordinates exit assignment, pathfinding, and guidance delivery in 1-second cycles
 */

import { Server } from 'socket.io';
import { ExitAssignmentService } from './exit-assignment';
import { PathPlannerService } from './path-planner';
import { GuidanceDeliveryService } from './guidance-delivery';
import { UserState, ExitInfo, GridCell, Route, HazardWarning } from '../types/schemas';
import { GridUtils } from '../utils/grid-utils';

export class EvacuationOrchestrator {
  private exitAssigner: ExitAssignmentService;
  private pathPlanner: PathPlannerService;
  private guidanceDelivery: GuidanceDeliveryService;

  private intervalId?: NodeJS.Timeout;
  private readonly CYCLE_INTERVAL = 1000; // 1 second
  private readonly HAZARD_PROXIMITY_RADIUS = 5; // meters

  // State
  private users: Map<string, UserState>;
  private exits: Map<string, ExitInfo>;
  private hazardGrid: Map<string, GridCell>;
  private currentAssignments: Map<string, string>; // userId -> exitId
  private buildingDimensions: { width: number; height: number };

  // Metrics
  private cycleCount = 0;
  private lastCycleTime = 0;
  private isRunning = false;

  constructor(io: Server) {
    this.exitAssigner = new ExitAssignmentService();
    this.pathPlanner = new PathPlannerService();
    this.guidanceDelivery = new GuidanceDeliveryService(io);

    this.users = new Map();
    this.exits = new Map();
    this.hazardGrid = new Map();
    this.currentAssignments = new Map();
    this.buildingDimensions = { width: 50, height: 50 }; // Default
  }

  /**
   * Start the coordination loop
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[Orchestrator] Already running');
      return;
    }

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║  Evacuation Orchestrator - Starting           ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    // Build initial navigation graph
    if (this.hazardGrid.size > 0) {
      this.pathPlanner.buildGraph(this.hazardGrid, this.buildingDimensions);
    }

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.runCycle().catch(error => {
        console.error('[Orchestrator] Cycle error:', error);
      });
    }, this.CYCLE_INTERVAL);

    console.log('[Orchestrator] ✅ Coordination loop started (1s cycles)\n');
  }

  /**
   * Stop the coordination loop
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.isRunning = false;
      console.log('[Orchestrator] Coordination loop stopped');
    }
  }

  /**
   * Main coordination cycle
   */
  private async runCycle(): Promise<void> {
    const cycleStart = Date.now();
    this.cycleCount++;

    try {
      console.log(`\n[Orchestrator] ═══ Cycle ${this.cycleCount} ═══`);

      // Skip if no users
      if (this.users.size === 0) {
        console.log('[Orchestrator] No active users, skipping cycle');
        return;
      }

      // Phase 1: Exit Assignment
      console.log('[Orchestrator] Phase 1: Exit Assignment...');
      const assignmentStart = Date.now();

      try {
        const assignments = this.exitAssigner.assignExits(
          this.users,
          this.exits,
          this.hazardGrid
        );
        this.currentAssignments = assignments;

        // Update exit loads
        this.exits = this.exitAssigner.updateExitLoads(this.exits, assignments);

        const assignmentTime = Date.now() - assignmentStart;
        console.log(`  ✓ Assigned ${assignments.size} users to exits (${assignmentTime}ms)`);
      } catch (error: any) {
        console.error(`  ✗ Exit assignment failed: ${error.message}`);
        return;
      }

      // Phase 2: Path Planning
      console.log('[Orchestrator] Phase 2: Path Planning...');
      const pathStart = Date.now();
      const routes = new Map<string, Route>();

      for (const [userId, exitId] of this.currentAssignments) {
        const user = this.users.get(userId);
        const exit = this.exits.get(exitId);

        if (!user || !exit) {
          console.warn(`  ! Skipping user ${userId}: missing user or exit data`);
          continue;
        }

        try {
          const route = this.pathPlanner.findPath(
            user.position,
            exit.position,
            this.hazardGrid
          );

          if (route) {
            routes.set(userId, route);
          } else {
            console.warn(`  ! No path found for user ${userId} to exit ${exitId}`);
          }
        } catch (error: any) {
          console.error(`  ! Path planning error for user ${userId}: ${error.message}`);
        }
      }

      const pathTime = Date.now() - pathStart;
      console.log(`  ✓ Computed ${routes.size} paths (${pathTime}ms)`);

      // Phase 3: Guidance Delivery
      console.log('[Orchestrator] Phase 3: Guidance Delivery...');
      const guidanceStart = Date.now();

      for (const [userId, route] of routes) {
        const user = this.users.get(userId);
        if (!user) continue;

        // Get immediate hazards near user
        const immediateHazards = this.getImmediateHazards(
          user.position,
          this.HAZARD_PROXIMITY_RADIUS
        );

        try {
          this.guidanceDelivery.sendGuidance(userId, route, user, immediateHazards);
        } catch (error: any) {
          console.error(`  ! Guidance delivery error for user ${userId}: ${error.message}`);
        }
      }

      const guidanceTime = Date.now() - guidanceStart;
      console.log(`  ✓ Delivered guidance to ${routes.size} users (${guidanceTime}ms)`);

      // Metrics
      this.lastCycleTime = Date.now() - cycleStart;
      console.log(`[Orchestrator] ═══ Cycle ${this.cycleCount} completed in ${this.lastCycleTime}ms ═══`);

      // Warn if cycle time is approaching limit
      if (this.lastCycleTime > 900) {
        console.warn(`[Orchestrator] ⚠️  WARNING: Cycle time (${this.lastCycleTime}ms) approaching 1s limit!`);
      }

    } catch (error) {
      console.error('[Orchestrator] ✗ Fatal cycle error:', error);
    }
  }

  /**
   * Update user state
   */
  updateUserState(userId: string, state: UserState): void {
    this.users.set(userId, state);

    // Check if user is near exit
    const assignment = this.currentAssignments.get(userId);
    if (assignment) {
      const exit = this.exits.get(assignment);
      if (exit && GridUtils.distance(state.position, exit.position) < 2) {
        console.log(`[Orchestrator] 🎉 User ${userId} reached exit ${exit.id}`);
        this.guidanceDelivery.sendEvacuationComplete(userId);
        this.removeUser(userId);
      }
    }
  }

  /**
   * Remove user (evacuated or disconnected)
   */
  removeUser(userId: string): void {
    this.users.delete(userId);
    this.currentAssignments.delete(userId);
    console.log(`[Orchestrator] User ${userId} removed`);
  }

  /**
   * Update hazard grid from video analysis
   */
  updateHazardGrid(updates: Map<string, GridCell>): void {
    // Merge updates into existing grid
    for (const [key, cell] of updates) {
      this.hazardGrid.set(key, cell);
    }

    // Rebuild graph if hazards changed significantly
    if (this.isRunning && updates.size > 10) {
      console.log('[Orchestrator] Rebuilding navigation graph due to hazard changes');
      this.pathPlanner.buildGraph(this.hazardGrid, this.buildingDimensions);
    }
  }

  /**
   * Update exit status
   */
  updateExitStatus(exitId: string, status: ExitInfo): void {
    this.exits.set(exitId, status);
  }

  /**
   * Set building dimensions
   */
  setBuildingDimensions(width: number, height: number): void {
    this.buildingDimensions = { width, height };
  }

  /**
   * Get hazards within radius of position
   */
  private getImmediateHazards(
    position: { x: number; y: number; z: number },
    radius: number
  ): HazardWarning[] {
    const warnings: HazardWarning[] = [];
    const radiusCells = Math.ceil(radius);

    const centerX = Math.floor(position.x);
    const centerY = Math.floor(position.y);

    // Check grid cells within radius
    for (let dx = -radiusCells; dx <= radiusCells; dx++) {
      for (let dy = -radiusCells; dy <= radiusCells; dy++) {
        const x = centerX + dx;
        const y = centerY + dy;

        // Skip if outside radius
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > radius) continue;

        const key = `${x}_${y}`;
        const cell = this.hazardGrid.get(key);

        if (!cell) continue;

        // Fire warning
        if (cell.fire && cell.fire.intensity > 2) {
          warnings.push({
            type: 'fire',
            severity: cell.fire.intensity > 4 ? 'critical' : cell.fire.intensity > 3 ? 'high' : 'medium',
            location: { x, y, z: 0 },
            message: `Fire ${distance.toFixed(0)}m away (intensity ${cell.fire.intensity.toFixed(1)}/5)`
          });
        }

        // Smoke warning
        if (cell.smoke && cell.smoke.intensity > 2) {
          warnings.push({
            type: 'smoke',
            severity: cell.smoke.intensity > 4 ? 'high' : 'medium',
            location: { x, y, z: 0 },
            message: `Smoke ${distance.toFixed(0)}m away (density ${cell.smoke.intensity.toFixed(1)}/5)`
          });
        }
      }
    }

    // Sort by severity and distance
    warnings.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aSeverity = severityOrder[a.severity];
      const bSeverity = severityOrder[b.severity];

      if (aSeverity !== bSeverity) {
        return aSeverity - bSeverity;
      }

      // Sort by distance from position
      const aDist = GridUtils.distance(position, a.location);
      const bDist = GridUtils.distance(position, b.location);
      return aDist - bDist;
    });

    return warnings.slice(0, 3); // Return top 3 warnings
  }

  /**
   * Get orchestrator metrics
   */
  getMetrics() {
    return {
      cycleCount: this.cycleCount,
      lastCycleTime: this.lastCycleTime,
      isRunning: this.isRunning,
      activeUsers: this.users.size,
      activeExits: this.exits.size,
      hazardCells: this.hazardGrid.size,
      assignments: this.currentAssignments.size,
      graphStats: this.pathPlanner.getGraphStats()
    };
  }

  /**
   * Get current assignments
   */
  getAssignments(): Map<string, string> {
    return new Map(this.currentAssignments);
  }
}
