/**
 * ScenarioParser - Extracts location, floor, and hazard information from scenario text
 * Converts natural language descriptions into 3D positions
 */

export interface ParsedScenario {
  floor: number;
  location: string;
  hazards: HazardInfo[];
  playerPosition?: [number, number, number];
}

export interface HazardInfo {
  type: 'fire' | 'smoke' | 'blocked';
  direction: 'north' | 'south' | 'east' | 'west' | 'center';
  intensity: number;
  position: [number, number, number];
  description: string;
}

export class ScenarioParser {
  private floorHeight = 3.5;

  /**
   * Parse scenario text to extract location and hazard information
   */
  parseScenarioText(text: string, defaultFloor: number = 6): ParsedScenario {
    const floor = this.extractFloor(text, defaultFloor);
    const location = this.extractLocation(text);
    const hazards = this.extractHazards(text, floor);
    const playerPosition = this.getPlayerPosition(floor, location);

    return {
      floor,
      location,
      hazards,
      playerPosition
    };
  }

  /**
   * Extract floor number from text
   * Examples: "floor 6", "5th floor", "on floor 5"
   */
  private extractFloor(text: string, defaultFloor: number): number {
    const floorPatterns = [
      /floor (\d+)/i,
      /(\d+)(?:st|nd|rd|th) floor/i,
      /level (\d+)/i
    ];

    for (const pattern of floorPatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    return defaultFloor;
  }

  /**
   * Extract location description
   * Examples: "main hallway", "stairwell", "corridor"
   */
  private extractLocation(text: string): string {
    const locationPatterns = [
      /(?:in|at) the ([a-z\s]+(?:hallway|corridor|stairwell|stairs|wing|room))/i,
      /(main hallway)/i,
      /(stairwell)/i,
      /(ground floor)/i
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return 'unknown';
  }

  /**
   * Extract hazards from text
   * Examples: "flames at the east end", "smoke from the west", "fire in the north corridor"
   */
  private extractHazards(text: string, floor: number): HazardInfo[] {
    const hazards: HazardInfo[] = [];
    const lowerText = text.toLowerCase();

    // Pattern: fire/flames + direction
    const firePatterns = [
      /fire.*?(north|south|east|west)/i,
      /flames?.*?(north|south|east|west)/i,
      /(north|south|east|west).*?fire/i,
      /(north|south|east|west).*?flames?/i
    ];

    // Pattern: smoke + direction
    const smokePatterns = [
      /smoke.*?(north|south|east|west)/i,
      /(north|south|east|west).*?smoke/i,
      /smoke.*?(?:from|in|at).*?(north|south|east|west)/i
    ];

    // Check for fire hazards
    for (const pattern of firePatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        const direction = match[1].toLowerCase() as 'north' | 'south' | 'east' | 'west';
        const position = this.getHazardPosition(floor, direction, 'fire');
        hazards.push({
          type: 'fire',
          direction,
          intensity: 1.0,
          position,
          description: `Fire at ${direction} end`
        });
        break; // Only add one fire per pattern type
      }
    }

    // Check for smoke hazards
    for (const pattern of smokePatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        const direction = match[1].toLowerCase() as 'north' | 'south' | 'east' | 'west';
        const position = this.getHazardPosition(floor, direction, 'smoke');
        hazards.push({
          type: 'smoke',
          direction,
          intensity: 0.7,
          position,
          description: `Smoke from ${direction}`
        });
        break;
      }
    }

    // Check for "visible" or "coming from" without explicit direction
    if (lowerText.includes('smoke is visible') || lowerText.includes('smoke') && hazards.length === 0) {
      hazards.push({
        type: 'smoke',
        direction: 'center',
        intensity: 0.5,
        position: this.getHazardPosition(floor, 'center', 'smoke'),
        description: 'Smoke visible'
      });
    }

    return hazards;
  }

  /**
   * Get 3D position for hazard based on floor and direction
   * Building coordinate system:
   * - X axis: East (+) / West (-)
   * - Y axis: Up (+) / Down (-)
   * - Z axis: North (+) / South (-)
   */
  private getHazardPosition(
    floor: number,
    direction: 'north' | 'south' | 'east' | 'west' | 'center',
    hazardType: 'fire' | 'smoke'
  ): [number, number, number] {
    const yPos = floor * this.floorHeight;

    // Gates Building dimensions (approximate from GatesBuilding.tsx)
    const mainWingWidth = 45;
    const mainWingDepth = 18;

    switch (direction) {
      case 'east':
        return [mainWingWidth / 2 - 5, yPos, 0]; // East end of main wing
      case 'west':
        return [-mainWingWidth / 2 + 5, yPos, 0]; // West end of main wing
      case 'north':
        return [0, yPos, mainWingDepth / 2 - 3]; // North side
      case 'south':
        return [0, yPos, -mainWingDepth / 2 + 3]; // South side
      case 'center':
      default:
        return [0, yPos, 0]; // Center
    }
  }

  /**
   * Get player position based on floor and location description
   */
  private getPlayerPosition(floor: number, location: string): [number, number, number] {
    const yPos = floor * this.floorHeight;

    if (location.includes('main hallway')) {
      return [0, yPos, 0]; // Center of main hallway
    } else if (location.includes('stairwell') || location.includes('stairs')) {
      return [-18, yPos, 0]; // West stairwell
    } else if (location.includes('ground floor')) {
      return [-18, 3.5, 0]; // Ground level at stairs
    } else {
      // Default center position
      return [0, yPos, 0];
    }
  }
}

// Export singleton instance
export const scenarioParser = new ScenarioParser();
