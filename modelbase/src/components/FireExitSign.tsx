import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text } from '@react-three/drei';
import * as THREE from 'three';

interface FireExitSignProps {
  position: [number, number, number];
  direction?: 'left' | 'right' | 'up' | 'down' | 'straight';
  label?: string;
}

export function FireExitSign({
  position,
  direction = 'straight',
  label = 'EXIT'
}: FireExitSignProps) {
  const signRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (signRef.current) {
      // Pulsing glow effect
      const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      if (signRef.current.material instanceof THREE.MeshStandardMaterial) {
        signRef.current.material.emissiveIntensity = pulse;
      }
    }
  });

  // Determine arrow based on direction
  const getArrow = () => {
    switch (direction) {
      case 'left': return '←';
      case 'right': return '→';
      case 'up': return '↑';
      case 'down': return '↓';
      case 'straight': return '';
      default: return '';
    }
  };

  return (
    <group position={position}>
      {/* Sign background - glowing red */}
      <Box
        ref={signRef}
        args={[1.2, 0.4, 0.1]}
      >
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={0.8}
        />
      </Box>

      {/* EXIT text */}
      <Text
        position={[0, 0, 0.06]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {label}
      </Text>

      {/* Directional arrow if applicable */}
      {direction !== 'straight' && (
        <Text
          position={[0, -0.15, 0.06]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {getArrow()}
        </Text>
      )}

      {/* Point light for illumination */}
      <pointLight
        position={[0, 0, 0.5]}
        color="#ff0000"
        intensity={1.5}
        distance={8}
        decay={2}
      />

      {/* Glowing aura behind sign */}
      <Box
        args={[1.4, 0.6, 0.05]}
        position={[0, 0, -0.05]}
      >
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
        />
      </Box>
    </group>
  );
}
