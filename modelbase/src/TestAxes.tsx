import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CoordinateSystem } from './components/CoordinateSystem';

/**
 * Simple test scene to verify the coordinate system is working
 *
 * You should see:
 * 1. A red line pointing RIGHT (+X axis)
 * 2. A green line pointing UP (+Y axis)
 * 3. A blue line pointing toward you (+Z axis)
 *
 * If you see these colored lines, the coordinate system is working!
 */
export function TestAxes() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      {/* Instructions overlay */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: 'white',
          fontFamily: 'monospace',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '20px',
          borderRadius: '8px',
          zIndex: 1000,
          maxWidth: '400px',
          border: '2px solid #4CAF50'
        }}
      >
        <h2 style={{ margin: '0 0 15px 0', color: '#4CAF50' }}>
          ✓ Coordinate System Test
        </h2>

        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#FFD700' }}>What you should see:</strong>
          <div style={{ marginLeft: '10px', marginTop: '5px' }}>
            <div style={{ color: '#ff0000', marginBottom: '3px' }}>
              🔴 Red line = +X axis (pointing RIGHT)
            </div>
            <div style={{ color: '#00ff00', marginBottom: '3px' }}>
              🟢 Green line = +Y axis (pointing UP)
            </div>
            <div style={{ color: '#00aaff', marginBottom: '3px' }}>
              🔵 Blue line = +Z axis (pointing TOWARD you)
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#FFD700' }}>Controls:</strong>
          <div style={{ marginLeft: '10px', fontSize: '12px', marginTop: '5px' }}>
            <div>• Left Click + Drag: Rotate camera</div>
            <div>• Right Click + Drag: Pan camera</div>
            <div>• Scroll: Zoom in/out</div>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#aaa', borderTop: '1px solid #444', paddingTop: '10px' }}>
          <strong>Note:</strong> The three colored lines originate from the center [0,0,0].
          If you see them, the coordinate system is working correctly!
        </div>
      </div>

      <Canvas
        camera={{ position: [10, 10, 10], fov: 60 }}
        style={{ background: '#1a1a1a' }}
      >
        {/* Basic lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {/* THE COORDINATE SYSTEM - This is what you're testing! */}
        <CoordinateSystem position={[0, 0, 0]} size={5} visible={true} />

        {/* Additional coordinate systems at different positions for reference */}
        <CoordinateSystem position={[5, 0, 0]} size={2} visible={true} />
        <CoordinateSystem position={[0, 5, 0]} size={2} visible={true} />
        <CoordinateSystem position={[0, 0, 5]} size={2} visible={true} />

        {/* Reference spheres at axis endpoints to make it clearer */}
        {/* +X axis (right) */}
        <mesh position={[5, 0, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
        </mesh>

        {/* +Y axis (up) */}
        <mesh position={[0, 5, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="green" emissive="green" emissiveIntensity={0.5} />
        </mesh>

        {/* +Z axis (toward camera/backward) */}
        <mesh position={[0, 0, 5]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="blue" emissive="blue" emissiveIntensity={0.5} />
        </mesh>

        {/* Center reference sphere */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={0.8} />
        </mesh>

        {/* Ground grid for spatial reference */}
        <gridHelper args={[20, 20, '#444', '#222']} position={[0, 0, 0]} />

        {/* Camera controls */}
        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  );
}

export default TestAxes;
