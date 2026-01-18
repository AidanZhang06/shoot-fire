/**
 * User Marker - Displays user position as a green 3D character
 * Converted from modelbase/src/GreenDotPerson.tsx
 */

import * as THREE from 'three';
import { Vector3 } from '../types/schemas';

export class UserMarker {
  private group: THREE.Group;
  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;

  private targetPosition: THREE.Vector3;
  private currentPosition: THREE.Vector3;
  private lerpSpeed = 1.0; // Direct movement - no lag

  private pulseTime = 0;
  private enablePulse = true;

  constructor() {
    this.group = new THREE.Group();
    this.currentPosition = new THREE.Vector3(0, 0, 0);
    this.targetPosition = new THREE.Vector3(0, 0, 0);

    this.createGeometry();
  }

  private createGeometry(): void {
    // Make the person 3x larger for better visibility in minimap
    const personHeight = 5.1;
    const headRadius = 0.9;
    const bodyRadius = 0.75;
    const bodyHeight = 3.0;
    const legRadius = 0.36;
    const legHeight = 1.8;

    // Material - bright green for visibility
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.2,
      roughness: 0.5,
      metalness: 0.3
    });

    // Body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(
      bodyRadius,
      bodyRadius * 0.8,
      bodyHeight,
      8
    );
    this.body = new THREE.Mesh(bodyGeometry, material);
    this.body.position.set(0, bodyHeight / 2 + 0.2, 0);
    this.body.castShadow = true;
    this.group.add(this.body);

    // Head (sphere)
    const headGeometry = new THREE.SphereGeometry(headRadius, 16, 16);
    this.head = new THREE.Mesh(headGeometry, material);
    this.head.position.set(0, bodyHeight + headRadius + 0.3, 0);
    this.head.castShadow = true;
    this.group.add(this.head);

    // Left leg (cylinder)
    const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 8);
    this.leftLeg = new THREE.Mesh(legGeometry, material);
    this.leftLeg.position.set(-0.45, legHeight / 2, 0);
    this.leftLeg.castShadow = true;
    this.group.add(this.leftLeg);

    // Right leg (cylinder)
    this.rightLeg = new THREE.Mesh(legGeometry, material);
    this.rightLeg.position.set(0.45, legHeight / 2, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.rightLeg);

    // Directional indicator cone (shows which way user is facing)
    const coneGeometry = new THREE.ConeGeometry(0.9, 2.4, 8);
    const coneMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, // Blue color for direction indicator
      emissive: 0x3b82f6,
      emissiveIntensity: 0.3,
      roughness: 0.5,
      metalness: 0.3
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.rotation.x = Math.PI; // Point forward (cone default points up)
    cone.position.set(0, bodyHeight + headRadius + 0.8, 0); // Above head
    cone.castShadow = true;
    this.group.add(cone);
  }

  /**
   * Update target position (will smoothly interpolate to this position)
   */
  updatePosition(position: Vector3): void {
    this.targetPosition.set(position.x, position.y, position.z);
  }

  /**
   * Set position immediately (no interpolation)
   */
  setPosition(position: Vector3): void {
    this.currentPosition.set(position.x, position.y, position.z);
    this.targetPosition.set(position.x, position.y, position.z);
    this.group.position.copy(this.currentPosition);
  }

  /**
   * Set heading direction (in degrees, 0-360 where 0=North)
   * Rotates the entire marker group to face the given direction
   */
  setHeading(degrees: number): void {
    const radians = (degrees * Math.PI) / 180;
    this.group.rotation.y = -radians; // Negative because of coordinate system
  }

  /**
   * Update animation (call every frame)
   */
  update(deltaTime: number = 0.016): void {
    // Smooth position interpolation
    this.currentPosition.lerp(this.targetPosition, this.lerpSpeed);
    this.group.position.copy(this.currentPosition);

    // Pulsing animation for visibility
    if (this.enablePulse) {
      this.pulseTime += deltaTime * 2;
      const pulseScale = 1 + Math.sin(this.pulseTime) * 0.1;
      this.head.scale.setScalar(pulseScale);
    }
  }

  /**
   * Enable or disable pulsing animation
   */
  setPulseEnabled(enabled: boolean): void {
    this.enablePulse = enabled;
    if (!enabled) {
      this.head.scale.setScalar(1);
    }
  }

  /**
   * Get the Three.js group
   */
  getGroup(): THREE.Group {
    return this.group;
  }

  /**
   * Get current position
   */
  getPosition(): Vector3 {
    return {
      x: this.currentPosition.x,
      y: this.currentPosition.y,
      z: this.currentPosition.z
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.body.geometry.dispose();
    this.head.geometry.dispose();
    this.leftLeg.geometry.dispose();
    this.rightLeg.geometry.dispose();

    if (this.body.material instanceof THREE.Material) {
      this.body.material.dispose();
    }
  }
}
