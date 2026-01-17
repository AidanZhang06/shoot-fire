import * as THREE from 'three';

/**
 * Coordinate Transform Utilities for Three.js
 *
 * This module provides utilities for working with coordinate systems,
 * transforming between local and world space, and handling orientation-based movement.
 *
 * THREE.JS COORDINATE SYSTEM:
 * - Right-handed coordinate system
 * - +X: Right
 * - +Y: Up
 * - +Z: Toward camera (Backward in typical game convention)
 * - -Z: Away from camera (Forward in typical game convention)
 */

/**
 * Convert a direction from local space to world space
 *
 * Local space is relative to an object's orientation.
 * World space is the fixed global coordinate system.
 *
 * Example:
 * - Local forward (-Z) becomes world direction based on rotation
 * - If object is rotated 90° right, local forward (-Z) becomes world -X
 *
 * @param localDirection - Direction in local coordinates (e.g., [0, 0, -1] for forward)
 * @param rotationY - Y-axis rotation in radians
 * @returns Direction in world coordinates
 */
export function localToWorldDirection(
  localDirection: THREE.Vector3,
  rotationY: number
): THREE.Vector3 {
  return localDirection
    .clone()
    .normalize()
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
}

/**
 * Convert a direction from world space to local space
 *
 * @param worldDirection - Direction in world coordinates
 * @param rotationY - Y-axis rotation in radians
 * @returns Direction in local coordinates
 */
export function worldToLocalDirection(
  worldDirection: THREE.Vector3,
  rotationY: number
): THREE.Vector3 {
  return worldDirection
    .clone()
    .normalize()
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotationY);
}

/**
 * Get the forward direction vector for an object based on its Y-axis rotation
 *
 * In Three.js, forward is -Z, so we rotate the -Z vector by the object's rotation.
 *
 * @param rotationY - Y-axis rotation in radians
 * @returns Normalized forward direction in world space
 */
export function getForwardDirection(rotationY: number): THREE.Vector3 {
  const forward = new THREE.Vector3(0, 0, -1);
  return forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
}

/**
 * Get the right direction vector for an object based on its Y-axis rotation
 *
 * In Three.js, right is +X, so we rotate the +X vector by the object's rotation.
 *
 * @param rotationY - Y-axis rotation in radians
 * @returns Normalized right direction in world space
 */
export function getRightDirection(rotationY: number): THREE.Vector3 {
  const right = new THREE.Vector3(1, 0, 0);
  return right.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
}

/**
 * Get the up direction vector (always +Y in Three.js unless object is tilted)
 *
 * @returns Normalized up direction
 */
export function getUpDirection(): THREE.Vector3 {
  return new THREE.Vector3(0, 1, 0);
}

/**
 * Calculate the Y-axis rotation needed to face a target position
 *
 * This is useful for making characters or cameras look at a specific point.
 *
 * @param currentPosition - Current position
 * @param targetPosition - Position to face towards
 * @returns Y-axis rotation in radians
 */
export function calculateLookAtRotation(
  currentPosition: THREE.Vector3,
  targetPosition: THREE.Vector3
): number {
  const direction = new THREE.Vector3()
    .subVectors(targetPosition, currentPosition)
    .normalize();

  // atan2(x, -z) gives us the Y rotation
  // We use -z because forward is -Z in Three.js
  return Math.atan2(direction.x, -direction.z);
}

/**
 * Move a position in a direction relative to a rotation (local space movement)
 *
 * This is the foundation of orientation-based movement:
 * - The direction is in local space (e.g., forward = [0, 0, -1])
 * - The direction is transformed to world space based on rotation
 * - The position is updated in world space
 *
 * @param position - Current world position
 * @param localDirection - Direction in local space
 * @param distance - Distance to move
 * @param rotationY - Y-axis rotation in radians
 * @returns New world position
 */
export function moveInDirection(
  position: THREE.Vector3,
  localDirection: THREE.Vector3,
  distance: number,
  rotationY: number
): THREE.Vector3 {
  const worldDirection = localToWorldDirection(localDirection, rotationY);
  const delta = worldDirection.multiplyScalar(distance);
  return position.clone().add(delta);
}

/**
 * Rotate smoothly towards a target rotation
 *
 * Uses lerp for smooth rotation interpolation.
 *
 * @param currentRotation - Current Y-axis rotation in radians
 * @param targetRotation - Target Y-axis rotation in radians
 * @param speed - Rotation speed (0-1, where 1 is instant)
 * @returns New rotation value
 */
export function rotateTowards(
  currentRotation: number,
  targetRotation: number,
  speed: number
): number {
  // Normalize angles to -PI to PI range
  currentRotation = normalizeAngle(currentRotation);
  targetRotation = normalizeAngle(targetRotation);

  // Find shortest rotation path
  let delta = targetRotation - currentRotation;
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta < -Math.PI) delta += 2 * Math.PI;

  // Lerp towards target
  return currentRotation + delta * speed;
}

/**
 * Normalize an angle to the range [-PI, PI]
 *
 * @param angle - Angle in radians
 * @returns Normalized angle
 */
export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * Calculate distance between two positions
 *
 * @param pos1 - First position
 * @param pos2 - Second position
 * @returns Distance between positions
 */
export function distance(pos1: THREE.Vector3, pos2: THREE.Vector3): number {
  return pos1.distanceTo(pos2);
}

/**
 * Check if two positions are approximately equal (within tolerance)
 *
 * @param pos1 - First position
 * @param pos2 - Second position
 * @param tolerance - Maximum difference (default: 0.01)
 * @returns True if positions are approximately equal
 */
export function approximatelyEqual(
  pos1: THREE.Vector3,
  pos2: THREE.Vector3,
  tolerance: number = 0.01
): boolean {
  return distance(pos1, pos2) < tolerance;
}

/**
 * Clamp a vector's magnitude to a maximum value
 *
 * Useful for limiting movement speed while preserving direction.
 *
 * @param vector - Vector to clamp
 * @param maxLength - Maximum length
 * @returns Clamped vector
 */
export function clampMagnitude(vector: THREE.Vector3, maxLength: number): THREE.Vector3 {
  if (vector.length() > maxLength) {
    return vector.clone().normalize().multiplyScalar(maxLength);
  }
  return vector.clone();
}

/**
 * Project a position onto a plane
 *
 * Useful for constraining movement to a specific height (e.g., ground plane).
 *
 * @param position - Position to project
 * @param planeY - Y-coordinate of the plane
 * @returns Projected position
 */
export function projectToPlane(position: THREE.Vector3, planeY: number): THREE.Vector3 {
  return new THREE.Vector3(position.x, planeY, position.z);
}

/**
 * Standard local direction vectors for common movements
 */
export const LocalDirections = {
  /** Forward in local space (away from camera) */
  FORWARD: new THREE.Vector3(0, 0, -1),

  /** Backward in local space (toward camera) */
  BACKWARD: new THREE.Vector3(0, 0, 1),

  /** Right in local space */
  RIGHT: new THREE.Vector3(1, 0, 0),

  /** Left in local space */
  LEFT: new THREE.Vector3(-1, 0, 0),

  /** Up in local space */
  UP: new THREE.Vector3(0, 1, 0),

  /** Down in local space */
  DOWN: new THREE.Vector3(0, -1, 0)
} as const;

/**
 * Helper to get Object3D's world direction using getWorldDirection method
 *
 * This is the Three.js built-in way to get forward direction.
 * The object's local -Z axis direction in world coordinates.
 *
 * @param object - Three.js Object3D
 * @returns Forward direction in world space
 */
export function getObjectWorldDirection(object: THREE.Object3D): THREE.Vector3 {
  const direction = new THREE.Vector3();
  object.getWorldDirection(direction);
  return direction;
}

/**
 * Debug helper to log coordinate information
 *
 * @param label - Label for the log
 * @param position - Position to log
 * @param rotation - Optional rotation to log (in radians)
 */
export function logCoordinates(
  label: string,
  position: THREE.Vector3,
  rotation?: number
): void {
  console.log(`[${label}]`, {
    position: `(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`,
    rotation: rotation !== undefined ? `${((rotation * 180) / Math.PI).toFixed(1)}°` : 'N/A'
  });
}
