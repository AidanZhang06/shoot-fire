import { useThree } from '@react-three/fiber';
import { Raycaster, Vector2 } from 'three';
import { NavigationNode } from '../navigation/types';

export class RaycastInteraction {
  private raycaster: Raycaster;
  private mouse: Vector2;

  constructor() {
    this.raycaster = new Raycaster();
    this.mouse = new Vector2();
  }

  // Convert mouse coordinates to normalized device coordinates
  updateMouse(event: MouseEvent, width: number, height: number): void {
    this.mouse.x = (event.clientX / width) * 2 - 1;
    this.mouse.y = -(event.clientY / height) * 2 + 1;
  }

  // Perform raycast to find intersected objects
  intersectObjects(
    objects: THREE.Object3D[],
    camera: THREE.Camera
  ): THREE.Intersection[] {
    this.raycaster.setFromCamera(this.mouse, camera);
    return this.raycaster.intersectObjects(objects, true);
  }

  // Find nearest navigation node from click position
  findNearestNode(
    clickPosition: [number, number, number],
    nodes: Map<string, NavigationNode>,
    maxDistance: number = 5
  ): NavigationNode | null {
    let nearest: NavigationNode | null = null;
    let minDistance = maxDistance;

    nodes.forEach((node) => {
      const distance = Math.sqrt(
        Math.pow(node.position[0] - clickPosition[0], 2) +
        Math.pow(node.position[1] - clickPosition[1], 2) +
        Math.pow(node.position[2] - clickPosition[2], 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = node;
      }
    });

    return nearest;
  }
}

