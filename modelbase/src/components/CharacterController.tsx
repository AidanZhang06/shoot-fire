import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GreenDotPerson } from '../GreenDotPerson';
import { NavigationNode } from '../navigation/types';

interface CharacterControllerProps {
  position: [number, number, number];
  targetPosition?: [number, number, number];
  currentNode?: NavigationNode;
  onPositionUpdate?: (position: [number, number, number]) => void;
  showAxes?: boolean;
  rotation?: number; // Facing direction in radians
  speedMultiplier?: number;
}

export function CharacterController({
  position,
  targetPosition,
  currentNode,
  onPositionUpdate,
  showAxes = false,
  rotation = 0,
  speedMultiplier = 1.0
}: CharacterControllerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const currentPosRef = useRef(new THREE.Vector3(...position));
  const targetPosRef = useRef(new THREE.Vector3(...position));
  const currentRotationRef = useRef(rotation);

  // Update target when it changes
  useEffect(() => {
    if (targetPosition) {
      targetPosRef.current.set(...targetPosition);
    }
  }, [targetPosition]);

  // Smooth movement animation
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const speed = 5 * speedMultiplier * delta;
    
    // Smoothly interpolate position
    currentPosRef.current.lerp(targetPosRef.current, speed);
    groupRef.current.position.copy(currentPosRef.current);

    // Smoothly interpolate rotation
    const rotationSpeed = 5 * delta;
    currentRotationRef.current += (rotation - currentRotationRef.current) * rotationSpeed;
    groupRef.current.rotation.y = currentRotationRef.current;

    // Notify parent of position update
    if (onPositionUpdate) {
      const pos = currentPosRef.current;
      onPositionUpdate([pos.x, pos.y, pos.z]);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Character */}
      <GreenDotPerson />
      
      {/* Direction indicator arrow */}
      <mesh position={[0.8, 0.5, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.2, 0.5, 8]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Coordinate axes (optional) */}
      {showAxes && (
        <group>
          {/* X axis - Red */}
          <mesh position={[1, 0, 0]}>
            <boxGeometry args={[2, 0.05, 0.05]} />
            <meshBasicMaterial color="red" />
          </mesh>
          {/* Y axis - Green */}
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[0.05, 2, 0.05]} />
            <meshBasicMaterial color="green" />
          </mesh>
          {/* Z axis - Blue */}
          <mesh position={[0, 0, 1]}>
            <boxGeometry args={[0.05, 0.05, 2]} />
            <meshBasicMaterial color="blue" />
          </mesh>
        </group>
      )}
    </group>
  );
}
