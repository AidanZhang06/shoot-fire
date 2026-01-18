/**
 * Overshoot Integration Module
 * Manages video stream processing through Overshoot API for all users
 *
 * Note: The Overshoot SDK is designed for browser environments.
 * In production, this would typically run in the client (browser) and
 * communicate results to the server via WebSocket. This server-side
 * implementation is for testing and can work with video files.
 */

import { RealtimeVision } from '@overshoot/sdk';
import {
  OVERSHOOT_CONFIG,
  OVERSHOOT_CONFIG_HIGH_LOAD,
  EMERGENCY_ANALYSIS_PROMPT,
  EMERGENCY_SCHEMA
} from '../config/overshoot-config';
import {
  VideoAnalysisResult,
  EnrichedVideoAnalysisResult,
  UserState
} from '../types/schemas';

/**
 * Manages Overshoot API sessions for multiple users
 * Handles video stream processing and result enrichment
 */
export class EmergencyVideoProcessor {
  private visionSessions: Map<string, RealtimeVision> = new Map();
  private userStates: Map<string, UserState> = new Map();
  private onResultCallback?: (enrichedResult: EnrichedVideoAnalysisResult) => void;
  private processingStartTimes: Map<string, number> = new Map();

  // Configuration thresholds
  private readonly HIGH_LOAD_THRESHOLD = 30;
  private adaptiveConfigEnabled = true;

  constructor(onResult?: (enrichedResult: EnrichedVideoAnalysisResult) => void) {
    this.onResultCallback = onResult;
  }

  /**
   * Start processing video stream for a user
   * @param userId Unique user identifier
   * @param videoFile Optional video file for testing (browser File API)
   */
  async startProcessingForUser(userId: string, videoFile?: any): Promise<void> {
    if (this.visionSessions.has(userId)) {
      console.warn(`[Overshoot] User ${userId} already has an active session`);
      return;
    }

    try {
      // Determine config based on current load
      const activeUsers = this.visionSessions.size;
      const config = this.shouldUseHighLoadConfig(activeUsers)
        ? OVERSHOOT_CONFIG_HIGH_LOAD
        : OVERSHOOT_CONFIG;

      console.log(`[Overshoot] Starting session for user ${userId} (active users: ${activeUsers})`);
      console.log(`[Overshoot] Using ${activeUsers >= this.HIGH_LOAD_THRESHOLD ? 'HIGH_LOAD' : 'STANDARD'} config`);

      // Create Overshoot RealtimeVision session
      const vision = new RealtimeVision({
        ...config,
        prompt: EMERGENCY_ANALYSIS_PROMPT,
        outputSchema: EMERGENCY_SCHEMA,
        source: videoFile
          ? { type: 'video' as const, file: videoFile }
          : { type: 'camera' as const, cameraFacing: 'environment' as const },
        onResult: (result: any) => this.handleAnalysisResult(userId, result)
      });

      // Start the vision session
      await vision.start();
      this.visionSessions.set(userId, vision);
      this.processingStartTimes.set(userId, Date.now());

      console.log(`[Overshoot] Successfully started session for user ${userId}`);
    } catch (error) {
      console.error(`[Overshoot] Failed to start session for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Handle video analysis results from Overshoot API
   * Enriches results with user context and forwards to coordination layer
   */
  private handleAnalysisResult(userId: string, result: VideoAnalysisResult): void {
    try {
      const userState = this.userStates.get(userId);
      if (!userState) {
        console.warn(`[Overshoot] No user state found for ${userId}`);
        return;
      }

      // Calculate processing latency
      const startTime = this.processingStartTimes.get(userId) || Date.now();
      const processingLatency = Date.now() - startTime;

      // Enrich result with user context
      const enrichedResult: EnrichedVideoAnalysisResult = {
        ...result,
        userId,
        userPosition: userState.position,
        processingLatency
      };

      // Log analysis summary
      console.log(`[Overshoot] Analysis result for user ${userId}:`, {
        confidence: result.confidence,
        obstacles: result.obstacles.length,
        firePresent: result.hazards.fire.present,
        smokePresent: result.hazards.smoke.present,
        peopleCount: result.people.count,
        exitsVisible: result.exits.filter(e => e.visible).length,
        latency: processingLatency
      });

      // Forward to callback (situational map manager)
      if (this.onResultCallback) {
        this.onResultCallback(enrichedResult);
      }

      // Update processing start time for next result
      this.processingStartTimes.set(userId, Date.now());
    } catch (error) {
      console.error(`[Overshoot] Error handling result for user ${userId}:`, error);
    }
  }

  /**
   * Update the prompt for a specific user's session
   * Useful for contextual prompts (e.g., focusing on exits when user is nearby)
   */
  async updateUserPrompt(userId: string, newPrompt: string): Promise<void> {
    const session = this.visionSessions.get(userId);
    if (!session) {
      console.warn(`[Overshoot] No session found for user ${userId}`);
      return;
    }

    try {
      await session.updatePrompt(newPrompt);
      console.log(`[Overshoot] Updated prompt for user ${userId}`);
    } catch (error) {
      console.error(`[Overshoot] Failed to update prompt for user ${userId}:`, error);
    }
  }

  /**
   * Generate contextual prompt based on user's situation
   * @param userId User identifier
   * @returns Customized prompt string
   */
  getContextualPrompt(userId: string): string {
    const userState = this.userStates.get(userId);
    if (!userState) {
      return EMERGENCY_ANALYSIS_PROMPT;
    }

    let customPrompt = EMERGENCY_ANALYSIS_PROMPT;

    // Focus on exits if user is near one
    if (userState.nearExit) {
      customPrompt += '\n\nFocus especially on exit accessibility and any blockages.';
    }

    // Emphasize hazard detection in high-danger zones
    if (userState.inHighHazardZone) {
      customPrompt += '\n\nPrioritize fire and smoke detection accuracy.';
    }

    return customPrompt;
  }

  /**
   * Stop processing for a specific user
   * @param userId User identifier
   */
  async stopProcessingForUser(userId: string): Promise<void> {
    const session = this.visionSessions.get(userId);
    if (!session) {
      console.warn(`[Overshoot] No session to stop for user ${userId}`);
      return;
    }

    try {
      await session.stop();
      this.visionSessions.delete(userId);
      this.processingStartTimes.delete(userId);
      this.userStates.delete(userId);
      console.log(`[Overshoot] ✅ Stopped and cleaned up session for user ${userId}`);
    } catch (error) {
      console.error(`[Overshoot] ❌ Error stopping session for user ${userId}:`, error);
    }
  }

  /**
   * Stop all active sessions
   */
  async stopAll(): Promise<void> {
    console.log(`[Overshoot] Stopping all ${this.visionSessions.size} sessions`);
    const stopPromises = Array.from(this.visionSessions.keys()).map(userId =>
      this.stopProcessingForUser(userId)
    );
    await Promise.all(stopPromises);
  }

  /**
   * Update user state (position, heading, etc.)
   * Used to enrich video analysis results
   */
  updateUserState(userId: string, state: UserState): void {
    this.userStates.set(userId, state);
  }

  /**
   * Get current user state
   */
  getUserState(userId: string): UserState | undefined {
    return this.userStates.get(userId);
  }

  /**
   * Determine if high-load configuration should be used
   */
  private shouldUseHighLoadConfig(activeUsers: number): boolean {
    return this.adaptiveConfigEnabled && activeUsers >= this.HIGH_LOAD_THRESHOLD;
  }

  /**
   * Enable or disable adaptive configuration
   */
  setAdaptiveConfig(enabled: boolean): void {
    this.adaptiveConfigEnabled = enabled;
    console.log(`[Overshoot] Adaptive configuration ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get current system statistics
   */
  getStats() {
    return {
      activeSessions: this.visionSessions.size,
      trackedUsers: this.userStates.size,
      usingHighLoadConfig: this.shouldUseHighLoadConfig(this.visionSessions.size)
    };
  }
}
