/**
 * Path Renderer - Visualizes evacuation routes as 3D paths
 * Shows the route from user's current position to the exit
 */

import * as THREE from 'three';
import { Waypoint } from '../types/schemas';

export class PathRenderer {
  private group: THREE.Group;
  private pathLine: THREE.Mesh | null = null;
  private waypointMarkers: THREE.Mesh[] = [];

  private animationTime = 0;
  private readonly pathColor = 0xf27059; // Orange-500 from UI palette
  private readonly pathRadius = 0.15;

  constructor() {
    this.group = new THREE.Group();
  }

  /**
   * Update the path with new waypoints
   */
  updatePath(waypoints: Waypoint[]): void {
    this.clearPath();

    if (!waypoints || waypoints.length < 2) {
      return; // Need at least 2 points for a path
    }

    // Create path line
    this.createPathLine(waypoints);

    // Create waypoint markers
    this.createWaypointMarkers(waypoints);
  }

  /**
   * Create the main path line using TubeGeometry for visibility
   */
  private createPathLine(waypoints: Waypoint[]): void {
    // Convert waypoints to Vector3 array
    const points = waypoints.map(
      wp => new THREE.Vector3(wp.x, wp.y + 0.5, wp.z) // Raise slightly above ground
    );

    // Create smooth curve from waypoints
    const curve = new THREE.CatmullRomCurve3(points);

    // Create tube geometry along the curve
    const tubeGeometry = new THREE.TubeGeometry(
      curve,
      Math.max(32, waypoints.length * 8), // Segments (more = smoother)
      this.pathRadius,
      8, // Radial segments
      false // Not closed
    );

    // Create material with emissive glow
    const material = new THREE.MeshBasicMaterial({
      color: this.pathColor,
      transparent: true,
      opacity: 0.8,
      emissive: this.pathColor,
      emissiveIntensity: 0.5
    });

    this.pathLine = new THREE.Mesh(tubeGeometry, material);
    this.group.add(this.pathLine);
  }

  /**
   * Create small markers at each waypoint
   */
  private createWaypointMarkers(waypoints: Waypoint[]): void {
    // Skip first (current position) and last (handled by exit marker)
    const markersToShow = waypoints.slice(1, -1);

    markersToShow.forEach((wp, index) => {
      const geometry = new THREE.SphereGeometry(0.2, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: this.pathColor,
        transparent: true,
        opacity: 0.7
      });

      const marker = new THREE.Mesh(geometry, material);
      marker.position.set(wp.x, wp.y + 0.5, wp.z);

      this.waypointMarkers.push(marker);
      this.group.add(marker);
    });
  }

  /**
   * Clear the current path
   */
  clearPath(): void {
    if (this.pathLine) {
      this.pathLine.geometry.dispose();
      if (this.pathLine.material instanceof THREE.Material) {
        this.pathLine.material.dispose();
      }
      this.group.remove(this.pathLine);
      this.pathLine = null;
    }

    this.waypointMarkers.forEach(marker => {
      marker.geometry.dispose();
      if (marker.material instanceof THREE.Material) {
        marker.material.dispose();
      }
      this.group.remove(marker);
    });
    this.waypointMarkers = [];
  }

  /**
   * Update animation (call every frame)
   */
  update(deltaTime: number = 0.016): void {
    this.animationTime += deltaTime;

    // Pulse waypoint markers
    this.waypointMarkers.forEach((marker, index) => {
      const offset = index * 0.5;
      const pulseScale = 1 + Math.sin(this.animationTime * 2 + offset) * 0.2;
      marker.scale.setScalar(pulseScale);
    });

    // Fade path line in and out slightly for attention
    if (this.pathLine && this.pathLine.material instanceof THREE.Material) {
      const baseMaterial = this.pathLine.material as THREE.MeshBasicMaterial;
      baseMaterial.opacity = 0.7 + Math.sin(this.animationTime) * 0.1;
    }
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
    this.clearPath();
  }
}
