import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GreenDotPerson } from '../GreenDotPerson';
import { MovementAnimation } from '../animation/MovementAnimation';
import { NavigationNode } from '../navigation/types';

interface CharacterControllerProps {
  position: [number, number, number];
  targetPosition?: [number, number, number];
  currentNode?: NavigationNode;
  onPositionUpdate?: (position: [number, number, number], nodeId?: string) => void;
}

export function CharacterController({
  position: initialPosition,
  targetPosition,
  currentNode,
  onPositionUpdate
}: CharacterControllerProps) {
  const [currentPosition, setCurrentPosition] = useState<[number, number, number]>(initialPosition);
  const [animation, setAnimation] = useState<MovementAnimation | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);

  // Update position when target changes
  useEffect(() => {
    if (targetPosition) {
      try {
        const distance = Math.sqrt(
          Math.pow(targetPosition[0] - currentPosition[0], 2) +
          Math.pow(targetPosition[1] - currentPosition[1], 2) +
          Math.pow(targetPosition[2] - currentPosition[2], 2)
        );

        // Only animate if distance is significant
        if (distance > 0.1) {
          const duration = MovementAnimation.calculateDuration(currentPosition, targetPosition, 2);
          const newAnimation = new MovementAnimation(
            currentPosition,
            targetPosition,
            duration,
            () => {
              setAnimation(null);
              if (onPositionUpdate) {
                onPositionUpdate(targetPosition, currentNode?.id);
              }
            }
          );
          setAnimation(newAnimation);
        } else {
          // Already at target
          setCurrentPosition(targetPosition);
          if (onPositionUpdate) {
            onPositionUpdate(targetPosition, currentNode?.id);
          }
        }
      } catch (error) {
        console.error('Error updating character position:', error);
      }
    }
  }, [targetPosition, currentPosition, currentNode, onPositionUpdate]);

  // Update position when initial position changes (but not animating)
  useEffect(() => {
    if (!animation && !targetPosition) {
      setCurrentPosition(initialPosition);
    }
  }, [initialPosition]);

  // Animation loop
  useFrame(() => {
    if (animation) {
      const newPos = animation.getCurrentPosition();
      if (newPos) {
        setCurrentPosition(newPos);
        if (groupRef.current) {
          groupRef.current.position.set(newPos[0], newPos[1], newPos[2]);
        }
      }
    } else if (groupRef.current) {
      groupRef.current.position.set(currentPosition[0], currentPosition[1], currentPosition[2]);
    }
  });

  return (
    <group ref={groupRef}>
      <GreenDotPerson position={[0, 0, 0]} />
    </group>
  );
}

