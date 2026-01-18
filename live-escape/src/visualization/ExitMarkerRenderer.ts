/**
 * Exit Marker Renderer - Displays exit markers in 3D
 * Converted from modelbase/src/components/ExitMarkers.tsx
 * Uses exit positions from FireExits.ts
 */

import * as THREE from 'three';
import { Vector3 } from '../types/schemas';

interface ExitMarker {
  id: string;
  mesh: THREE.Mesh;
  status: 'clear' | 'crowded' | 'blocked';
  position: Vector3;
}

export class ExitMarkerRenderer {
  private group: THREE.Group;
  private exits: Map<string, ExitMarker> = new Map();
  private animationTime = 0;

  constructor() {
    this.group = new THREE.Group();
  }

  /**
   * Add or update an exit marker
   */
  addExit(exitId: string, position: Vector3, status: 'clear' | 'crowded' | 'blocked' = 'clear'): void {
    // Remove existing if present
    if (this.exits.has(exitId)) {
      this.removeExit(exitId);
    }

    // Determine color based on status
    let color: number;
    switch (status) {
      case 'clear':
        color = 0x22c55e; // Green
        break;
      case 'crowded':
        color = 0xf59e0b; // Orange
        break;
      case 'blocked':
        color = 0xef4444; // Red
        break;
    }

    // Create glowing box
    const geometry = new THREE.BoxGeometry(1.5, 3, 0.5);
    const material = new THREE.MeshBasicMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y + 1.5, position.z);
    mesh.castShadow = false; // Exits are emissive, don't cast shadows
    this.group.add(mesh);

    this.exits.set(exitId, {
      id: exitId,
      mesh,
      status,
      position
    });
  }

  /**
   * Remove an exit marker
   */
  removeExit(exitId: string): void {
    const exit = this.exits.get(exitId);
    if (!exit) return;

    exit.mesh.geometry.dispose();
    if (exit.mesh.material instanceof THREE.Material) {
      exit.mesh.material.dispose();
    }
    this.group.remove(exit.mesh);

    this.exits.delete(exitId);
  }

  /**
   * Update exit status (changes color)
   */
  updateExitStatus(exitId: string, status: 'clear' | 'crowded' | 'blocked'): void {
    const exit = this.exits.get(exitId);
    if (!exit) return;

    // Update color based on new status
    let color: number;
    switch (status) {
      case 'clear':
        color = 0x22c55e;
        break;
      case 'crowded':
        color = 0xf59e0b;
        break;
      case 'blocked':
        color = 0xef4444;
        break;
    }

    const material = exit.mesh.material as THREE.MeshBasicMaterial;
    material.color.setHex(color);
    material.emissive.setHex(color);

    exit.status = status;
  }

  /**
   * Clear all exit markers
   */
  clearAll(): void {
    const ids = Array.from(this.exits.keys());
    ids.forEach(id => this.removeExit(id));
  }

  /**
   * Update animations (call every frame)
   */
  update(deltaTime: number = 0.016): void {
    this.animationTime += deltaTime;

    // Pulsing animation for all exits
    this.exits.forEach(exit => {
      const pulseScale = 1 + Math.sin(this.animationTime * 2) * 0.1;
      exit.mesh.scale.set(1, pulseScale, 1); // Pulse vertically

      // Vary emissive intensity
      const material = exit.mesh.material as THREE.MeshBasicMaterial;
      material.emissiveIntensity = 0.5 + Math.sin(this.animationTime * 2) * 0.2;
    });
  }

  /**
   * Get all exit IDs
   */
  getExitIds(): string[] {
    return Array.from(this.exits.keys());
  }

  /**
   * Check if exit exists
   */
  hasExit(exitId: string): boolean {
    return this.exits.has(exitId);
  }

  /**
   * Get the Three.js group
   */
  getGroup(): THREE.Group {
    return this.group;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.clearAll();
  }
}
