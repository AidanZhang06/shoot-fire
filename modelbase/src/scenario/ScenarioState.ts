import { ScenarioState, ScenarioEvolution } from './types';
import { FireScenario } from '../ai/types';
import { NavigationGraphImpl } from '../navigation/NavigationGraph';
import { fireExits } from '../navigation/FireExits';
import { PlayerStateManager } from '../player/PlayerState';

export class ScenarioStateManager {
  private state: ScenarioState;
  private graph: NavigationGraphImpl;
  private evolutionConfig: ScenarioEvolution;
  private playerState: PlayerStateManager;
  private lastUpdateTime: number;

  constructor(scenario: FireScenario, graph: NavigationGraphImpl) {
    this.graph = graph;
    this.evolutionConfig = {
      fireSpread: true,
      smokeIncrease: true,
      pathCollapse: false, // Can be enabled for harder scenarios
      timeStep: 5 // Update every 5 seconds
    };

    // Initialize player state
    this.playerState = new PlayerStateManager(scenario.startPosition);
    this.lastUpdateTime = Date.now();

    // Calculate current floor from start position
    const currentFloor = Math.floor(scenario.startPosition[1] / 3.5) + 1;
    
    // Initialize state from scenario
    this.state = {
      scenarioId: scenario.id,
      startTime: Date.now(),
      currentTime: Date.now(),
      playerPosition: scenario.startPosition,
      currentFloor: currentFloor,
      fireLocations: (scenario.fireLocations || []).map(fire => ({
        ...fire,
        startTime: Date.now()
      })),
      smokeAreas: [...(scenario.smokeAreas || [])],
      blockedNodes: [...(scenario.blockedNodes || [])],
      blockedPaths: [...(scenario.blockedPaths || [])],
      // If no exits specified, use all exits on the starting floor
      availableExits: scenario.availableExits && scenario.availableExits.length > 0
        ? [...scenario.availableExits]
        : fireExits.filter(e => e.floor === currentFloor).map(e => e.id),
      playerPath: [],
      status: 'not_started',
      playerHealth: 100,
      playerAlive: true,
      isTrapped: false
    };
    
    console.log('📊 ScenarioState initialized:', {
      scenarioId: this.state.scenarioId,
      fireLocations: this.state.fireLocations.length,
      smokeAreas: this.state.smokeAreas.length,
      blockedNodes: this.state.blockedNodes.length,
      availableExits: this.state.availableExits.length,
      currentFloor: this.state.currentFloor
    });

    // Apply initial scenario to graph
    this.applyScenarioToGraph(scenario);
  }

  getState(): ScenarioState {
    return { ...this.state };
  }

  start(): void {
    if (this.state.status === 'not_started') {
      this.state.status = 'in_progress';
      this.state.startTime = Date.now();
      this.state.currentTime = Date.now();
    }
  }

  updatePlayerPosition(position: [number, number, number], nodeId?: string): void {
    this.state.playerPosition = position;
    this.state.playerNodeId = nodeId;
    this.state.currentFloor = Math.floor(position[1] / 3.5) + 1;
    
    // Update player state position
    this.playerState.updatePosition(position);
    
    if (nodeId && !this.state.playerPath.includes(nodeId)) {
      this.state.playerPath.push(nodeId);
    }

    // Update player state based on current environment
    this.updatePlayerStateFromEnvironment();

    // Check if player reached an exit
    if (nodeId && this.state.availableExits.includes(nodeId)) {
      if (this.state.playerAlive) {
        this.complete('safe');
      }
    }

    // Check if player is dead
    if (!this.state.playerAlive) {
      this.complete('death');
      return;
    }

    // Check if player is trapped (no viable path to any exit)
    if (this.checkIfTrapped()) {
      this.state.isTrapped = true;
      this.complete('trapped');
      return;
    }

    // Check if player is in danger (legacy check)
    if (this.isPlayerInDanger()) {
      this.complete('unsafe');
    }
  }

  evolve(elapsedSeconds: number): void {
    if (this.state.status !== 'in_progress') return;

    this.state.currentTime = Date.now();
    const elapsed = (this.state.currentTime - this.state.startTime) / 1000;

    // Update player state continuously based on environment
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = now;
    
    if (deltaTime > 0 && deltaTime < 1) { // Only update if reasonable delta
      this.updatePlayerStateFromEnvironment(deltaTime);
      
      // Sync player state to scenario state
      const playerState = this.playerState.getState();
      this.state.playerHealth = playerState.health;
      this.state.playerAlive = playerState.alive;
      
      // Check if player died
      if (!playerState.alive) {
        this.complete('death');
        return;
      }
    }

    // Fire spreads over time
    if (this.evolutionConfig.fireSpread) {
      this.evolveFire(elapsed);
    }

    // Smoke increases over time
    if (this.evolutionConfig.smokeIncrease) {
      this.evolveSmoke(elapsed);
    }

    // Paths may collapse
    if (this.evolutionConfig.pathCollapse) {
      this.evolvePathCollapse(elapsed);
    }

    // Check timeout (e.g., 5 minutes max)
    if (elapsed > 300) {
      this.complete('timeout');
    }
  }

  private evolveFire(elapsedSeconds: number): void {
    // Fire intensity increases and spreads to nearby nodes
    if (!this.state.fireLocations) return;
    this.state.fireLocations.forEach(fire => {
      const fireAge = (Date.now() - fire.startTime) / 1000;
      
      // Increase intensity over time (capped at 1.0)
      fire.intensity = Math.min(1.0, fire.intensity + (fireAge * 0.01));
      
      // Spread to nearby nodes (simplified - in reality would check adjacency)
      if (fire.nodeId) {
        const fireNode = this.graph.getNode(fire.nodeId);
        if (fireNode) {
          fireNode.neighbors.forEach(neighborId => {
            const neighbor = this.graph.getNode(neighborId);
            if (neighbor && !neighbor.blocked && fireAge > 10) {
              // After 10 seconds, fire can spread
              const spreadChance = fire.intensity * 0.1;
              if (Math.random() < spreadChance) {
                this.graph.blockNode(neighborId);
                if (!this.state.blockedNodes.includes(neighborId)) {
                  this.state.blockedNodes.push(neighborId);
                }
              }
            }
          });
        }
      }
    });
  }

  private evolveSmoke(elapsedSeconds: number): void {
    // Smoke levels increase in affected areas
    if (!this.state.smokeAreas) return;
    this.state.smokeAreas.forEach(smokeArea => {
      // Smoke increases over time, but more slowly
      smokeArea.level = Math.min(1.0, smokeArea.level + (elapsedSeconds * 0.001));
      
      // Update graph nodes
      if (!smokeArea.nodes) return;
      smokeArea.nodes.forEach(nodeId => {
        this.graph.setSmokeLevel(nodeId, smokeArea.level);
      });
    });
  }

  private evolvePathCollapse(elapsedSeconds: number): void {
    // Randomly collapse paths (for harder scenarios)
    if (elapsedSeconds > 30 && Math.random() < 0.01) {
      // 1% chance per update to collapse a random path
      const allEdges = Array.from(this.graph.edges.keys());
      if (allEdges.length > 0) {
        const randomEdge = allEdges[Math.floor(Math.random() * allEdges.length)];
        const [fromId, toId] = randomEdge.split('-');
        
        const edge = this.graph.getEdge(fromId, toId);
        if (edge && !edge.blocked) {
          edge.blocked = true;
          if (!this.state.blockedPaths.includes(randomEdge)) {
            this.state.blockedPaths.push(randomEdge);
          }
        }
      }
    }
  }

  private isPlayerInDanger(): boolean {
    const playerNode = this.state.playerNodeId 
      ? this.graph.getNode(this.state.playerNodeId)
      : null;

    if (!playerNode) return false;

    // Check if player is in a blocked node
    if (playerNode.blocked) return true;

    // Check if player is in a fire location
    const inFire = this.state.fireLocations.some(fire => {
      if (fire.nodeId === playerNode.id) return true;
      const distance = Math.sqrt(
        Math.pow(playerNode.position[0] - fire.position[0], 2) +
        Math.pow(playerNode.position[2] - fire.position[2], 2)
      );
      return distance < 2 && fire.intensity > 0.5;
    });

    if (inFire) return true;

    // Check if player is in heavy smoke
    if (playerNode.smokeLevel && playerNode.smokeLevel > 0.8) {
      return true;
    }

    return false;
  }

  private complete(outcome: 'safe' | 'unsafe' | 'timeout' | 'death' | 'trapped'): void {
    this.state.status = 'completed';
    this.state.outcome = outcome;
    
    if (outcome === 'safe') {
      this.state.timeToSafety = (this.state.currentTime - this.state.startTime) / 1000;
    }
  }

  // Update player state based on current environment (fire/smoke)
  private updatePlayerStateFromEnvironment(deltaTime: number = 0.1): void {
    if (!this.state.playerNodeId) return;

    const playerNode = this.graph.getNode(this.state.playerNodeId);
    if (!playerNode) return;

    // Check if player is in fire
    const isInFire = this.state.fireLocations.some(fire => {
      if (fire.nodeId === playerNode.id) return true;
      const distance = Math.sqrt(
        Math.pow(playerNode.position[0] - fire.position[0], 2) +
        Math.pow(playerNode.position[2] - fire.position[2], 2)
      );
      return distance < 2 && fire.intensity > 0.5;
    });

    // Get smoke level at current node
    const smokeLevel = playerNode.smokeLevel || 0;

    // Update player state
    this.playerState.updateFromEnvironment(isInFire, smokeLevel, deltaTime);
  }

  // Check if player is trapped (no viable path to any exit)
  private checkIfTrapped(): boolean {
    if (!this.state.playerNodeId) return false;

    // Check if there's a path to any available exit
    const exits = this.graph.getExits();
    const availableExits = exits.filter(e => this.state.availableExits.includes(e.id));

    if (availableExits.length === 0) return true;

    // Try to find path to each exit
    for (const exit of availableExits) {
      const path = this.findPathToNode(this.state.playerNodeId!, exit.id);
      if (path && path.length > 0) {
        return false; // Found a viable path
      }
    }

    return true; // No viable path to any exit
  }

  // Simple pathfinding helper (uses graph directly)
  private findPathToNode(startId: string, goalId: string): string[] | null {
    const visited = new Set<string>();
    const queue: Array<{ id: string; path: string[] }> = [{ id: startId, path: [startId] }];

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;

      if (visited.has(id)) continue;
      visited.add(id);

      if (id === goalId) {
        return path;
      }

      const node = this.graph.getNode(id);
      if (!node || node.blocked) continue;

      for (const neighborId of node.neighbors) {
        if (visited.has(neighborId)) continue;

        const neighbor = this.graph.getNode(neighborId);
        if (!neighbor || neighbor.blocked) continue;

        const edge = this.graph.getEdge(id, neighborId);
        if (!edge || edge.blocked) continue;

        queue.push({ id: neighborId, path: [...path, neighborId] });
      }
    }

    return null;
  }

  // Get player state manager (for speed multiplier)
  getPlayerStateManager(): PlayerStateManager {
    return this.playerState;
  }

  private applyScenarioToGraph(scenario: FireScenario): void {
    // Block nodes
    if (scenario.blockedNodes) {
      scenario.blockedNodes.forEach(nodeId => {
        this.graph.blockNode(nodeId);
      });
    }

    // Block paths
    if (scenario.blockedPaths) {
      scenario.blockedPaths.forEach(edgeKey => {
        const [fromId, toId] = edgeKey.split('-');
        const edge = this.graph.getEdge(fromId, toId);
        if (edge) {
          edge.blocked = true;
        }
      });
    }

    // Apply smoke
    if (scenario.smokeAreas) {
      scenario.smokeAreas.forEach(smokeArea => {
        if (smokeArea.nodes) {
          smokeArea.nodes.forEach(nodeId => {
            this.graph.setSmokeLevel(nodeId, smokeArea.level);
          });
        }
      });
    }

    // Map fire locations to nodes (find nearest node)
    if (scenario.fireLocations) {
      scenario.fireLocations.forEach(fire => {
        const nearestNode = this.findNearestNode(fire.position);
        if (nearestNode) {
          fire.nodeId = nearestNode.id;
          this.graph.blockNode(nearestNode.id);
          if (!this.state.blockedNodes.includes(nearestNode.id)) {
            this.state.blockedNodes.push(nearestNode.id);
          }
        }
      });
    }
  }

  private findNearestNode(position: [number, number, number]): { id: string; position: [number, number, number] } | null {
    let nearest: { id: string; position: [number, number, number] } | null = null;
    let minDistance = Infinity;

    this.graph.nodes.forEach((node, id) => {
      const distance = Math.sqrt(
        Math.pow(node.position[0] - position[0], 2) +
        Math.pow(node.position[1] - position[1], 2) +
        Math.pow(node.position[2] - position[2], 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = { id, position: node.position };
      }
    });

    return nearest;
  }

  getAvailablePaths(): string[] {
    if (!this.state.playerNodeId) return [];
    
    const playerNode = this.graph.getNode(this.state.playerNodeId);
    if (!playerNode) return [];

    return playerNode.neighbors.filter(neighborId => {
      const neighbor = this.graph.getNode(neighborId);
      if (!neighbor || neighbor.blocked) return false;
      
      const edge = this.graph.getEdge(this.state.playerNodeId!, neighborId);
      return edge && !edge.blocked;
    });
  }

  reset(): void {
    this.state.status = 'not_started';
    this.state.playerPath = [];
    this.state.outcome = undefined;
    this.state.timeToSafety = undefined;
  }
}

