/**
 * Emergency Evacuation System - Main Entry Point
 * Real-time video analysis and evacuation guidance
 */

import 'dotenv/config';
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';
import { EmergencyVideoProcessor } from './server/overshoot-integration';
import { EnrichedVideoAnalysisResult } from './types/schemas';
import { EvacuationOrchestrator } from './services/orchestrator';
import { MockDataProvider } from './mocks/mock-data-provider';

const app = express();

// Parse JSON bodies
app.use(express.json());

// Observations directory
const OBSERVATIONS_DIR = path.join(__dirname, '../observations');
if (!fs.existsSync(OBSERVATIONS_DIR)) {
  fs.mkdirSync(OBSERVATIONS_DIR, { recursive: true });
  console.log('[Server] Created observations directory');
}

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Initialize Evacuation Orchestrator
const orchestrator = new EvacuationOrchestrator(io);
const mockData = new MockDataProvider();

// Track socket-to-userId mapping for proper cleanup on disconnect
const socketToUser = new Map<string, string>();
const userToSocket = new Map<string, string>();

// Initialize with mock data
console.log('[Server] Initializing mock data...');
const mockExits = mockData.getMockExits();
const mockHazardGrid = mockData.getMockHazardGrid();
const mockDimensions = mockData.getBuildingDimensions();

mockExits.forEach((exit, exitId) => {
  orchestrator.updateExitStatus(exitId, exit);
});

orchestrator.updateHazardGrid(mockHazardGrid);
orchestrator.setBuildingDimensions(mockDimensions.width, mockDimensions.height);

console.log(`[Server] Mock data loaded: ${mockExits.size} exits, ${mockHazardGrid.size} hazard cells`);

// Start orchestrator
orchestrator.start();

// Initialize Emergency Video Processor
const videoProcessor = new EmergencyVideoProcessor((result: EnrichedVideoAnalysisResult) => {
  console.log(`\n[Analysis] User ${result.userId}:`);
  console.log(`  Confidence: ${result.confidence.toFixed(2)}`);
  console.log(`  Obstacles: ${result.obstacles.length}`);
  console.log(`  Fire: ${result.hazards.fire.present ? `Yes (intensity: ${result.hazards.fire.intensity})` : 'No'}`);
  console.log(`  Smoke: ${result.hazards.smoke.present ? `Yes (density: ${result.hazards.smoke.density})` : 'No'}`);
  console.log(`  People count: ${result.people.count}`);
  console.log(`  Exits visible: ${result.exits.filter(e => e.visible).length}`);
  console.log(`  Processing latency: ${result.processingLatency}ms\n`);

  // In a full implementation, this would forward to the situational map manager
  // For now, we'll broadcast to the user's client
  io.to(result.userId).emit('video-analysis', result);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[Server] Client connected: ${socket.id}`);

  // User registration
  socket.on('register-user', async (data: { userId: string; position: any }) => {
    const { userId, position } = data;
    console.log(`[Server] User registration request: ${userId} (socket: ${socket.id})`);

    // Check if user already registered with a different socket (reconnection case)
    const existingSocket = userToSocket.get(userId);
    if (existingSocket && existingSocket !== socket.id) {
      console.log(`[Server] User ${userId} reconnecting - disconnecting old socket ${existingSocket}`);

      // Force disconnect old socket
      const oldSocket = io.sockets.sockets.get(existingSocket);
      if (oldSocket) {
        oldSocket.disconnect(true);
      }

      // Clean up old mapping
      socketToUser.delete(existingSocket);
    }

    // Store bidirectional socket-userId mapping
    socketToUser.set(socket.id, userId);
    userToSocket.set(userId, socket.id);

    // Join user-specific room
    socket.join(userId);

    // Initialize user state in video processor
    videoProcessor.updateUserState(userId, {
      id: userId,
      position: position || { x: 0, y: 0, z: 0 },
      heading: 0,
      viewingDirection: 0,
      speed: 0,
      groupSize: 1
    });

    // Add user to orchestrator - Floor 9, center of left side (as shown in floor plan)
    const START_POSITION = { x: -20, y: 28, z: 5 }; // Center of left side, Floor 9
    orchestrator.updateUserState(userId, {
      id: userId,
      position: position && position.x !== 0 ? position : START_POSITION,
      heading: 0, // Will be updated by GPS trajectory
      viewingDirection: 0,
      speed: 0,
      groupSize: 1,
      nearExit: false,
      inHighHazardZone: false
    });

    console.log(`[Server] User ${userId} added to orchestrator at position (${position?.x || 0}, ${position?.y || 0})`);

    // Note: Video processing happens client-side in the browser
    // The client will handle Overshoot SDK and send analysis results to server
    socket.emit('registration-confirmed', {
      success: true,
      userId,
      message: 'User registered - ready for video analysis'
    });
  });

  // Update user position and sensors
  socket.on('update-position', (data: {
    userId: string;
    position: any;
    heading?: number;
    speed?: number;
  }) => {
    const userState = videoProcessor.getUserState(data.userId);
    if (userState) {
      const updatedState = {
        ...userState,
        position: data.position,
        heading: data.heading || userState.heading,
        speed: data.speed || userState.speed
      };

      videoProcessor.updateUserState(data.userId, updatedState);
      orchestrator.updateUserState(data.userId, updatedState);
    }
  });

  // Receive video analysis from client (client-side Overshoot processing)
  socket.on('video-analysis', (data: {
    userId: string;
    analysis: any;
    latency: number;
  }) => {
    console.log(`\n[Client Analysis] User ${data.userId}:`);
    console.log(`  Obstacles: ${data.analysis.obstacles?.length || 0}`);
    console.log(`  Fire: ${data.analysis.hazards?.fire?.present ? 'YES' : 'No'}`);
    console.log(`  Smoke: ${data.analysis.hazards?.smoke?.present ? 'YES' : 'No'}`);
    console.log(`  People: ${data.analysis.people?.count || 0}`);
    console.log(`  Exits visible: ${data.analysis.exits?.filter((e: any) => e.visible).length || 0}`);
    console.log(`  Latency: ${data.latency}ms\n`);

    // In full implementation, this would:
    // 1. Update situational map with this data
    // 2. Recompute optimal routes
    // 3. Send guidance back to user
    // For now, just acknowledge receipt
    socket.emit('analysis-received', {
      userId: data.userId,
      timestamp: Date.now()
    });
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`[Server] Client disconnected: ${socket.id}`);

    // Look up userId for this socket
    const userId = socketToUser.get(socket.id);

    if (userId) {
      console.log(`[Server] Cleaning up user ${userId} after disconnect`);

      try {
        // Stop video processing for this user
        await videoProcessor.stopProcessingForUser(userId);

        // Remove user from orchestrator
        orchestrator.removeUser(userId);

        // Clean up socket-userId mapping
        socketToUser.delete(socket.id);
        userToSocket.delete(userId);

        console.log(`[Server] ✅ User ${userId} successfully removed`);
      } catch (error) {
        console.error(`[Server] ❌ Error cleaning up user ${userId}:`, error);
      }
    } else {
      console.log(`[Server] ⚠️ No userId found for disconnected socket ${socket.id}`);
    }
  });

  // Manual stop processing
  socket.on('stop-processing', async (data: { userId: string }) => {
    await videoProcessor.stopProcessingForUser(data.userId);
    socket.emit('processing-stopped', {
      success: true,
      userId: data.userId
    });
  });
});

// Basic HTTP routes
app.get('/', (req, res) => {
  res.json({
    service: 'Emergency Evacuation System',
    version: '1.0.0',
    status: 'running',
    stats: videoProcessor.getStats()
  });
});

app.get('/health', (req, res) => {
  const stats = videoProcessor.getStats();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    ...stats
  });
});

app.get('/stats', (req, res) => {
  res.json(videoProcessor.getStats());
});

app.get('/orchestrator-stats', (req, res) => {
  res.json(orchestrator.getMetrics());
});

// Observation storage endpoints (from locationDetector)
app.post('/save_observation', (req, res) => {
  try {
    const { device_id, timestamp, gps_latitude, gps_longitude, gps_accuracy, metadata } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }

    const deviceFile = path.join(OBSERVATIONS_DIR, `observations_${device_id}.json`);

    // Read existing observations or create new array
    let observations: any[] = [];
    if (fs.existsSync(deviceFile)) {
      const fileContent = fs.readFileSync(deviceFile, 'utf-8');
      observations = JSON.parse(fileContent);
    }

    // Append new observation
    observations.push({ device_id, timestamp, gps_latitude, gps_longitude, gps_accuracy, metadata });

    // Write back to file
    fs.writeFileSync(deviceFile, JSON.stringify(observations, null, 2));

    console.log(`[Observation] Saved for device ${device_id} (total: ${observations.length})`);

    res.json({
      status: 'success',
      device_id,
      total_observations: observations.length
    });
  } catch (error: any) {
    console.error('[Observation] Error saving:', error);
    res.status(500).json({ error: 'Failed to save observation', details: error.message });
  }
});

app.get('/observations/:device_id', (req, res) => {
  try {
    const { device_id } = req.params;
    const deviceFile = path.join(OBSERVATIONS_DIR, `observations_${device_id}.json`);

    if (!fs.existsSync(deviceFile)) {
      return res.json({ device_id, observations: [], count: 0 });
    }

    const fileContent = fs.readFileSync(deviceFile, 'utf-8');
    const observations = JSON.parse(fileContent);

    res.json({ device_id, observations, count: observations.length });
  } catch (error: any) {
    console.error('[Observation] Error getting:', error);
    res.status(500).json({ error: 'Failed to get observations', details: error.message });
  }
});

app.get('/devices', (req, res) => {
  try {
    const devices: any[] = [];
    const files = fs.readdirSync(OBSERVATIONS_DIR);

    files.forEach(fileName => {
      if (fileName.startsWith('observations_') && fileName.endsWith('.json')) {
        const device_id = fileName.replace('observations_', '').replace('.json', '');
        const filePath = path.join(OBSERVATIONS_DIR, fileName);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const observations = JSON.parse(fileContent);

        if (observations.length > 0) {
          const latest = observations[observations.length - 1];
          devices.push({
            device_id,
            observation_count: observations.length,
            latest_gps: {
              latitude: latest.gps_latitude,
              longitude: latest.gps_longitude,
              accuracy: latest.gps_accuracy,
              timestamp: latest.timestamp
            }
          });
        }
      }
    });

    console.log(`[Devices] Listed ${devices.length} active devices`);
    res.json({ devices, count: devices.length });
  } catch (error: any) {
    console.error('[Devices] Error listing:', error);
    res.status(500).json({ error: 'Failed to list devices', details: error.message });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down gracefully...');
  orchestrator.stop();
  await videoProcessor.stopAll();
  httpServer.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n[Server] SIGTERM received, shutting down...');
  orchestrator.stop();
  await videoProcessor.stopAll();
  httpServer.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   Emergency Evacuation System - Server Started            ║
╚═══════════════════════════════════════════════════════════╝

🚀 Server running on port ${PORT}
📡 WebSocket server ready
🎥 Overshoot API integration active

Endpoints:
  - GET  /          Service info
  - GET  /health    Health check
  - GET  /stats     System statistics

Socket.IO Events:
  - register-user      Register and start video processing
  - update-position    Update user position and sensors
  - stop-processing    Stop video processing for user

Ready to process emergency video streams!
  `);
});

export { app, io, videoProcessor };
