import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Text } from '@react-three/drei';
import * as THREE from 'three';

interface ExitPathMarkersProps {
  floor?: number;
}

export function ExitPathMarkers({ floor = 6 }: ExitPathMarkersProps) {
  const markerRefs = useRef<THREE.Mesh[]>([]);
  const floorHeight = 3.5;
  const yPos = (floor - 1) * floorHeight;

  useFrame((state) => {
    markerRefs.current.forEach((ref, index) => {
      if (ref) {
        // Animated glow effect - wave pattern
        const phase = state.clock.elapsedTime * 2 - index * 0.3;
        const pulse = 0.5 + Math.sin(phase) * 0.5;
        if (ref.material instanceof THREE.MeshStandardMaterial) {
          ref.material.emissiveIntensity = pulse;
        }
      }
    });
  });

  // Define exit path markers for floor 6
  const westExitMarkers = [
    { x: 0, z: 0 },    // Center hallway
    { x: -5, z: 0 },   // Moving west
    { x: -10, z: 0 },
    { x: -15, z: 0 },
    { x: -18, z: 0 },  // Near west stairs
  ];

  const eastExitMarkers = [
    { x: 0, z: 0 },    // Center hallway
    { x: 5, z: 0 },    // Moving east
    { x: 10, z: 0 },
    { x: 15, z: 0 },
    { x: 18, z: 0 },   // Near east stairs
  ];

  const southExitMarkers = [
    { x: -15, z: 0 },   // Side wing junction
    { x: -15, z: 5 },   // Moving south
    { x: -15, z: 10 },
    { x: -15, z: 15 },  // Near south exit
  ];

  return (
    <group>
      {/* West exit path markers */}
      {westExitMarkers.map((marker, index) => (
        <group key={`west-${index}`} position={[marker.x, yPos + 0.1, marker.z]}>
          {/* Glowing floor arrow pointing west */}
          <mesh
            ref={(el) => {
              if (el) markerRefs.current[index] = el;
            }}
            rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
          >
            <coneGeometry args={[0.4, 0.8, 3]} />
            <meshStandardMaterial
              color="#00ff00"
              emissive="#00ff00"
              emissiveIntensity={0.8}
              transparent
              opacity={0.7}
            />
          </mesh>

          {/* Floor glow circle */}
          <Cylinder
            args={[0.6, 0.6, 0.05, 16]}
            position={[0, -0.02, 0]}
          >
            <meshStandardMaterial
              color="#00ff00"
              emissive="#00ff00"
              emissiveIntensity={0.3}
              transparent
              opacity={0.3}
            />
          </Cylinder>
        </group>
      ))}

      {/* East exit path markers */}
      {eastExitMarkers.map((marker, index) => (
        <group key={`east-${index}`} position={[marker.x, yPos + 0.1, marker.z]}>
          {/* Glowing floor arrow pointing east */}
          <mesh
            ref={(el) => {
              if (el) markerRefs.current[westExitMarkers.length + index] = el;
            }}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          >
            <coneGeometry args={[0.4, 0.8, 3]} />
            <meshStandardMaterial
              color="#00ff00"
              emissive="#00ff00"
              emissiveIntensity={0.8}
              transparent
              opacity={0.7}
            />
          </mesh>

          {/* Floor glow circle */}
          <Cylinder
            args={[0.6, 0.6, 0.05, 16]}
            position={[0, -0.02, 0]}
          >
            <meshStandardMaterial
              color="#00ff00"
              emissive="#00ff00"
              emissiveIntensity={0.3}
              transparent
              opacity={0.3}
            />
          </Cylinder>
        </group>
      ))}

      {/* South exit path markers */}
      {southExitMarkers.map((marker, index) => (
        <group key={`south-${index}`} position={[marker.x, yPos + 0.1, marker.z]}>
          {/* Glowing floor arrow pointing south */}
          <mesh
            ref={(el) => {
              if (el)
                markerRefs.current[westExitMarkers.length + eastExitMarkers.length + index] = el;
            }}
            rotation={[-Math.PI / 2, 0, Math.PI]}
          >
            <coneGeometry args={[0.4, 0.8, 3]} />
            <meshStandardMaterial
              color="#00ff00"
              emissive="#00ff00"
              emissiveIntensity={0.8}
              transparent
              opacity={0.7}
            />
          </mesh>

          {/* Floor glow circle */}
          <Cylinder
            args={[0.6, 0.6, 0.05, 16]}
            position={[0, -0.02, 0]}
          >
            <meshStandardMaterial
              color="#00ff00"
              emissive="#00ff00"
              emissiveIntensity={0.3}
              transparent
              opacity={0.3}
            />
          </Cylinder>
        </group>
      ))}

      {/* Wall-mounted exit signs */}
      <group position={[-18, yPos + 2.5, 0]}>
        <Box args={[0.1, 0.5, 2]}>
          <meshStandardMaterial
            color="#00ff00"
            emissive="#00ff00"
            emissiveIntensity={1}
          />
        </Box>
        <Text
          position={[0.15, 0, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          rotation={[0, -Math.PI / 2, 0]}
        >
          ← EXIT
        </Text>
      </group>

      <group position={[18, yPos + 2.5, 0]}>
        <Box args={[0.1, 0.5, 2]}>
          <meshStandardMaterial
            color="#00ff00"
            emissive="#00ff00"
            emissiveIntensity={1}
          />
        </Box>
        <Text
          position={[-0.15, 0, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          rotation={[0, Math.PI / 2, 0]}
        >
          EXIT →
        </Text>
      </group>
    </group>
  );
}
