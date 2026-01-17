import React from 'react';
import { Box, Text } from '@react-three/drei';

interface StairsProps {
  position: [number, number, number];
  floorFrom: number;
  floorTo: number;
  direction: 'up' | 'down';
  label?: string;
  width?: number;
}

export function Stairs({ position, floorFrom, floorTo, direction, label, width = 2.5 }: StairsProps) {
  const floorHeight = 3.5;
  const stairsDepth = 4;
  const numSteps = 20;
  const stepHeight = floorHeight / numSteps;
  const stepDepth = stairsDepth / numSteps;
  const stepWidth = width;

  return (
    <group position={position}>
      {/* Removed: Staircase enclosure walls - was creating unwanted box */}

      {/* Stairwell floor base */}
      <Box
        args={[stepWidth + 0.2, 0.2, stairsDepth + 0.2]}
        position={[0, 0.1, 0]}
      >
        <meshStandardMaterial
          color="#2a2a2a"
          roughness={0.7}
          metalness={0.1}
        />
      </Box>

      {/* Individual steps - more visible */}
      {Array.from({ length: numSteps }).map((_, i) => {
        const stepY = i * stepHeight;
        const stepZ = direction === 'up' 
          ? -stairsDepth / 2 + i * stepDepth
          : stairsDepth / 2 - i * stepDepth;

        return (
          <React.Fragment key={`step-${i}`}>
            {/* Step tread - more visible */}
            <Box
              args={[stepWidth, stepHeight * 0.7, stepDepth * 1.1]}
              position={[0, stepY + stepHeight * 0.35, stepZ]}
            >
              <meshStandardMaterial
                color="#b0b0b0"
                roughness={0.4}
                metalness={0.3}
              />
            </Box>
            {/* Step riser - more prominent */}
            <Box
              args={[stepWidth, stepHeight * 0.3, 0.15]}
              position={[0, stepY + stepHeight * 0.85, stepZ + (direction === 'up' ? stepDepth / 2 : -stepDepth / 2)]}
            >
              <meshStandardMaterial
                color="#909090"
                roughness={0.5}
              />
            </Box>
          </React.Fragment>
        );
      })}

      {/* Handrails - solid walls on sides */}
      <Box
        args={[0.2, floorHeight + 0.5, stairsDepth + 0.2]}
        position={[stepWidth / 2 + 0.1, (floorHeight + 0.5) / 2, 0]}
      >
        <meshStandardMaterial
          color="#cccccc"
          metalness={0.4}
          roughness={0.3}
          opacity={0.8}
          transparent
        />
      </Box>
      <Box
        args={[0.2, floorHeight + 0.5, stairsDepth + 0.2]}
        position={[-stepWidth / 2 - 0.1, (floorHeight + 0.5) / 2, 0]}
      >
        <meshStandardMaterial
          color="#cccccc"
          metalness={0.4}
          roughness={0.3}
          opacity={0.8}
          transparent
        />
      </Box>

      {/* Removed horizontal bars - cleaner design with solid side walls */}

      {/* Floor indicator - more visible */}
      {label && (
        <Text
          position={[0, floorHeight + 1.5, 0]}
          fontSize={0.5}
          color="#00ffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {label}
        </Text>
      )}

      {/* Direction arrow - glowing */}
      <Text
        position={[0, floorHeight / 2, direction === 'up' ? stairsDepth / 2 - 0.3 : -stairsDepth / 2 + 0.3]}
        fontSize={0.6}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {direction === 'up' ? '↑' : '↓'}
      </Text>

      {/* Stairwell sign */}
      <Box
        args={[stepWidth * 0.8, 0.3, 0.1]}
        position={[0, floorHeight + 0.5, 0]}
      >
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={0.5}
        />
      </Box>
      <Text
        position={[0, floorHeight + 0.5, 0.06]}
        fontSize={0.2}
        color="#000000"
        anchorX="center"
        anchorY="middle"
      >
        STAIRS
      </Text>
    </group>
  );
}
