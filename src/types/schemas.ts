/**
 * Type definitions for emergency evacuation system
 * Matches the Overshoot API output schema and internal data structures
 */

// =============================================================================
// Video Analysis Result Types (from Overshoot API)
// =============================================================================

export interface Obstacle {
  type: 'debris' | 'furniture' | 'door' | 'structural' | 'unknown';
  severity: 'passable' | 'difficult' | 'impassable';
  position: 'left' | 'center' | 'right' | 'overhead';
  distance: 'immediate' | 'near' | 'far';
}

export interface FireHazard {
  present: boolean;
  intensity: number; // 0-5
  direction: 'left' | 'center' | 'right' | 'behind' | 'multiple';
  growthRate: 'stable' | 'growing' | 'rapid';
}

export interface SmokeHazard {
  present: boolean;
  density: number; // 0-5
  heightFromFloor: 'floor' | 'waist' | 'head' | 'ceiling';
  visibility: 'clear' | 'reduced' | 'minimal' | 'zero';
}

export interface WaterHazard {
  present: boolean;
  depth: 'wet' | 'ankle' | 'shin' | 'knee' | 'thigh';
  flow: 'still' | 'slow' | 'moderate' | 'rapid';
}

export interface Hazards {
  fire: FireHazard;
  smoke: SmokeHazard;
  water: WaterHazard;
}

export interface PersonPosition {
  horizontal: 'left' | 'center' | 'right';
  distance: 'immediate' | 'near' | 'far';
}

export interface People {
  count: number;
  density: 'clear' | 'sparse' | 'moderate' | 'crowded' | 'jammed';
  positions: PersonPosition[];
  movement: 'stationary' | 'moving_same' | 'moving_opposite' | 'chaotic';
}

export interface Exit {
  visible: boolean;
  type: 'door' | 'sign' | 'stairwell' | 'window' | 'unknown';
  status: 'clear' | 'blocked' | 'partially_blocked' | 'unknown';
  direction: number; // Degrees from center, -180 to 180
  distance: 'immediate' | 'near' | 'far';
}

export interface CameraMetadata {
  orientation: 'portrait' | 'landscape';
  stability: 'stable' | 'moving' | 'shaking';
  lightingQuality: 'good' | 'dim' | 'poor' | 'dark';
}

/**
 * Main video analysis result from Overshoot API
 */
export interface VideoAnalysisResult {
  timestamp: number;
  confidence: number; // 0-1
  obstacles: Obstacle[];
  hazards: Hazards;
  people: People;
  exits: Exit[];
  cameraMetadata: CameraMetadata;
}

/**
 * Enriched video analysis result with user context
 */
export interface EnrichedVideoAnalysisResult extends VideoAnalysisResult {
  userId: string;
  userPosition: Vector3;
  processingLatency: number;
}

// =============================================================================
// Spatial & Navigation Types
// =============================================================================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Waypoint extends Vector3 {
  id: string;
  type?: 'normal' | 'exit' | 'stairwell' | 'door';
}

export interface Route {
  waypoints: Waypoint[];
  distance: number; // meters
  estimatedTime: number; // seconds
  hazardWarnings: HazardWarning[];
  computedAt: number; // timestamp
}

export interface HazardWarning {
  type: 'fire' | 'smoke' | 'water' | 'obstacle' | 'crowding';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: Vector3;
  message: string;
}

// =============================================================================
// Situational Map Types
// =============================================================================

export interface HazardData {
  intensity: number;
  lastSeen: number; // timestamp
  confidence: number; // 0-1
}

export interface GridCell {
  fire?: HazardData;
  smoke?: HazardData;
  water?: HazardData;
  crowding?: {
    density: number;
    userCount: number;
  };
  obstacles: Obstacle[];
}

export interface UserState {
  id: string;
  position: Vector3;
  heading: number; // degrees from north
  viewingDirection: number; // camera orientation
  lastVideoAnalysis?: VideoAnalysisResult;
  currentRoute?: Route;
  speed: number; // m/s
  groupSize: number;
  nearExit?: boolean;
  inHighHazardZone?: boolean;
}

export interface ExitInfo {
  id: string;
  position: Vector3;
  capacity: number; // people per minute
  currentLoad: number; // people currently using
  status: 'clear' | 'crowded' | 'blocked' | 'unknown';
  lastVerified: number; // timestamp
  verificationSource: 'video' | 'sensor' | 'inference';
}

export interface SituationalMap {
  timestamp: number;
  buildingId: string;

  // Spatial grid for hazard tracking (1m x 1m cells)
  // Key format: "x_y" (e.g., "15_23" for cell at x=15, y=23)
  hazardGrid: Map<string, GridCell>;

  // User tracking
  users: Map<string, UserState>;

  // Exit status
  exits: Map<string, ExitInfo>;

  // Global metrics
  metrics: {
    totalUsers: number;
    evacuatedUsers: number;
    estimatedTimeToFullEvacuation: number;
    criticalHazardZones: string[]; // array of gridKeys
  };
}

// =============================================================================
// Guidance & Communication Types
// =============================================================================

export interface Action {
  type: 'turn' | 'navigate' | 'warning' | 'wait';
  direction?: 'left' | 'right' | 'straight';
  degrees?: number;
  distance?: number;
  description: string;
  severity?: 'low' | 'medium' | 'high';
  audioAlert?: boolean;
}

export interface VisualizationData {
  pathLine: Vector3[];
  markerPositions: {
    type: 'hazard' | 'exit' | 'waypoint' | 'user';
    position: Vector3;
    label?: string;
  }[];
  hazardOverlays: {
    type: 'fire' | 'smoke' | 'water';
    area: Vector3[]; // polygon points
    intensity: number;
  }[];
}

export interface GuidancePayload {
  type: 'route-update' | 'hazard-alert' | 'evacuation-complete';
  timestamp: number;
  route?: {
    waypoints: Waypoint[];
    totalDistance: number;
    estimatedTime: number;
    hazardWarnings: HazardWarning[];
  };
  immediateActions: Action[];
  visualization: VisualizationData;
  audio: {
    instruction: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  };
}

// =============================================================================
// System Configuration Types
// =============================================================================

export interface SystemMetrics {
  latency: {
    videoCapture: number;
    networkTransmission: number;
    overshootProcessing: number;
    coordinationCompute: number;
    guidanceDelivery: number;
    endToEnd: number;
  };
  quality: {
    videoAnalysisConfidence: number;
    routeQuality: number;
    exitLoadBalance: number;
  };
  health: {
    activeUsers: number;
    overshootAPIErrors: number;
    websocketDrops: number;
    routeRecomputations: number;
  };
  evacuation: {
    averageDistanceToExit: number;
    usersInHighDangerZones: number;
    estimatedTimeToEvacuation: number;
    exitBottlenecks: string[];
  };
}

export interface FloorPlan {
  id: string;
  buildingId: string;
  floor: number;
  dimensions: {
    width: number;
    height: number;
  };
  exits: {
    id: string;
    position: Vector3;
    type: 'door' | 'stairwell' | 'window';
    capacity: number;
  }[];
  walls: Vector3[][]; // Array of wall segments (each segment is array of points)
}
