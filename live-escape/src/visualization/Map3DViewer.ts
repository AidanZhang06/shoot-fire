/**
 * 3D Map Viewer for Emergency Evacuation
 * Displays building model, user location, and evacuation routes in 3D
 */

import * as THREE from 'three';
import { BuildingModel } from './BuildingModel';
import { UserMarker } from './UserMarker';
import { PathRenderer } from './PathRenderer';
import { HazardRenderer } from './HazardRenderer';
import { ExitMarkerRenderer } from './ExitMarkerRenderer';
import { Vector3, Route, HazardWarning } from '../types/schemas';

export interface Map3DViewerConfig {
  container: HTMLElement;
  buildingDimensions: { width: number; height: number };
  floorHeight?: number;
}

export class Map3DViewer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private buildingModel: BuildingModel;
  private userMarker: UserMarker;
  private pathRenderer: PathRenderer;
  private hazardRenderer: HazardRenderer;
  private exitRenderer: ExitMarkerRenderer;

  private container: HTMLElement;
  private animationFrameId?: number;
  private isRunning = false;
  private lastFrameTime = 0;
  private readonly TARGET_FPS = 30; // Performance optimization for minimap

  // Interactive controls state
  private controls: any | null = null; // OrbitControls instance
  private autoFollowEnabled = true;
  private routeVisible = true;
  private exitsVisible = true;
  private lastUserPosition: THREE.Vector3 | null = null;

  constructor(config: Map3DViewerConfig) {
    this.container = config.container;

    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);
    this.scene.fog = new THREE.Fog(0x1a1a1a, 50, 200);

    // Setup camera - bird's eye isometric view
    const aspect = config.container.clientWidth / config.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 80, 50); // Higher up, better bird's eye view
    this.camera.lookAt(0, 0, 0);

    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(config.container.clientWidth, config.container.clientHeight);
    this.renderer.setPixelRatio(1); // Fixed pixel ratio for performance
    this.renderer.shadowMap.enabled = false; // Disabled for minimap performance
    config.container.appendChild(this.renderer.domElement);

    // Setup lighting
    this.setupLighting();

    // Initialize building model
    this.buildingModel = new BuildingModel(
      config.buildingDimensions,
      config.floorHeight || 3.5
    );
    this.scene.add(this.buildingModel.getGroup());

    // Initialize user marker
    this.userMarker = new UserMarker();
    this.scene.add(this.userMarker.getGroup());

    // Initialize path renderer
    this.pathRenderer = new PathRenderer();
    this.scene.add(this.pathRenderer.getGroup());

    // Initialize hazard renderer
    this.hazardRenderer = new HazardRenderer();
    this.scene.add(this.hazardRenderer.getGroup());

    // Initialize exit marker renderer
    this.exitRenderer = new ExitMarkerRenderer();
    this.scene.add(this.exitRenderer.getGroup());

    // Handle window resize
    window.addEventListener('resize', this.handleResize);
  }

  private setupLighting(): void {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x6666ff, 0.4);
    this.scene.add(ambientLight);

    // Main directional light (sun)
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(50, 100, 50);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 500;
    mainLight.shadow.camera.left = -100;
    mainLight.shadow.camera.right = 100;
    mainLight.shadow.camera.top = 100;
    mainLight.shadow.camera.bottom = -100;
    this.scene.add(mainLight);

    // Fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0x88ccff, 0.3);
    fillLight.position.set(-50, 50, -30);
    this.scene.add(fillLight);

    // Emergency lighting (red tint)
    const emergencyLight = new THREE.PointLight(0xff4444, 0.5, 100);
    emergencyLight.position.set(0, 30, 0);
    this.scene.add(emergencyLight);
  }

  /**
   * Update user position on the map
   */
  updateUserPosition(position: Vector3): void {
    this.userMarker.updatePosition(position);
    this.lastUserPosition = new THREE.Vector3(position.x, position.y, position.z);
    // Camera following now handled in animate() loop
  }

  /**
   * Update evacuation route visualization
   */
  updateRoute(route: Route | null): void {
    if (route) {
      this.pathRenderer.updatePath(route.waypoints);
    } else {
      this.pathRenderer.clearPath();
    }
  }

  /**
   * Add hazard visualization at a location
   */
  addHazard(position: Vector3, type: 'fire' | 'smoke' | 'water', intensity: number): void {
    switch (type) {
      case 'fire':
        this.hazardRenderer.addFireHazard(position, intensity);
        break;
      case 'smoke':
        this.hazardRenderer.addSmokeHazard(position, intensity);
        break;
      case 'water':
        this.hazardRenderer.addWaterHazard(position, intensity);
        break;
    }
  }

  /**
   * Clear all hazard markers
   */
  clearHazards(): void {
    this.hazardRenderer.clearAll();
  }

  /**
   * Add or update exit marker
   */
  addExitMarker(position: Vector3, exitId: string, status: 'clear' | 'crowded' | 'blocked' = 'clear'): void {
    this.exitRenderer.addExit(exitId, position, status);
  }

  /**
   * Update exit status
   */
  updateExitStatus(exitId: string, status: 'clear' | 'crowded' | 'blocked'): void {
    this.exitRenderer.updateExitStatus(exitId, status);
  }

  /**
   * Remove exit marker
   */
  removeExitMarker(exitId: string): void {
    this.exitRenderer.removeExit(exitId);
  }

  /**
   * Clear all exit markers
   */
  clearExitMarkers(): void {
    this.exitRenderer.clearAll();
  }

  /**
   * Initialize OrbitControls for manual camera control
   */
  initializeControls(OrbitControlsClass: any): void {
    if (this.controls) {
      this.controls.dispose();
    }

    this.controls = new OrbitControlsClass(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 150;
    this.controls.maxPolarAngle = Math.PI / 2.5; // Don't go below ground
    this.controls.target.set(0, 0, 0);
    this.controls.enabled = false; // Start disabled (auto-follow active by default)

    console.log('[Map3DViewer] OrbitControls initialized');
  }

  /**
   * Set auto-follow camera mode
   */
  setAutoFollow(enabled: boolean): void {
    this.autoFollowEnabled = enabled;
    if (this.controls) {
      this.controls.enabled = !enabled;
    }
  }

  /**
   * Get auto-follow camera mode state
   */
  getAutoFollow(): boolean {
    return this.autoFollowEnabled;
  }

  /**
   * Set route path visibility
   */
  setRouteVisible(visible: boolean): void {
    this.routeVisible = visible;
    this.pathRenderer.getGroup().visible = visible;
  }

  /**
   * Get route path visibility state
   */
  getRouteVisible(): boolean {
    return this.routeVisible;
  }

  /**
   * Set exit markers visibility
   */
  setExitsVisible(visible: boolean): void {
    this.exitsVisible = visible;
    this.exitRenderer.getGroup().visible = visible;
  }

  /**
   * Get exit markers visibility state
   */
  getExitsVisible(): boolean {
    return this.exitsVisible;
  }

  /**
   * Start rendering loop
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.animate();
    console.log('[Map3DViewer] Started rendering');
  }

  /**
   * Stop rendering loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    console.log('[Map3DViewer] Stopped rendering');
  }

  /**
   * Animation loop with FPS limiting
   */
  private animate = (): void => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    // FPS limiting for performance
    const now = performance.now();
    const delta = now - this.lastFrameTime;

    if (delta < 1000 / this.TARGET_FPS) {
      return; // Skip this frame
    }

    this.lastFrameTime = now;
    const deltaTime = delta / 1000; // Convert to seconds

    // Handle camera controls - dual mode (auto-follow vs manual)
    if (this.autoFollowEnabled && this.lastUserPosition) {
      // Auto-follow mode: disable controls, use lerp-based following
      if (this.controls) {
        this.controls.enabled = false;
      }

      // Smoothly follow user
      const targetX = this.lastUserPosition.x;
      const targetY = this.lastUserPosition.y + 20;
      const targetZ = this.lastUserPosition.z + 30;

      this.camera.position.lerp(
        new THREE.Vector3(targetX, targetY, targetZ),
        0.05
      );
      this.camera.lookAt(
        this.lastUserPosition.x,
        this.lastUserPosition.y,
        this.lastUserPosition.z
      );

      // Update controls target for smooth transition when switching modes
      if (this.controls) {
        this.controls.target.copy(this.lastUserPosition);
      }
    } else if (this.controls) {
      // Manual control mode: enable OrbitControls
      this.controls.enabled = true;
      this.controls.update();
    }

    // Update all animations
    this.userMarker.update(deltaTime);
    this.hazardRenderer.update(deltaTime);

    // Conditional rendering based on visibility flags
    if (this.routeVisible) {
      this.pathRenderer.update(deltaTime);
    }
    if (this.exitsVisible) {
      this.exitRenderer.update(deltaTime);
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Handle window resize
   */
  private handleResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);

    // Dispose of OrbitControls
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    // Dispose of Three.js resources
    this.buildingModel.dispose();
    this.userMarker.dispose();
    this.pathRenderer.dispose();
    this.hazardRenderer.dispose();
    this.exitRenderer.dispose();

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }

    console.log('[Map3DViewer] Disposed');
  }
}
