// Scenario state type definitions

export interface ScenarioState {
  scenarioId: string;
  startTime: number;
  currentTime: number;
  playerPosition: [number, number, number];
  playerNodeId?: string;
  currentFloor: number;
  fireLocations: Array<{
    position: [number, number, number];
    intensity: number;
    nodeId?: string;
    startTime: number;
  }>;
  smokeAreas: Array<{
    nodes: string[];
    level: number;
    region?: string;
  }>;
  blockedNodes: string[];
  blockedPaths: string[];
  availableExits: string[];
  playerPath: string[]; // Nodes the player has visited
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  outcome?: 'safe' | 'unsafe' | 'timeout';
  timeToSafety?: number;
}

export interface ScenarioEvolution {
  fireSpread: boolean;
  smokeIncrease: boolean;
  pathCollapse: boolean;
  timeStep: number; // seconds
}

