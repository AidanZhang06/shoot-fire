import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

interface ExitDoorProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  label?: string;
  width?: number;
  height?: number;
}

export function ExitDoor({
  position,
  rotation = [0, 0, 0],
  label = "EXIT",
  width = 3,
  height = 3.5
}: ExitDoorProps) {
  const doorRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta;

    // Pulsing glow animation
    if (glowRef.current) {
      const pulse = 0.8 + Math.sin(timeRef.current * 2) * 0.2;
      glowRef.current.material.emissiveIntensity = pulse;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Door frame */}
      <group>
        {/* Left frame */}
        <Box
          args={[0.2, height, 0.3]}
          position={[-width / 2 - 0.1, height / 2, 0]}
        >
          <meshStandardMaterial color="#333333" />
        </Box>

        {/* Right frame */}
        <Box
          args={[0.2, height, 0.3]}
          position={[width / 2 + 0.1, height / 2, 0]}
        >
          <meshStandardMaterial color="#333333" />
        </Box>

        {/* Top frame */}
        <Box
          args={[width + 0.4, 0.3, 0.3]}
          position={[0, height, 0]}
        >
          <meshStandardMaterial color="#333333" />
        </Box>
      </group>

      {/* Exit door - glowing green */}
      <Box
        ref={doorRef}
        args={[width, height, 0.2]}
        position={[0, height / 2, 0]}
      >
        <meshStandardMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={0.5}
          metalness={0.3}
          roughness={0.4}
        />
      </Box>

      {/* EXIT sign above door */}
      <Box
        args={[width * 0.8, 0.4, 0.1]}
        position={[0, height + 0.5, 0.2]}
      >
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={1.5}
        />
      </Box>

      <Text
        position={[0, height + 0.5, 0.26]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {label}
      </Text>

      {/* Glowing portal effect inside door */}
      <Box
        ref={glowRef}
        args={[width * 0.9, height * 0.9, 0.1]}
        position={[0, height / 2, 0]}
      >
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={0.8}
          transparent
          opacity={0.6}
        />
      </Box>

      {/* Floor marking - green path leading to exit */}
      <Box
        args={[width * 1.5, 0.05, 4]}
        position={[0, 0.03, -2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
        />
      </Box>

      {/* Directional arrows on floor */}
      {[0, -1, -2, -3].map((offset, i) => (
        <group key={`arrow-${i}`} position={[0, 0.04, offset]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.3, 0.6, 3]} />
            <meshStandardMaterial
              color="#00ff00"
              emissive="#00ff00"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      ))}

      {/* Point lights for illumination */}
      <pointLight
        position={[0, height / 2, 1]}
        color="#00ff00"
        intensity={3}
        distance={15}
        decay={2}
      />

      {/* Safety light beacon on top */}
      <Cylinder
        args={[0.3, 0.3, 0.3, 16]}
        position={[0, height + 0.8, 0]}
      >
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={1.2}
        />
      </Cylinder>
    </group>
  );
}
