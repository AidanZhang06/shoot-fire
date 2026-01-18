# 3D Map Integration - Remaining Steps

## What's Been Completed ✅

All the 3D visualization components have been created:
- ✅ `UserMarker.ts` - Green 3D character showing user position
- ✅ `PathRenderer.ts` - Orange evacuation route visualization
- ✅ `BuildingModel.ts` - L-shaped 9-floor Gates Building
- ✅ `HazardRenderer.ts` - Fire, smoke, and water hazards
- ✅ `ExitMarkerRenderer.ts` - Green glowing exit markers
- ✅ `Map3DViewer.ts` - Main orchestrator with all components integrated
- ✅ HTML updated with Three.js CDN and 3D container
- ✅ 2D canvas replaced with 3D div (240x240px)

## Next Steps to Complete Integration

### Step 1: Install Vite for Building (Required)

Since the HTML uses inline scripts, we need to build the TypeScript visualization code into a JavaScript bundle.

```bash
cd live-escape
npm install --save-dev vite @types/three
```

### Step 2: Create Vite Configuration

Create `live-escape/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/visualization/index.ts'),
      name: 'LiveEscapeViz',
      formats: ['es'],
      fileName: 'visualization'
    },
    outDir: 'public/dist',
    rollupOptions: {
      external: ['three'],
      output: {
        globals: {
          three: 'THREE'
        }
      }
    }
  }
});
```

### Step 3: Update package.json Scripts

Add to the `scripts` section in `live-escape/package.json`:

```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "build-client": "vite build",
    "dev-full": "concurrently \"vite build --watch\" \"nodemon src/index.ts\"",
    "start": "node dist/index.js",
    "test": "jest",
    "example": "node examples/client-example.js"
  }
}
```

Also install concurrently:
```bash
npm install --save-dev concurrently
```

### Step 4: Build the Client Code

```bash
cd live-escape
npm run build-client
```

This will create `live-escape/public/dist/visualization.js`

### Step 5: Add Script Tag to HTML

In `live-escape/public/index.html`, add after the Three.js CDN script (around line 9):

```html
<script type="module">
  import * as Viz from './dist/visualization.js';
  window.LiveEscapeViz = Viz;
</script>
```

### Step 6: Remove Old 2D Minimap Code from HTML

Find and remove the `updateMinimap()` function (around line 723-812 in the original file). This function draws the 2D canvas and is no longer needed.

```javascript
// DELETE THIS ENTIRE FUNCTION:
function updateMinimap(visualization, route) {
    const canvas = document.getElementById('minimap-canvas');
    // ... all the canvas drawing code ...
}
```

### Step 7: Add 3D Map Initialization Code

In the `<script>` section of `index.html`, after the Socket.IO initialization (around line 483), add:

```javascript
// 3D Map Viewer
let map3DViewer = null;

function initMap3DViewer() {
  const container = document.getElementById('minimap-3d');
  if (!container || map3DViewer) return;

  // Map3DViewer is available via window.LiveEscapeViz from the module
  const { Map3DViewer } = window.LiveEscapeViz;

  map3DViewer = new Map3DViewer({
    container: container,
    buildingDimensions: { width: 50, height: 50 },
    floorHeight: 3.5
  });

  map3DViewer.start();
  console.log('✅ 3D Map initialized');
}
```

### Step 8: Update Socket.IO guidance-update Handler

Find the `socket.on('guidance-update', ...)` handler (around line 506) and add 3D updates:

```javascript
socket.on('guidance-update', (payload) => {
  console.log('📍 Guidance update:', payload);
  lastGuidanceUpdate = Date.now();

  // Initialize 3D viewer on first update
  if (!map3DViewer) {
    initMap3DViewer();
  }

  // Show overlay if not visible
  if (!guidanceActive) {
    document.getElementById('guidance-overlay').style.display = 'block';
    guidanceActive = true;
  }

  // Update 3D scene
  if (map3DViewer && payload.route) {
    // User position (use route start or default)
    const userPos = payload.route.waypoints && payload.route.waypoints.length > 0
      ? payload.route.waypoints[0]
      : { x: 0, y: 7, z: 0 };

    map3DViewer.updateUserPosition(userPos);

    // Route visualization
    if (payload.route.waypoints && payload.route.waypoints.length > 1) {
      map3DViewer.updateRoute(payload.route);
    }

    // Hazards
    if (payload.route.hazardWarnings && payload.route.hazardWarnings.length > 0) {
      map3DViewer.clearHazards();
      payload.route.hazardWarnings.forEach(hw => {
        // Convert severity to intensity (0-5 scale)
        const intensityMap = { low: 1, medium: 3, high: 4, critical: 5 };
        const intensity = intensityMap[hw.severity] || 3;
        map3DViewer.addHazard(hw.location, hw.type, intensity);
      });
    }
  }

  // Update all existing UI components
  updateImmediateAction(payload.immediateActions[0]);
  updateProgressInfo(payload.route);
  updateHazardWarnings(payload.route.hazardWarnings);
  // REMOVE: updateMinimap(payload.visualization, payload.route); // Old 2D minimap
  speakInstruction(payload.audio);
});
```

### Step 9: Test the Integration

1. **Build everything:**
   ```bash
   cd live-escape
   npm run build-client
   npm run build
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   - Navigate to `http://localhost:3000`
   - Open browser console (F12)
   - Start the camera
   - Register as a user

4. **Verify 3D map:**
   - You should see the L-shaped building in the bottom-left corner
   - The view should be a bird's eye (isometric) perspective
   - Check for console log: "✅ 3D Map initialized"

5. **Test with mock data** (paste in browser console):
   ```javascript
   socket.emit('guidance-update', {
     route: {
       waypoints: [
         { x: 10, y: 7, z: 15, id: 'w1' },
         { x: 15, y: 7, z: 10, id: 'w2' },
         { x: 20, y: 7, z: 5, id: 'w3' }
       ],
       totalDistance: 15,
       estimatedTime: 12,
       hazardWarnings: [
         { type: 'fire', severity: 'high', location: { x: 12, y: 7, z: 12 }, message: 'Fire ahead' }
       ]
     },
     immediateActions: [{ type: 'navigate', description: 'Move forward', severity: 'medium' }],
     audio: { instruction: 'Continue forward', urgency: 'medium' }
   });
   ```

6. **What you should see:**
   - Green character (user marker) appears at first waypoint
   - Orange path line connecting waypoints
   - Red/orange pulsing sphere for fire hazard
   - Camera smoothly follows the user
   - Building visible in background

## Troubleshooting

### Issue: "Cannot find module 'three'"
**Solution:** Make sure Three.js is loaded from CDN before your module:
```html
<script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>
<script type="module" src="./dist/visualization.js"></script>
```

### Issue: "map3DViewer is not defined"
**Solution:** Check that the module export is working. Try:
```javascript
console.log(window.LiveEscapeViz); // Should show exported classes
```

### Issue: Black screen in 3D container
**Solutions:**
- Check browser console for errors
- Verify building model is being created: Look for meshes in the scene
- Check camera position (should be at y=80, z=50)
- Verify lighting is set up

### Issue: User marker not visible
**Solutions:**
- Check that waypoints have valid x, y, z coordinates
- Y coordinate should match floor level (floor 1 = y:0, floor 2 = y:3.5, etc.)
- Check that updateUserPosition() is being called

### Issue: Path not rendering
**Solutions:**
- Need at least 2 waypoints for a path
- Check waypoint coordinates are within building bounds
- Verify PathRenderer.updatePath() is being called

## Performance Optimization

If the 3D view is slow:

1. **Reduce render resolution** in Map3DViewer.ts:
   ```typescript
   renderer.setPixelRatio(0.5); // Lower quality but faster
   ```

2. **Increase FPS limit**:
   ```typescript
   private readonly TARGET_FPS = 20; // Lower framerate
   ```

3. **Simplify building** in BuildingModel.ts:
   - Remove upper floors (show only floor 1-3)
   - Reduce wall segments
   - Use lower polygon counts

## Alternative: Quick Test Without Build Step

If you want to test without setting up Vite, you can temporarily inline the classes:

1. Copy the content of each `.ts` file
2. Remove the imports and exports
3. Paste directly in `<script>` tags in index.html
4. Make classes available via `window.BuildingModel = class BuildingModel { ... }`

This is NOT recommended for production but works for quick testing.

## Success Checklist

- [ ] Vite installed and configured
- [ ] `npm run build-client` succeeds
- [ ] `/public/dist/visualization.js` file exists
- [ ] Three.js loads from CDN
- [ ] Module script loads without errors
- [ ] 3D container appears in HTML
- [ ] `initMap3DViewer()` runs without errors
- [ ] Building renders in 3D view
- [ ] User marker appears and moves
- [ ] Path line draws correctly
- [ ] Hazards display with pulsing animation
- [ ] Camera follows user smoothly
- [ ] Performance is acceptable (>20 FPS)

## Next Enhancement Ideas

Once working:
- Add floor selector to show only current floor
- Click on exits to highlight routes
- Add mini labels for exits
- Show other users as different colored markers
- Add smoke particle effects
- Implement zoom controls
- Add first-person view toggle
