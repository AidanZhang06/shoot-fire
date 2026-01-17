# Three.js Coordinate System Implementation Guide

This guide explains the coordinate system implementation in this Three.js project, covering visualization, local vs. global space, and orientation-based movement.

## Table of Contents

1. [Three.js Coordinate Convention](#threejs-coordinate-convention)
2. [Visual Debugging with AxesHelper](#visual-debugging-with-axeshelper)
3. [Local vs. Global Space](#local-vs-global-space)
4. [Coordinate-Based Movement](#coordinate-based-movement)
5. [Orientation Tracking](#orientation-tracking)
6. [Usage Examples](#usage-examples)
7. [API Reference](#api-reference)

---

## Three.js Coordinate Convention

Three.js uses a **right-handed coordinate system**:

- **+X axis (Red)**: Points to the RIGHT
- **+Y axis (Green)**: Points UP
- **+Z axis (Blue)**: Points TOWARD the camera (Backward in game terms)
- **-Z axis**: Points AWAY from camera (Forward in game terms)

### Important Note

In most game engines, "forward" is +Z. In Three.js, **forward is -Z**. This is the most common source of confusion when working with character movement.

```
     Y (Green - Up)
     |
     |
     |_______ X (Red - Right)
    /
   /
  Z (Blue - Backward/Toward Camera)
```

---

## Visual Debugging with AxesHelper

### Using the CoordinateSystem Component

The `CoordinateSystem` component provides a visual representation of the axes:

```tsx
import { CoordinateSystem } from './components/CoordinateSystem';

function Scene() {
  return (
    <>
      {/* World axes at origin */}
      <CoordinateSystem position={[0, 0, 0]} size={10} />

      {/* Character axes (optional) */}
      <CoordinateSystem position={characterPosition} size={2} />
    </>
  );
}
```

### What the Colors Mean

- **Red Line (X-axis)**: Extends in the RIGHT direction
- **Green Line (Y-axis)**: Extends in the UP direction
- **Blue Line (Z-axis)**: Extends BACKWARD (toward camera)

When you see these axes on your character, you instantly know which way they're facing!

---

## Local vs. Global Space

### Global Space (World Space)

- **Fixed coordinate system** that never changes
- World axes always point in the same directions
- Position `[10, 5, -3]` is always at the same location

### Local Space (Object Space)

- **Rotates with the object**
- Local forward (-Z) changes direction as object rotates
- Used for character-relative movement

### Example

```typescript
// Character facing North (rotation = 0)
// Local Forward (-Z) = World -Z = [0, 0, -1]

// Character rotated 90° right (rotation = -π/2)
// Local Forward (-Z) = World -X = [-1, 0, 0]

// Character rotated 180° (rotation = π)
// Local Forward (-Z) = World +Z = [0, 0, 1]
```

### Why This Matters

When implementing character movement:

```typescript
// ❌ WRONG - Moves in world space (always north)
position.z -= speed;

// ✅ CORRECT - Moves in local space (forward relative to character)
const forward = getWorldDirection(characterRotation);
position.add(forward.multiplyScalar(speed));
```

---

## Coordinate-Based Movement

### Using Vector Math for Movement

The `OrientedCharacterController` implements proper coordinate-based movement:

```tsx
import { OrientedCharacterController } from './components/OrientedCharacterController';

function Scene() {
  return (
    <OrientedCharacterController
      position={[0, 0, 0]}
      rotation={0}
      enableKeyboard={true}
      speed={5}
      showLocalAxes={true}
    />
  );
}
```

### Movement Functions

The coordinate transform utilities provide helper functions:

```typescript
import {
  moveInDirection,
  LocalDirections,
  getForwardDirection,
  getRightDirection
} from './utils/coordinateTransforms';

// Move forward in local space
const newPosition = moveInDirection(
  currentPosition,
  LocalDirections.FORWARD,
  distance,
  characterRotation
);

// Get forward direction in world space
const forward = getForwardDirection(characterRotation);

// Get right direction for strafing
const right = getRightDirection(characterRotation);
```

---

## Orientation Tracking

### Using getWorldDirection()

Three.js provides a built-in method to get an object's forward direction:

```typescript
import { getObjectWorldDirection } from './utils/coordinateTransforms';

// Get the direction the object is facing
const forwardDir = getObjectWorldDirection(characterMesh);

// Move forward in that direction
characterMesh.position.add(forwardDir.multiplyScalar(speed * delta));
```

### Manual Calculation

You can also calculate it manually:

```typescript
import { getForwardDirection } from './utils/coordinateTransforms';

const forward = getForwardDirection(characterRotation); // rotation in radians
// Returns Vector3 pointing in character's forward direction
```

### Face Towards Target

To make a character look at a target:

```typescript
import { calculateLookAtRotation } from './utils/coordinateTransforms';

const targetRotation = calculateLookAtRotation(characterPosition, targetPosition);

// Smooth rotation
characterRotation = rotateTowards(characterRotation, targetRotation, 0.1);
```

---

## Usage Examples

### Example 1: Basic Setup with Axes

```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CoordinateSystem } from './components/CoordinateSystem';

function App() {
  return (
    <Canvas>
      {/* Show world axes */}
      <CoordinateSystem position={[0, 0, 0]} size={10} />

      {/* Your scene content */}
      <mesh>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>

      <OrbitControls />
    </Canvas>
  );
}
```

### Example 2: Character with Keyboard Control

```tsx
import { OrientedCharacterController } from './components/OrientedCharacterController';
import { CoordinateSystem } from './components/CoordinateSystem';

function Game() {
  return (
    <Canvas>
      {/* World axes */}
      <CoordinateSystem position={[0, 0, 0]} size={10} />

      {/* Character with local axes and keyboard control */}
      <OrientedCharacterController
        position={[0, 0, 0]}
        enableKeyboard={true}
        speed={5}
        showLocalAxes={true}
      />
    </Canvas>
  );
}
```

### Example 3: Custom Movement Logic

```typescript
import * as THREE from 'three';
import {
  moveInDirection,
  LocalDirections,
  getForwardDirection
} from './utils/coordinateTransforms';

function updateCharacter(
  position: THREE.Vector3,
  rotation: number,
  keys: Set<string>,
  deltaTime: number
) {
  const speed = 5;
  const rotSpeed = Math.PI; // 180° per second

  // Rotation
  if (keys.has('a')) rotation += rotSpeed * deltaTime;
  if (keys.has('d')) rotation -= rotSpeed * deltaTime;

  // Movement
  if (keys.has('w')) {
    position = moveInDirection(position, LocalDirections.FORWARD, speed * deltaTime, rotation);
  }
  if (keys.has('s')) {
    position = moveInDirection(position, LocalDirections.BACKWARD, speed * deltaTime, rotation);
  }
  if (keys.has('q')) {
    position = moveInDirection(position, LocalDirections.LEFT, speed * deltaTime, rotation);
  }
  if (keys.has('e')) {
    position = moveInDirection(position, LocalDirections.RIGHT, speed * deltaTime, rotation);
  }

  return { position, rotation };
}
```

### Example 4: Complete Demo Scene

See `src/components/CoordinateSystemExample.tsx` for a complete interactive demo with:

- World axes visualization
- Character with local axes
- Position and rotation display
- Keyboard controls
- Reference markers

---

## API Reference

### Components

#### `CoordinateSystem`

Visual axes helper component.

**Props:**

- `position?: [number, number, number]` - Position in world space (default: `[0, 0, 0]`)
- `size?: number` - Length of axis lines (default: `5`)
- `visible?: boolean` - Show/hide axes (default: `true`)

#### `OrientedCharacterController`

Character controller with orientation-based movement.

**Props:**

- `position: [number, number, number]` - Initial position
- `rotation?: number` - Initial Y-axis rotation in radians (default: `0`)
- `enableKeyboard?: boolean` - Enable keyboard controls (default: `true`)
- `speed?: number` - Movement speed (default: `5`)
- `rotationSpeed?: number` - Rotation speed in radians/sec (default: `π`)
- `showLocalAxes?: boolean` - Show character's local axes (default: `true`)
- `onPositionUpdate?: (pos, rot) => void` - Position update callback

### Utility Functions

See `src/utils/coordinateTransforms.ts` for complete API documentation:

- `localToWorldDirection(dir, rotation)` - Convert local to world direction
- `worldToLocalDirection(dir, rotation)` - Convert world to local direction
- `getForwardDirection(rotation)` - Get forward vector
- `getRightDirection(rotation)` - Get right vector
- `calculateLookAtRotation(from, to)` - Calculate rotation to face target
- `moveInDirection(pos, dir, dist, rot)` - Move in local direction
- `rotateTowards(current, target, speed)` - Smooth rotation
- `getObjectWorldDirection(object)` - Use Object3D.getWorldDirection()
- `LocalDirections` - Constant direction vectors (FORWARD, RIGHT, etc.)

---

## Best Practices

1. **Always use AxesHelper during development** - It prevents confusion about which way is "forward"

2. **Think in local space for movement** - Character controls should be relative to facing direction

3. **Use world space for positioning** - Absolute positions should use world coordinates

4. **Normalize direction vectors** - Before using them for movement calculations

5. **Use utility functions** - Don't manually calculate transformations

6. **Log coordinates while debugging** - Use `logCoordinates()` to track positions

7. **Test rotation at 0°, 90°, 180°, 270°** - These are the angles where bugs appear

---

## Troubleshooting

### Character moves in wrong direction

- Check if you're using -Z for forward (not +Z)
- Verify rotation is applied correctly
- Add local axes to visualize orientation

### Rotation is backwards

- Three.js uses counter-clockwise as positive
- Try negating your rotation value

### Movement stutters or jumps

- Use `deltaTime` for frame-independent movement
- Smooth rotation with `rotateTowards()`

### Can't see which way character is facing

- Enable `showLocalAxes={true}` on the character
- Add a visual "front" indicator to your model

---

## Additional Resources

- [Three.js Documentation - Coordinate Systems](https://threejs.org/docs/#manual/en/introduction/Coordinate-systems)
- [Object3D.getWorldDirection()](https://threejs.org/docs/#api/en/core/Object3D.getWorldDirection)
- [Vector3 API Reference](https://threejs.org/docs/#api/en/math/Vector3)

---

## Summary

The key to successful coordinate system implementation in Three.js:

1. **Visualize** - Always use AxesHelper to see orientation
2. **Understand** - Know that forward is -Z, not +Z
3. **Transform** - Convert between local and world space correctly
4. **Track** - Use `getWorldDirection()` for orientation
5. **Test** - Verify movement at different rotations

With these tools and concepts, you can confidently implement character movement, camera controls, and any other coordinate-dependent features in your Three.js application!
