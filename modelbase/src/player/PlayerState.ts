// Player state management for fire safety simulator
// Tracks health, visibility, speed, and alive status internally

export interface PlayerState {
  health: number; // 0-100
  visibility: number; // 0-1 (1 = full visibility, 0 = blind)
  speed: number; // 0-1 (multiplier, 1 = normal speed)
  alive: boolean;
  position: [number, number, number];
  lastDamageTime: number;
  totalDamageTaken: number;
  timeInSmoke: number; // Cumulative time in smoke
  timeInFire: number; // Cumulative time in fire
}

export class PlayerStateManager {
  private state: PlayerState;

  constructor(initialPosition: [number, number, number]) {
    this.state = {
      health: 100,
      visibility: 1.0,
      speed: 1.0,
      alive: true,
      position: initialPosition,
      lastDamageTime: 0,
      totalDamageTaken: 0,
      timeInSmoke: 0,
      timeInFire: 0
    };
  }

  getState(): PlayerState {
    return { ...this.state };
  }

  updatePosition(position: [number, number, number]): void {
    this.state.position = position;
  }

  // Update player state based on environment
  updateFromEnvironment(
    isInFire: boolean,
    smokeLevel: number,
    deltaTime: number // in seconds
  ): void {
    if (!this.state.alive) return;

    const now = Date.now();

    // Fire damage: 10 damage per second when in fire
    if (isInFire) {
      this.state.timeInFire += deltaTime;
      const damage = 10 * deltaTime; // 10 damage per second
      this.state.health = Math.max(0, this.state.health - damage);
      this.state.totalDamageTaken += damage;
      this.state.lastDamageTime = now;

      // Death check
      if (this.state.health <= 0) {
        this.state.alive = false;
        this.state.health = 0;
      }
    }

    // Smoke effects: reduce visibility and speed, slow health drain
    if (smokeLevel > 0) {
      this.state.timeInSmoke += deltaTime;
      
      // Visibility decreases with smoke (0.5 = 50% smoke = 50% visibility)
      this.state.visibility = Math.max(0.1, 1.0 - (smokeLevel * 0.9));
      
      // Speed decreases with smoke (heavy smoke = slower movement)
      this.state.speed = Math.max(0.3, 1.0 - (smokeLevel * 0.7));
      
      // Health slowly decreases in heavy smoke (1 damage per second at max smoke)
      if (smokeLevel > 0.7) {
        const smokeDamage = (smokeLevel - 0.7) * 3.33 * deltaTime; // Up to 1 damage/sec at 1.0 smoke
        this.state.health = Math.max(0, this.state.health - smokeDamage);
        this.state.totalDamageTaken += smokeDamage;
        
        if (this.state.health <= 0) {
          this.state.alive = false;
          this.state.health = 0;
        }
      }
    } else {
      // Gradually recover visibility and speed when out of smoke
      this.state.visibility = Math.min(1.0, this.state.visibility + deltaTime * 0.5);
      this.state.speed = Math.min(1.0, this.state.speed + deltaTime * 0.5);
    }
  }

  // Get speed multiplier for movement calculations
  getSpeedMultiplier(): number {
    return this.state.alive ? this.state.speed : 0;
  }

  // Check if player is alive
  isAlive(): boolean {
    return this.state.alive && this.state.health > 0;
  }

  // Get health percentage
  getHealthPercentage(): number {
    return this.state.health / 100;
  }

  // Reset player state (for new scenario)
  reset(newPosition: [number, number, number]): void {
    this.state = {
      health: 100,
      visibility: 1.0,
      speed: 1.0,
      alive: true,
      position: newPosition,
      lastDamageTime: 0,
      totalDamageTaken: 0,
      timeInSmoke: 0,
      timeInFire: 0
    };
  }
}

