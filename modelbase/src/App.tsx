import React, { useState, useEffect, useCallback } from 'react';
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
import { CoordinateSystem } from './components/CoordinateSystem';
import { ScenarioEngine } from './scenario/ScenarioEngine';
import { NavigationGraphImpl } from './navigation/NavigationGraph';
import { GraphBuilder } from './navigation/GraphBuilder';
import { FireScenario } from './ai/types';
import { ScenarioState } from './scenario/types';

// Building data for navigation
const mockBuildingLevels = [
  { floorNumber: 6, sections: [{ x: 0, z: 0, width: 40, depth: 18 }], rooms: [], hasHallways: true, mainHallwayWidth: 2.5, sideHallwayWidth: 2.0, offsetX: 0 }
];

// Movement positions based on scenario choices
const POSITIONS = {
  start: [0, 21, 0] as [number, number, number],           // Center of floor 6
  eastCorridor: [15, 21, 0] as [number, number, number],   // East side
  westStairs: [-18, 21, 0] as [number, number, number],    // West stairwell
  southWing: [-15, 21, 12] as [number, number, number],    // South wing
  mainHallway: [0, 21, 0] as [number, number, number],     // Main hallway
  stairwell: [-18, 14, 0] as [number, number, number],     // Descending stairs (floor 4)
  groundFloor: [-18, 3.5, 0] as [number, number, number],  // Ground level
  exit: [-22, 0, 0] as [number, number, number],           // Outside
};

function App() {
  const [scenario, setScenario] = useState<FireScenario | null>(null);
  const [scenarioEngine, setScenarioEngine] = useState<ScenarioEngine | null>(null);
  const [navigationGraph, setNavigationGraph] = useState<NavigationGraphImpl | null>(null);
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>(POSITIONS.start);
  const [targetPosition, setTargetPosition] = useState<[number, number, number] | undefined>();
  const [scenarioState, setScenarioState] = useState<ScenarioState | null>(null);
  const [firstPersonMode, setFirstPersonMode] = useState(false);
  const [showCoordinateAxes, setShowCoordinateAxes] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Initialize navigation graph
  useEffect(() => {
    try {
      const builder = new GraphBuilder();
      const graph = builder.buildGraph(mockBuildingLevels);
      setNavigationGraph(graph);
    } catch (error) {
      console.error('Error initializing navigation graph:', error);
    }
  }, []);

  // Update scenario state periodically
  useEffect(() => {
    if (!scenarioEngine) return;
    const interval = setInterval(() => {
      setScenarioState(scenarioEngine.getState());
    }, 1000);
    return () => clearInterval(interval);
  }, [scenarioEngine]);

  const handleScenarioStart = useCallback((newScenario: FireScenario) => {
    setScenario(newScenario);
    setCurrentStep(0);
    
    // Reset player to start position
    setPlayerPosition(POSITIONS.start);
    setTargetPosition(POSITIONS.start);
    
    if (navigationGraph) {
      const engine = new ScenarioEngine(newScenario, navigationGraph);
      engine.start();
      setScenarioEngine(engine);
      
      const initialState = engine.getState();
      setScenarioState(initialState);
    } else {
      // Fallback state
      setScenarioState({
        scenarioId: newScenario.id,
        startTime: Date.now(),
        currentTime: Date.now(),
        playerPosition: POSITIONS.start,
        currentFloor: 6,
        fireLocations: newScenario.fireLocations || [],
        smokeAreas: newScenario.smokeAreas || [],
        blockedNodes: [],
        blockedPaths: [],
        availableExits: newScenario.availableExits || ['exit-6-west', 'exit-6-south'],
        playerPath: [],
        status: 'in_progress',
        playerHealth: 100,
        playerAlive: true,
        isTrapped: false
      });
    }
  }, [navigationGraph]);

  // Move character based on scenario decision
  const handleDecision = useCallback((choiceId: string) => {
    let newTarget: [number, number, number] | undefined;
    
    // Map choices to positions based on scenario flow
    switch (choiceId) {
      // Step 0 choices
      case 'assess':
        // Stay in place, look around
        newTarget = playerPosition;
        break;
      case 'east':
        // Move toward east (dangerous - toward fire)
        newTarget = POSITIONS.eastCorridor;
        break;
      case 'west':
        // Move toward west stairs (safe)
        newTarget = POSITIONS.westStairs;
        break;
        
      // Step 1 choices
      case 'west-stairs':
        newTarget = POSITIONS.westStairs;
        break;
      case 'south':
        newTarget = POSITIONS.southWing;
        break;
      case 'elevator':
        // Stay where you are (elevator doesn't work)
        newTarget = playerPosition;
        break;
        
      // Step 2 choices
      case 'descend':
        newTarget = POSITIONS.stairwell;
        break;
      case 'check-floor':
        // Move a bit then come back
        newTarget = POSITIONS.mainHallway;
        break;
        
      // Step 3 choices
      case 'exit':
      case 'wait':
        newTarget = POSITIONS.groundFloor;
        break;
        
      // Final - reached exit
      case 'reached-exit':
        newTarget = POSITIONS.exit;
        break;
        
      default:
        // Move forward a bit
        newTarget = [
          playerPosition[0] - 3,
          playerPosition[1],
          playerPosition[2]
        ];
    }
    
    if (newTarget) {
      setTargetPosition(newTarget);
    }
    
    setCurrentStep(prev => prev + 1);
  }, [playerPosition]);

  const handlePositionUpdate = useCallback((newPosition: [number, number, number]) => {
    setPlayerPosition(newPosition);
    if (scenarioEngine) {
      scenarioEngine.updatePlayerPosition(newPosition);
    }
  }, [scenarioEngine]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      {/* 3D Canvas - 75% width */}
      <div style={{ width: '75%', height: '100%', position: 'relative' }}>
        <Canvas
          camera={{ position: [80, 60, 80], fov: 50 }}
          style={{ background: '#1a1a2e' }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[50, 50, 25]} intensity={0.8} castShadow />
          <pointLight position={[-30, 20, 30]} intensity={0.4} />

          {/* Buildings */}
          <GatesBuilding />
          <HillmanBuilding />
          <ConnectingBridges />

          {/* Stairs */}
          <Stairs position={[19, 0, 0]} direction="east" width={3} />
          <Stairs position={[-19, 0, 0]} direction="west" width={3} />
          <Stairs position={[-15, 0, 12]} direction="south" width={3} />
          <Stairs position={[-15, 0, -12]} direction="north" width={3} />

          {/* Coordinate System (toggle) */}
          {showCoordinateAxes && <CoordinateSystem size={50} />}

          {/* Character */}
          <CharacterController
            position={playerPosition}
            targetPosition={targetPosition}
            onPositionUpdate={handlePositionUpdate}
            showAxes={showCoordinateAxes}
            speedMultiplier={1.0}
          />

          {/* Fire Visualization - shows based on scenario */}
          {scenario && scenarioState && (
            <FireVisualization
              fireLocations={scenarioState.fireLocations || []}
              smokeAreas={scenarioState.smokeAreas || []}
            />
          )}

          {/* Exit Markers */}
          {scenario && scenarioState && (
            <ExitMarkers
              availableExits={scenarioState.availableExits || []}
              currentFloor={scenarioState.currentFloor}
            />
          )}

          {/* Camera Controls */}
          {firstPersonMode ? (
            <FirstPersonCamera
              targetPosition={playerPosition}
              enabled={firstPersonMode}
            />
          ) : (
            <OrbitControls
              makeDefault
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={10}
              maxDistance={200}
              target={[-15, 15, 0]}
            />
          )}
        </Canvas>

        {/* Axes toggle button */}
        <button
          onClick={() => setShowCoordinateAxes(!showCoordinateAxes)}
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            padding: '8px 12px',
            backgroundColor: showCoordinateAxes ? '#4a9c4a' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          📐 Axes
        </button>
      </div>

      {/* Scenario Panel - 25% width */}
      <ScenarioPanel
        onScenarioStart={handleScenarioStart}
        onDecision={handleDecision}
        scenarioState={scenarioState || undefined}
        scenario={scenario || undefined}
        onToggleFirstPerson={setFirstPersonMode}
        firstPersonMode={firstPersonMode}
      />
    </div>
  );
}

export default App;
