import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface FireLocation {
  position: [number, number, number];
  intensity: number;
  description?: string;
}

interface SmokeArea {
  nodes?: string[];
  level: number;
  region?: string;
  position?: [number, number, number];
}

interface FireVisualizationProps {
  fireLocations: FireLocation[];
  smokeAreas?: SmokeArea[];
}

export function FireVisualization({ fireLocations, smokeAreas = [] }: FireVisualizationProps) {
  const fireRefs = useRef<THREE.Mesh[]>([]);
  const timeRef = useRef(0);
  const { camera } = useThree();

  useFrame((state, delta) => {
    timeRef.current += delta;
    
    fireRefs.current.forEach((ref, index) => {
      if (ref && fireLocations[index]) {
        const intensity = fireLocations[index].intensity;
        const scale = 1 + Math.sin(timeRef.current * 3) * 0.3 * intensity;
        ref.scale.set(scale, scale * 1.2, scale);
      }
    });
  });

  if (!fireLocations || fireLocations.length === 0) {
    return null;
  }

  return (
    <group>
      {/* Fire effects */}
      {fireLocations.map((fire, index) => {
        // Calculate distance from camera to fire
        const firePos = new THREE.Vector3(...fire.position);
        const cameraPos = new THREE.Vector3();
        camera.getWorldPosition(cameraPos);
        const distance = cameraPos.distanceTo(firePos);

        // Check if this is smoke-only (Q1 east corridor)
        const isSmokeOnly = fire.description?.toLowerCase().includes('smoke');

        // Show smoke when viewing from outside (distance > 30 units), fire when close
        const showSmoke = distance > 30 || isSmokeOnly;
        const isFirstPerson = distance <= 30;

        return (
          <group key={`fire-${index}`} position={fire.position}>
            {showSmoke ? (
              // Smoke-only view (gray when far, orange when close for smoke-only)
              <>
                {/* Large smoke plume - reduced size */}
                <Sphere
                  ref={(el) => {
                    if (el) fireRefs.current[index] = el;
                  }}
                  args={[4 * fire.intensity, 16, 16]}
                  position={[0, 3, 0]}
                >
                  <meshStandardMaterial
                    color={isSmokeOnly && isFirstPerson ? "#ff8844" : "#555555"}
                    emissive={isSmokeOnly && isFirstPerson ? "#ff6622" : "#000000"}
                    emissiveIntensity={isSmokeOnly && isFirstPerson ? 0.8 : 0}
                    transparent
                    opacity={0.5 * fire.intensity}
                  />
                </Sphere>

                {/* Rising smoke column - reduced size */}
                <Sphere
                  args={[3.5 * fire.intensity, 12, 12]}
                  position={[0, 6, 0]}
                >
                  <meshStandardMaterial
                    color={isSmokeOnly && isFirstPerson ? "#ff9955" : "#777777"}
                    emissive={isSmokeOnly && isFirstPerson ? "#ff7733" : "#000000"}
                    emissiveIntensity={isSmokeOnly && isFirstPerson ? 0.6 : 0}
                    transparent
                    opacity={0.4 * fire.intensity}
                  />
                </Sphere>

                <Sphere
                  args={[3 * fire.intensity, 10, 10]}
                  position={[0, 9, 0]}
                >
                  <meshStandardMaterial
                    color={isSmokeOnly && isFirstPerson ? "#ffaa66" : "#999999"}
                    emissive={isSmokeOnly && isFirstPerson ? "#ff8844" : "#000000"}
                    emissiveIntensity={isSmokeOnly && isFirstPerson ? 0.4 : 0}
                    transparent
                    opacity={0.3 * fire.intensity}
                  />
                </Sphere>

                {/* Point light for orange glow in first person */}
                {isSmokeOnly && isFirstPerson && (
                  <pointLight
                    color="#ff7733"
                    intensity={fire.intensity * 5}
                    distance={20}
                    decay={2}
                  />
                )}
              </>
            ) : (
              // Full fire view (when close/inside) - only for non-smoke
              <>
                {/* Main fire glow - reduced size */}
                <Sphere
                  ref={(el) => {
                    if (el) fireRefs.current[index] = el;
                  }}
                  args={[2.5 * fire.intensity, 16, 16]}
                  position={[0, 1.5, 0]}
                >
                  <meshStandardMaterial
                    color="#ff2200"
                    emissive="#ff4400"
                    emissiveIntensity={2 * fire.intensity}
                    transparent
                    opacity={0.8}
                  />
                </Sphere>

                {/* Inner bright core - reduced size */}
                <Sphere
                  args={[1.5 * fire.intensity, 12, 12]}
                  position={[0, 2, 0]}
                >
                  <meshStandardMaterial
                    color="#ffaa00"
                    emissive="#ffcc00"
                    emissiveIntensity={3}
                    transparent
                    opacity={0.9}
                  />
                </Sphere>

                {/* Flickering particles */}
                {[...Array(8)].map((_, i) => (
                  <Sphere
                    key={`spark-${i}`}
                    args={[0.4, 6, 6]}
                    position={[
                      Math.sin(i * 0.8) * fire.intensity * 2,
                      2 + Math.cos(i * 0.5) * fire.intensity * 2,
                      Math.cos(i * 0.8) * fire.intensity * 2
                    ]}
                  >
                    <meshStandardMaterial
                      color="#ffff00"
                      emissive="#ffaa00"
                      emissiveIntensity={2}
                    />
                  </Sphere>
                ))}

                {/* Smoke rising from fire - reduced size */}
                <Sphere
                  args={[3 * fire.intensity, 12, 12]}
                  position={[0, 5, 0]}
                >
                  <meshStandardMaterial
                    color="#333333"
                    transparent
                    opacity={0.3 * fire.intensity}
                  />
                </Sphere>

                {/* Point light for illumination */}
                <pointLight
                  color="#ff4400"
                  intensity={fire.intensity * 10}
                  distance={30}
                  decay={2}
                />
              </>
            )}
          </group>
        );
      })}

      {/* Smoke areas - minimized */}
      {smokeAreas.map((smoke, index) => {
        // Calculate smoke position - use provided position or estimate from region
        const smokePos: [number, number, number] = smoke.position || [
          index * 5 - 5, // Spread out
          21, // Floor 6 height
          0
        ];

        return (
          <group key={`smoke-${index}`} position={smokePos}>
            <Sphere args={[2, 12, 12]}>
              <meshStandardMaterial
                color="#555555"
                transparent
                opacity={0.25 * smoke.level}
              />
            </Sphere>
          </group>
        );
      })}
    </group>
  );
}
