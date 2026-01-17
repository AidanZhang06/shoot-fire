# Coordinate Axes on Green Character - Quick Guide

## ✅ What Was Done

The coordinate axes are now **directly attached to the bottom of the green character** (at their feet). When you enable them, you'll see three colored lines coming out of the character's base.

## 🎮 How to Use

1. **Run your app:**
   ```bash
   npm run dev
   ```

2. **Click "Show Coordinate Axes" button** (top-left corner)

3. **Look at the green character** - you should see three colored lines at their feet:

```
        Green Character (Green Dot Person)
              🟢
             /|\
            / | \
           /  |  \
          /   |   \
         🦵  👕  🦵
        /     |     \
       /      |      \
    🔴━━━━━━🟡━━━━━━━ (feet/bottom)
             /
            /
           🔵

🔴 Red line   = +X axis (points RIGHT)
🟢 Green line = +Y axis (points UP)
🔵 Blue line  = +Z axis (points BACKWARD/toward camera)
🟡 Yellow dot = origin point (character's feet position)
```

## 🎯 What You'll See

When axes are ON:
- **Red line** extends to the right of the character (X-axis)
- **Green line** extends upward from the character (Y-axis)
- **Blue line** extends toward the camera from character (Z-axis)
- Lines are about **3 units long** each
- They're **right at the character's feet** (bottom of the model)

## 📍 Important: Understanding Directions

- **Forward** (in game terms) = **-Z direction** (opposite of blue line!)
- **Backward** = +Z direction (same as blue line)
- **Right** = +X direction (same as red line)
- **Left** = -X direction (opposite of red line)
- **Up** = +Y direction (same as green line)
- **Down** = -Y direction (opposite of green line)

## 🔍 Troubleshooting

### "I don't see the axes"

**Check these:**

1. ✅ **Is the button pressed?**
   - Should say "✓ Axes ON (at green character feet)"
   - Legend box should appear below button

2. ✅ **Can you see the green character?**
   - If no character, the axes won't show either
   - Navigate camera to find your character first

3. ✅ **Are you zoomed in enough?**
   - The axes are only 3 units long
   - Zoom in on the character to see them clearly

4. ✅ **Check the console (F12):**
   - Should see: `🎯 Coordinate Axes: VISIBLE`
   - And instructions about what to look for

### "Axes are too small"

You can increase the size. In `src/components/CharacterController.tsx` line 28:

```tsx
// Change from:
const axesHelper = useMemo(() => new THREE.AxesHelper(3), []);

// To larger size:
const axesHelper = useMemo(() => new THREE.AxesHelper(5), []); // or 10
```

### "I want axes at other locations too"

In `src/App.tsx` around line 346-358, uncomment these lines:

```tsx
{/* Uncomment this to add world origin axes at [0,0,0] */}
<CoordinateSystem position={[0, 0, 0]} size={30} visible={true} />

{/* Uncomment this to add floor-level axes */}
{playerPosition && (
  <CoordinateSystem
    position={[0, playerPosition[1], 0]}
    size={20}
    visible={true}
  />
)}
```

## 💡 Why This is Useful

**Local Space Movement:**
When you implement character movement, you want them to move "forward" relative to where they're facing, not relative to the world grid.

The axes show you:
- Which way the character is facing (look at the axis orientation)
- How coordinates change as character rotates
- The relationship between local and world space

**Example:**
```typescript
// Without coordinate system - confusing!
// Is this moving forward or sideways?
position.x += 1;

// With coordinate system - clear!
// Move in local forward direction (-Z)
const forward = getForwardDirection(characterRotation);
position.add(forward.multiplyScalar(speed));
```

## 🎓 Using the Coordinate System

Now that you can see the axes on your character, you can use the utilities:

```typescript
import { getForwardDirection, moveInDirection, LocalDirections }
  from './utils/coordinateTransforms';

// Get which way character is facing
const forward = getForwardDirection(characterRotation);

// Move character forward (in the direction they're facing)
const newPos = moveInDirection(
  currentPosition,
  LocalDirections.FORWARD,  // This is -Z
  speed * deltaTime,
  characterRotation
);
```

## 📚 More Resources

- **Full guide:** `COORDINATE_SYSTEM_GUIDE.md`
- **Testing help:** `HOW_TO_TEST_COORDINATES.md`
- **Code examples:** `src/examples/coordinate-usage-examples.ts`
- **Test scene:** `src/TestAxes.tsx`
- **Utilities:** `src/utils/coordinateTransforms.ts`

## 🎨 Visual Quick Test

To quickly verify it's working:

1. Click "Show Coordinate Axes"
2. Zoom in on green character
3. Rotate camera around character
4. You should see colored lines staying attached to character's feet
5. As you rotate view, the lines show X/Y/Z directions from character's position

If you see the three colored lines (red, green, blue) coming from the character's feet, **it's working!** 🎉

---

**Next Step:** Try the `OrientedCharacterController` component to see keyboard-controlled movement with orientation-based controls!
