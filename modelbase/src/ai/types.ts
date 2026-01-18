// AI scenario generation type definitions

export interface FireLocation {
  startTime: undefined;
  position: [number, number, number]; // x, y (floor), z
  intensity: number; // 0-1, where 1 is fully engulfed
  nodeId?: string; // If mapped to a navigation node
}

export interface SmokeArea {
  nodes: string[]; // Node IDs affected
  level: number; // 0-1, where 1 is completely blocked
  region?: string; // Description of region
}

export interface FireScenario {
  id: string;
  startPosition: [number, number, number];
  startNodeId?: string; // Mapped navigation node
  fireLocations: FireLocation[];
  smokeAreas: SmokeArea[];
  blockedPaths: string[]; // Edge IDs that are blocked
  blockedNodes: string[]; // Node IDs that are blocked
  availableExits: string[]; // Exit node IDs that are still accessible
  correctPath: string[]; // Optimal path to safety (node IDs)
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTimeToSafety: number; // in seconds
  floor?: number; // Floor number where scenario takes place
}

export interface ScenarioGenerationInput {
  buildingLayout: string;
  currentConditions?: {
    temperature?: number;
    visibility?: number;
    wind?: string;
  };
  difficulty?: 'easy' | 'medium' | 'hard';
  floor?: number; // Specific floor to start on
}

export interface ScenarioGenerationOutput {
  scenario: FireScenario;
  reasoning?: string;
  safetyNotes?: string;
}

