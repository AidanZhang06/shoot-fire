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
            {/* Exit marker - green glowing box */}
            <Box
              ref={(el) => {
                if (el) markerRefs.current[index] = el;
              }}
              args={[1, 3, 1]}
              position={[0, 1.5, 0]}
              onClick={() => onExitClick?.(exit.id)}
            >
              <meshStandardMaterial
                color="#00ff00"
                emissive="#00ff00"
                emissiveIntensity={0.8}
                transparent
                opacity={0.6}
              />
            </Box>

            {/* Exit label */}
            <Text
              position={[0, 3, 0]}
              fontSize={0.5}
              color="#00ff00"
              anchorX="center"
              anchorY="middle"
            >
              {exit.label}
            </Text>

            {/* Exit description */}
            <Text
              position={[0, 2.5, 0]}
              fontSize={0.3}
              color="#88ff88"
              anchorX="center"
              anchorY="middle"
            >
              EXIT
            </Text>
          </group>
        ))}
    </group>
  );
}

