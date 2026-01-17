import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { TextureLoader } from 'three';
import { Building } from './Building';
import { Floor } from './Floor';
import { BuildingElement } from './types';
import { SpatialLink } from './SpatialLink';

class BuildingApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private building: Building;
  private spatialLink: SpatialLink;

  constructor() {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e); // Dark background like reference

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);

    // Setup renderer
    const container = document.getElementById('canvas-container');
    if (!container) {
      throw new Error('Canvas container not found');
    }

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Setup controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Setup lighting - cool blue-white glow like reference
    const ambientLight = new THREE.AmbientLight(0x4444ff, 0.4); // Blue ambient
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 15, 5);
    this.scene.add(directionalLight);
    
    // Add additional spotlight for dramatic effect
    const spotLight = new THREE.SpotLight(0xffffff, 1.5);
    spotLight.position.set(0, 20, 0);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    this.scene.add(spotLight);

    // Initialize building and spatial link
    this.building = new Building();
    this.spatialLink = new SpatialLink();

    this.scene.add(this.building.getGroup());
    this.scene.add(this.spatialLink.getUserMesh());

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Start render loop
    this.animate();
  }

  /**
   * Load and parse SVG file
   */
  async loadSVG(url: string): Promise<void> {
    const loader = new SVGLoader();
    
    try {
      const data = await loader.loadAsync(url);
      
      // Create a floor for the SVG data
      const floor = this.building.addFloor();
      
      // Process each path in the SVG
      data.paths.forEach((path) => {
        const shapes = SVGLoader.createShapes(path);
        
        // Determine element type from path userData
        // SVGLoader stores the DOM node in userData.node
        const node = path.userData?.node;
        const nodeId = (node?.id || node?.getAttribute?.('id') || '').toLowerCase();
        const nodeClass = (node?.className?.baseVal || node?.className || node?.getAttribute?.('class') || '').toLowerCase();
        const identifier = (nodeId + ' ' + nodeClass);
        
        let elementType: 'wall' | 'door' | 'stair';
        let depth: number;
        let opacity: number;
        let color: THREE.Color;

        if (identifier.includes('wall')) {
          elementType = 'wall';
          depth = 3.0;
          opacity = 0.4;
          color = new THREE.Color(0x888888);
        } else if (identifier.includes('door')) {
          elementType = 'door';
          depth = 2.2;
          opacity = 0.6;
          color = new THREE.Color(0x8b4513); // Brown
        } else if (identifier.includes('stair')) {
          elementType = 'stair';
          depth = 2.5;
          opacity = 0.5;
          color = new THREE.Color(0x654321); // Dark brown
        } else {
          // Default to wall if no identifier found
          elementType = 'wall';
          depth = 3.0;
          opacity = 0.4;
          color = new THREE.Color(0x888888);
        }

        // Create extruded geometry for each shape
        shapes.forEach((shape) => {
          const extrudeSettings = {
            depth: depth,
            bevelEnabled: false,
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          
          // Rotate to align with XZ plane (SVG is in XY, Three.js uses XZ for ground)
          geometry.rotateX(-Math.PI / 2);
          
          // Center the geometry
          geometry.center();

          const material = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: opacity,
            side: THREE.DoubleSide,
          });

          const mesh = new THREE.Mesh(geometry, material);
          
          const element: BuildingElement = {
            mesh,
            type: elementType,
            depth,
            opacity,
          };

          floor.addElement(element);
        });
      });

      // Center the building
      this.centerBuilding();
      
      console.log('SVG loaded successfully');
    } catch (error) {
      console.error('Error loading SVG:', error);
    }
  }

  /**
   * Detect yellow pixels (walls and filled regions) in the floor plan image
   * Yellow typically has high red and green, low blue
   * Also detects orange/yellow-orange variations
   */
  private isYellowPixel(r: number, g: number, b: number): boolean {
    // More comprehensive yellow detection
    // Yellow: high red and green, low blue
    const brightness = (r + g + b) / 3;
    
    // Method 1: Classic yellow (high R+G, low B)
    if (r > 120 && g > 120 && b < 200 && (r + g) > (b * 1.5)) {
      return true;
    }
    
    // Method 2: Yellow-orange variations
    if (r > 150 && g > 100 && b < 150 && r > g) {
      return true;
    }
    
    // Method 3: Bright yellow (very high R+G, very low B)
    if (r > 200 && g > 200 && b < 100) {
      return true;
    }
    
    // Method 4: Darker yellow/amber
    if (r > 100 && g > 80 && b < 80 && brightness > 80) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Detect if a pixel is part of the building (not background)
   * Uses brightness threshold to find non-white building content
   */
  private isBuildingPixel(r: number, g: number, b: number): boolean {
    const brightness = (r + g + b) / 3;
    // Building pixels are darker than white background
    // Adjust threshold based on floor plan images
    return brightness < 220;
  }

  /**
   * Find the actual building outline by detecting edges and contours
   * Returns the bounding box of the building perimeter
   */
  private findBuildingOutline(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): { minX: number; maxX: number; minY: number; maxY: number } | null {
    // First pass: find all building pixels (non-background)
    const buildingPixels: Array<{x: number, y: number}> = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        if (this.isBuildingPixel(r, g, b)) {
          buildingPixels.push({x, y});
        }
      }
    }
    
    if (buildingPixels.length === 0) {
      return null;
    }
    
    // Find bounding box of all building pixels
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    buildingPixels.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    
    // Refine by finding the actual outer edge (not just bounding box)
    // Look for the outermost building pixels in each direction
    const edgeThreshold = 5; // Pixels - how far to look for edge
    
    // Find actual north edge (topmost building pixels)
    for (let y = minY; y < minY + edgeThreshold && y < height; y++) {
      for (let x = minX; x <= maxX; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        if (this.isBuildingPixel(r, g, b)) {
          minY = y;
          break;
        }
      }
    }
    
    // Find actual south edge (bottommost building pixels)
    for (let y = maxY; y > maxY - edgeThreshold && y >= 0; y--) {
      for (let x = minX; x <= maxX; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        if (this.isBuildingPixel(r, g, b)) {
          maxY = y;
          break;
        }
      }
    }
    
    // Find actual west edge (leftmost building pixels)
    for (let x = minX; x < minX + edgeThreshold && x < width; x++) {
      for (let y = minY; y <= maxY; y++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        if (this.isBuildingPixel(r, g, b)) {
          minX = x;
          break;
        }
      }
    }
    
    // Find actual east edge (rightmost building pixels)
    for (let x = maxX; x > maxX - edgeThreshold && x >= 0; x--) {
      for (let y = minY; y <= maxY; y++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        if (this.isBuildingPixel(r, g, b)) {
          maxX = x;
          break;
        }
      }
    }
    
    return { minX, maxX, minY, maxY };
  }

  /**
   * Process an image to create a complete rectangular floor with transparent walls
   * Detects the actual building outline (not yellow lines) and creates walls around it
   */
  private processImageToExtrudedGeometry(
    image: HTMLImageElement,
    floorWidth: number,
    floorHeight: number,
    floorIndex: number
  ): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    
    // Create a canvas to process the image
    const canvas = document.createElement('canvas');
    // Process at reasonable resolution for edge detection
    const processScale = 0.7; // 70% resolution for balance
    canvas.width = Math.floor(image.width * processScale);
    canvas.height = Math.floor(image.height * processScale);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return meshes;
    
    // Draw the image to canvas (scaled)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Find the actual building outline
    const outline = this.findBuildingOutline(data, canvas.width, canvas.height);
    
    if (!outline) {
      console.warn(`Floor ${floorIndex + 1}: No building outline detected`);
      return meshes;
    }
    
    // Scale factors to convert pixel coordinates to world coordinates
    const scaleX = floorWidth / canvas.width;
    const scaleY = floorHeight / canvas.height;
    
    // Add small padding to the outline
    const padding = 10; // pixels
    const minX = Math.max(0, outline.minX - padding);
    const maxX = Math.min(canvas.width, outline.maxX + padding);
    const minY = Math.max(0, outline.minY - padding);
    const maxY = Math.min(canvas.height, outline.maxY + padding);
    
    // Convert to world coordinates (centered)
    const buildingWidth = (maxX - minX) * scaleX;
    const buildingHeight = (maxY - minY) * scaleY;
    const centerX = ((minX + maxX) / 2 - canvas.width / 2) * scaleX;
    const centerZ = ((minY + maxY) / 2 - canvas.height / 2) * scaleY;
    
    console.log(`Floor ${floorIndex + 1}: Building outline ${buildingWidth.toFixed(2)} x ${buildingHeight.toFixed(2)}`);
    
    // Wall height in world units (each floor is 3.5 units tall)
    const wallHeight = 3.0;
    const wallThickness = 0.2; // Thinner walls for cleaner look
    
    // Create the outer rectangular walls (4 walls forming a complete rectangle)
    const walls = [
      // North wall (positive Z)
      {
        width: buildingWidth + wallThickness * 2,
        height: wallHeight,
        position: { x: centerX, y: 0, z: centerZ + buildingHeight / 2 },
        rotation: { x: 0, y: 0, z: 0 }
      },
      // South wall (negative Z)
      {
        width: buildingWidth + wallThickness * 2,
        height: wallHeight,
        position: { x: centerX, y: 0, z: centerZ - buildingHeight / 2 },
        rotation: { x: 0, y: 0, z: 0 }
      },
      // East wall (positive X)
      {
        width: buildingHeight + wallThickness * 2,
        height: wallHeight,
        position: { x: centerX + buildingWidth / 2, y: 0, z: centerZ },
        rotation: { x: 0, y: Math.PI / 2, z: 0 }
      },
      // West wall (negative X)
      {
        width: buildingHeight + wallThickness * 2,
        height: wallHeight,
        position: { x: centerX - buildingWidth / 2, y: 0, z: centerZ },
        rotation: { x: 0, y: Math.PI / 2, z: 0 }
      }
    ];
    
    // Create each wall
    walls.forEach(wall => {
      const shape = new THREE.Shape();
      shape.moveTo(-wall.width / 2, -wallThickness / 2);
      shape.lineTo(wall.width / 2, -wallThickness / 2);
      shape.lineTo(wall.width / 2, wallThickness / 2);
      shape.lineTo(-wall.width / 2, wallThickness / 2);
      shape.lineTo(-wall.width / 2, -wallThickness / 2);
      
      const extrudeSettings = {
        depth: wall.height,
        bevelEnabled: false,
      };
      
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(wall.position.x, 0, wall.position.z);
      
      if (wall.rotation.y !== 0) {
        geometry.rotateY(wall.rotation.y);
      }
      
      // Create transparent material with subtle glow
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xffffff),
        transparent: true,
        opacity: 0.3, // More transparent for glass-like effect
        side: THREE.DoubleSide,
        emissive: new THREE.Color(0x4444ff), // Subtle blue glow
        emissiveIntensity: 0.2,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      meshes.push(mesh);
    });
    
    // Create a floor plane to show the floor plan inside
    // Use full resolution canvas for the texture
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = image.width;
    fullCanvas.height = image.height;
    const fullCtx = fullCanvas.getContext('2d');
    if (fullCtx) {
      fullCtx.drawImage(image, 0, 0);
      const floorTexture = new THREE.CanvasTexture(fullCanvas);
      floorTexture.flipY = false;
      floorTexture.needsUpdate = true;
      
      const floorPlaneGeometry = new THREE.PlaneGeometry(buildingWidth, buildingHeight);
      const floorMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture,
        transparent: true,
        opacity: 0.5, // Semi-transparent so you can see the floor plan
        side: THREE.DoubleSide,
      });
      
      const floorPlane = new THREE.Mesh(floorPlaneGeometry, floorMaterial);
      floorPlane.rotation.x = -Math.PI / 2;
      floorPlane.position.set(centerX, 0.01, centerZ); // Slightly above ground
      
      meshes.push(floorPlane);
    }
    
    return meshes;
  }

  /**
   * Create a realistic college campus building with 3 floors, rooms, doors, and stairs
   */
  createCampusBuilding(): void {
    const buildingWidth = 40;  // Building width in units
    const buildingDepth = 30;  // Building depth in units
    const floorHeight = 3.5;   // Height of each floor
    const wallThickness = 0.3; // Wall thickness
    const numFloors = 3;
    
    // Create floors
    for (let floorIndex = 0; floorIndex < numFloors; floorIndex++) {
      const floor = this.building.addFloor();
      
      // Create outer walls for this floor
      this.createOuterWalls(floor, buildingWidth, buildingDepth, wallThickness, floorHeight);
      
      // Create interior rooms
      this.createInteriorRooms(floor, buildingWidth, buildingDepth, wallThickness, floorHeight, floorIndex);
      
      // Create stairs (only on floors 0 and 1, connecting to next floor)
      if (floorIndex < numFloors - 1) {
        this.createStairs(floor, buildingWidth, buildingDepth, floorHeight, floorIndex);
      }
    }
    
    // Center the building
    this.centerBuilding();
    
    console.log(`Created ${numFloors}-floor campus building`);
  }

  /**
   * Create outer walls for a floor
   */
  private createOuterWalls(
    floor: Floor,
    width: number,
    depth: number,
    wallThickness: number,
    wallHeight: number
  ): void {
    const walls = [
      // North wall
      { width: width + wallThickness * 2, position: { x: 0, z: depth / 2 }, rotation: 0 },
      // South wall
      { width: width + wallThickness * 2, position: { x: 0, z: -depth / 2 }, rotation: 0 },
      // East wall
      { width: depth + wallThickness * 2, position: { x: width / 2, z: 0 }, rotation: Math.PI / 2 },
      // West wall
      { width: depth + wallThickness * 2, position: { x: -width / 2, z: 0 }, rotation: Math.PI / 2 },
    ];
    
    walls.forEach(wall => {
      const shape = new THREE.Shape();
      shape.moveTo(-wall.width / 2, -wallThickness / 2);
      shape.lineTo(wall.width / 2, -wallThickness / 2);
      shape.lineTo(wall.width / 2, wallThickness / 2);
      shape.lineTo(-wall.width / 2, wallThickness / 2);
      shape.lineTo(-wall.width / 2, -wallThickness / 2);
      
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: wallHeight,
        bevelEnabled: false,
      });
      
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(wall.position.x, 0, wall.position.z);
      if (wall.rotation !== 0) {
        geometry.rotateY(wall.rotation);
      }
      
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xffffff),
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        emissive: new THREE.Color(0x4444ff),
        emissiveIntensity: 0.2,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      floor.addElement({
        mesh,
        type: 'wall',
        depth: wallHeight,
        opacity: 0.3,
      });
    });
  }

  /**
   * Create interior rooms with walls and doors
   */
  private createInteriorRooms(
    floor: Floor,
    buildingWidth: number,
    buildingDepth: number,
    wallThickness: number,
    wallHeight: number,
    floorIndex: number
  ): void {
    // Define room layout - 2x2 grid of rooms
    const roomsPerSide = 2;
    const roomWidth = (buildingWidth - wallThickness * (roomsPerSide + 1)) / roomsPerSide;
    const roomDepth = (buildingDepth - wallThickness * (roomsPerSide + 1)) / roomsPerSide;
    
    // Create interior walls
    for (let i = 1; i < roomsPerSide; i++) {
      // Vertical walls (dividing left/right)
      const vWallX = -buildingWidth / 2 + i * (buildingWidth / roomsPerSide);
      this.createInteriorWall(floor, buildingDepth, wallThickness, wallHeight, vWallX, 0, 0);
      
      // Horizontal walls (dividing front/back)
      const hWallZ = -buildingDepth / 2 + i * (buildingDepth / roomsPerSide);
      this.createInteriorWall(floor, buildingWidth, wallThickness, wallHeight, 0, hWallZ, Math.PI / 2);
    }
    
    // Create doors in interior walls
    const doorWidth = 1.2;
    const doorHeight = 2.5;
    
    // Door in vertical wall (center)
    this.createDoor(floor, doorWidth, doorHeight, wallThickness, 
      -buildingWidth / 2 + buildingWidth / roomsPerSide, 0, 0);
    
    // Door in horizontal wall (center)
    this.createDoor(floor, doorWidth, doorHeight, wallThickness,
      0, -buildingDepth / 2 + buildingDepth / roomsPerSide, Math.PI / 2);
    
    // Create exterior doors
    this.createDoor(floor, doorWidth, doorHeight, wallThickness,
      -buildingWidth / 2, 0, Math.PI / 2); // West entrance
    this.createDoor(floor, doorWidth, doorHeight, wallThickness,
      buildingWidth / 2, 0, Math.PI / 2); // East entrance
  }

  /**
   * Create an interior wall
   */
  private createInteriorWall(
    floor: Floor,
    length: number,
    thickness: number,
    height: number,
    x: number,
    z: number,
    rotation: number
  ): void {
    const shape = new THREE.Shape();
    shape.moveTo(-length / 2, -thickness / 2);
    shape.lineTo(length / 2, -thickness / 2);
    shape.lineTo(length / 2, thickness / 2);
    shape.lineTo(-length / 2, thickness / 2);
    shape.lineTo(-length / 2, -thickness / 2);
    
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
    });
    
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(x, 0, z);
    if (rotation !== 0) {
      geometry.rotateY(rotation);
    }
    
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(0x4444ff),
      emissiveIntensity: 0.15,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    floor.addElement({
      mesh,
      type: 'wall',
      depth: height,
      opacity: 0.3,
    });
  }

  /**
   * Create a door opening
   */
  private createDoor(
    floor: Floor,
    width: number,
    height: number,
    wallThickness: number,
    x: number,
    z: number,
    rotation: number
  ): void {
    // Create door frame
    const frameThickness = 0.1;
    const frameDepth = wallThickness + 0.1;
    
    // Top frame
    const topFrameShape = new THREE.Shape();
    topFrameShape.moveTo(-width / 2 - frameThickness, -frameDepth / 2);
    topFrameShape.lineTo(width / 2 + frameThickness, -frameDepth / 2);
    topFrameShape.lineTo(width / 2 + frameThickness, frameDepth / 2);
    topFrameShape.lineTo(-width / 2 - frameThickness, frameDepth / 2);
    topFrameShape.lineTo(-width / 2 - frameThickness, -frameDepth / 2);
    
    const topFrameGeometry = new THREE.ExtrudeGeometry(topFrameShape, {
      depth: frameThickness,
      bevelEnabled: false,
    });
    
    topFrameGeometry.rotateX(-Math.PI / 2);
    topFrameGeometry.translate(x, height, z);
    if (rotation !== 0) {
      topFrameGeometry.rotateY(rotation);
    }
    
    // Side frames
    const sideFrameWidth = frameThickness;
    const sideFrameHeight = height;
    
    // Left side frame
    const leftFrameShape = new THREE.Shape();
    leftFrameShape.moveTo(-sideFrameWidth / 2, -frameDepth / 2);
    leftFrameShape.lineTo(sideFrameWidth / 2, -frameDepth / 2);
    leftFrameShape.lineTo(sideFrameWidth / 2, frameDepth / 2);
    leftFrameShape.lineTo(-sideFrameWidth / 2, frameDepth / 2);
    leftFrameShape.lineTo(-sideFrameWidth / 2, -frameDepth / 2);
    
    const leftFrameGeometry = new THREE.ExtrudeGeometry(leftFrameShape, {
      depth: sideFrameHeight,
      bevelEnabled: false,
    });
    
    leftFrameGeometry.rotateX(-Math.PI / 2);
    leftFrameGeometry.translate(x - width / 2 - frameThickness / 2, sideFrameHeight / 2, z);
    if (rotation !== 0) {
      leftFrameGeometry.rotateY(rotation);
    }
    
    // Right side frame
    const rightFrameGeometry = leftFrameGeometry.clone();
    rightFrameGeometry.translate(width + frameThickness, 0, 0);
    
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x8b4513), // Brown door
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    
    const topFrame = new THREE.Mesh(topFrameGeometry, doorMaterial);
    const leftFrame = new THREE.Mesh(leftFrameGeometry, doorMaterial);
    const rightFrame = new THREE.Mesh(rightFrameGeometry, doorMaterial);
    
    floor.addElement({ mesh: topFrame, type: 'door', depth: frameThickness, opacity: 0.8 });
    floor.addElement({ mesh: leftFrame, type: 'door', depth: sideFrameHeight, opacity: 0.8 });
    floor.addElement({ mesh: rightFrame, type: 'door', depth: sideFrameHeight, opacity: 0.8 });
  }

  /**
   * Create stairs connecting floors
   */
  private createStairs(
    floor: Floor,
    buildingWidth: number,
    buildingDepth: number,
    floorHeight: number,
    floorIndex: number
  ): void {
    const stairWidth = 2.0;
    const stairDepth = 3.0;
    const numSteps = 10;
    const stepHeight = floorHeight / numSteps;
    const stepDepth = stairDepth / numSteps;
    
    // Position stairs in corner
    const stairX = buildingWidth / 2 - stairWidth / 2 - 2;
    const stairZ = buildingDepth / 2 - stairDepth / 2 - 2;
    
    for (let i = 0; i < numSteps; i++) {
      const stepShape = new THREE.Shape();
      stepShape.moveTo(-stairWidth / 2, 0);
      stepShape.lineTo(stairWidth / 2, 0);
      stepShape.lineTo(stairWidth / 2, stepDepth);
      stepShape.lineTo(-stairWidth / 2, stepDepth);
      stepShape.lineTo(-stairWidth / 2, 0);
      
      const stepGeometry = new THREE.ExtrudeGeometry(stepShape, {
        depth: stepHeight,
        bevelEnabled: false,
      });
      
      stepGeometry.rotateX(-Math.PI / 2);
      stepGeometry.translate(stairX, stepHeight * i, stairZ - stepDepth * i);
      
      const stepMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x654321), // Dark brown for stairs
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      
      const stepMesh = new THREE.Mesh(stepGeometry, stepMaterial);
      floor.addElement({
        mesh: stepMesh,
        type: 'stair',
        depth: stepHeight,
        opacity: 0.7,
      });
    }
  }

  /**
   * Center the building in the scene
   */
  private centerBuilding(): void {
    const box = new THREE.Box3().setFromObject(this.building.getGroup());
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center the building
    this.building.getGroup().position.sub(center);

    // Adjust camera to view the entire building
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5; // Add some padding

    this.camera.position.set(cameraZ, cameraZ, cameraZ);
    this.camera.lookAt(0, 0, 0);
    this.controls.update();
  }

  /**
   * Handle window resize
   */
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Animation loop
   */
  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Get the SpatialLink instance for external pose updates
   */
  getSpatialLink(): SpatialLink {
    return this.spatialLink;
  }

  /**
   * Get the Building instance
   */
  getBuilding(): Building {
    return this.building;
  }
}

// Initialize the application
const app = new BuildingApp();

// Create the campus building
app.createCampusBuilding();

// Example: Load an SVG file (you can change this path)
// app.loadSVG('./path/to/your/building.svg');

// Example: Update user pose (for testing)
// app.getSpatialLink().updateUserPose({ x: 0, y: 0, rotation: 0 });

// Export for use in other modules if needed
export { BuildingApp };

