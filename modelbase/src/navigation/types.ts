// Navigation graph type definitions

export interface NavigationNode {
  id: string;
  position: [number, number, number]; // x, y (floor height), z
  floor: number;
  type: 'hallway' | 'room' | 'exit' | 'stair' | 'elevator';
  neighbors: string[]; // IDs of connected nodes
  blocked?: boolean;
  smokeLevel?: number; // 0-1, where 1 is completely blocked by smoke
  roomLabel?: string; // If in a room, the room label
}

export interface NavigationEdge {
  from: string;
  to: string;
  weight: number; // Base movement cost
  blocked?: boolean;
  smokeLevel?: number; // Additional cost multiplier for smoke
}

export interface NavigationGraph {
  nodes: Map<string, NavigationNode>;
  edges: Map<string, NavigationEdge>; // Key: "fromId-toId"
  floors: Map<number, string[]>; // Floor number -> node IDs on that floor
  exits: string[]; // Node IDs that are exits
}

export interface Path {
  nodes: string[];
  totalCost: number;
  estimatedTime: number; // in seconds
  safe: boolean;
}

