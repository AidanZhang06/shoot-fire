/**
 * Hazard Renderer - Visualizes fire, smoke, and water hazards
 * Inspired by modelbase/src/components/FireVisualization.tsx
 */

import * as THREE from 'three';
import { Vector3 } from '../types/schemas';

interface Hazard {
  id: string;
  type: 'fire' | 'smoke' | 'water';
  mesh: THREE.Mesh;
  intensity: number;
  position: Vector3;
  particles?: THREE.Mesh[];
}

export class HazardRenderer {
  private group: THREE.Group;
  private hazards: Map<string, Hazard> = new Map();
  private animationTime = 0;

  constructor() {
    this.group = new THREE.Group();
  }

  /**
   * Add a fire hazard
   */
  addFireHazard(position: Vector3, intensity: number): string {
    const id = `fire-${position.x}-${position.y}-${position.z}`;

    // Base fire sphere
    const baseRadius = 1.0 + intensity * 0.3;
    const geometry = new THREE.SphereGeometry(baseRadius, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.6 + intensity * 0.1,
      emissive: 0xff4400,
      emissiveIntensity: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y + baseRadius, position.z);
    this.group.add(mesh);

    // Add particle effects
    const particles: THREE.Mesh[] = [];
    const particleCount = Math.floor(5 + intensity * 3);

    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0xff4400 : 0xff8800,
        transparent: true,
        opacity: 0.5
      });

      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = baseRadius * 0.7;
      particle.position.set(
        position.x + Math.cos(angle) * radius,
        position.y + baseRadius,
        position.z + Math.sin(angle) * radius
      );

      particles.push(particle);
      this.group.add(particle);
    }

    // Add smoke cloud above fire
    const smokeGeometry = new THREE.SphereGeometry(baseRadius * 1.2, 12, 12);
    const smokeMaterial = new THREE.MeshBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.3
    });
    const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
    smoke.position.set(position.x, position.y + baseRadius * 2.5, position.z);
    this.group.add(smoke);
    particles.push(smoke);

    this.hazards.set(id, {
      id,
      type: 'fire',
      mesh,
      intensity,
      position,
      particles
    });

    return id;
  }

  /**
   * Add a smoke hazard
   */
  addSmokeHazard(position: Vector3, density: number): string {
    const id = `smoke-${position.x}-${position.y}-${position.z}`;

    const radius = 1.5 + density * 0.4;
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.2 + density * 0.1
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y + radius, position.z);
    this.group.add(mesh);

    this.hazards.set(id, {
      id,
      type: 'smoke',
      mesh,
      intensity: density,
      position
    });

    return id;
  }

  /**
   * Add a water hazard
   */
  addWaterHazard(position: Vector3, depth: number): string {
    const id = `water-${position.x}-${position.y}-${position.z}`;

    // Flat plane for water
    const size = 2.0;
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshBasicMaterial({
      color: 0x4444ff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y + depth * 0.1, position.z);
    mesh.rotation.x = -Math.PI / 2; // Rotate to horizontal
    this.group.add(mesh);

    this.hazards.set(id, {
      id,
      type: 'water',
      mesh,
      intensity: depth,
      position
    });

    return id;
  }

  /**
   * Remove a specific hazard
   */
  removeHazard(id: string): void {
    const hazard = this.hazards.get(id);
    if (!hazard) return;

    // Dispose mesh
    hazard.mesh.geometry.dispose();
    if (hazard.mesh.material instanceof THREE.Material) {
      hazard.mesh.material.dispose();
    }
    this.group.remove(hazard.mesh);

    // Dispose particles if any
    if (hazard.particles) {
      hazard.particles.forEach(particle => {
        particle.geometry.dispose();
        if (particle.material instanceof THREE.Material) {
          particle.material.dispose();
        }
        this.group.remove(particle);
      });
    }

    this.hazards.delete(id);
  }

  /**
   * Clear all hazards
   */
  clearAll(): void {
    const ids = Array.from(this.hazards.keys());
    ids.forEach(id => this.removeHazard(id));
  }

  /**
   * Update animations (call every frame)
   */
  update(deltaTime: number = 0.016): void {
    this.animationTime += deltaTime;

    this.hazards.forEach(hazard => {
      if (hazard.type === 'fire') {
        // Pulsing fire
        const pulseScale = 1 + Math.sin(this.animationTime * 3) * 0.15;
        hazard.mesh.scale.setScalar(pulseScale);

        // Animate fire particles
        if (hazard.particles) {
          hazard.particles.forEach((particle, index) => {
            // Rising and spinning motion
            const time = this.animationTime + index * 0.5;
            const yOffset = Math.sin(time * 2) * 0.3;
            const angle = time * 0.5;
            const radius = 0.5;

            particle.position.set(
              hazard.position.x + Math.cos(angle + index) * radius,
              hazard.position.y + 1 + yOffset,
              hazard.position.z + Math.sin(angle + index) * radius
            );
          });
        }
      } else if (hazard.type === 'smoke') {
        // Slow pulsing and drifting smoke
        const pulseScale = 1 + Math.sin(this.animationTime * 1.5) * 0.1;
        hazard.mesh.scale.setScalar(pulseScale);

        // Drift upward slowly
        hazard.mesh.position.y += deltaTime * 0.2;
      } else if (hazard.type === 'water') {
        // Gentle wave motion
        const waveScale = 1 + Math.sin(this.animationTime * 2) * 0.05;
        hazard.mesh.scale.set(waveScale, 1, waveScale);
      }
    });
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
