/**
 * GPS Trajectory Tracker
 * Tracks GPS position changes over time to calculate building coordinates,
 * heading, and speed using relative positioning from a demo start point.
 */

export interface GPSReading {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface BuildingPosition {
  x: number;
  y: number;
  z: number;
}

export interface GPSConfig {
  POSITION_HISTORY_SIZE: number;
  MIN_DISTANCE_FOR_MOVEMENT: number;
  HEADING_SMOOTHING_WINDOW: number;
  MAX_SPEED_THRESHOLD: number;
  BUILDING_BOUNDS: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
}

export class GPSTrajectoryTracker {
  private positionHistory: GPSReading[] = [];
  private referenceGPS: { latitude: number; longitude: number } | null = null;
  private buildingStartPosition: BuildingPosition = { x: 0, y: 0, z: 0 };
  private currentBuildingPosition: BuildingPosition | null = null;
  private lastHeading: number | null = null;
  private lastSpeed: number = 0;

  private config: GPSConfig = {
    POSITION_HISTORY_SIZE: 10,
    MIN_DISTANCE_FOR_MOVEMENT: 0.5, // meters
    HEADING_SMOOTHING_WINDOW: 3,
    MAX_SPEED_THRESHOLD: 5.0, // m/s - reject GPS jumps faster than this
    // L-shaped building bounds (Gates Building)
    // Main wing: 45m wide x 18m deep, Side wing: 15m wide x 35m deep
    BUILDING_BOUNDS: {
      minX: -25,
      maxX: 25,
      minZ: -10,
      maxZ: 35
    }
  };

  /**
   * Initialize tracker with demo starting position
   */
  initialize(startX: number, startY: number, startZ: number): void {
    this.buildingStartPosition = { x: startX, y: startY, z: startZ };
    this.currentBuildingPosition = { ...this.buildingStartPosition };
    console.log(`📍 GPS Tracker initialized at position (${startX}, ${startY}, ${startZ})`);
  }

  /**
   * Add new GPS reading and update position
   */
  addGPSReading(latitude: number, longitude: number, accuracy: number): void {
    const reading: GPSReading = {
      latitude,
      longitude,
      accuracy,
      timestamp: Date.now()
    };

    // Set reference GPS on first reading
    if (this.referenceGPS === null) {
      this.referenceGPS = { latitude, longitude };
      console.log(`📍 Reference GPS set: (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
      return;
    }

    // Add to history
    this.positionHistory.push(reading);

    // Keep only recent readings
    if (this.positionHistory.length > this.config.POSITION_HISTORY_SIZE) {
      this.positionHistory.shift();
    }

    // Update building position
    this.updateBuildingPosition(reading);

    // Calculate heading from trajectory
    this.updateHeading();

    // Calculate speed
    this.updateSpeed();
  }

  /**
   * Get current building position (relative to start)
   */
  getCurrentBuildingPosition(): BuildingPosition | null {
    return this.currentBuildingPosition;
  }

  /**
   * Get current heading from trajectory (degrees, 0-360, 0=North)
   */
  getHeading(): number | null {
    return this.lastHeading;
  }

  /**
   * Get current speed (m/s)
   */
  getSpeed(): number {
    return this.lastSpeed;
  }

  /**
   * Update building position based on GPS delta from reference
   */
  private updateBuildingPosition(reading: GPSReading): void {
    if (!this.referenceGPS) return;

    // Calculate distance and bearing from reference GPS
    const distance = this.haversineDistance(
      this.referenceGPS.latitude,
      this.referenceGPS.longitude,
      reading.latitude,
      reading.longitude
    );

    const bearing = this.calculateBearing(
      this.referenceGPS.latitude,
      this.referenceGPS.longitude,
      reading.latitude,
      reading.longitude
    );

    // Convert to building coordinate deltas
    const dx = distance * Math.sin(bearing * Math.PI / 180);
    const dz = distance * Math.cos(bearing * Math.PI / 180);

    // Calculate new building position
    let newX = this.buildingStartPosition.x + dx;
    let newZ = this.buildingStartPosition.z + dz;

    // Clamp to building bounds
    newX = Math.max(this.config.BUILDING_BOUNDS.minX, Math.min(this.config.BUILDING_BOUNDS.maxX, newX));
    newZ = Math.max(this.config.BUILDING_BOUNDS.minZ, Math.min(this.config.BUILDING_BOUNDS.maxZ, newZ));

    // Check for GPS jumps (speed too high)
    if (this.currentBuildingPosition) {
      const deltaX = newX - this.currentBuildingPosition.x;
      const deltaZ = newZ - this.currentBuildingPosition.z;
      const movementDistance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);

      if (this.positionHistory.length >= 2) {
        const timeDelta = (reading.timestamp - this.positionHistory[this.positionHistory.length - 2].timestamp) / 1000; // seconds
        const instantSpeed = movementDistance / timeDelta;

        if (instantSpeed > this.config.MAX_SPEED_THRESHOLD) {
          console.warn(`⚠️ GPS jump detected (${instantSpeed.toFixed(2)} m/s), ignoring reading`);
          return; // Reject this reading
        }
      }
    }

    // Update position
    this.currentBuildingPosition = {
      x: newX,
      y: this.buildingStartPosition.y, // Keep same floor
      z: newZ
    };
  }

  /**
   * Calculate heading from recent GPS trajectory
   */
  private updateHeading(): void {
    const windowSize = Math.min(this.config.HEADING_SMOOTHING_WINDOW, this.positionHistory.length);

    if (windowSize < 2) {
      return; // Need at least 2 points for heading
    }

    const recentReadings = this.positionHistory.slice(-windowSize);
    const bearings: number[] = [];

    // Calculate bearings between consecutive points
    for (let i = 0; i < recentReadings.length - 1; i++) {
      const bearing = this.calculateBearing(
        recentReadings[i].latitude,
        recentReadings[i].longitude,
        recentReadings[i + 1].latitude,
        recentReadings[i + 1].longitude
      );
      bearings.push(bearing);
    }

    if (bearings.length === 0) return;

    // Average bearings (handling circular nature of angles)
    const avgBearing = this.averageAngles(bearings);

    // Apply exponential moving average for smoothing
    if (this.lastHeading === null) {
      this.lastHeading = avgBearing;
    } else {
      const alpha = 0.3; // Smoothing factor
      this.lastHeading = this.lastHeading + alpha * this.angleDifference(avgBearing, this.lastHeading);

      // Normalize to 0-360
      if (this.lastHeading < 0) this.lastHeading += 360;
      if (this.lastHeading >= 360) this.lastHeading -= 360;
    }
  }

  /**
   * Calculate speed from recent GPS readings
   */
  private updateSpeed(): void {
    if (this.positionHistory.length < 2) {
      this.lastSpeed = 0;
      return;
    }

    // Use last 2 readings for speed
    const latest = this.positionHistory[this.positionHistory.length - 1];
    const previous = this.positionHistory[this.positionHistory.length - 2];

    const distance = this.haversineDistance(
      previous.latitude,
      previous.longitude,
      latest.latitude,
      latest.longitude
    );

    const timeDelta = (latest.timestamp - previous.timestamp) / 1000; // seconds

    if (timeDelta > 0) {
      const instantSpeed = distance / timeDelta;

      // Apply exponential moving average
      const alpha = 0.4;
      this.lastSpeed = this.lastSpeed + alpha * (instantSpeed - this.lastSpeed);
    }
  }

  /**
   * Haversine distance formula - calculates distance between two GPS coordinates in meters
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Calculate bearing between two GPS coordinates (0-360 degrees, 0=North)
   */
  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    const bearing = (θ * 180 / Math.PI + 360) % 360; // Normalize to 0-360

    return bearing;
  }

  /**
   * Average multiple angles (handling circular nature)
   */
  private averageAngles(angles: number[]): number {
    let sinSum = 0;
    let cosSum = 0;

    for (const angle of angles) {
      const rad = angle * Math.PI / 180;
      sinSum += Math.sin(rad);
      cosSum += Math.cos(rad);
    }

    const avgRad = Math.atan2(sinSum / angles.length, cosSum / angles.length);
    const avgDeg = (avgRad * 180 / Math.PI + 360) % 360;

    return avgDeg;
  }

  /**
   * Calculate shortest angular difference between two angles
   */
  private angleDifference(angle1: number, angle2: number): number {
    let diff = angle1 - angle2;

    // Normalize to -180 to 180
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;

    return diff;
  }

  /**
   * Reset tracker (useful for testing)
   */
  reset(): void {
    this.positionHistory = [];
    this.referenceGPS = null;
    this.currentBuildingPosition = { ...this.buildingStartPosition };
    this.lastHeading = null;
    this.lastSpeed = 0;
    console.log('📍 GPS Tracker reset');
  }
}
