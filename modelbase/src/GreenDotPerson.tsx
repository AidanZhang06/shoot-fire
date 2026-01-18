import React from 'react';
import { Sphere, Cylinder } from '@react-three/drei';

interface GreenDotPersonProps {
  position?: [number, number, number];
}

export function GreenDotPerson({ position = [0, 0, 0] }: GreenDotPersonProps) {
  const personHeight = 1.7;
  const headRadius = 0.3;
  const bodyRadius = 0.25;
  const bodyHeight = 1.0;

  return (
    <group position={position}>
      {/* Body */}
      <Cylinder
        args={[bodyRadius, bodyRadius * 0.8, bodyHeight, 8]}
        position={[0, bodyHeight / 2 + 0.2, 0]}
      >
        <meshStandardMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={0.6}
        />
      </Cylinder>

      {/* Head */}
      <Sphere
        args={[headRadius, 16, 16]}
        position={[0, bodyHeight + headRadius + 0.3, 0]}
      >
        <meshStandardMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={0.6}
        />
      </Sphere>

      {/* Legs */}
      <Cylinder
        args={[0.12, 0.12, 0.6, 8]}
        position={[-0.15, 0.3, 0]}
      >
        <meshStandardMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={0.6}
        />
      </Cylinder>

      <Cylinder
        args={[0.12, 0.12, 0.6, 8]}
        position={[0.15, 0.3, 0]}
      >
        <meshStandardMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={0.6}
        />
      </Cylinder>

      {/* Glowing aura around character */}
      <pointLight
        color="#00ff00"
        intensity={2}
        distance={5}
        decay={2}
        position={[0, 1, 0]}
      />

      {/* Optional glow sphere for extra visibility */}
      <Sphere
        args={[bodyRadius * 1.8, 16, 16]}
        position={[0, bodyHeight / 2 + 0.2, 0]}
      >
        <meshStandardMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={0.4}
          transparent
          opacity={0.2}
        />
      </Sphere>
    </group>
  );
}
