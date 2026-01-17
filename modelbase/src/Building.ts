import { Group } from 'three';
import { Floor } from './Floor';
import { BuildingElement } from './types';

/**
 * Building class that manages an array of Floor objects
 * Each floor is offset by y = 3.5 units
 */
export class Building {
  private floors: Floor[];
  private group: Group;
  private floorHeight: number = 3.5;

  constructor() {
    this.floors = [];
    this.group = new Group();
  }

  /**
   * Get the main THREE.Group for the building
   */
  getGroup(): Group {
    return this.group;
  }

  /**
   * Add a new floor to the building
   */
  addFloor(): Floor {
    const floor = new Floor();
    const floorIndex = this.floors.length;
    
    // Offset each floor by floorHeight
    floor.getGroup().position.y = floorIndex * this.floorHeight;
    
    this.floors.push(floor);
    this.group.add(floor.getGroup());
    
    return floor;
  }

  /**
   * Get a specific floor by index
   */
  getFloor(index: number): Floor | undefined {
    return this.floors[index];
  }

  /**
   * Get all floors
   */
  getFloors(): Floor[] {
    return this.floors;
  }

  /**
   * Get the number of floors
   */
  getFloorCount(): number {
    return this.floors.length;
  }

  /**
   * Add elements to a specific floor
   */
  addElementsToFloor(floorIndex: number, elements: BuildingElement[]): void {
    const floor = this.floors[floorIndex];
    if (floor) {
      elements.forEach(element => floor.addElement(element));
    }
  }
}

