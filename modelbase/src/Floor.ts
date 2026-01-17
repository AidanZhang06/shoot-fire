import { Group } from 'three';
import { BuildingElement } from './types';

/**
 * Floor class that holds a THREE.Group containing building elements
 */
export class Floor {
  private group: Group;
  private elements: BuildingElement[];

  constructor() {
    this.group = new Group();
    this.elements = [];
  }

  /**
   * Get the THREE.Group for this floor
   */
  getGroup(): Group {
    return this.group;
  }

  /**
   * Add a building element to this floor
   */
  addElement(element: BuildingElement): void {
    this.elements.push(element);
    this.group.add(element.mesh);
  }

  /**
   * Get all elements in this floor
   */
  getElements(): BuildingElement[] {
    return this.elements;
  }

  /**
   * Remove all elements from this floor
   */
  clear(): void {
    this.elements.forEach(element => {
      this.group.remove(element.mesh);
      element.mesh.geometry.dispose();
      if (Array.isArray(element.mesh.material)) {
        element.mesh.material.forEach(mat => mat.dispose());
      } else {
        element.mesh.material.dispose();
      }
    });
    this.elements = [];
  }
}

