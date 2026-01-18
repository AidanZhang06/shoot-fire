/**
 * Building Model - 3D representation of the Gates Building
 * Converted and simplified from modelbase/src/GatesBuilding.tsx
 * Optimized for minimap rendering (reduced detail)
 */

import * as THREE from 'three';

interface BuildingDimensions {
  width: number;
  height: number;
}

export class BuildingModel {
  private group: THREE.Group;
  private floorHeight: number;
  private readonly wallThickness = 0.3;

  constructor(dimensions: BuildingDimensions, floorHeight: number = 3.5) {
    this.group = new THREE.Group();
    this.floorHeight = floorHeight;

    this.buildGeometry();
  }

  private buildGeometry(): void {
    // Create 9 floors of the L-shaped building
    for (let floorNum = 1; floorNum <= 9; floorNum++) {
      const floorY = (floorNum - 1) * this.floorHeight;

      // Calculate dimensions (building tapers on upper floors)
      const mainWingWidth = 45 - (floorNum - 1) * 1.2;
      const mainWingDepth = 18;
      const sideWingWidth = 15;
      const sideWingDepth = 35 - (floorNum - 1) * 1;

      // Offset for upper floors (cantilever effect)
      const offsetX = floorNum >= 7 ? 2 + (floorNum - 6) * 0.8 : 0;

      // Create floor plate
      this.createFloorPlate(floorY, mainWingWidth, mainWingDepth, sideWingWidth, sideWingDepth, offsetX);

      // Create walls
      this.createWalls(floorY, mainWingWidth, mainWingDepth, sideWingWidth, sideWingDepth, offsetX, floorNum);
    }
  }

  private createFloorPlate(
    y: number,
    mainWidth: number,
    mainDepth: number,
    sideWidth: number,
    sideDepth: number,
    offsetX: number
  ): void {
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.8,
      metalness: 0.2,
      transparent: true,
      opacity: 0.3
    });

    // Main wing floor (horizontal)
    const mainFloorGeometry = new THREE.BoxGeometry(mainWidth, 0.2, mainDepth);
    const mainFloor = new THREE.Mesh(mainFloorGeometry, floorMaterial);
    mainFloor.position.set(offsetX, y, 0);
    mainFloor.receiveShadow = true;
    this.group.add(mainFloor);

    // Side wing floor (vertical, extends south from west end)
    const sideFloorGeometry = new THREE.BoxGeometry(sideWidth, 0.2, sideDepth);
    const sideFloor = new THREE.Mesh(sideFloorGeometry, floorMaterial);
    sideFloor.position.set(
      -mainWidth / 2 + sideWidth / 2 + offsetX,
      y,
      sideDepth / 2
    );
    sideFloor.receiveShadow = true;
    this.group.add(sideFloor);
  }

  private createWalls(
    y: number,
    mainWidth: number,
    mainDepth: number,
    sideWidth: number,
    sideDepth: number,
    offsetX: number,
    floorNum: number
  ): void {
    // Determine wall opacity based on floor (upper floors more transparent)
    const opacity = floorNum >= 7 ? 0.2 : 0.4;

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity,
      roughness: 0.3,
      metalness: 0.1
    });

    const wallHeight = this.floorHeight;

    // Main wing walls
    // North wall
    this.createWall(
      offsetX,
      y + wallHeight / 2,
      mainDepth / 2,
      mainWidth,
      wallHeight,
      this.wallThickness,
      wallMaterial
    );

    // South wall
    this.createWall(
      offsetX,
      y + wallHeight / 2,
      -mainDepth / 2,
      mainWidth,
      wallHeight,
      this.wallThickness,
      wallMaterial
    );

    // East wall
    this.createWall(
      mainWidth / 2 + offsetX,
      y + wallHeight / 2,
      0,
      this.wallThickness,
      wallHeight,
      mainDepth,
      wallMaterial
    );

    // West wall (partial - connects to side wing)
    this.createWall(
      -mainWidth / 2 + offsetX,
      y + wallHeight / 2,
      -mainDepth / 2,
      this.wallThickness,
      wallHeight,
      mainDepth / 2,
      wallMaterial
    );

    // Side wing walls
    const sideX = -mainWidth / 2 + sideWidth / 2 + offsetX;
    const sideZ = sideDepth / 2;

    // East wall (connects to main wing)
    this.createWall(
      sideX + sideWidth / 2,
      y + wallHeight / 2,
      sideZ,
      this.wallThickness,
      wallHeight,
      sideDepth,
      wallMaterial
    );

    // West wall
    this.createWall(
      sideX - sideWidth / 2,
      y + wallHeight / 2,
      sideZ,
      this.wallThickness,
      wallHeight,
      sideDepth,
      wallMaterial
    );

    // South wall
    this.createWall(
      sideX,
      y + wallHeight / 2,
      sideDepth,
      sideWidth,
      wallHeight,
      this.wallThickness,
      wallMaterial
    );
  }

  private createWall(
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    material: THREE.Material
  ): void {
    const wallGeometry = new THREE.BoxGeometry(width, height, depth);
    const wall = new THREE.Mesh(wallGeometry, material);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.group.add(wall);
  }

  /**
   * Get the Three.js group
   */
  getGroup(): THREE.Group {
    return this.group;
  }

  /**
   * Show only specific floors (for performance)
   */
  showFloors(minFloor: number, maxFloor: number): void {
    // Filter visible floors based on range
    // Could be implemented by tagging meshes with userData
    // For now, all floors are always visible in minimap
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
  }
}
