import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere } from '@react-three/drei';
import { FireLocation } from '../ai/types';

interface FireVisualizationProps {
  fireLocations: FireLocation[];
}

export function FireVisualization({ fireLocations }: FireVisualizationProps) {
  const fireRefs = useRef<THREE.Mesh[]>([]);

  if (!fireLocations || fireLocations.length === 0) {
    return null;
  }

  useFrame((state) => {
    fireRefs.current.forEach((ref, index) => {
      if (ref && fireLocations[index]) {
        // Animate fire with pulsing effect
        const fire = fireLocations[index];
        const intensity = fire.intensity;
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2 * intensity;
        ref.scale.set(scale, scale, scale);
      }
    });
  });

  return (
    <group>
      {fireLocations.map((fire, index) => (
        <group key={`fire-${index}`} position={fire.position}>
          {/* Fire base - orange/red glow */}
          <Sphere
            ref={(el) => {
              if (el) fireRefs.current[index] = el;
            }}
            args={[1.5 * fire.intensity, 16, 16]}
            position={[0, 0.5, 0]}
          >
            <meshStandardMaterial
              color="#ff4400"
              emissive="#ff6600"
              emissiveIntensity={fire.intensity}
              transparent
              opacity={0.7 * fire.intensity}
            />
          </Sphere>

          {/* Fire particles - smaller spheres */}
          {Array.from({ length: Math.floor(fire.intensity * 5) }).map((_, i) => (
            <Sphere
              key={`particle-${i}`}
              args={[0.2, 8, 8]}
              position={[
                (Math.random() - 0.5) * 2 * fire.intensity,
                Math.random() * 2 * fire.intensity + 0.5,
                (Math.random() - 0.5) * 2 * fire.intensity
              ]}
            >
              <meshStandardMaterial
                color="#ffaa00"
                emissive="#ff8800"
                emissiveIntensity={1}
                transparent
                opacity={0.8}
              />
            </Sphere>
          ))}

          {/* Smoke effect - dark cloud above fire */}
          <Sphere
            args={[2 * fire.intensity, 16, 16]}
            position={[0, 2 * fire.intensity + 1, 0]}
          >
            <meshStandardMaterial
              color="#222222"
              transparent
              opacity={0.4 * fire.intensity}
            />
          </Sphere>
        </group>
      ))}
    </group>
  );
}

