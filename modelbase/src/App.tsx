import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GatesBuilding } from './GatesBuilding';
import { HillmanBuilding } from './HillmanBuilding';
import { ConnectingBridges } from './ConnectingBridges';
import { GreenDotPerson } from './GreenDotPerson';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [80, 60, 80], fov: 75 }}
        style={{ background: '#a0a0a0' }}
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

        {/* Green Dot Person */}
        <GreenDotPerson position={[10, 0, 15]} />

        {/* Camera controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={15}
          maxDistance={300}
          target={[-15, 15, 0]}
        />
      </Canvas>
    </div>
  );
}

export default App;
