# How to Test the Coordinate System

## Problem You're Having

You clicked "Show Axes" but don't see any colored lines. Let's fix that and verify everything works!

## Quick Test (2 minutes)

### Step 1: Test the Axes Component Directly

I've created a simple test scene. Let's temporarily use it:

1. **Open `src/index.tsx`**

2. **Replace the content with this:**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import TestAxes from './TestAxes';  // ← Use test scene instead

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <TestAxes />
  </React.StrictMode>
);
```

3. **Save and check your browser**

### What You Should See

If the coordinate system is working, you'll see:

```
        🟢 (green line pointing UP)
         |
         |
         |_______ 🔴 (red line pointing RIGHT)
        /
       /
      🔵 (blue line pointing toward you)
```

**Plus:**
- A yellow sphere at the center (origin)
- Red, green, and blue spheres at the axis endpoints
- Smaller axes at positions [5,0,0], [0,5,0], and [0,0,5]
- A grid on the ground

### If You See the Axes ✓

Great! The coordinate system works. The issue is just with the integration in your main App.

**Continue to Step 2** to fix the main app.

### If You DON'T See the Axes ✗

There might be a build or dependency issue. Check:

```bash
# Make sure dependencies are installed
npm install

# Restart dev server
npm run dev
```

Also check the browser console (F12) for errors.

---

## Step 2: Fix the Main App Integration

Now let's make sure the axes show up in your main app properly.

### Check App.tsx Configuration

Open `src/App.tsx` and verify the CoordinateSystem is configured correctly. It should look like this:

```tsx
{/* Around line 279-290 */}
{/* Coordinate System for visual debugging (optional) */}
{showCoordinateAxes && (
  <>
    {/* World origin axes */}
    <CoordinateSystem position={[0, 0, 0]} size={15} />

    {/* Character position axes */}
    {playerPosition && (
      <CoordinateSystem position={playerPosition} size={3} />
    )}
  </>
)}
```

### Potential Issues in Your Main App

#### Issue 1: Camera Position

Your camera might be too far or pointing the wrong way. The axes at [0,0,0] might not be visible from your starting camera position at `[80, 60, 80]`.

**Fix:** After clicking "Show Axes", use the OrbitControls to navigate to the origin:
- Right-click and drag to pan
- Scroll to zoom
- Look for the colored lines

#### Issue 2: Player Position

Your `playerPosition` is at `[0, 21, 0]` (floor 6, y=21). The world axes at [0,0,0] are 21 units below. You might need to look down or zoom out far to see them.

**Fix:** Let's make the axes follow the camera focus instead.

### Better Integration for Your App

Replace the coordinate system section in App.tsx with this improved version:

```tsx
{/* Coordinate System for visual debugging */}
{showCoordinateAxes && (
  <>
    {/* World origin axes - LARGE and at ground level */}
    <CoordinateSystem position={[0, 0, 0]} size={30} visible={true} />

    {/* Character position axes - smaller, follows character */}
    {playerPosition && (
      <CoordinateSystem
        position={playerPosition}
        size={5}
        visible={true}
      />
    )}

    {/* Additional reference axes at character's floor level */}
    {playerPosition && (
      <CoordinateSystem
        position={[0, playerPosition[1], 0]}
        size={20}
        visible={true}
      />
    )}
  </>
)}
```

This gives you:
1. **Large axes at world origin** (size 30)
2. **Smaller axes following your character** (size 5)
3. **Reference axes at your floor level** (size 20)

---

## Step 3: Verify in Your Main App

1. **Revert `src/index.tsx` back to original:**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';  // ← Back to main app
import { ErrorBoundary } from './components/ErrorBoundary';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
```

2. **Run your app:**

```bash
npm run dev
```

3. **Click "Show Axes" button** (top-left)

4. **Look for the axes:**
   - Zoom OUT with scroll wheel
   - Look around with left-click drag
   - Look for colored lines at your character's position

---

## Troubleshooting Checklist

### ✓ "I see the axes in TestAxes.tsx but not in my main App"

**Cause:** Camera position or scale issue in your main app.

**Solutions:**
- Increase size: `<CoordinateSystem size={50} />` (make them HUGE)
- Navigate camera to [0, 0, 0] to see world axes
- The axes at your character should be visible when zoomed in

### ✓ "I don't see axes anywhere, even in test scene"

**Cause:** Build or dependency issue.

**Solutions:**
1. Check browser console (F12) for errors
2. Verify the file was saved: `src/components/CoordinateSystem.tsx`
3. Restart dev server
4. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
5. Try: `npm install && npm run dev`

### ✓ "The button doesn't seem to do anything"

**Cause:** The `showCoordinateAxes` state might not be toggling.

**Solution:** Add a console log to verify:

```tsx
<button
  onClick={() => {
    setShowCoordinateAxes(!showCoordinateAxes);
    console.log('Axes visible:', !showCoordinateAxes); // ← Add this
  }}
  ...
```

Check the browser console when clicking the button.

### ✓ "I see some axes but they're tiny"

**Cause:** The size is too small for your scene scale.

**Solution:** Make them much bigger:

```tsx
<CoordinateSystem position={[0, 0, 0]} size={100} />
```

---

## Visual Reference

### What the Axes Mean

When you see the axes:

```
      Y (GREEN - Up)
      |
      |
      |_________ X (RED - Right)
     /
    /
   Z (BLUE - Backward/Toward Camera)
```

- **Red (X)**: Horizontal, points RIGHT
- **Green (Y)**: Vertical, points UP
- **Blue (Z)**: Depth, points TOWARD camera (this is "backward")

The **opposite of blue (-Z) is FORWARD** (away from camera).

### Expected Visual Result

After clicking "Show Axes", you should see:

1. **At world origin [0,0,0]:**
   - Three lines emanating from the center of your world
   - Red line pointing right
   - Green line pointing up
   - Blue line pointing toward camera

2. **At character position:**
   - Smaller set of three colored lines
   - Following your character as they move
   - Showing which way the character is oriented

---

## Quick Debug Commands

Add this to your App.tsx to debug:

```tsx
// Add inside your component, before the return statement
useEffect(() => {
  console.log('=== COORDINATE DEBUG ===');
  console.log('Show Axes:', showCoordinateAxes);
  console.log('Player Position:', playerPosition);
  console.log('Camera Position:', thirdPersonCameraState.position);
  console.log('Camera Target:', thirdPersonCameraState.target);
}, [showCoordinateAxes, playerPosition]);
```

This will log your current state to help diagnose issues.

---

## Still Not Working?

If you've tried everything above and still don't see axes:

1. **Share the error messages** from browser console (F12 → Console tab)

2. **Verify the file exists:**
   ```bash
   ls -la src/components/CoordinateSystem.tsx
   ```

3. **Check for TypeScript errors:**
   ```bash
   npm run build
   ```

4. **Try the absolute simplest test** - add this directly in your Canvas:
   ```tsx
   <primitive object={new THREE.AxesHelper(50)} position={[0, 0, 0]} />
   ```

   If this works but the component doesn't, there's an issue with the component.

---

## Summary

1. ✅ Test with `TestAxes.tsx` first (modify `index.tsx`)
2. ✅ If that works, check camera position in main app
3. ✅ Make axes LARGER if you can't see them (size={50} or more)
4. ✅ Look for axes at your character's position (easier to find)
5. ✅ Use console.log to verify state is toggling

The coordinate system IS implemented - we just need to make sure you can see it in your scene!
