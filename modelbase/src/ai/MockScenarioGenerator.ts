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
        startPosition: [0, floorY, 0], // Center of floor - safe starting point
        fireLocations: [
          {
            position: [15, floorY, 0], // East side - far from start
            intensity: 0.5, // Lower intensity
            description: 'Small fire in east corridor'
          }
        ],
        smokeAreas: [
          {
            nodes: [], // Will be populated by graph builder based on region
            level: 0.2, // Low smoke level
            region: 'East corridor'
          }
        ],
        blockedNodes: [], // No blocked nodes
        blockedPaths: [], // All paths clear
        availableExits: ['exit-6-west', 'exit-6-south', 'exit-6-east'], // Multiple clear exits
        correctPath: ['start', 'center', 'west-exit'],
        description: 'A small fire has started in the east corridor, far from your location. Light smoke is visible but exits are clear. You have multiple safe paths - the west or south exits are recommended.',
        difficulty: 'easy',
        estimatedTimeToSafety: 60,
        safetyNotes: 'Always use the nearest safe exit. Avoid smoke-filled areas. Multiple exits are available.'
      },
      medium: {
        id: `mock-scenario-medium-${Date.now()}`,
        startPosition: [5, floorY, 0], // Slightly offset - closer to danger
        fireLocations: [
          {
            position: [18, floorY, 0], // East side
            intensity: 0.75,
            description: 'Fire in east wing'
          },
          {
            position: [-10, floorY, 5], // West side, north
            intensity: 0.6,
            description: 'Secondary fire in west wing'
          }
        ],
        smokeAreas: [
          {
            nodes: ['node-east-1', 'node-east-2', 'node-center-1'],
            level: 0.6, // Moderate smoke
            region: 'East corridor and center'
          },
          {
            nodes: ['node-west-1'],
            level: 0.5, // Moderate smoke
            region: 'West corridor'
          }
        ],
        blockedNodes: ['node-east-3'], // One node blocked
        blockedPaths: ['node-east-2-node-east-3'], // One path blocked
        availableExits: ['exit-6-west', 'exit-6-south'], // Two exits (one blocked)
        correctPath: ['start', 'center', 'south-exit'],
        description: 'Multiple fires have broken out in the building. The east exit is blocked by fire and heavy smoke. The west exit has moderate smoke but is passable with caution. Your safest route is through the south exit.',
        difficulty: 'medium',
        estimatedTimeToSafety: 90,
        safetyNotes: 'When multiple exits are available, choose the one with least smoke. Stay low in smoke-filled areas. Never enter areas with active fire.'
      },
      hard: {
        id: `mock-scenario-hard-${Date.now()}`,
        startPosition: [10, floorY, 0], // Close to fire - dangerous start
        fireLocations: [
          {
            position: [18, floorY, 0], // East side - close to start
            intensity: 0.95, // Very high intensity
            description: 'Major fire in east wing'
          },
          {
            position: [-15, floorY, 0], // West side
            intensity: 0.85, // High intensity
            description: 'Fire spreading in west wing'
          },
          {
            position: [0, floorY, 8], // Center, north - cutting off escape route
            intensity: 0.7,
            description: 'Fire blocking center passage'
          }
        ],
        smokeAreas: [
          {
            nodes: ['node-east-1', 'node-east-2', 'node-center-1', 'node-west-1', 'node-center-2'],
            level: 0.85, // Very heavy smoke
            region: 'Main corridors'
          }
        ],
        blockedNodes: ['node-east-3', 'node-west-2', 'node-center-3'], // Multiple blocked nodes
        blockedPaths: ['node-east-2-node-east-3', 'node-west-1-node-west-2', 'node-center-1-node-center-2'], // Multiple blocked paths
        availableExits: ['exit-6-south'], // Only one exit available
        correctPath: ['start', 'south-wing', 'south-exit'], // Longer, more dangerous path
        description: 'MAJOR FIRE ALERT: Multiple fires have broken out simultaneously, blocking both east and west exits. Heavy smoke fills all main corridors. The south exit is your only remaining option - you must navigate through smoke-filled areas. Move quickly but stay low!',
        difficulty: 'hard',
        estimatedTimeToSafety: 150, // Longer time
        safetyNotes: 'CRITICAL: In severe situations, you must pass through smoke-filled areas. Stay low to the ground where air is clearer, move quickly but don\'t panic, cover your mouth with cloth if available. This scenario tests your ability to find the last remaining safe exit. Know your building layout!'
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
