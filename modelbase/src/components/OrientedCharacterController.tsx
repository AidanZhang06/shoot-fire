import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GreenDotPerson } from '../GreenDotPerson';

interface OrientedCharacterControllerProps {
  /** Initial position in world space */
  position: [number, number, number];

  /** Optional rotation in radians (Y-axis rotation) */
  rotation?: number;

  /** Enable keyboard controls for movement */
  enableKeyboard?: boolean;

  /** Movement speed in units per second */
  speed?: number;

  /** Rotation speed in radians per second */
  rotationSpeed?: number;

  /** Callback when position updates */
  onPositionUpdate?: (position: [number, number, number], rotation: number) => void;

  /** Show local axes helper on character */
  showLocalAxes?: boolean;
}

/**
 * Oriented Character Controller
 *
 * This controller implements LOCAL SPACE movement where:
 * - Forward movement is along the character's local -Z axis (the direction they're facing)
 * - The character can rotate to change their orientation
 * - Movement is always relative to the character's current facing direction
 *
 * Coordinate System (Three.js Standard):
 * - +X = Right (Red axis)
 * - +Y = Up (Green axis)
 * - +Z = Backward towards camera (Blue axis)
 * - -Z = Forward away from camera
 *
 * Controls:
 * - W/Up Arrow: Move forward (local -Z direction)
 * - S/Down Arrow: Move backward (local +Z direction)
 * - A/Left Arrow: Rotate left (CCW around Y-axis)
 * - D/Right Arrow: Rotate right (CW around Y-axis)
 * - Q: Strafe left (local -X direction)
 * - E: Strafe right (local +X direction)
 */
export function OrientedCharacterController({
  position: initialPosition,
  rotation: initialRotation = 0,
  enableKeyboard = true,
  speed = 5,
  rotationSpeed = Math.PI, // 180 degrees per second
  onPositionUpdate,
  showLocalAxes = true
}: OrientedCharacterControllerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [currentPosition, setCurrentPosition] = useState<THREE.Vector3>(
    new THREE.Vector3(...initialPosition)
  );
  const [currentRotation, setCurrentRotation] = useState<number>(initialRotation);

  // Track pressed keys
  const keysPressed = useRef<Set<string>>(new Set());

  // Keyboard event handlers
  useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enableKeyboard]);

  // Animation loop - processes input and updates position/rotation
  useFrame((state, delta) => {
    if (!groupRef.current || !enableKeyboard) return;

    let moved = false;
    let rotated = false;

    // Process rotation
    if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) {
      // Rotate left (counter-clockwise around Y-axis)
      setCurrentRotation(prev => {
        const newRotation = prev + rotationSpeed * delta;
        rotated = true;
        return newRotation;
      });
    }
    if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) {
      // Rotate right (clockwise around Y-axis)
      setCurrentRotation(prev => {
        const newRotation = prev - rotationSpeed * delta;
        rotated = true;
        return newRotation;
      });
    }

    // Get current forward direction (LOCAL -Z in world space)
    const forwardDirection = getWorldDirection(currentRotation);

    // Get right direction (LOCAL +X in world space)
    const rightDirection = new THREE.Vector3()
      .copy(forwardDirection)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);

    // Process movement in local space
    const movementDelta = new THREE.Vector3();

    if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) {
      // Move forward (local -Z direction)
      movementDelta.add(forwardDirection.clone().multiplyScalar(speed * delta));
      moved = true;
    }
    if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) {
      // Move backward (local +Z direction)
      movementDelta.add(forwardDirection.clone().multiplyScalar(-speed * delta));
      moved = true;
    }
    if (keysPressed.current.has('q')) {
      // Strafe left (local -X direction)
      movementDelta.add(rightDirection.clone().multiplyScalar(-speed * delta));
      moved = true;
    }
    if (keysPressed.current.has('e')) {
      // Strafe right (local +X direction)
      movementDelta.add(rightDirection.clone().multiplyScalar(speed * delta));
      moved = true;
    }

    // Apply movement
    if (moved || rotated) {
      setCurrentPosition(prev => {
        const newPos = prev.clone().add(movementDelta);

        // Update group transform
        groupRef.current!.position.copy(newPos);
        groupRef.current!.rotation.y = currentRotation;

        // Notify parent component
        if (onPositionUpdate) {
          onPositionUpdate([newPos.x, newPos.y, newPos.z], currentRotation);
        }

        return newPos;
      });
    } else {
      // Even if not moving, ensure group transform is synced
      groupRef.current.position.copy(currentPosition);
      groupRef.current.rotation.y = currentRotation;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Character model */}
      <GreenDotPerson position={[0, 0, 0]} />

      {/* Local axes helper - shows character's local coordinate system */}
      {showLocalAxes && (
        <axesHelper args={[2]} />
      )}
    </group>
  );
}

/**
 * Get the world-space forward direction based on character's Y-axis rotation
 * In Three.js: forward is -Z, so we rotate the -Z vector by the rotation angle
 *
 * @param rotationY - Rotation around Y-axis in radians
 * @returns Vector3 pointing in the character's forward direction
 */
export function getWorldDirection(rotationY: number): THREE.Vector3 {
  // Start with -Z (forward direction in Three.js)
  const forward = new THREE.Vector3(0, 0, -1);

  // Rotate around Y-axis by the character's rotation
  forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);

  return forward;
}

/**
 * Move character in a direction relative to their current orientation
 * This is the core of LOCAL SPACE movement
 *
 * @param currentPosition - Character's current world position
 * @param currentRotation - Character's current Y-axis rotation
 * @param localDirection - Direction in LOCAL space (e.g., [0, 0, -1] for forward)
 * @param distance - Distance to move
 * @returns New world position
 */
export function moveInLocalSpace(
  currentPosition: THREE.Vector3,
  currentRotation: number,
  localDirection: THREE.Vector3,
  distance: number
): THREE.Vector3 {
  // Convert local direction to world space
  const worldDirection = localDirection
    .clone()
    .normalize()
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), currentRotation);

  // Calculate movement delta
  const movementDelta = worldDirection.multiplyScalar(distance);

  // Return new position
  return currentPosition.clone().add(movementDelta);
}

/**
 * Calculate the rotation needed to face a target position
 *
 * @param currentPosition - Character's current position
 * @param targetPosition - Position to face towards
 * @returns Y-axis rotation in radians
 */
export function calculateRotationToFaceTarget(
  currentPosition: THREE.Vector3,
  targetPosition: THREE.Vector3
): number {
  const direction = new THREE.Vector3()
    .subVectors(targetPosition, currentPosition)
    .normalize();

  // Calculate angle from -Z axis (forward direction)
  // atan2(x, -z) gives us the Y rotation needed
  return Math.atan2(direction.x, -direction.z);
}
