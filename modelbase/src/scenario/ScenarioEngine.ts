import { ScenarioStateManager } from './ScenarioState';
import { NavigationGraphImpl } from '../navigation/NavigationGraph';
import { FireScenario } from '../ai/types';
import { Pathfinder } from '../navigation/Pathfinder';

export class ScenarioEngine {
  private stateManager: ScenarioStateManager;
  private graph: NavigationGraphImpl;
  private pathfinder: Pathfinder;
  private evolutionInterval?: number;

  constructor(scenario: FireScenario, graph: NavigationGraphImpl) {
    this.graph = graph;
    this.stateManager = new ScenarioStateManager(scenario, graph);
    this.pathfinder = new Pathfinder(graph);
  }

  start(): void {
    this.stateManager.start();
    
    // Start evolution loop (update every 5 seconds)
    this.evolutionInterval = window.setInterval(() => {
      this.stateManager.evolve(5);
    }, 5000);
  }

  stop(): void {
    if (this.evolutionInterval) {
      clearInterval(this.evolutionInterval);
      this.evolutionInterval = undefined;
    }
  }

  getState() {
    return this.stateManager.getState();
  }

  updatePlayerPosition(position: [number, number, number], nodeId?: string): void {
    this.stateManager.updatePlayerPosition(position, nodeId);
  }

  getAvailablePaths(): string[] {
    return this.stateManager.getAvailablePaths();
  }

  findPathToExit(exitId?: string): import('../navigation/types').Path | null {
    const state = this.stateManager.getState();
    if (!state.playerNodeId) return null;

    if (exitId) {
      return this.pathfinder.findPath(state.playerNodeId, exitId);
    } else {
      return this.pathfinder.findPathToNearestExit(state.playerNodeId);
    }
  }

  getReachableExits(): Array<{ id: string; path: import('../navigation/types').Path }> {
    const state = this.stateManager.getState();
    if (!state.playerNodeId) return [];

    const exits = this.graph.getExits();
    const reachableExits: Array<{ id: string; path: import('../navigation/types').Path }> = [];

    // If no available exits specified, use all exits on current floor
    const exitsToCheck = state.availableExits.length > 0 
      ? state.availableExits 
      : exits.filter(e => e.floor === state.currentFloor).map(e => e.id);

    exits.forEach(exit => {
      if (exitsToCheck.includes(exit.id)) {
        const path = this.pathfinder.findPath(state.playerNodeId!, exit.id);
        if (path) {
          reachableExits.push({ id: exit.id, path });
        }
      }
    });

    return reachableExits.sort((a, b) => a.path.totalCost - b.path.totalCost);
  }

  getStateManager(): ScenarioStateManager {
    return this.stateManager;
  }

  cleanup(): void {
    this.stop();
  }
}

