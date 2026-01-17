import React from 'react';
import { Box, Cylinder, Sphere, Text } from '@react-three/drei';

/**
 * GHC Gardens: 5 green roofs, winter garden, moss garden, rain garden
 */
export function GHCGardens() {
  return (
    <group>
      {/* Green Roof 1 - Level 7 terrace */}
      <group position={[12, -24.4 + 7 * 3.5 + 3.5, 8]}>
        <Box args={[20, 0.4, 12]}>
          <meshStandardMaterial color="#1a4a0a" />
        </Box>

        {/* Plants and vegetation */}
        {Array.from({ length: 30 }).map((_, i) => (
          <Cylinder
            key={`gr1-plant-${i}`}
            args={[0.2, 0.3, 0.8 + Math.random(), 6]}
            position={[
              -8 + Math.random() * 16,
              0.5,
              -4 + Math.random() * 8
            ]}
          >
            <meshStandardMaterial color="#2a5a1a" />
          </Cylinder>
        ))}

        <Text
          position={[0, 0.5, 7]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.5}
          color="#88ff88"
        >
          Green Roof 1
        </Text>
      </group>

      {/* Green Roof 2 - Level 7 opposite side */}
      <group position={[-10, -24.4 + 7 * 3.5 + 3.5, -10]}>
        <Box args={[18, 0.4, 14]}>
          <meshStandardMaterial color="#1a4a0a" />
        </Box>

        {Array.from({ length: 25 }).map((_, i) => (
          <Cylinder
            key={`gr2-plant-${i}`}
            args={[0.15, 0.25, 0.6 + Math.random() * 0.5, 6]}
            position={[
              -7 + Math.random() * 14,
              0.4,
              -5 + Math.random() * 10
            ]}
          >
            <meshStandardMaterial color="#3a6a2a" />
          </Cylinder>
        ))}

        <Text
          position={[0, 0.5, 8]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.5}
          color="#88ff88"
        >
          Green Roof 2
        </Text>
      </group>

      {/* Green Roof 3 - Level 8 */}
      <group position={[8, -24.4 + 8 * 3.5 + 3.5, 0]}>
        <Box args={[15, 0.4, 10]}>
          <meshStandardMaterial color="#1a4a0a" />
        </Box>

        {Array.from({ length: 20 }).map((_, i) => (
          <Cylinder
            key={`gr3-plant-${i}`}
            args={[0.2, 0.3, 0.7 + Math.random() * 0.4, 6]}
            position={[
              -6 + Math.random() * 12,
              0.4,
              -3 + Math.random() * 6
            ]}
          >
            <meshStandardMaterial color="#2a5a1a" />
          </Cylinder>
        ))}
      </group>

      {/* Green Roof 4 - Level 9 */}
      <group position={[-5, 0 + 3.5, 5]}>
        <Box args={[12, 0.4, 8]}>
          <meshStandardMaterial color="#1a4a0a" />
        </Box>

        {Array.from({ length: 15 }).map((_, i) => (
          <Cylinder
            key={`gr4-plant-${i}`}
            args={[0.18, 0.28, 0.6 + Math.random() * 0.3, 6]}
            position={[
              -5 + Math.random() * 10,
              0.4,
              -3 + Math.random() * 6
            ]}
          >
            <meshStandardMaterial color="#3a6a2a" />
          </Cylinder>
        ))}

        <Text
          position={[0, 0.5, 5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.5}
          color="#88ff88"
        >
          Roof Garden
        </Text>
      </group>

      {/* Green Roof 5 - Small terrace */}
      <group position={[15, -24.4 + 6 * 3.5 + 3.5, -8]}>
        <Box args={[10, 0.4, 10]}>
          <meshStandardMaterial color="#1a4a0a" />
        </Box>

        {Array.from({ length: 12 }).map((_, i) => (
          <Cylinder
            key={`gr5-plant-${i}`}
            args={[0.15, 0.25, 0.5 + Math.random() * 0.3, 6]}
            position={[
              -4 + Math.random() * 8,
              0.3,
              -4 + Math.random() * 8
            ]}
          >
            <meshStandardMaterial color="#2a5a1a" />
          </Cylinder>
        ))}
      </group>

      {/* Winter Garden - Indoor garden space on Level 5 */}
      <group position={[-8, -24.4 + 4 * 3.5, -8]}>
        <Box args={[12, 0.3, 10]}>
          <meshStandardMaterial color="#2a3a1a" />
        </Box>

        {/* Indoor plants - taller and more varied */}
        {Array.from({ length: 15 }).map((_, i) => (
          <Cylinder
            key={`winter-plant-${i}`}
            args={[0.3, 0.4, 1.5 + Math.random(), 6]}
            position={[
              -5 + Math.random() * 10,
              1,
              -4 + Math.random() * 8
            ]}
          >
            <meshStandardMaterial color="#3a6a2a" />
          </Cylinder>
        ))}

        {/* Small trees */}
        {[[-3, 2, -2], [3, 2, 2], [0, 2, -3]].map((pos, i) => (
          <group key={`winter-tree-${i}`} position={pos as [number, number, number]}>
            <Cylinder args={[0.2, 0.3, 2, 8]}>
              <meshStandardMaterial color="#4a3020" />
            </Cylinder>
            <Sphere args={[1.5, 8, 8]} position={[0, 2.5, 0]}>
              <meshStandardMaterial color="#3a6a2a" />
            </Sphere>
          </group>
        ))}

        <Text
          position={[0, 0.5, 6]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.6}
          color="#88ff88"
        >
          WINTER GARDEN
        </Text>
      </group>

      {/* Moss Garden - Ground level near entrance */}
      <group position={[5, -24.4 + 0.2, 15]}>
        <Box args={[8, 0.2, 8]}>
          <meshStandardMaterial color="#1a3a0a" />
        </Box>

        {/* Moss texture - small low bumps */}
        {Array.from({ length: 40 }).map((_, i) => (
          <Cylinder
            key={`moss-${i}`}
            args={[0.3, 0.35, 0.15, 6]}
            position={[
              -3 + Math.random() * 6,
              0.08,
              -3 + Math.random() * 6
            ]}
          >
            <meshStandardMaterial color="#2a4a1a" />
          </Cylinder>
        ))}

        {/* Rocks in moss garden */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Sphere
            key={`moss-rock-${i}`}
            args={[0.3 + Math.random() * 0.3, 6, 6]}
            position={[
              -3 + Math.random() * 6,
              0.2,
              -3 + Math.random() * 6
            ]}
          >
            <meshStandardMaterial color="#555555" />
          </Sphere>
        ))}

        <Text
          position={[0, 0.3, 5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.5}
          color="#88ff88"
        >
          Moss Garden
        </Text>
      </group>

      {/* Rain Garden - Wetland plants at lower level */}
      <group position={[-12, -24.4 + 0.2, -15]}>
        <Box args={[10, 0.3, 12]}>
          <meshStandardMaterial color="#2a3a2a" />
        </Box>

        {/* Standing water effect */}
        <Box args={[9, 0.05, 11]} position={[0, 0.15, 0]}>
          <meshStandardMaterial
            color="#4488aa"
            transparent
            opacity={0.6}
            metalness={0.8}
            roughness={0.1}
          />
        </Box>

        {/* Wetland plants - reeds and cattails */}
        {Array.from({ length: 25 }).map((_, i) => (
          <Cylinder
            key={`rain-plant-${i}`}
            args={[0.08, 0.06, 1.5 + Math.random(), 8]}
            position={[
              -4 + Math.random() * 8,
              0.8,
              -5 + Math.random() * 10
            ]}
          >
            <meshStandardMaterial color="#4a6a3a" />
          </Cylinder>
        ))}

        {/* Cattail tops */}
        {Array.from({ length: 15 }).map((_, i) => (
          <Cylinder
            key={`cattail-${i}`}
            args={[0.15, 0.1, 0.4, 8]}
            position={[
              -4 + Math.random() * 8,
              2 + Math.random() * 0.5,
              -5 + Math.random() * 10
            ]}
          >
            <meshStandardMaterial color="#5a4a2a" />
          </Cylinder>
        ))}

        {/* Lily pads */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Cylinder
            key={`lily-${i}`}
            args={[0.4, 0.4, 0.05, 8]}
            position={[
              -3 + Math.random() * 6,
              0.18,
              -4 + Math.random() * 8
            ]}
          >
            <meshStandardMaterial color="#2a5a2a" />
          </Cylinder>
        ))}

        <Text
          position={[0, 0.5, 7]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.6}
          color="#88ffff"
        >
          RAIN GARDEN
        </Text>

        <Text
          position={[0, 0.2, 7]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.3}
          color="#aaffaa"
        >
          Wetland Plants
        </Text>
      </group>

      {/* Outdoor seating areas in gardens */}
      {[
        [10, -24.4 + 7 * 3.5 + 3.5, 12],
        [-8, -24.4 + 7 * 3.5 + 3.5, -12],
        [5, -24.4 + 0.5, 10],
      ].map((pos, i) => (
        <Box
          key={`garden-bench-${i}`}
          args={[2, 0.4, 0.6]}
          position={pos as [number, number, number]}
        >
          <meshStandardMaterial color="#654321" />
        </Box>
      ))}
    </group>
  );
}
