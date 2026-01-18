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
        
        // Show smoke when viewing from outside (distance > 30 units), fire when close
        const showSmoke = distance > 30;
        
        return (
          <group key={`fire-${index}`} position={fire.position}>
            {showSmoke ? (
              // Smoke-only view (when outside/far away)
              <>
                {/* Large smoke plume */}
                <Sphere
                  ref={(el) => {
                    if (el) fireRefs.current[index] = el;
                  }}
                  args={[5 * fire.intensity, 16, 16]}
                  position={[0, 3, 0]}
                >
                  <meshStandardMaterial
                    color="#555555"
                    transparent
                    opacity={0.5 * fire.intensity}
                  />
                </Sphere>
                
                {/* Rising smoke column */}
                <Sphere
                  args={[4 * fire.intensity, 12, 12]}
                  position={[0, 6, 0]}
                >
                  <meshStandardMaterial
                    color="#777777"
                    transparent
                    opacity={0.4 * fire.intensity}
                  />
                </Sphere>
                
                <Sphere
                  args={[3 * fire.intensity, 10, 10]}
                  position={[0, 9, 0]}
                >
                  <meshStandardMaterial
                    color="#999999"
                    transparent
                    opacity={0.3 * fire.intensity}
                  />
                </Sphere>
              </>
            ) : (
              // Full fire view (when close/inside)
              <>
                {/* Main fire glow */}
                <Sphere
                  ref={(el) => {
                    if (el) fireRefs.current[index] = el;
                  }}
                  args={[2 * fire.intensity, 16, 16]}
                  position={[0, 1, 0]}
                >
                  <meshStandardMaterial
                    color="#ff2200"
                    emissive="#ff4400"
                    emissiveIntensity={2 * fire.intensity}
                    transparent
                    opacity={0.8}
                  />
                </Sphere>

                {/* Inner bright core */}
                <Sphere
                  args={[1 * fire.intensity, 12, 12]}
                  position={[0, 1.5, 0]}
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
                    args={[0.15, 6, 6]}
                    position={[
                      Math.sin(i * 0.8) * fire.intensity,
                      1 + Math.cos(i * 0.5) * fire.intensity,
                      Math.cos(i * 0.8) * fire.intensity
                    ]}
                  >
                    <meshStandardMaterial
                      color="#ffff00"
                      emissive="#ffaa00"
                      emissiveIntensity={2}
                    />
                  </Sphere>
                ))}

                {/* Smoke rising from fire */}
                <Sphere
                  args={[3 * fire.intensity, 12, 12]}
                  position={[0, 4, 0]}
                >
                  <meshStandardMaterial
                    color="#333333"
                    transparent
                    opacity={0.4 * fire.intensity}
                  />
                </Sphere>

                {/* Point light for illumination */}
                <pointLight
                  color="#ff4400"
                  intensity={fire.intensity * 5}
                  distance={15}
                  decay={2}
                />
              </>
            )}
          </group>
        );
      })}

      {/* Smoke areas */}
      {smokeAreas.map((smoke, index) => {
        // Calculate smoke position - use provided position or estimate from region
        const smokePos: [number, number, number] = smoke.position || [
          index * 5 - 5, // Spread out
          21, // Floor 6 height
          0
        ];
        
        return (
          <group key={`smoke-${index}`} position={smokePos}>
            <Sphere args={[4, 12, 12]}>
              <meshStandardMaterial
                color="#555555"
                transparent
                opacity={0.3 * smoke.level}
              />
            </Sphere>
          </group>
        );
      })}
    </group>
  );
}
