import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { GatesBuilding } from './GatesBuilding';
import { HillmanBuilding } from './HillmanBuilding';
import { ConnectingBridges } from './ConnectingBridges';
import { DoubleHelixStaircase } from './DoubleHelixStaircase';
import { CampusEnvironment } from './CampusEnvironment';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [80, 60, 80], fov: 75 }}
        style={{ background: '#1a1a2e' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} color="#6666ff" />
        <directionalLight position={[50, 50, 30]} intensity={1.2} castShadow />
        <directionalLight position={[-50, 40, -30]} intensity={0.6} />
        <spotLight position={[0, 50, 0]} angle={Math.PI / 3} penumbra={0.5} intensity={1.5} />
        <spotLight position={[-30, 40, 0]} angle={Math.PI / 4} penumbra={0.3} intensity={1.0} color="#88ccff" />

        {/* Background stars for atmosphere */}
        <Stars radius={150} depth={80} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* Campus Environment - roads, sidewalks, parking, trees */}
        <CampusEnvironment />

        {/* Gates Building - Carnegie Mellon */}
        <GatesBuilding />

        {/* Hillman Building */}
        <HillmanBuilding />

        {/* Connecting Bridges between buildings */}
        <ConnectingBridges />

        {/* Double Helix Staircase in the center atrium */}
        <DoubleHelixStaircase />

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
