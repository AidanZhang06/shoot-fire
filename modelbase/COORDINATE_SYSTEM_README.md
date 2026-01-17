# Three.js Coordinate System - Quick Start

A complete coordinate system implementation for Three.js with visual debugging, local/global space transformations, and orientation-based character movement.

## What's Included

### 🎯 Components

- **`CoordinateSystem`** - Visual axes helper (Red=X, Green=Y, Blue=Z)
- **`OrientedCharacterController`** - Full keyboard-controlled character with local space movement
- **`CoordinateSystemExample`** - Complete interactive demo scene

### 🛠️ Utilities

- **`coordinateTransforms.ts`** - Complete set of coordinate transformation functions
- **`coordinate-usage-examples.ts`** - 12 practical usage examples

### 📚 Documentation

- **`COORDINATE_SYSTEM_GUIDE.md`** - Comprehensive guide with theory and best practices

## Quick Start (60 seconds)

### 1. Add Visual Axes to Your Scene

```tsx
import { CoordinateSystem } from './components/CoordinateSystem';

function MyScene() {
  return (
    <Canvas>
      {/* Shows Red (X), Green (Y), Blue (Z) axes */}
      <CoordinateSystem position={[0, 0, 0]} size={10} />

      {/* Your existing scene content */}
    </Canvas>
  );
}
```

**What you'll see:**
- Red line pointing RIGHT (+X)
- Green line pointing UP (+Y)
- Blue line pointing BACKWARD/toward camera (+Z)

### 2. Add Keyboard-Controlled Character

```tsx
import { OrientedCharacterController } from './components/OrientedCharacterController';

function Game() {
  return (
    <Canvas>
      <CoordinateSystem position={[0, 0, 0]} size={10} />

      <OrientedCharacterController
        position={[0, 0, 0]}
        enableKeyboard={true}
        showLocalAxes={true}
      />
    </Canvas>
  );
}
```

**Controls:**
- W/↑: Move Forward (local -Z direction)
- S/↓: Move Backward
- A/←: Rotate Left
- D/→: Rotate Right
- Q: Strafe Left
- E: Strafe Right

### 3. Use Coordinate Transforms in Your Code

```typescript
import { getForwardDirection, moveInDirection, LocalDirections } from './utils/coordinateTransforms';

// Get forward direction based on rotation
const forward = getForwardDirection(characterRotation);

// Move character forward in local space
const newPosition = moveInDirection(
  currentPosition,
  LocalDirections.FORWARD,
  distance,
  characterRotation
);
```

## Already Integrated in Your App

The coordinate system is already integrated into your main App.tsx:

1. **Click the "Show Axes" button** (top-left corner) to toggle visualization
2. You'll see:
   - **Large axes** at world origin [0, 0, 0]
   - **Small axes** following your character's position

## Three.js Coordinate Convention (Important!)

```
      Y (Up/Green)
      |
      |
      |______ X (Right/Red)
     /
    /
   Z (Backward/Blue - toward camera)
```

**Key Point:** In Three.js, **forward is -Z** (negative Z direction), not +Z!

## File Structure

```
src/
├── components/
│   ├── CoordinateSystem.tsx              ← Visual axes helper
│   ├── OrientedCharacterController.tsx   ← Character with local space movement
│   └── CoordinateSystemExample.tsx       ← Complete demo scene
├── utils/
│   └── coordinateTransforms.ts           ← Transform utilities
└── examples/
    └── coordinate-usage-examples.ts      ← 12 practical examples

COORDINATE_SYSTEM_GUIDE.md                ← Full documentation
COORDINATE_SYSTEM_README.md               ← This file
```

## Common Use Cases

### Move Character Forward

```typescript
import { getForwardDirection } from './utils/coordinateTransforms';

const forward = getForwardDirection(rotation);
position.add(forward.multiplyScalar(speed * deltaTime));
```

### Make Character Face a Target

```typescript
import { calculateLookAtRotation, rotateTowards } from './utils/coordinateTransforms';

const targetRotation = calculateLookAtRotation(characterPos, targetPos);
characterRotation = rotateTowards(characterRotation, targetRotation, 0.1);
```

### Check if Target is in Front

```typescript
import { example7_isTargetInFront } from './examples/coordinate-usage-examples';

const { inFront, angle } = example7_isTargetInFront(characterPos, characterRotation, targetPos);
if (inFront) {
  console.log('Target ahead at angle:', angle);
}
```

### Strafe (Move Sideways)

```typescript
import { moveInDirection, LocalDirections } from './utils/coordinateTransforms';

// Strafe left
newPos = moveInDirection(position, LocalDirections.LEFT, speed * deltaTime, rotation);

// Strafe right
newPos = moveInDirection(position, LocalDirections.RIGHT, speed * deltaTime, rotation);
```

## Testing Your Setup

### Test in Your Existing App

1. Run your app: `npm run dev`
2. Click "Show Axes" button in top-left
3. You should see:
   - Red (X) line pointing right
   - Green (Y) line pointing up
   - Blue (Z) line pointing toward you (backward)

### Test with Demo Scene

Create a test file:

```tsx
// src/TestCoordinates.tsx
import { CoordinateSystemExample } from './components/CoordinateSystemExample';

export function TestCoordinates() {
  return <CoordinateSystemExample />;
}
```

Update your router/entry to use `<TestCoordinates />` temporarily.

## Local vs Global Space Explained

### Global Space (World Space)
- **Fixed coordinate system** that never changes
- Position [5, 0, -3] is always at the same location in the world
- World axes are always Red (X), Green (Y), Blue (Z)

### Local Space (Object Space)
- **Rotates with the object**
- "Forward" changes as the object rotates
- Used for character-relative movement like "walk forward"

**Example:**

```typescript
// Character facing North (rotation = 0°)
LocalDirections.FORWARD (-Z) = World [0, 0, -1]

// Character facing East (rotation = -90°)
LocalDirections.FORWARD (-Z) = World [-1, 0, 0]

// Character facing South (rotation = 180°)
LocalDirections.FORWARD (-Z) = World [0, 0, 1]
```

## Available Functions

### Direction Vectors

```typescript
getForwardDirection(rotation)      // Returns -Z direction rotated
getRightDirection(rotation)         // Returns +X direction rotated
getUpDirection()                    // Always returns +Y
```

### Space Conversion

```typescript
localToWorldDirection(dir, rot)    // Convert local → world
worldToLocalDirection(dir, rot)    // Convert world → local
```

### Movement

```typescript
moveInDirection(pos, dir, dist, rot)  // Move in local space
calculateLookAtRotation(from, to)      // Rotation to face target
rotateTowards(current, target, speed)  // Smooth rotation
```

### Utility

```typescript
distance(pos1, pos2)                   // Distance between positions
approximatelyEqual(pos1, pos2, tol)    // Check if positions match
clampMagnitude(vector, maxLen)         // Limit vector length
projectToPlane(pos, y)                 // Project to horizontal plane
```

### Debug

```typescript
logCoordinates(label, pos, rot)        // Log to console
getObjectWorldDirection(object)        // Use Object3D method
```

## Examples

See `src/examples/coordinate-usage-examples.ts` for 12 complete examples:

1. Basic forward movement
2. WASD keyboard controls
3. Strafing (Q/E)
4. Look at target
5. Follow waypoint path
6. Mouse input to movement
7. Check if target is in front
8. Orbit around target
9. Velocity-based physics
10. Debug visualization
11. Using Object3D.getWorldDirection()
12. Complete character controller class

## Troubleshooting

### Axes not visible?
- Click the "Show Axes" button (top-left in your App)
- Check that `visible={true}` on CoordinateSystem component
- Make sure camera can see origin [0, 0, 0]

### Character moves wrong direction?
- Remember: Forward is **-Z** (negative Z), not +Z
- Use `getForwardDirection()` instead of manual math
- Enable `showLocalAxes={true}` to see orientation

### Movement is choppy?
- Multiply speed by `deltaTime` for frame-independent movement
- Use `rotateTowards()` for smooth rotation

### Can't tell which way character is facing?
- Enable `showLocalAxes={true}` on the character
- The small axes rotate with the character
- Blue line points "backward", opposite direction is forward

## Next Steps

1. **Read the full guide**: `COORDINATE_SYSTEM_GUIDE.md`
2. **Try the examples**: `src/examples/coordinate-usage-examples.ts`
3. **Test the demo**: `src/components/CoordinateSystemExample.tsx`
4. **Explore utilities**: `src/utils/coordinateTransforms.ts`

## Quick Reference Card

```typescript
// COORDINATE CONVENTION
+X = Right (Red)
+Y = Up (Green)
+Z = Backward/Toward Camera (Blue)
-Z = Forward/Away from Camera ⭐ THIS IS FORWARD!

// LOCAL DIRECTIONS
LocalDirections.FORWARD  = [0, 0, -1]  ← Most important!
LocalDirections.BACKWARD = [0, 0,  1]
LocalDirections.RIGHT    = [1, 0,  0]
LocalDirections.LEFT     = [-1, 0, 0]

// COMMON PATTERN: Move Forward
const forward = getForwardDirection(rotation);
position.add(forward.multiplyScalar(speed * deltaTime));

// COMMON PATTERN: Face Target
const targetRot = calculateLookAtRotation(pos, target);
rotation = rotateTowards(rotation, targetRot, 0.1);
```

## Support

- Full documentation: `COORDINATE_SYSTEM_GUIDE.md`
- Usage examples: `src/examples/coordinate-usage-examples.ts`
- Demo scene: `src/components/CoordinateSystemExample.tsx`
- Utility API: `src/utils/coordinateTransforms.ts`

---

**Pro Tip:** Always enable `showLocalAxes={true}` during development. It instantly shows you which direction your character is facing and prevents 90% of coordinate-related bugs!
