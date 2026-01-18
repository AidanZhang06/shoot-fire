/**
 * Example Client Connection
 * Demonstrates how to connect to the emergency evacuation server
 */

const io = require('socket.io-client');

// Connect to server
const socket = io('http://localhost:3000');

// User configuration
const userId = 'demo-user-' + Date.now();
const initialPosition = { x: 10, y: 20, z: 0 };

// Connection established
socket.on('connect', () => {
  console.log('✅ Connected to emergency evacuation server');
  console.log(`   Socket ID: ${socket.id}`);

  // Register user and start video processing
  console.log(`\n📝 Registering user: ${userId}`);
  socket.emit('register-user', {
    userId,
    position: initialPosition
  });
});

// Processing started confirmation
socket.on('processing-started', (data) => {
  console.log('\n🎥 Video processing started!');
  console.log('   Data:', JSON.stringify(data, null, 2));

  // Simulate position updates (in real app, this comes from GPS/sensors)
  startPositionUpdates();
});

// Video analysis results
socket.on('video-analysis', (result) => {
  console.log('\n📊 Video Analysis Result:');
  console.log('   Timestamp:', new Date(result.timestamp).toISOString());
  console.log('   Confidence:', (result.confidence * 100).toFixed(1) + '%');
  console.log('   User Position:', result.userPosition);

  console.log('\n   🚧 Obstacles:', result.obstacles.length);
  if (result.obstacles.length > 0) {
    result.obstacles.forEach((obs, i) => {
      console.log(`      ${i + 1}. ${obs.type} (${obs.severity}) at ${obs.position}, ${obs.distance}`);
    });
  }

  console.log('\n   ⚠️  Hazards:');
  if (result.hazards.fire.present) {
    console.log(`      🔥 Fire: intensity ${result.hazards.fire.intensity}/5, ${result.hazards.fire.growthRate}`);
  }
  if (result.hazards.smoke.present) {
    console.log(`      💨 Smoke: density ${result.hazards.smoke.density}/5, visibility ${result.hazards.smoke.visibility}`);
  }
  if (result.hazards.water.present) {
    console.log(`      💧 Water: ${result.hazards.water.depth}, flow ${result.hazards.water.flow}`);
  }
  if (!result.hazards.fire.present && !result.hazards.smoke.present && !result.hazards.water.present) {
    console.log('      ✅ No hazards detected');
  }

  console.log('\n   👥 People:', result.people.count, `(${result.people.density} density)`);
  if (result.people.positions.length > 0) {
    console.log('      Positions:', result.people.positions.map(p => `${p.horizontal}-${p.distance}`).join(', '));
  }

  console.log('\n   🚪 Exits:', result.exits.filter(e => e.visible).length, 'visible');
  result.exits.filter(e => e.visible).forEach((exit, i) => {
    console.log(`      ${i + 1}. ${exit.type} - ${exit.status}, ${exit.direction}°, ${exit.distance}`);
  });

  console.log('\n   ⏱️  Processing latency:', result.processingLatency + 'ms');
  console.log('   -----------------------------------');
});

// Error handling
socket.on('processing-error', (error) => {
  console.error('\n❌ Processing error:', error);
});

socket.on('disconnect', () => {
  console.log('\n⚠️  Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('\n❌ Connection error:', error.message);
});

// Simulate position updates
let position = { ...initialPosition };
let heading = 0;
let speed = 1.2; // m/s

function startPositionUpdates() {
  setInterval(() => {
    // Simulate movement (random walk)
    const angle = (Math.random() - 0.5) * 30; // +/- 15 degrees
    heading = (heading + angle + 360) % 360;

    // Update position based on heading and speed
    const radians = heading * Math.PI / 180;
    position.x += Math.cos(radians) * speed * 0.1; // 0.1s update interval
    position.y += Math.sin(radians) * speed * 0.1;

    // Send position update
    socket.emit('update-position', {
      userId,
      position,
      heading,
      speed
    });
  }, 100); // Update every 100ms
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping processing...');
  socket.emit('stop-processing', { userId });

  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 1000);
});

console.log(`
╔═══════════════════════════════════════════════════════════╗
║   Emergency Evacuation System - Client Example            ║
╚═══════════════════════════════════════════════════════════╝

Connecting to server...
Press Ctrl+C to stop

`);
