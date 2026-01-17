# Three.js Building Model Generator

A TypeScript application that generates 3D transparent building models from SVG files using Three.js.

## Features

- **SVG Parsing**: Automatically parses SVG files and identifies building elements (walls, doors, stairs)
- **3D Extrusion**: Converts 2D SVG paths into 3D extruded meshes
- **Multi-Floor Support**: Manages multiple floors with automatic vertical offsetting
- **Localization**: SpatialLink service for tracking user position in 3D space
- **Interactive Controls**: OrbitControls for camera manipulation

## Installation

```bash
npm install
```

## Building

```bash
npm run build
```

## Development

```bash
# Watch mode for TypeScript compilation
npm run dev

# In another terminal, serve the application
npm run serve
```

Then open `http://localhost:8080` in your browser.

## Usage

1. Place your SVG file in the project directory
2. Update the path in `src/index.ts`:
   ```typescript
   app.loadSVG('./path/to/your/building.svg');
   ```
3. The application will automatically:
   - Parse the SVG
   - Identify elements by ID or class (wall, door, stair)
   - Extrude them with appropriate depths and opacities
   - Display them in a 3D scene

## SVG Requirements

Your SVG should have elements with IDs or classes containing:
- `wall` - for walls (extruded to 3.0 units, 40% opacity)
- `door` - for doors (extruded to 2.2 units, 60% opacity)
- `stair` - for stairs (extruded to 2.5 units, 50% opacity)

## API

### SpatialLink

Update user position:
```typescript
app.getSpatialLink().updateUserPose({ x: 0, y: 0, rotation: 0 });
```

### Building

Access building floors:
```typescript
const building = app.getBuilding();
const floor = building.getFloor(0);
```

## Architecture

- **types.ts**: TypeScript interfaces (`BuildingElement`, `Pose`)
- **Floor.ts**: Manages a single floor's building elements
- **Building.ts**: Manages multiple floors with vertical offsetting
- **SpatialLink.ts**: Handles user localization and pose updates
- **index.ts**: Main application with SVG loading and scene setup

