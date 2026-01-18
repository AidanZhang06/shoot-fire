/**
 * Mock Data Provider
 * Generates realistic test data for development and testing
 */

import { UserState, ExitInfo, GridCell } from '../types/schemas';

export class MockDataProvider {
  private readonly BUILDING_WIDTH = 50;  // 50m x 50m test building
  private readonly BUILDING_HEIGHT = 50;

  /**
   * Generate mock users distributed in building
   * @param count Number of users to generate (default: 10)
   */
  getMockUsers(count: number = 10): Map<string, UserState> {
    const users = new Map<string, UserState>();

    for (let i = 0; i < count; i++) {
      const userId = `mock-user-${i}`;
      users.set(userId, {
        id: userId,
        position: {
          x: Math.random() * this.BUILDING_WIDTH,
          y: Math.random() * this.BUILDING_HEIGHT,
          z: 0
        },
        heading: Math.random() * 360,
        viewingDirection: Math.random() * 360,
        speed: Math.random() * 1.5, // 0-1.5 m/s walking speed
        groupSize: 1,
        nearExit: false,
        inHighHazardZone: false
      });
    }

    return users;
  }

  /**
   * Generate mock exits based on L-shaped building geometry (Gates Building)
   * Main wing: 45m wide x 18m deep, centered at origin
   * Side wing: 15m wide x 35m deep, extending south from west end
   */
  getMockExits(): Map<string, ExitInfo> {
    const exits = new Map<string, ExitInfo>();

    // Exit 1: Main Entrance - East side of main wing (ground floor)
    exits.set('exit-main-entrance', {
      id: 'exit-main-entrance',
      position: { x: 22.5, y: 0, z: 0 }, // East wall center
      capacity: 40, // people per minute - main entrance has high capacity
      currentLoad: 0,
      status: 'clear',
      lastVerified: Date.now(),
      verificationSource: 'inference'
    });

    // Exit 2: North Emergency Exit - North side of main wing (ground floor)
    exits.set('exit-north', {
      id: 'exit-north',
      position: { x: 0, y: 0, z: -9 }, // North wall center
      capacity: 25,
      currentLoad: 0,
      status: 'clear',
      lastVerified: Date.now(),
      verificationSource: 'inference'
    });

    // Exit 3: South Emergency Exit - South end of side wing (ground floor)
    exits.set('exit-south', {
      id: 'exit-south',
      position: { x: -15, y: 0, z: 35 }, // South wall of side wing
      capacity: 25,
      currentLoad: 0,
      status: 'clear',
      lastVerified: Date.now(),
      verificationSource: 'inference'
    });

    // Exit 4: West Emergency Exit - West side of side wing (ground floor)
    exits.set('exit-west', {
      id: 'exit-west',
      position: { x: -22.5, y: 0, z: 17 }, // West wall center of side wing
      capacity: 20,
      currentLoad: 0,
      status: 'clear',
      lastVerified: Date.now(),
      verificationSource: 'inference'
    });

    return exits;
  }

  /**
   * Generate mock hazard grid with fire and smoke zones
   */
  getMockHazardGrid(): Map<string, GridCell> {
    const grid = new Map<string, GridCell>();

    // Fire zone: center-left area (15-25, 20-30)
    const fireEpicenter = { x: 20, y: 25 };

    for (let x = 10; x <= 30; x++) {
      for (let y = 15; y <= 35; y++) {
        const key = `${x}_${y}`;

        // Calculate distance from fire epicenter
        const distFromFire = Math.sqrt(
          Math.pow(x - fireEpicenter.x, 2) +
          Math.pow(y - fireEpicenter.y, 2)
        );

        // Fire intensity decreases with distance (max 5 at epicenter)
        const fireIntensity = Math.max(0, 5 - distFromFire / 2);

        // Smoke spreads wider than fire
        const smokeIntensity = Math.max(0, 5 - distFromFire / 3);

        const cell: GridCell = {
          obstacles: []
        };

        // Add fire if intensity > 0.5
        if (fireIntensity > 0.5) {
          cell.fire = {
            intensity: fireIntensity,
            lastSeen: Date.now(),
            confidence: 0.9 - (distFromFire * 0.05) // Confidence decreases with distance
          };
        }

        // Add smoke if intensity > 0.5
        if (smokeIntensity > 0.5) {
          cell.smoke = {
            intensity: smokeIntensity,
            lastSeen: Date.now(),
            confidence: 0.8 - (distFromFire * 0.04)
          };
        }

        // Only add cell to grid if it has hazards
        if (cell.fire || cell.smoke) {
          grid.set(key, cell);
        }
      }
    }

    // Add some random obstacles in other areas
    this.addRandomObstacles(grid, 10);

    return grid;
  }

  /**
   * Add random obstacles to the grid
   */
  private addRandomObstacles(grid: Map<string, GridCell>, count: number): void {
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * this.BUILDING_WIDTH);
      const y = Math.floor(Math.random() * this.BUILDING_HEIGHT);
      const key = `${x}_${y}`;

      const existingCell = grid.get(key);
      const obstacle = {
        type: ['debris', 'furniture', 'door'][Math.floor(Math.random() * 3)] as 'debris' | 'furniture' | 'door',
        severity: ['passable', 'difficult', 'impassable'][Math.floor(Math.random() * 3)] as 'passable' | 'difficult' | 'impassable',
        position: ['left', 'center', 'right'][Math.floor(Math.random() * 3)] as 'left' | 'center' | 'right',
        distance: ['immediate', 'near', 'far'][Math.floor(Math.random() * 3)] as 'immediate' | 'near' | 'far'
      };

      if (existingCell) {
        existingCell.obstacles.push(obstacle);
      } else {
        grid.set(key, {
          obstacles: [obstacle]
        });
      }
    }
  }

  /**
   * Get building dimensions
   */
  getBuildingDimensions(): { width: number; height: number } {
    return {
      width: this.BUILDING_WIDTH,
      height: this.BUILDING_HEIGHT
    };
  }

  /**
   * Update mock hazard grid to simulate fire growth
   * (Useful for testing dynamic scenarios)
   */
  simulateFireGrowth(grid: Map<string, GridCell>, elapsedSeconds: number): Map<string, GridCell> {
    const newGrid = new Map(grid);
    const growthRate = elapsedSeconds * 0.1; // Fire grows slowly

    for (const [key, cell] of grid.entries()) {
      if (cell.fire) {
        const newIntensity = Math.min(5, cell.fire.intensity + growthRate);
        const updatedCell = { ...cell };
        updatedCell.fire = {
          ...cell.fire,
          intensity: newIntensity
        };
        newGrid.set(key, updatedCell);
      }
    }

    return newGrid;
  }
}
