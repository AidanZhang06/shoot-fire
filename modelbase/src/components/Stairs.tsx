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
      {/* Staircase enclosure walls */}
      <Box
        args={[stepWidth + 0.4, floorHeight + 0.2, stairsDepth + 0.4]}
        position={[0, floorHeight / 2, 0]}
      >
        <meshStandardMaterial
          color="#444444"
          roughness={0.8}
          opacity={0.3}
          transparent
        />
      </Box>

      {/* Stairwell floor base */}
      <Box
        args={[stepWidth + 0.2, 0.1, stairsDepth + 0.2]}
        position={[0, 0.05, 0]}
      >
        <meshStandardMaterial
          color="#333333"
          roughness={0.7}
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
            {/* Step tread */}
            <Box
              args={[stepWidth, stepHeight * 0.8, stepDepth]}
              position={[0, stepY + stepHeight * 0.4, stepZ]}
            >
              <meshStandardMaterial
                color="#aaaaaa"
                roughness={0.3}
                metalness={0.2}
                emissive="#666666"
                emissiveIntensity={0.1}
              />
            </Box>
            {/* Step riser */}
            <Box
              args={[stepWidth, stepHeight * 0.2, 0.1]}
              position={[0, stepY + stepHeight * 0.9, stepZ + (direction === 'up' ? stepDepth / 2 : -stepDepth / 2)]}
            >
              <meshStandardMaterial
                color="#888888"
                roughness={0.5}
              />
            </Box>
          </React.Fragment>
        );
      })}

      {/* Handrails - more prominent */}
      <Box
        args={[0.15, floorHeight + 1, 0.15]}
        position={[stepWidth / 2, (floorHeight + 1) / 2, 0]}
      >
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.8}
          roughness={0.2}
          emissive="#ffffff"
          emissiveIntensity={0.2}
        />
      </Box>
      <Box
        args={[0.15, floorHeight + 1, 0.15]}
        position={[-stepWidth / 2, (floorHeight + 1) / 2, 0]}
      >
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.8}
          roughness={0.2}
          emissive="#ffffff"
          emissiveIntensity={0.2}
        />
      </Box>

      {/* Handrail horizontal bars */}
      {Array.from({ length: 3 }).map((_, i) => {
        const barY = (i + 1) * (floorHeight / 4);
        return (
          <React.Fragment key={`bar-${i}`}>
            <Box
              args={[stepWidth, 0.1, 0.15]}
              position={[0, barY, stepWidth / 2 + 0.075]}
            >
              <meshStandardMaterial
                color="#ffffff"
                metalness={0.8}
                roughness={0.2}
              />
            </Box>
            <Box
              args={[stepWidth, 0.1, 0.15]}
              position={[0, barY, -stepWidth / 2 - 0.075]}
            >
              <meshStandardMaterial
                color="#ffffff"
                metalness={0.8}
                roughness={0.2}
              />
            </Box>
          </React.Fragment>
        );
      })}

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
