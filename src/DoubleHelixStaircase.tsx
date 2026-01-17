import React from 'react';
import { Box, Cylinder, Torus } from '@react-three/drei';

export function DoubleHelixStaircase() {
  const totalHeight = 24; // Covers about 7 floors
  const stepsPerHelix = 80;
  const radius = 3;
  const centralPoleRadius = 0.5;

  // Create two intertwined helixes
  const helix1Steps = [];
  const helix2Steps = [];

  for (let i = 0; i < stepsPerHelix; i++) {
    const angle = (i / stepsPerHelix) * Math.PI * 6; // 3 full rotations
    const y = (i / stepsPerHelix) * totalHeight;

    // First helix
    const x1 = Math.cos(angle) * radius;
    const z1 = Math.sin(angle) * radius;
    helix1Steps.push({ x: x1, y: y, z: z1, angle });

    // Second helix (offset by 180 degrees)
    const x2 = Math.cos(angle + Math.PI) * radius;
    const z2 = Math.sin(angle + Math.PI) * radius;
    helix2Steps.push({ x: x2, y: y, z: z2, angle: angle + Math.PI });
  }

  return (
    <group position={[-30, 0, 0]}> {/* Position in the center atrium between buildings */}
      {/* Central support pole */}
      <Cylinder
        args={[centralPoleRadius, centralPoleRadius, totalHeight, 16]}
        position={[0, totalHeight / 2, 0]}
      >
        <meshStandardMaterial
          color="#cccccc"
          metalness={0.8}
          roughness={0.2}
        />
      </Cylinder>

      {/* First helix (red/orange stairs) */}
      {helix1Steps.map((step, index) => (
        <group key={`helix1-${index}`} position={[step.x, step.y, step.z]}>
          {/* Step tread */}
          <Box
            args={[1.8, 0.15, 0.8]}
            rotation={[0, step.angle, 0]}
          >
            <meshStandardMaterial
              color="#cc6633"
              metalness={0.3}
              roughness={0.7}
            />
          </Box>

          {/* Step riser */}
          <Box
            args={[1.8, 0.3, 0.1]}
            position={[0, -0.15, -0.35]}
            rotation={[0, step.angle, 0]}
          >
            <meshStandardMaterial
              color="#aa5522"
              metalness={0.3}
              roughness={0.7}
            />
          </Box>

          {/* Support beam from center pole */}
          <Box
            args={[radius - 0.5, 0.1, 0.2]}
            position={[-step.x / 2, -0.1, -step.z / 2]}
            rotation={[0, step.angle, 0]}
          >
            <meshStandardMaterial
              color="#888888"
              metalness={0.7}
              roughness={0.3}
            />
          </Box>

          {/* Handrail post */}
          <Cylinder
            args={[0.05, 0.05, 1.2, 8]}
            position={[Math.cos(step.angle) * 0.7, 0.6, Math.sin(step.angle) * 0.7]}
          >
            <meshStandardMaterial
              color="#555555"
              metalness={0.8}
              roughness={0.2}
            />
          </Cylinder>
        </group>
      ))}

      {/* Second helix (blue stairs) */}
      {helix2Steps.map((step, index) => (
        <group key={`helix2-${index}`} position={[step.x, step.y, step.z]}>
          {/* Step tread */}
          <Box
            args={[1.8, 0.15, 0.8]}
            rotation={[0, step.angle, 0]}
          >
            <meshStandardMaterial
              color="#4466cc"
              metalness={0.3}
              roughness={0.7}
            />
          </Box>

          {/* Step riser */}
          <Box
            args={[1.8, 0.3, 0.1]}
            position={[0, -0.15, -0.35]}
            rotation={[0, step.angle, 0]}
          >
            <meshStandardMaterial
              color="#334499"
              metalness={0.3}
              roughness={0.7}
            />
          </Box>

          {/* Support beam from center pole */}
          <Box
            args={[radius - 0.5, 0.1, 0.2]}
            position={[-step.x / 2, -0.1, -step.z / 2]}
            rotation={[0, step.angle, 0]}
          >
            <meshStandardMaterial
              color="#888888"
              metalness={0.7}
              roughness={0.3}
            />
          </Box>

          {/* Handrail post */}
          <Cylinder
            args={[0.05, 0.05, 1.2, 8]}
            position={[Math.cos(step.angle) * 0.7, 0.6, Math.sin(step.angle) * 0.7]}
          >
            <meshStandardMaterial
              color="#555555"
              metalness={0.8}
              roughness={0.2}
            />
          </Cylinder>
        </group>
      ))}

      {/* Glass cylinder enclosure around the staircase */}
      <Cylinder
        args={[radius + 1.5, radius + 1.5, totalHeight, 32, 1, true]}
        position={[0, totalHeight / 2, 0]}
      >
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          side={2}
        />
      </Cylinder>

      {/* Base platform */}
      <Cylinder
        args={[radius + 2, radius + 2, 0.5, 32]}
        position={[0, -0.25, 0]}
      >
        <meshStandardMaterial color="#777777" />
      </Cylinder>
    </group>
  );
}
