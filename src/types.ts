import { Mesh } from 'three';

/**
 * Interface for building elements (extruded meshes from SVG paths)
 */
export interface BuildingElement {
  mesh: Mesh;
  type: 'wall' | 'door' | 'stair';
  depth: number;
  opacity: number;
}

/**
 * Interface for pose data from Overshoot AI
 */
export interface Pose {
  x: number;
  y: number;
  rotation: number; // in radians
}

