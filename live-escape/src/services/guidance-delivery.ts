/**
 * Guidance Delivery Service
 * Generates and delivers turn-by-turn guidance via Socket.IO
 */

import { Server } from 'socket.io';
import { Route, UserState, HazardWarning, GuidancePayload, Action, VisualizationData, GridCell, Vector3 } from '../types/schemas';
import { GridUtils } from '../utils/grid-utils';
import { RouteUtils } from '../utils/route-utils';

export class GuidanceDeliveryService {
  private io: Server;

  // Configuration
  private readonly TURN_THRESHOLD = 15; // degrees
  private readonly WAYPOINT_PROXIMITY = 2; // meters

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Send guidance to a specific user
   */
  sendGuidance(
    userId: string,
    route: Route,
    userState: UserState,
    immediateHazards: HazardWarning[]
  ): void {
    // Generate actions from route
    const actions = this.generateActions(route.waypoints, userState.heading);

    // Create visualization data
    const visualization = this.createVisualization(route, userState.position);

    // Generate audio instruction
    const audio = this.generateAudioInstruction(actions, immediateHazards);

    // Build guidance payload
    const payload: GuidancePayload = {
      type: 'route-update',
      timestamp: Date.now(),
      route: {
        waypoints: route.waypoints,
        totalDistance: route.distance,
        estimatedTime: route.estimatedTime,
        hazardWarnings: route.hazardWarnings
      },
      immediateActions: actions.slice(0, 3), // Next 3 actions
      visualization,
      audio
    };

    // Emit to user's Socket.IO room
    this.io.to(userId).emit('guidance-update', payload);
  }

  /**
   * Broadcast guidance to multiple users
   */
  broadcastGuidance(guidanceMap: Map<string, GuidancePayload>): void {
    for (const [userId, payload] of guidanceMap) {
      this.io.to(userId).emit('guidance-update', payload);
    }
  }

  /**
   * Send hazard alert (emergency notification)
   */
  sendHazardAlert(userId: string, hazard: HazardWarning): void {
    const alert: GuidancePayload = {
      type: 'hazard-alert',
      timestamp: Date.now(),
      immediateActions: [{
        type: 'warning',
        severity: hazard.severity === 'critical' ? 'high' : hazard.severity,
        description: hazard.message
      }],
      visualization: {
        pathLine: [],
        markerPositions: [{
          type: 'hazard',
          position: hazard.location,
          label: hazard.message
        }],
        hazardOverlays: []
      },
      audio: {
        instruction: `ALERT: ${hazard.message}`,
        urgency: hazard.severity === 'critical' ? 'critical' : 'high'
      }
    };

    this.io.to(userId).emit('hazard-alert', alert);
  }

  /**
   * Send evacuation complete notification
   */
  sendEvacuationComplete(userId: string): void {
    this.io.to(userId).emit('evacuation-complete', {
      userId,
      timestamp: Date.now(),
      message: 'You have reached the exit. You are safe.'
    });
  }

  /**
   * Generate turn-by-turn actions from waypoints
   */
  private generateActions(waypoints: Array<{ x: number; y: number; z: number }>, userHeading: number): Action[] {
    const actions: Action[] = [];

    if (waypoints.length < 2) {
      actions.push({
        type: 'navigate',
        description: 'You have arrived at your destination',
        distance: 0
      });
      return actions;
    }

    let currentHeading = userHeading;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];

      const bearing = GridUtils.calculateBearing(from, to);
      const distance = GridUtils.distance(from, to);
      const turnAngle = RouteUtils.calculateTurnAngle(currentHeading, bearing);

      // Generate turn action if angle is significant
      if (Math.abs(turnAngle) > this.TURN_THRESHOLD) {
        const direction = turnAngle > 0 ? 'right' : 'left';
        actions.push({
          type: 'turn',
          direction,
          degrees: Math.abs(turnAngle),
          description: `Turn ${direction} ${Math.abs(turnAngle).toFixed(0)}°`
        });
      }

      // Generate navigate action
      if (distance > 1) {
        actions.push({
          type: 'navigate',
          distance,
          description: `Continue straight for ${distance.toFixed(1)}m`
        });
      }

      currentHeading = bearing;
    }

    // Final action
    actions.push({
      type: 'navigate',
      description: 'You have reached the exit',
      distance: 0
    });

    return actions;
  }

  /**
   * Create visualization data for AR overlay
   */
  private createVisualization(
    route: Route,
    userPosition: { x: number; y: number; z: number }
  ): VisualizationData {
    // Path line from waypoints
    const pathLine = route.waypoints.map(w => ({ x: w.x, y: w.y, z: w.z }));

    // Create markers for waypoints and exit
    const markerPositions: VisualizationData['markerPositions'] = [];

    // Add waypoint markers (every 5th waypoint to avoid clutter)
    route.waypoints
      .filter((_, index) => index % 5 === 0 && index !== route.waypoints.length - 1)
      .forEach(w => {
        markerPositions.push({
          type: 'waypoint',
          position: { x: w.x, y: w.y, z: w.z }
        });
      });

    // Add exit marker at destination
    const exitWaypoint = route.waypoints[route.waypoints.length - 1];
    if (exitWaypoint) {
      markerPositions.push({
        type: 'exit',
        position: { x: exitWaypoint.x, y: exitWaypoint.y, z: exitWaypoint.z },
        label: 'EXIT'
      });
    }

    // Create hazard overlays (simplified as 3m radius circles approximated as squares)
    const hazardOverlays: VisualizationData['hazardOverlays'] = route.hazardWarnings
      .filter(w => w.type === 'fire' || w.type === 'smoke' || w.type === 'water')
      .map(warning => {
        const radius = 3; // 3 meter radius
        const loc = warning.location;

        // Create a square area around the hazard location
        const area: Vector3[] = [
          { x: loc.x - radius, y: loc.y - radius, z: loc.z },
          { x: loc.x + radius, y: loc.y - radius, z: loc.z },
          { x: loc.x + radius, y: loc.y + radius, z: loc.z },
          { x: loc.x - radius, y: loc.y + radius, z: loc.z }
        ];

        return {
          type: warning.type as 'fire' | 'smoke' | 'water',
          area,
          intensity: warning.severity === 'critical' ? 5 : warning.severity === 'high' ? 4 : warning.severity === 'medium' ? 3 : 2
        };
      });

    return {
      pathLine,
      markerPositions,
      hazardOverlays
    };
  }

  /**
   * Generate natural language audio instruction
   */
  private generateAudioInstruction(
    actions: Action[],
    hazards: HazardWarning[]
  ): { instruction: string; urgency: 'low' | 'medium' | 'high' | 'critical' } {
    let instruction = '';
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Take first 2-3 actions for audio
    const immediateActions = actions.slice(0, 2);

    if (immediateActions.length > 0) {
      instruction = immediateActions
        .map(action => action.description)
        .join('. ') + '.';
    }

    // Add hazard warnings
    const criticalHazards = hazards.filter(h => h.severity === 'critical');
    const highHazards = hazards.filter(h => h.severity === 'high');

    if (criticalHazards.length > 0) {
      instruction += ` CRITICAL: ${criticalHazards[0].message}.`;
      urgency = 'critical';
    } else if (highHazards.length > 0) {
      instruction += ` Warning: ${highHazards[0].message}.`;
      urgency = 'high';
    } else if (hazards.length > 0) {
      instruction += ` Caution: ${hazards[0].message}.`;
      urgency = 'medium';
    }

    return { instruction, urgency };
  }

  /**
   * Calculate turn direction and magnitude
   */
  private calculateTurn(
    currentBearing: number,
    targetBearing: number
  ): { direction: 'left' | 'right' | 'straight'; degrees: number } {
    const turnAngle = RouteUtils.calculateTurnAngle(currentBearing, targetBearing);

    if (Math.abs(turnAngle) < this.TURN_THRESHOLD) {
      return { direction: 'straight', degrees: 0 };
    }

    return {
      direction: turnAngle > 0 ? 'right' : 'left',
      degrees: Math.abs(turnAngle)
    };
  }

  /**
   * Send route update notification (when route changes significantly)
   */
  sendRouteUpdate(userId: string, reason: string): void {
    this.io.to(userId).emit('route-update', {
      userId,
      timestamp: Date.now(),
      reason
    });
  }
}
