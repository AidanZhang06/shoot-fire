/**
 * Emergency Evacuation System - Main Entry Point
 * Real-time video analysis and evacuation guidance
 */

import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { EmergencyVideoProcessor } from './server/overshoot-integration';
import { EnrichedVideoAnalysisResult } from './types/schemas';
import { EvacuationOrchestrator } from './services/orchestrator';
import { MockDataProvider } from './mocks/mock-data-provider';

const app = express();

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
    console.log(`[Server] User registered: ${userId}`);

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

    // Add user to orchestrator
    orchestrator.updateUserState(userId, {
      id: userId,
      position: position || { x: Math.random() * 50, y: Math.random() * 50, z: 0 },
      heading: Math.random() * 360,
      viewingDirection: Math.random() * 360,
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

    // Find userId for this socket and stop processing
    // In production, maintain socket-to-userId mapping
    // For now, we'll need to track socket-to-userId mapping
    // TODO: Implement proper cleanup when we have the mapping
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
