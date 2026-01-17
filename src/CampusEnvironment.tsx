import React from 'react';
import { Box, Cylinder, Cone } from '@react-three/drei';

// Simple tree component
function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <Cylinder args={[0.3, 0.4, 4, 8]} position={[0, 2, 0]}>
        <meshStandardMaterial color="#4a3020" />
      </Cylinder>

      {/* Foliage - multiple cones for a tree shape */}
      <Cone args={[2, 3, 8]} position={[0, 5, 0]}>
        <meshStandardMaterial color="#2d5016" />
      </Cone>
      <Cone args={[1.8, 2.5, 8]} position={[0, 6.5, 0]}>
        <meshStandardMaterial color="#3a6b1f" />
      </Cone>
      <Cone args={[1.5, 2, 8]} position={[0, 7.8, 0]}>
        <meshStandardMaterial color="#4a8527" />
      </Cone>
    </group>
  );
}

// Parking space marker
function ParkingSpace({ position, rotation }: { position: [number, number, number], rotation?: number }) {
  return (
    <Box args={[2.5, 0.02, 5]} position={position} rotation={[0, rotation || 0, 0]}>
      <meshStandardMaterial color="#ffffff" />
    </Box>
  );
}

export function CampusEnvironment() {
  return (
    <group>
      {/* Ground plane - grass */}
      <Box args={[200, 0.1, 200]} position={[0, -0.05, 0]}>
        <meshStandardMaterial color="#3a5f2a" />
      </Box>

      {/* Main road running north-south */}
      <Box args={[12, 0.11, 180]} position={[50, -0.04, 0]}>
        <meshStandardMaterial color="#333333" />
      </Box>

      {/* Road markings - yellow center line */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Box
          key={`road-mark-${i}`}
          args={[0.3, 0.12, 3]}
          position={[50, -0.03, -90 + i * 9]}
        >
          <meshStandardMaterial color="#ffff00" />
        </Box>
      ))}

      {/* Secondary road running east-west */}
      <Box args={[150, 0.11, 10]} position={[-10, -0.04, 40]}>
        <meshStandardMaterial color="#333333" />
      </Box>

      {/* Sidewalk around Gates building */}
      <Box args={[60, 0.105, 5]} position={[-5, -0.045, 25]}>
        <meshStandardMaterial color="#888888" />
      </Box>

      <Box args={[5, 0.105, 50]} position={[25, -0.045, 0]}>
        <meshStandardMaterial color="#888888" />
      </Box>

      <Box args={[60, 0.105, 5]} position={[-5, -0.045, -25]}>
        <meshStandardMaterial color="#888888" />
      </Box>

      {/* Sidewalk around Hillman building */}
      <Box args={[50, 0.105, 5]} position={[-60, -0.045, 15]}>
        <meshStandardMaterial color="#888888" />
      </Box>

      <Box args={[5, 0.105, 40]} position={[-85, -0.045, -5]}>
        <meshStandardMaterial color="#888888" />
      </Box>

      {/* Connecting walkway between buildings */}
      <Box args={[30, 0.105, 4]} position={[-30, -0.045, -18]}>
        <meshStandardMaterial color="#888888" />
      </Box>

      {/* Parking lot 1 - East side */}
      <Box args={[35, 0.105, 45]} position={[30, -0.045, -50]}>
        <meshStandardMaterial color="#2a2a2a" />
      </Box>

      {/* Parking spaces in lot 1 */}
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 3 }).map((_, col) => (
          <ParkingSpace
            key={`park1-${row}-${col}`}
            position={[22 + col * 5.5, -0.035, -60 + row * 7]}
          />
        ))
      )}

      {/* Parking lot 2 - South side */}
      <Box args={[50, 0.105, 30]} position={[-30, -0.045, -60]}>
        <meshStandardMaterial color="#2a2a2a" />
      </Box>

      {/* Parking spaces in lot 2 */}
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <ParkingSpace
            key={`park2-${row}-${col}`}
            position={[-45 + col * 6.5, -0.035, -68 + row * 7]}
          />
        ))
      )}

      {/* Trees around the campus */}
      {/* Trees along the main road */}
      <Tree position={[45, 0, -70]} />
      <Tree position={[45, 0, -50]} />
      <Tree position={[45, 0, -30]} />
      <Tree position={[45, 0, -10]} />
      <Tree position={[45, 0, 10]} />
      <Tree position={[45, 0, 30]} />
      <Tree position={[45, 0, 50]} />
      <Tree position={[45, 0, 70]} />

      {/* Trees on the other side */}
      <Tree position={[55, 0, -65]} />
      <Tree position={[55, 0, -45]} />
      <Tree position={[55, 0, -25]} />
      <Tree position={[55, 0, -5]} />
      <Tree position={[55, 0, 15]} />
      <Tree position={[55, 0, 35]} />
      <Tree position={[55, 0, 55]} />
      <Tree position={[55, 0, 75]} />

      {/* Trees around Gates building */}
      <Tree position={[15, 0, 35]} />
      <Tree position={[5, 0, 35]} />
      <Tree position={[-5, 0, 35]} />
      <Tree position={[30, 0, 15]} />
      <Tree position={[30, 0, -15]} />

      {/* Trees around Hillman building */}
      <Tree position={[-90, 0, 20]} />
      <Tree position={[-90, 0, 0]} />
      <Tree position={[-90, 0, -20]} />
      <Tree position={[-40, 0, 20]} />

      {/* Trees in courtyard area between buildings */}
      <Tree position={[-30, 0, -35]} />
      <Tree position={[-20, 0, -35]} />
      <Tree position={[-40, 0, -35]} />

      {/* Garden/landscaping area */}
      <Box args={[15, 0.105, 15]} position={[-30, -0.045, 30]}>
        <meshStandardMaterial color="#2a4a1a" />
      </Box>

      {/* Benches in landscaping area */}
      <Box args={[2, 0.5, 0.6]} position={[-32, 0.25, 28]}>
        <meshStandardMaterial color="#654321" />
      </Box>

      <Box args={[2, 0.5, 0.6]} position={[-28, 0.25, 32]}>
        <meshStandardMaterial color="#654321" />
      </Box>

      {/* Bike racks */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Box
          key={`bike-rack-${i}`}
          args={[0.1, 0.8, 2]}
          position={[22, 0.4, 20 + i * 0.8]}
        >
          <meshStandardMaterial color="#444444" metalness={0.7} />
        </Box>
      ))}

      {/* Light posts */}
      {[
        [35, 0, 25],
        [35, 0, -25],
        [-30, 0, 25],
        [-70, 0, 10],
        [20, 0, -40],
        [-20, 0, -40],
      ].map((pos, i) => (
        <group key={`light-${i}`} position={pos as [number, number, number]}>
          {/* Pole */}
          <Cylinder args={[0.15, 0.2, 8, 8]} position={[0, 4, 0]}>
            <meshStandardMaterial color="#222222" metalness={0.8} />
          </Cylinder>
          {/* Light fixture */}
          <Cylinder args={[0.5, 0.3, 0.6, 8]} position={[0, 8.3, 0]}>
            <meshStandardMaterial
              color="#ffff88"
              emissive="#ffff44"
              emissiveIntensity={0.5}
            />
          </Cylinder>
        </group>
      ))}

      {/* Entrance plaza */}
      <Box args={[20, 0.106, 20]} position={[0, -0.044, 0]}>
        <meshStandardMaterial color="#666666" />
      </Box>

      {/* Plaza pattern - decorative squares */}
      {Array.from({ length: 4 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <Box
            key={`plaza-${row}-${col}`}
            args={[3, 0.107, 3]}
            position={[-7.5 + col * 5, -0.043, -7.5 + row * 5]}
          >
            <meshStandardMaterial color="#555555" />
          </Box>
        ))
      )}
    </group>
  );
}
