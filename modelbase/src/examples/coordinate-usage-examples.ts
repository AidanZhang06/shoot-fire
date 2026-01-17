/**
 * Coordinate System Usage Examples
 *
 * This file contains practical examples demonstrating how to use
 * the coordinate system utilities for common Three.js tasks.
 */

import * as THREE from 'three';
import {
  getForwardDirection,
  getRightDirection,
  moveInDirection,
  LocalDirections,
  calculateLookAtRotation,
  rotateTowards,
  localToWorldDirection,
  worldToLocalDirection,
  getObjectWorldDirection,
  clampMagnitude,
  logCoordinates
} from '../utils/coordinateTransforms';

// ============================================================================
// Example 1: Basic Forward Movement
// ============================================================================

/**
 * Move a character forward based on their current rotation
 */
export function example1_basicForwardMovement(
  position: THREE.Vector3,
  rotation: number,
  speed: number,
  deltaTime: number
): THREE.Vector3 {
  // Get the forward direction based on current rotation
  const forward = getForwardDirection(rotation);

  // Calculate movement delta
  const movementDelta = forward.multiplyScalar(speed * deltaTime);

  // Apply to position
  return position.clone().add(movementDelta);
}

// ============================================================================
// Example 2: WASD Movement with Rotation
// ============================================================================

/**
 * Implement WASD keyboard controls with A/D rotation
 */
export function example2_WASDMovement(
  position: THREE.Vector3,
  rotation: number,
  keysPressed: Set<string>,
  speed: number,
  rotationSpeed: number,
  deltaTime: number
): { position: THREE.Vector3; rotation: number } {
  let newPosition = position.clone();
  let newRotation = rotation;

  // Handle rotation (A/D keys)
  if (keysPressed.has('a')) {
    newRotation += rotationSpeed * deltaTime; // Rotate left (CCW)
  }
  if (keysPressed.has('d')) {
    newRotation -= rotationSpeed * deltaTime; // Rotate right (CW)
  }

  // Handle movement (W/S keys)
  if (keysPressed.has('w')) {
    // Move forward
    newPosition = moveInDirection(newPosition, LocalDirections.FORWARD, speed * deltaTime, newRotation);
  }
  if (keysPressed.has('s')) {
    // Move backward
    newPosition = moveInDirection(newPosition, LocalDirections.BACKWARD, speed * deltaTime, newRotation);
  }

  return { position: newPosition, rotation: newRotation };
}

// ============================================================================
// Example 3: Strafing (Q/E for Left/Right)
// ============================================================================

/**
 * Add strafing movement (sideways movement without rotation)
 */
export function example3_strafingMovement(
  position: THREE.Vector3,
  rotation: number,
  keysPressed: Set<string>,
  speed: number,
  deltaTime: number
): THREE.Vector3 {
  let newPosition = position.clone();

  // Strafe left (Q key)
  if (keysPressed.has('q')) {
    newPosition = moveInDirection(newPosition, LocalDirections.LEFT, speed * deltaTime, rotation);
  }

  // Strafe right (E key)
  if (keysPressed.has('e')) {
    newPosition = moveInDirection(newPosition, LocalDirections.RIGHT, speed * deltaTime, rotation);
  }

  return newPosition;
}

// ============================================================================
// Example 4: Look At Target
// ============================================================================

/**
 * Make a character face towards a target position
 */
export function example4_lookAtTarget(
  characterPosition: THREE.Vector3,
  targetPosition: THREE.Vector3,
  currentRotation: number,
  smoothing: number = 0.1
): number {
  // Calculate the rotation needed to face the target
  const targetRotation = calculateLookAtRotation(characterPosition, targetPosition);

  // Smoothly rotate towards target
  return rotateTowards(currentRotation, targetRotation, smoothing);
}

// ============================================================================
// Example 5: Follow Path with Smooth Rotation
// ============================================================================

/**
 * Follow a path of waypoints with smooth rotation
 */
export function example5_followPath(
  position: THREE.Vector3,
  rotation: number,
  waypoints: THREE.Vector3[],
  currentWaypointIndex: number,
  speed: number,
  rotationSpeed: number,
  deltaTime: number
): {
  position: THREE.Vector3;
  rotation: number;
  reachedWaypoint: boolean;
  nextWaypointIndex: number;
} {
  if (currentWaypointIndex >= waypoints.length) {
    return {
      position,
      rotation,
      reachedWaypoint: false,
      nextWaypointIndex: currentWaypointIndex
    };
  }

  const targetWaypoint = waypoints[currentWaypointIndex];

  // Calculate target rotation to face waypoint
  const targetRotation = calculateLookAtRotation(position, targetWaypoint);

  // Rotate towards waypoint
  const newRotation = rotateTowards(rotation, targetRotation, rotationSpeed * deltaTime);

  // Move forward
  const forward = getForwardDirection(newRotation);
  const newPosition = position.clone().add(forward.multiplyScalar(speed * deltaTime));

  // Check if reached waypoint
  const distanceToWaypoint = position.distanceTo(targetWaypoint);
  const reachedWaypoint = distanceToWaypoint < 0.5; // Within 0.5 units
  const nextWaypointIndex = reachedWaypoint ? currentWaypointIndex + 1 : currentWaypointIndex;

  return {
    position: newPosition,
    rotation: newRotation,
    reachedWaypoint,
    nextWaypointIndex
  };
}

// ============================================================================
// Example 6: Convert Mouse Input to World Direction
// ============================================================================

/**
 * Convert 2D mouse input to movement in world space relative to camera
 */
export function example6_mouseToWorldMovement(
  position: THREE.Vector3,
  mouseX: number, // -1 to 1
  mouseY: number, // -1 to 1
  cameraRotation: number,
  speed: number,
  deltaTime: number
): THREE.Vector3 {
  // Create movement vector in camera space
  const cameraSpaceMovement = new THREE.Vector3(mouseX, 0, -mouseY).normalize();

  // Convert to world space based on camera rotation
  const worldSpaceMovement = localToWorldDirection(cameraSpaceMovement, cameraRotation);

  // Apply movement
  return position.clone().add(worldSpaceMovement.multiplyScalar(speed * deltaTime));
}

// ============================================================================
// Example 7: Check if Target is in Front
// ============================================================================

/**
 * Determine if a target is in front of or behind the character
 */
export function example7_isTargetInFront(
  characterPosition: THREE.Vector3,
  characterRotation: number,
  targetPosition: THREE.Vector3
): { inFront: boolean; angle: number } {
  // Get direction to target
  const directionToTarget = new THREE.Vector3()
    .subVectors(targetPosition, characterPosition)
    .normalize();

  // Get character's forward direction
  const forward = getForwardDirection(characterRotation);

  // Calculate dot product (measures alignment)
  // dot > 0 means in front, dot < 0 means behind
  const dot = forward.dot(directionToTarget);

  // Calculate angle between forward and target direction
  const angle = Math.acos(THREE.MathUtils.clamp(dot, -1, 1));

  return {
    inFront: dot > 0,
    angle: angle
  };
}

// ============================================================================
// Example 8: Orbit Around Target
// ============================================================================

/**
 * Make a character orbit around a target position
 */
export function example8_orbitAroundTarget(
  characterPosition: THREE.Vector3,
  targetPosition: THREE.Vector3,
  orbitRadius: number,
  orbitSpeed: number,
  currentAngle: number,
  deltaTime: number
): { position: THREE.Vector3; rotation: number; angle: number } {
  // Update orbit angle
  const newAngle = currentAngle + orbitSpeed * deltaTime;

  // Calculate position on orbit
  const x = targetPosition.x + Math.cos(newAngle) * orbitRadius;
  const z = targetPosition.z + Math.sin(newAngle) * orbitRadius;
  const newPosition = new THREE.Vector3(x, characterPosition.y, z);

  // Calculate rotation to face target
  const rotation = calculateLookAtRotation(newPosition, targetPosition);

  return {
    position: newPosition,
    rotation: rotation,
    angle: newAngle
  };
}

// ============================================================================
// Example 9: Velocity-Based Movement with Max Speed
// ============================================================================

/**
 * Implement physics-based movement with velocity and max speed
 */
export function example9_velocityBasedMovement(
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  rotation: number,
  keysPressed: Set<string>,
  acceleration: number,
  maxSpeed: number,
  friction: number,
  deltaTime: number
): { position: THREE.Vector3; velocity: THREE.Vector3 } {
  let newVelocity = velocity.clone();

  // Apply input acceleration in local space
  const inputDirection = new THREE.Vector3();

  if (keysPressed.has('w')) inputDirection.z -= 1;
  if (keysPressed.has('s')) inputDirection.z += 1;
  if (keysPressed.has('a')) inputDirection.x -= 1;
  if (keysPressed.has('d')) inputDirection.x += 1;

  if (inputDirection.length() > 0) {
    // Convert input to world space
    const worldDirection = localToWorldDirection(inputDirection.normalize(), rotation);

    // Apply acceleration
    newVelocity.add(worldDirection.multiplyScalar(acceleration * deltaTime));
  }

  // Apply friction
  newVelocity.multiplyScalar(1 - friction * deltaTime);

  // Clamp to max speed
  newVelocity = clampMagnitude(newVelocity, maxSpeed);

  // Update position
  const newPosition = position.clone().add(newVelocity.clone().multiplyScalar(deltaTime));

  return {
    position: newPosition,
    velocity: newVelocity
  };
}

// ============================================================================
// Example 10: Debug Visualization
// ============================================================================

/**
 * Log coordinate information for debugging
 */
export function example10_debugVisualization(
  characterPosition: THREE.Vector3,
  characterRotation: number,
  targetPosition?: THREE.Vector3
): void {
  console.log('=== Coordinate Debug Info ===');

  // Log character state
  logCoordinates('Character', characterPosition, characterRotation);

  // Log forward direction
  const forward = getForwardDirection(characterRotation);
  console.log('Forward Direction:', {
    x: forward.x.toFixed(2),
    y: forward.y.toFixed(2),
    z: forward.z.toFixed(2)
  });

  // Log right direction
  const right = getRightDirection(characterRotation);
  console.log('Right Direction:', {
    x: right.x.toFixed(2),
    y: right.y.toFixed(2),
    z: right.z.toFixed(2)
  });

  // Log target info if provided
  if (targetPosition) {
    logCoordinates('Target', targetPosition);

    const distance = characterPosition.distanceTo(targetPosition);
    console.log('Distance to Target:', distance.toFixed(2));

    const targetRotation = calculateLookAtRotation(characterPosition, targetPosition);
    console.log('Angle to Target:', ((targetRotation * 180) / Math.PI).toFixed(1) + '°');

    const { inFront } = example7_isTargetInFront(
      characterPosition,
      characterRotation,
      targetPosition
    );
    console.log('Target in Front:', inFront);
  }

  console.log('============================');
}

// ============================================================================
// Example 11: Using Object3D.getWorldDirection()
// ============================================================================

/**
 * Use Three.js built-in getWorldDirection for orientation tracking
 */
export function example11_usingObject3DDirection(object: THREE.Object3D, speed: number): void {
  // Get the direction the object is currently facing
  const worldDirection = getObjectWorldDirection(object);

  // Move forward in that direction
  object.position.add(worldDirection.multiplyScalar(speed));

  console.log('Moving in direction:', {
    x: worldDirection.x.toFixed(2),
    y: worldDirection.y.toFixed(2),
    z: worldDirection.z.toFixed(2)
  });
}

// ============================================================================
// Example 12: Complete Character Controller
// ============================================================================

/**
 * Complete character controller implementation combining all concepts
 */
export class CharacterController3D {
  position: THREE.Vector3;
  rotation: number;
  velocity: THREE.Vector3;

  speed: number = 5;
  rotationSpeed: number = Math.PI;
  acceleration: number = 20;
  friction: number = 10;
  maxSpeed: number = 10;

  constructor(initialPosition: THREE.Vector3, initialRotation: number = 0) {
    this.position = initialPosition;
    this.rotation = initialRotation;
    this.velocity = new THREE.Vector3();
  }

  update(keysPressed: Set<string>, deltaTime: number): void {
    // Rotation
    if (keysPressed.has('a') || keysPressed.has('arrowleft')) {
      this.rotation += this.rotationSpeed * deltaTime;
    }
    if (keysPressed.has('d') || keysPressed.has('arrowright')) {
      this.rotation -= this.rotationSpeed * deltaTime;
    }

    // Velocity-based movement
    const result = example9_velocityBasedMovement(
      this.position,
      this.velocity,
      this.rotation,
      keysPressed,
      this.acceleration,
      this.maxSpeed,
      this.friction,
      deltaTime
    );

    this.position = result.position;
    this.velocity = result.velocity;
  }

  lookAt(targetPosition: THREE.Vector3, smoothing: number = 0.1): void {
    this.rotation = example4_lookAtTarget(this.position, targetPosition, this.rotation, smoothing);
  }

  getForwardDirection(): THREE.Vector3 {
    return getForwardDirection(this.rotation);
  }

  getRightDirection(): THREE.Vector3 {
    return getRightDirection(this.rotation);
  }

  debugLog(): void {
    logCoordinates('Character', this.position, this.rotation);
  }
}
