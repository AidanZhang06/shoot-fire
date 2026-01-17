import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import { CoordinateSystem } from './CoordinateSystem';
import { OrientedCharacterController } from './OrientedCharacterController';
import * as THREE from 'three';

/**
 * Coordinate System Example Scene
 *
 * This component demonstrates:
 * 1. Global coordinate system visualization (World Axes)
 * 2. Local coordinate system on character (Character Axes)
 * 3. Vector-based movement in local space
 * 4. Orientation tracking with getWorldDirection()
 *
 * THREE.JS COORDINATE CONVENTIONS:
 * - X-axis (Red): Right is positive, Left is negative
 * - Y-axis (Green): Up is positive, Down is negative
 * - Z-axis (Blue): Toward camera is positive, Away is negative
 *
 * MOVEMENT:
 * - "Forward" means moving in the character's facing direction (local -Z)
 * - As the character rotates, "forward" changes in world space
 * - But it's always -Z in the character's local coordinate system
 */
export function CoordinateSystemExample() {
  const [characterPosition, setCharacterPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [characterRotation, setCharacterRotation] = useState<number>(0);

  const handlePositionUpdate = (pos: [number, number, number], rot: number) => {
    setCharacterPosition(pos);
    setCharacterRotation(rot);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      {/* Info Panel */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: 'white',
          fontFamily: 'monospace',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '15px',
          borderRadius: '8px',
          zIndex: 1000,
          maxWidth: '400px'
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>
          Three.js Coordinate System
        </h3>

        <div style={{ marginBottom: '10px' }}>
          <strong>Axes:</strong>
          <div style={{ marginLeft: '10px' }}>
            <div style={{ color: '#ff0000' }}>🔴 Red (X): Right/Left</div>
            <div style={{ color: '#00ff00' }}>🟢 Green (Y): Up/Down</div>
            <div style={{ color: '#0088ff' }}>🔵 Blue (Z): Forward/Back</div>
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>Controls:</strong>
          <div style={{ marginLeft: '10px', fontSize: '12px' }}>
            <div>W/↑: Move Forward (local -Z)</div>
            <div>S/↓: Move Backward (local +Z)</div>
            <div>A/←: Rotate Left</div>
            <div>D/→: Rotate Right</div>
            <div>Q: Strafe Left (local -X)</div>
            <div>E: Strafe Right (local +X)</div>
          </div>
        </div>

        <div style={{ marginBottom: '10px', fontSize: '12px' }}>
          <strong>Character State:</strong>
          <div style={{ marginLeft: '10px' }}>
            <div>
              Position: ({characterPosition[0].toFixed(1)}, {characterPosition[1].toFixed(1)},{' '}
              {characterPosition[2].toFixed(1)})
            </div>
            <div>Rotation: {((characterRotation * 180) / Math.PI).toFixed(0)}°</div>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#aaa' }}>
          <strong>Local vs Global Space:</strong>
          <div style={{ marginLeft: '10px' }}>
            Local space rotates with the character. Global space is fixed. The colored axes on the
            character show its local coordinate system.
          </div>
        </div>
      </div>

      <Canvas camera={{ position: [15, 15, 15], fov: 60 }}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {/* Global Coordinate System - Fixed in World Space */}
        <CoordinateSystem position={[0, 0, 0]} size={10} />

        {/* World Axes Labels */}
        <Text position={[11, 0, 0]} fontSize={1} color="red">
          +X (Right)
        </Text>
        <Text position={[0, 11, 0]} fontSize={1} color="green">
          +Y (Up)
        </Text>
        <Text position={[0, 0, 11]} fontSize={1} color="blue">
          +Z (Back)
        </Text>
        <Text position={[-11, 0, 0]} fontSize={1} color="red">
          -X (Left)
        </Text>
        <Text position={[0, 0, -11]} fontSize={1} color="blue">
          -Z (Forward)
        </Text>

        {/* Ground Grid */}
        <Grid
          args={[50, 50]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6f6f6f"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#9d4b4b"
          fadeDistance={100}
          fadeStrength={1}
          followCamera={false}
          position={[0, 0, 0]}
        />

        {/* Ground plane for visual reference */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>

        {/* Oriented Character Controller with Local Axes */}
        <OrientedCharacterController
          position={[0, 0, 0]}
          rotation={0}
          enableKeyboard={true}
          speed={5}
          rotationSpeed={Math.PI}
          showLocalAxes={true}
          onPositionUpdate={handlePositionUpdate}
        />

        {/* Reference markers at specific world positions */}
        <ReferenceMarker position={[5, 0, 0]} color="red" label="+X" />
        <ReferenceMarker position={[-5, 0, 0]} color="darkred" label="-X" />
        <ReferenceMarker position={[0, 0, 5]} color="blue" label="+Z" />
        <ReferenceMarker position={[0, 0, -5]} color="darkblue" label="-Z" />

        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  );
}

/**
 * Reference marker to show positions in world space
 */
function ReferenceMarker({
  position,
  color,
  label
}: {
  position: [number, number, number];
  color: string;
  label: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <Text position={[0, 1.5, 0]} fontSize={0.5} color="white">
        {label}
      </Text>
    </group>
  );
}
