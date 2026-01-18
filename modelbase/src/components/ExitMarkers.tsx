import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text } from '@react-three/drei';
import { fireExits } from '../navigation/FireExits';

interface ExitMarkersProps {
  availableExits: string[];
  onExitClick?: (exitId: string) => void;
}

export function ExitMarkers({ availableExits, onExitClick }: ExitMarkersProps) {
  const markerRefs = useRef<THREE.Mesh[]>([]);

  if (!availableExits || availableExits.length === 0) {
    return null;
  }

  useFrame((state) => {
    markerRefs.current.forEach((ref) => {
      if (ref) {
        // Pulsing animation for exit markers
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        ref.scale.set(scale, scale, scale);
      }
    });
  });

  return (
    <group>
      {fireExits
        .filter(exit => availableExits.includes(exit.id))
        .map((exit, index) => (
          <group key={exit.id} position={exit.position}>
            {/* Small light green platform above staircase */}
            <Box
              ref={(el) => {
                if (el) markerRefs.current[index] = el;
              }}
              args={[2, 0.2, 2]}
              position={[0, 2.5, 0]}
              onClick={() => onExitClick?.(exit.id)}
            >
              <meshStandardMaterial
                color="#90ee90"
                emissive="#90ee90"
                emissiveIntensity={0.5}
                transparent
                opacity={0.7}
              />
            </Box>

            {/* Exit label */}
            <Text
              position={[0, 3.2, 0]}
              fontSize={0.4}
              color="#00ff00"
              anchorX="center"
              anchorY="middle"
            >
              {exit.label}
            </Text>
          </group>
        ))}
    </group>
  );
}

