import { Mesh, SphereGeometry, MeshStandardMaterial, Color } from 'three';
import { Pose } from './types';

/**
 * SpatialLink service for handling localization and user pose updates
 */
export class SpatialLink {
  private userMesh: Mesh;
  private group: Mesh;

  constructor() {
    // Create a glowing green dot to represent the user
    const geometry = new SphereGeometry(0.2, 16, 16);
    const material = new MeshStandardMaterial({
      color: new Color(0x00ff00), // Green
      emissive: new Color(0x00ff00),
      emissiveIntensity: 0.8,
    });
    
    this.userMesh = new Mesh(geometry, material);
    this.group = this.userMesh; // For consistency, though we only have one mesh
  }

  /**
   * Update the user's pose in the 3D scene
   * @param pose - The pose data containing x, y, and rotation
   */
  updateUserPose(pose: Pose): void {
    // Update position (note: SVG coordinates might need transformation)
    this.userMesh.position.x = pose.x;
    this.userMesh.position.z = pose.y; // Use z for y in 3D space
    this.userMesh.position.y = 0.5; // Slightly above ground
    
    // Update rotation
    this.userMesh.rotation.y = pose.rotation;
  }

  /**
   * Get the user mesh for adding to the scene
   */
  getUserMesh(): Mesh {
    return this.userMesh;
  }

  /**
   * Set the user position directly (for testing or manual updates)
   */
  setPosition(x: number, y: number, z: number = 0.5): void {
    this.userMesh.position.set(x, z, y);
  }
}

