import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GatesBuilding } from './GatesBuilding';
import { HillmanBuilding } from './HillmanBuilding';
import { ConnectingBridges } from './ConnectingBridges';
import { ScenarioPanel } from './ScenarioPanel';
import { CharacterController } from './components/CharacterController';
import { FireVisualization } from './components/FireVisualization';
import { ExitMarkers } from './components/ExitMarkers';
import { FirstPersonCamera } from './components/FirstPersonCamera';
import { Stairs } from './components/Stairs';
import { ScenarioEngine } from './scenario/ScenarioEngine';
import { NavigationGraphImpl } from './navigation/NavigationGraph';
import { GraphBuilder } from './navigation/GraphBuilder';
import { FireScenario } from './ai/types';
import { ScenarioState } from './scenario/types';
import { safetyEvaluator } from './evaluation/SafetyEvaluator';
import { phoenixTracer } from './config/arizeConfig';
import { Pathfinder } from './navigation/Pathfinder';

// Mock building data for graph building (in real implementation, this would come from GatesBuilding)
const mockBuildingLevels = [
  { floorNumber: 6, sections: [{ x: 0, z: 0, width: 40, depth: 18 }], rooms: [], hasHallways: true, mainHallwayWidth: 2.5, sideHallwayWidth: 2.0, offsetX: 0 }
];

function App() {
  const [scenario, setScenario] = useState<FireScenario | null>(null);
  const [scenarioEngine, setScenarioEngine] = useState<ScenarioEngine | null>(null);
  const [navigationGraph, setNavigationGraph] = useState<NavigationGraphImpl | null>(null);
  const [pathfinder, setPathfinder] = useState<Pathfinder | null>(null);
  // Start character inside building on floor 6 (y=21 is floor 6, x=0 z=0 is center of main wing)
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 21, 0]);
  const [targetPosition, setTargetPosition] = useState<[number, number, number] | undefined>();
  const [scenarioState, setScenarioState] = useState<ScenarioState | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [firstPersonMode, setFirstPersonMode] = useState(false);
  const [thirdPersonCameraState, setThirdPersonCameraState] = useState({
    position: [80, 60, 80] as [number, number, number],
    target: [-15, 15, 0] as [number, number, number]
  });

  // Initialize navigation graph
  useEffect(() => {
    try {
      const builder = new GraphBuilder();
      const graph = builder.buildGraph(mockBuildingLevels);
      setNavigationGraph(graph);
      setPathfinder(new Pathfinder(graph));
    } catch (error) {
      console.error('Error initializing navigation graph:', error);
    }
  }, []);

  // Update scenario state periodically
  useEffect(() => {
    if (!scenarioEngine) return;

    const interval = setInterval(() => {
      try {
        const state = scenarioEngine.getState();
        setScenarioState(state);
      } catch (error) {
        console.error('Error getting scenario state:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [scenarioEngine]);

  // Move character along path step by step
  useEffect(() => {
    if (currentPath.length === 0 || currentPathIndex >= currentPath.length) {
      return;
    }

    if (!navigationGraph) return;

    const currentNodeId = currentPath[currentPathIndex];
    const currentNode = navigationGraph.getNode(currentNodeId);
    
    if (currentNode) {
      setTargetPosition(currentNode.position);
    }
  }, [currentPath, currentPathIndex, navigationGraph]);

  const handleScenarioStart = (newScenario: FireScenario) => {
    try {
      setScenario(newScenario);
      setEvaluationResult(null);
      setCurrentPath([]);
      setCurrentPathIndex(0);
      
      if (navigationGraph) {
        const engine = new ScenarioEngine(newScenario, navigationGraph);
        engine.start();
        setScenarioEngine(engine);
        
        // Set initial player position inside building (use scenario start position or default to center of floor 6)
        const startPos = newScenario.startPosition || [0, 21, 0];
        setPlayerPosition(startPos);
        setTargetPosition(undefined);
        
        // Update engine with initial position
        engine.updatePlayerPosition(startPos);
      } else {
        console.warn('Navigation graph not initialized yet');
      }
    } catch (error) {
      console.error('Error starting scenario:', error);
    }
  };

  const handleDecision = (decisionId: string) => {
    if (!scenarioEngine || !scenario || !scenarioState || !pathfinder || !navigationGraph) return;

    const state = scenarioEngine.getState();
    const playerNodeId = state.playerNodeId;
    
    if (!playerNodeId) {
      // Find nearest node to current position
      const nearestNode = findNearestNode(playerPosition, navigationGraph);
      if (nearestNode) {
        scenarioEngine.updatePlayerPosition(nearestNode.position, nearestNode.id);
      }
      return;
    }

    // Find path based on decision direction
    let targetExitId: string | undefined;
    const availableExits = scenarioEngine.getReachableExits();
    
    if (decisionId === 'move-east') {
      const eastExit = availableExits.find(e => e.id.includes('east'));
      targetExitId = eastExit?.id;
    } else if (decisionId === 'move-west') {
      const westExit = availableExits.find(e => e.id.includes('west'));
      targetExitId = westExit?.id;
    } else if (decisionId === 'move-south') {
      const southExit = availableExits.find(e => e.id.includes('south'));
      targetExitId = southExit?.id;
    } else if (decisionId === 'move-north') {
      // Move towards center/north
      const centerNode = navigationGraph.getNodesOnFloor(state.currentFloor)
        .find(n => Math.abs(n.position[2]) < 2 && n.type === 'hallway');
      if (centerNode) {
        const path = pathfinder.findPath(playerNodeId, centerNode.id);
        if (path && path.nodes.length > 1) {
          setCurrentPath(path.nodes);
          setCurrentPathIndex(1); // Start from second node (first is current)
          return;
        }
      }
    }

    if (targetExitId) {
      const path = pathfinder.findPath(playerNodeId, targetExitId);
      if (path && path.nodes.length > 1) {
        setCurrentPath(path.nodes);
        setCurrentPathIndex(1); // Start from second node (first is current position)
        
        // Evaluate decision
        const evaluation = safetyEvaluator.evaluateDecision(
          path.nodes,
          scenario,
          state,
          path
        );
        setEvaluationResult(evaluation);

        // Trace decision
        phoenixTracer.trace('user_decision', {
          scenarioId: scenario.id,
          decisionId,
          pathLength: path.nodes.length
        }, {
          correct: evaluation.correct,
          score: evaluation.score
        }, {});
      }
    }
  };

  // Handle character reaching a path node
  const handlePositionUpdate = (pos: [number, number, number], nodeId?: string) => {
    setPlayerPosition(pos);
    
    if (scenarioEngine && nodeId) {
      scenarioEngine.updatePlayerPosition(pos, nodeId);
      
      // Move to next node in path if we're following a path
      if (currentPath.length > 0 && currentPathIndex < currentPath.length - 1) {
        const nextIndex = currentPathIndex + 1;
        setCurrentPathIndex(nextIndex);
      } else if (currentPathIndex >= currentPath.length - 1) {
        // Reached end of path
        setCurrentPath([]);
        setCurrentPathIndex(0);
      }
    }
  };

  const handleExitClick = (exitId: string) => {
    if (!scenarioEngine || !scenario || !pathfinder || !navigationGraph) return;

    const state = scenarioEngine.getState();
    const playerNodeId = state.playerNodeId;
    
    if (!playerNodeId) return;

    const path = pathfinder.findPath(playerNodeId, exitId);
    if (path && path.nodes.length > 1) {
      setCurrentPath(path.nodes);
      setCurrentPathIndex(1);
      
      const exitNode = navigationGraph.getNode(exitId);
      if (exitNode) {
        const evaluation = safetyEvaluator.evaluateDecision(
          path.nodes,
          scenario,
          state,
          path
        );
        setEvaluationResult(evaluation);
      }
    }
  };

  // Helper to find nearest node
  const findNearestNode = (position: [number, number, number], graph: NavigationGraphImpl) => {
    let nearest: { id: string; position: [number, number, number] } | null = null;
    let minDistance = Infinity;

    graph.nodes.forEach((node, id) => {
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
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      {/* 3D Model Canvas - takes up 3/4 of the page */}
      <div style={{ width: '75%', height: '100vh' }}>
        <Canvas
          camera={{ 
            position: firstPersonMode ? [0, 21, 0] : thirdPersonCameraState.position, 
            fov: 75 
          }}
          style={{ background: '#a0a0a0', width: '100%', height: '100%' }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.5} color="#6666ff" />
          <directionalLight position={[50, 50, 30]} intensity={1.2} castShadow />
          <directionalLight position={[-50, 40, -30]} intensity={0.6} />
          <spotLight position={[0, 50, 0]} angle={Math.PI / 3} penumbra={0.5} intensity={1.5} />
          <spotLight position={[-30, 40, 0]} angle={Math.PI / 4} penumbra={0.3} intensity={1.0} color="#88ccff" />

          {/* Gates Building - L-shaped with detailed rooms */}
          <GatesBuilding />

          {/* Hillman Building */}
          <HillmanBuilding />

          {/* Connecting Bridges between buildings */}
          <ConnectingBridges />

          {/* Fire Visualization */}
          {scenario && scenarioState && scenarioState.fireLocations && Array.isArray(scenarioState.fireLocations) && scenarioState.fireLocations.length > 0 && (
            <FireVisualization fireLocations={scenarioState.fireLocations} />
          )}

          {/* Exit Markers - Show all exits for the current floor */}
          {scenario && scenarioState && Array.isArray(scenarioState.availableExits) && (
            <ExitMarkers
              availableExits={scenarioState.availableExits}
              onExitClick={handleExitClick}
            />
          )}

          {/* Stairs between floors - positioned inside building */}
          {Array.from({ length: 9 }).map((_, floorNum) => {
            const floorY = floorNum * 3.5;
            // Calculate building dimensions for this floor
            const mainWingWidth = 45 - floorNum * 1.2;
            const sideWingWidth = 15;
            const sideWingDepth = 35 - floorNum * 1;
            const offsetX = floorNum >= 7 ? 2 + (floorNum - 6) * 0.8 : 0;
            
            // Position stairs inside building at east and west ends (but inside walls)
            // Main wing stairs
            const eastStairX = (mainWingWidth / 2) - 2 + offsetX; // 2 units from edge
            const westStairX = -(mainWingWidth / 2) + 2 + offsetX; // 2 units from edge
            
            // Side wing stairs (north-south wing)
            const sideWingX = -mainWingWidth / 2 + sideWingWidth / 2 + offsetX;
            const southStairZ = sideWingDepth / 2 - 2; // 2 units from south edge
            
            if (floorNum < 8) {
              return (
                <React.Fragment key={`stairs-floor-${floorNum + 1}`}>
                  {/* Main wing - East stairwell */}
                  <Stairs
                    key={`stairs-east-${floorNum + 1}`}
                    position={[eastStairX, floorY, 0]}
                    floorFrom={floorNum + 1}
                    floorTo={floorNum + 2}
                    direction="up"
                    label={`F${floorNum + 1}→F${floorNum + 2}`}
                    width={2.5}
                  />
                  {/* Main wing - West stairwell */}
                  <Stairs
                    key={`stairs-west-${floorNum + 1}`}
                    position={[westStairX, floorY, 0]}
                    floorFrom={floorNum + 1}
                    floorTo={floorNum + 2}
                    direction="up"
                    label={`F${floorNum + 1}→F${floorNum + 2}`}
                    width={2.5}
                  />
                  {/* Side wing - South stairwell */}
                  <Stairs
                    key={`stairs-south-${floorNum + 1}`}
                    position={[sideWingX, floorY, southStairZ]}
                    floorFrom={floorNum + 1}
                    floorTo={floorNum + 2}
                    direction="up"
                    label={`F${floorNum + 1}→F${floorNum + 2}`}
                    width={2.5}
                  />
                </React.Fragment>
              );
            }
            return null;
          })}

          {/* Character Controller - positioned inside building */}
          {playerPosition && (
            <CharacterController
              position={playerPosition}
              targetPosition={targetPosition}
              currentNode={navigationGraph?.getNode(scenarioState?.playerNodeId || '')}
              onPositionUpdate={handlePositionUpdate}
            />
          )}

          {/* First Person Camera */}
          {firstPersonMode && playerPosition && (
            <FirstPersonCamera
              targetPosition={playerPosition}
              enabled={firstPersonMode}
              height={1.6}
            />
          )}

          {/* Camera controls - only enabled in 3rd person mode */}
          {!firstPersonMode && (
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={15}
              maxDistance={300}
              target={thirdPersonCameraState.target}
              enabled={!firstPersonMode}
              onChange={(e) => {
                // Save camera state when user moves it in 3rd person
                if (e?.target) {
                  const controls = e.target as any;
                  if (controls.object) {
                    const pos = controls.object.position;
                    const target = controls.target;
                    setThirdPersonCameraState({
                      position: [pos.x, pos.y, pos.z],
                      target: [target.x, target.y, target.z]
                    });
                  }
                }
              }}
            />
          )}
        </Canvas>
      </div>

      {/* Scenario Panel - takes up 1/4 of the page */}
      <ScenarioPanel
        onScenarioStart={handleScenarioStart}
        onDecision={handleDecision}
        scenarioState={scenarioState || undefined}
        onToggleFirstPerson={setFirstPersonMode}
        firstPersonMode={firstPersonMode}
      />
    </div>
  );
}

export default App;
