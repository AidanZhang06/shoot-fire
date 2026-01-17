import React from 'react';
import { Box, Cylinder, Cone, Text } from '@react-three/drei';
import * as THREE from 'three';

// Tree component
function Tree({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  return (
    <group position={position}>
      <Cylinder args={[0.3 * scale, 0.4 * scale, 4 * scale, 8]} position={[0, 2 * scale, 0]}>
        <meshStandardMaterial color="#4a3020" />
      </Cylinder>
      <Cone args={[2 * scale, 3 * scale, 8]} position={[0, 5 * scale, 0]}>
        <meshStandardMaterial color="#2d5016" />
      </Cone>
      <Cone args={[1.8 * scale, 2.5 * scale, 8]} position={[0, 6.5 * scale, 0]}>
        <meshStandardMaterial color="#3a6b1f" />
      </Cone>
      <Cone args={[1.5 * scale, 2 * scale, 8]} position={[0, 7.8 * scale, 0]}>
        <meshStandardMaterial color="#4a8527" />
      </Cone>
    </group>
  );
}

/**
 * CMU Campus Terrain with 80-foot elevation change
 * Forbes Avenue (north) is at elevation 0
 * Ravine (south/west) drops to -24.4m (80 feet)
 */
export function CMUTerrain() {
  return (
    <group>
      {/* Forbes Avenue level (Upper Campus / The Cut) - Elevation 0 */}
      <Box args={[100, 0.5, 60]} position={[0, -0.25, 50]}>
        <meshStandardMaterial color="#3a5f2a" />
      </Box>

      {/* Forbes Avenue road */}
      <Box args={[15, 0.52, 120]} position={[50, -0.24, 0]}>
        <meshStandardMaterial color="#2a2a2a" />
      </Box>

      {/* Road markings */}
      {Array.from({ length: 15 }).map((_, i) => (
        <Box
          key={`forbes-mark-${i}`}
          args={[0.3, 0.53, 3]}
          position={[50, -0.23, -60 + i * 8]}
        >
          <meshStandardMaterial color="#ffff00" />
        </Box>
      ))}

      {/* The Cut - sloped terrain transitioning down */}
      {Array.from({ length: 12 }).map((_, i) => {
        const t = i / 12;
        const yPos = -t * 12; // Gradual slope
        const zPos = 20 - i * 3;
        return (
          <Box
            key={`cut-${i}`}
            args={[80, 0.5, 4]}
            position={[0, yPos, zPos]}
            rotation={[-0.3, 0, 0]}
          >
            <meshStandardMaterial color="#4a6f3a" />
          </Box>
        );
      })}

      {/* Steep ravine slope (west side) */}
      {Array.from({ length: 10 }).map((_, i) => {
        const t = i / 10;
        const yPos = -t * 20 - 5;
        const xPos = -20 - i * 3;
        return (
          <Box
            key={`ravine-west-${i}`}
            args={[4, 0.5, 60]}
            position={[xPos, yPos, -10]}
            rotation={[0, 0, -0.4]}
          >
            <meshStandardMaterial color="#3a5520" />
          </Box>
        );
      })}

      {/* Steep ravine slope (south side) */}
      {Array.from({ length: 10 }).map((_, i) => {
        const t = i / 10;
        const yPos = -t * 18 - 5;
        const zPos = -15 - i * 4;
        return (
          <Box
            key={`ravine-south-${i}`}
            args={[60, 0.5, 4]}
            position={[0, yPos, zPos]}
            rotation={[-0.5, 0, 0]}
          >
            <meshStandardMaterial color="#3a5520" />
          </Box>
        );
      })}

      {/* Lower Campus (West Campus) - Bottom of ravine */}
      <Box args={[100, 0.5, 80]} position={[0, -24.65, -50]}>
        <meshStandardMaterial color="#2a4a1a" />
      </Box>

      {/* Retaining walls */}
      <Box args={[60, 15, 1]} position={[0, -17, -10]}>
        <meshStandardMaterial color="#666666" />
      </Box>

      <Box args={[1, 12, 50]} position={[-35, -18, -10]}>
        <meshStandardMaterial color="#666666" />
      </Box>

      {/* Sidewalks at Forbes Avenue level */}
      <Box args={[4, 0.51, 100]} position={[42, -0.24, 0]}>
        <meshStandardMaterial color="#888888" />
      </Box>

      <Box args={[4, 0.51, 100]} position={[58, -0.24, 0]}>
        <meshStandardMaterial color="#888888" />
      </Box>

      {/* Lower campus pathways */}
      <Box args={[60, 0.51, 4]} position={[0, -24.64, -30]}>
        <meshStandardMaterial color="#888888" />
      </Box>

      <Box args={[4, 0.51, 60]} position={[-20, -24.64, -50]}>
        <meshStandardMaterial color="#888888" />
      </Box>

      {/* Forbes Avenue sign */}
      <Text
        position={[50, 2, 70]}
        fontSize={1.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        FORBES AVENUE
      </Text>

      <Text
        position={[50, 0.5, 70]}
        fontSize={0.8}
        color="#aaaaaa"
        anchorX="center"
        anchorY="middle"
      >
        Upper Campus (The Cut)
      </Text>

      {/* Lower campus sign */}
      <Text
        position={[0, -22, -70]}
        fontSize={1.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        WEST CAMPUS
      </Text>

      <Text
        position={[0, -24, -70]}
        fontSize={0.7}
        color="#aaaaaa"
        anchorX="center"
        anchorY="middle"
      >
        Lower Campus (80 ft below Forbes Ave)
      </Text>

      {/* Trees along Forbes Avenue */}
      {Array.from({ length: 15 }).map((_, i) => (
        <Tree key={`forbes-tree-${i}`} position={[38, 0, -50 + i * 8]} scale={1.2} />
      ))}

      {/* Trees in the ravine */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Tree
          key={`ravine-tree-${i}`}
          position={[
            -30 + Math.random() * 20,
            -15 - Math.random() * 8,
            -20 + Math.random() * 40
          ]}
          scale={0.8 + Math.random() * 0.4}
        />
      ))}

      {/* Trees on lower campus */}
      {Array.from({ length: 12 }).map((_, i) => (
        <Tree
          key={`lower-tree-${i}`}
          position={[
            -40 + (i % 4) * 20,
            -24.4,
            -40 - Math.floor(i / 4) * 15
          ]}
        />
      ))}

      {/* Parking lot at lower level */}
      <Box args={[35, 0.51, 40]} position={[20, -24.64, -60]}>
        <meshStandardMaterial color="#1a1a1a" />
      </Box>

      {/* Parking spaces */}
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 6 }).map((_, col) => (
          <Box
            key={`park-${row}-${col}`}
            args={[2.5, 0.52, 5]}
            position={[8 + col * 4.5, -24.63, -70 + row * 8]}
          >
            <meshStandardMaterial color="#ffffff" />
          </Box>
        ))
      )}

      {/* Bike racks */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Box
          key={`bike-rack-${i}`}
          args={[0.1, 0.8, 2]}
          position={[40, 0.4, 40 + i * 1]}
        >
          <meshStandardMaterial color="#444444" metalness={0.7} />
        </Box>
      ))}

      {/* Light posts along paths */}
      {[
        [45, 0, 30],
        [45, 0, 0],
        [45, 0, -30],
        [0, -24.4, -30],
        [20, -24.4, -50],
        [-20, -24.4, -40],
      ].map((pos, i) => (
        <group key={`light-${i}`} position={pos as [number, number, number]}>
          <Cylinder args={[0.15, 0.2, 8, 8]} position={[0, 4, 0]}>
            <meshStandardMaterial color="#222222" metalness={0.8} />
          </Cylinder>
          <Cylinder args={[0.5, 0.3, 0.6, 8]} position={[0, 8.3, 0]}>
            <meshStandardMaterial
              color="#ffff88"
              emissive="#ffff44"
              emissiveIntensity={0.5}
            />
          </Cylinder>
        </group>
      ))}

      {/* Benches */}
      {[
        [35, 0, 20],
        [35, 0, -10],
        [0, -24.4, -35],
        [10, -24.4, -45],
      ].map((pos, i) => (
        <Box
          key={`bench-${i}`}
          args={[2, 0.5, 0.6]}
          position={pos as [number, number, number]}
        >
          <meshStandardMaterial color="#654321" />
        </Box>
      ))}

      {/* Steps/stairs connecting levels */}
      {Array.from({ length: 40 }).map((_, i) => (
        <Box
          key={`step-${i}`}
          args={[8, 0.2, 0.6]}
          position={[15, -0.6 * i, -5 - i * 0.6]}
        >
          <meshStandardMaterial color="#666666" />
        </Box>
      ))}
    </group>
  );
}
