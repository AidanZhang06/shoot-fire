// Mock scenario generator for fallback when API is unavailable
import { ScenarioGenerationInput, ScenarioGenerationOutput, FireScenario } from './types';

export class MockScenarioGenerator {
  async generateScenario(input: ScenarioGenerationInput): Promise<ScenarioGenerationOutput> {
    console.log('🎭 Using mock scenario generator (API unavailable)');

    const difficulty = input.difficulty || 'medium';
    const floor = input.floor || 6;
    const floorY = (floor - 1) * 3.5; // Floor height calculation

    // Generate scenario based on difficulty
    const scenarios: Record<string, FireScenario> = {
      easy: {
        id: `mock-scenario-easy-${Date.now()}`,
        startPosition: [0, floorY, 0], // Center of floor
        fireLocations: [
          {
            position: [15, floorY, 0], // East side
            intensity: 0.6,
            description: 'Small fire in east corridor'
          }
        ],
        smokeAreas: [
          {
            nodes: [], // Will be populated by graph builder based on region
            level: 0.3,
            region: 'East corridor'
          }
        ],
        blockedNodes: [],
        blockedPaths: [],
        availableExits: ['exit-6-west', 'exit-6-south'],
        correctPath: ['start', 'center', 'west-exit'],
        description: 'A small fire has started in the east corridor. Smoke is beginning to fill the area. You should evacuate using the west or south exits.',
        difficulty: 'easy',
        estimatedTimeToSafety: 60,
        safetyNotes: 'Always use the nearest safe exit. Avoid smoke-filled areas.'
      },
      medium: {
        id: `mock-scenario-medium-${Date.now()}`,
        startPosition: [0, floorY, 0],
        fireLocations: [
          {
            position: [18, floorY, 0], // East side
            intensity: 0.8,
            description: 'Fire in east wing'
          },
          {
            position: [-10, floorY, 5], // West side, north
            intensity: 0.5,
            description: 'Secondary fire in west wing'
          }
        ],
        smokeAreas: [
          {
            nodes: ['node-east-1', 'node-east-2', 'node-center-1'],
            level: 0.6,
            region: 'East corridor and center'
          },
          {
            nodes: ['node-west-1'],
            level: 0.4,
            region: 'West corridor'
          }
        ],
        blockedNodes: ['node-east-3'],
        blockedPaths: ['node-east-2-node-east-3'],
        availableExits: ['exit-6-west', 'exit-6-south'],
        correctPath: ['start', 'center', 'south-exit'],
        description: 'Multiple fires have broken out. The east exit is blocked by fire and smoke. The west exit has some smoke but is passable. The safest route is through the south exit.',
        difficulty: 'medium',
        estimatedTimeToSafety: 90,
        safetyNotes: 'When multiple exits are available, choose the one with least smoke. Never enter areas with active fire.'
      },
      hard: {
        id: `mock-scenario-hard-${Date.now()}`,
        startPosition: [5, floorY, 0],
        fireLocations: [
          {
            position: [20, floorY, 0], // East side
            intensity: 0.9,
            description: 'Major fire in east wing'
          },
          {
            position: [-15, floorY, 0], // West side
            intensity: 0.7,
            description: 'Fire spreading in west wing'
          }
        ],
        smokeAreas: [
          {
            nodes: ['node-east-1', 'node-east-2', 'node-center-1', 'node-west-1'],
            level: 0.7,
            region: 'Main corridors'
          }
        ],
        blockedNodes: ['node-east-3', 'node-west-2'],
        blockedPaths: ['node-east-2-node-east-3', 'node-west-1-node-west-2'],
        availableExits: ['exit-6-south'],
        correctPath: ['start', 'center', 'south-wing', 'south-exit'],
        description: 'A major fire has broken out, blocking both east and west exits. Heavy smoke fills the main corridors. The only safe exit is through the south wing. Move quickly but carefully through the smoke.',
        difficulty: 'hard',
        estimatedTimeToSafety: 120,
        safetyNotes: 'In severe situations, you may need to pass through smoke-filled areas. Stay low, move quickly, and cover your mouth. Always know your alternate exit routes.'
      }
    };

    const scenario = scenarios[difficulty] || scenarios.medium;

    return {
      scenario,
      reasoning: `Mock scenario generated for ${difficulty} difficulty level. This is a fallback when the AI API is unavailable.`,
      safetyNotes: scenario.safetyNotes
    };
  }
}

export const mockScenarioGenerator = new MockScenarioGenerator();
