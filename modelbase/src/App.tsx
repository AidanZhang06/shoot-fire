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
import { ExitDoor } from './components/ExitDoor';
import { ExitPathMarkers } from './components/ExitPathMarkers';
import { ScenarioEngine } from './scenario/ScenarioEngine';
import { NavigationGraphImpl } from './navigation/NavigationGraph';
import { GraphBuilder } from './navigation/GraphBuilder';
import { FireScenario } from './ai/types';
import { ScenarioState } from './scenario/types';
import { ParsedScenario } from './utils/ScenarioParser';
import { CompassLegend, CameraRotationTracker } from './components/CompassLegend';
import { generateQuadrantFires, generateProgressiveEastSmoke } from './utils/quadrantFires';

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
  const [parsedScenario, setParsedScenario] = useState<ParsedScenario | null>(null);
  const [cameraRotation, setCameraRotation] = useState(0);
  const [showQuadrantFires, setShowQuadrantFires] = useState(true); // Toggle for quadrant fires
  const [quadrantFireFloor, setQuadrantFireFloor] = useState(5); // Floor to show quadrant fires on

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
        fireLocations: Array.isArray(newScenario.fireLocations)
          ? newScenario.fireLocations.map(fire => ({
              ...fire,
              startTime:
                typeof fire.startTime !== 'undefined' && fire.startTime !== null
                  ? fire.startTime
                  : Date.now()
            }))
          : [],
        smokeAreas: Array.isArray(newScenario.smokeAreas) ? newScenario.smokeAreas : [],
        blockedNodes: [],
        blockedPaths: [],
        availableExits: Array.isArray(newScenario.availableExits)
          ? newScenario.availableExits
          : ['exit-6-west', 'exit-6-south'],
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

  const handleScenarioParsed = useCallback((parsed: ParsedScenario) => {
    setParsedScenario(parsed);

    // Update player position if provided
    if (parsed.playerPosition) {
      setPlayerPosition(parsed.playerPosition);
    }

    // Update scenario state with parsed hazards
    if (scenarioState) {
      const fireLocations = parsed.hazards
        .filter(h => h.type === 'fire')
        .map(h => ({
          position: h.position,
          intensity: h.intensity,
          startTime: Date.now()
        }));

      const smokeAreas = parsed.hazards
        .filter(h => h.type === 'smoke')
        .map(h => ({
          nodes: [],
          level: h.intensity,
          region: h.description,
          position: h.position
        }));

      setScenarioState({
        ...scenarioState,
        fireLocations,
        smokeAreas,
        currentFloor: parsed.floor
      });
    }
  }, [scenarioState]);

  const handleReset = useCallback(() => {
    // Reset player to floor 6 starting position
    setPlayerPosition(POSITIONS.start);
    setTargetPosition(POSITIONS.start);
    setCurrentStep(0);
    setScenario(null);
    setScenarioState(null);
    setScenarioEngine(null);
    setParsedScenario(null);
  }, []);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      {/* 3D Canvas - 75% width */}
      <div style={{ width: '75%', height: '100%', position: 'relative' }}>
        {/* Compass Legend Overlay - always visible, rotates with camera */}
        <CompassLegend rotation={cameraRotation} />

        <Canvas
          camera={{ position: [100, 80, 100], fov: 55 }}
          style={{ background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 50%, #252545 100%)' }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[50, 50, 25]} intensity={0.8} castShadow />
          <pointLight position={[-30, 20, 30]} intensity={0.4} />

          {/* Buildings */}
          <GatesBuilding playerPosition={playerPosition} renderDistance={30} />
          <HillmanBuilding playerPosition={playerPosition} renderDistance={30} />
          <ConnectingBridges />

          {/* Exit Doors at ground level - actual exits to escape through */}
          <ExitDoor position={[22.5, 0, 0]} rotation={[0, -Math.PI / 2, 0]} label="EXIT 1 - EAST" />
          <ExitDoor position={[-22.5, 0, 0]} rotation={[0, Math.PI / 2, 0]} label="EXIT 2 - WEST" />
          <ExitDoor position={[-15, 0, 17]} rotation={[0, Math.PI, 0]} label="EXIT 3 - SOUTH" />
          <ExitDoor position={[-15, 0, -17]} rotation={[0, 0, 0]} label="EXIT 4 - NORTH" />

          {/* Stairs - ground floor stairs also function as exits */}
          <Stairs position={[19, 0, 0]} direction="east" width={3} isExit={true} />
          <Stairs position={[-19, 0, 0]} direction="west" width={3} isExit={true} />
          <Stairs position={[-15, 0, 12]} direction="south" width={3} isExit={true} />
          <Stairs position={[-15, 0, -12]} direction="north" width={3} isExit={true} />

          {/* West side stairs - all floors */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map(floorNum => {
            const mainWingWidth = 45 - (floorNum - 1) * 1.2;
            const offsetX = floorNum >= 7 ? 2 + (floorNum - 6) * 0.8 : 0;
            const westX = -(mainWingWidth / 2) + 2 + offsetX;
            const yPos = (floorNum - 1) * 3.5;

            return (
              <Stairs
                key={`west-${floorNum}`}
                position={[westX, yPos, 0]}
                direction="west"
                width={2.5}
                label={`Floor ${floorNum}-${floorNum + 1}`}
              />
            );
          })}

          {/* East side stairs - all floors */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map(floorNum => {
            const mainWingWidth = 45 - (floorNum - 1) * 1.2;
            const offsetX = floorNum >= 7 ? 2 + (floorNum - 6) * 0.8 : 0;
            const eastX = (mainWingWidth / 2) - 2 + offsetX;
            const yPos = (floorNum - 1) * 3.5;

            return (
              <Stairs
                key={`east-${floorNum}`}
                position={[eastX, yPos, 0]}
                direction="east"
                width={2.5}
                label={`Floor ${floorNum}-${floorNum + 1}`}
              />
            );
          })}

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

          {/* Progressive East Corridor Smoke - Q1 only, grows with steps */}
          {showQuadrantFires && scenario && scenarioState && (
            <FireVisualization
              fireLocations={generateProgressiveEastSmoke(quadrantFireFloor, currentStep, 10)}
              smokeAreas={[]}
            />
          )}

          {/* Exit Path Markers - Floor indicators showing the way to exits */}
          <ExitPathMarkers floor={6} />

          {/* Exit Markers - Always visible */}
          <ExitMarkers
            availableExits={
              scenario && scenarioState
                ? scenarioState.availableExits || []
                : ['exit-6-east', 'exit-6-west', 'exit-6-south'] // Default exits for floor 6
            }
          />

          {/* Camera rotation tracker for compass */}
          <CameraRotationTracker onRotationChange={setCameraRotation} />

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
        onScenarioParsed={handleScenarioParsed}
        onReset={handleReset}
      />
    </div>
  );
}

export default App;
