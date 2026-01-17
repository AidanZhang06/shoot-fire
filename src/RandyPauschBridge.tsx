import React from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';

/**
 * Randy Pausch Memorial Bridge
 * High-tech pedestrian bridge on Level 4 connecting GHC to Purnell Center for the Arts
 */
export function RandyPauschBridge() {
  const bridgeLength = 35;
  const bridgeWidth = 4;
  const bridgeHeight = 3;
  const level4Height = -24.4 + 3 * 3.5; // Level 4 position

  return (
    <group position={[30, level4Height + bridgeHeight / 2, 0]}>
      {/* Main bridge structure */}
      <Box args={[bridgeLength, bridgeHeight, bridgeWidth]}>
        <meshStandardMaterial
          color="#88bbff"
          transparent
          opacity={0.35}
          emissive="#0088ff"
          emissiveIntensity={0.3}
        />
      </Box>

      {/* Floor deck */}
      <Box
        args={[bridgeLength, 0.2, bridgeWidth]}
        position={[0, -bridgeHeight / 2 + 0.1, 0]}
      >
        <meshStandardMaterial
          color="#666666"
          roughness={0.3}
        />
      </Box>

      {/* Glass walls with high-tech panels */}
      {/* North glass wall */}
      <Box
        args={[bridgeLength, bridgeHeight - 0.4, 0.15]}
        position={[0, 0, bridgeWidth / 2]}
      >
        <meshStandardMaterial
          color="#aaddff"
          transparent
          opacity={0.4}
          emissive="#0088ff"
          emissiveIntensity={0.25}
        />
      </Box>

      {/* South glass wall */}
      <Box
        args={[bridgeLength, bridgeHeight - 0.4, 0.15]}
        position={[0, 0, -bridgeWidth / 2]}
      >
        <meshStandardMaterial
          color="#aaddff"
          transparent
          opacity={0.4}
          emissive="#0088ff"
          emissiveIntensity={0.25}
        />
      </Box>

      {/* Tech panels/displays along walls */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Box
          key={`panel-${i}`}
          args={[3, 1.5, 0.1]}
          position={[-bridgeLength / 2 + (i + 1) * (bridgeLength / 9), 0.5, bridgeWidth / 2 + 0.2]}
        >
          <meshStandardMaterial
            color="#000000"
            emissive="#00ffff"
            emissiveIntensity={0.4}
          />
        </Box>
      ))}

      {/* Structural beams */}
      {/* Top beams */}
      <Box
        args={[bridgeLength, 0.25, 0.25]}
        position={[0, bridgeHeight / 2 - 0.125, bridgeWidth / 3]}
      >
        <meshStandardMaterial
          color="#333333"
          metalness={0.8}
          roughness={0.2}
        />
      </Box>

      <Box
        args={[bridgeLength, 0.25, 0.25]}
        position={[0, bridgeHeight / 2 - 0.125, -bridgeWidth / 3]}
      >
        <meshStandardMaterial
          color="#333333"
          metalness={0.8}
          roughness={0.2}
        />
      </Box>

      {/* Bottom support beams */}
      <Box
        args={[bridgeLength, 0.3, 0.3]}
        position={[0, -bridgeHeight / 2 - 0.5, bridgeWidth / 4]}
      >
        <meshStandardMaterial
          color="#444444"
          metalness={0.7}
          roughness={0.3}
        />
      </Box>

      <Box
        args={[bridgeLength, 0.3, 0.3]}
        position={[0, -bridgeHeight / 2 - 0.5, -bridgeWidth / 4]}
      >
        <meshStandardMaterial
          color="#444444"
          metalness={0.7}
          roughness={0.3}
        />
      </Box>

      {/* Support columns */}
      {[-bridgeLength / 3, 0, bridgeLength / 3].map((xPos, i) => (
        <React.Fragment key={`support-${i}`}>
          <Cylinder
            args={[0.35, 0.4, bridgeHeight + 3, 8]}
            position={[xPos, -1.5, bridgeWidth / 3]}
          >
            <meshStandardMaterial
              color="#555555"
              metalness={0.7}
              roughness={0.3}
            />
          </Cylinder>

          <Cylinder
            args={[0.35, 0.4, bridgeHeight + 3, 8]}
            position={[xPos, -1.5, -bridgeWidth / 3]}
          >
            <meshStandardMaterial
              color="#555555"
              metalness={0.7}
              roughness={0.3}
            />
          </Cylinder>
        </React.Fragment>
      ))}

      {/* Memorial plaque at entrance */}
      <Box
        args={[2.5, 1.5, 0.15]}
        position={[-bridgeLength / 2 + 1.5, -bridgeHeight / 2 + 1.5, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <meshStandardMaterial
          color="#8b7355"
          metalness={0.3}
          roughness={0.6}
        />
      </Box>

      <Text
        position={[-bridgeLength / 2 + 1.4, -bridgeHeight / 2 + 1.7, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        RANDY PAUSCH
      </Text>

      <Text
        position={[-bridgeLength / 2 + 1.4, -bridgeHeight / 2 + 1.2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.25}
        color="#cccccc"
        anchorX="center"
        anchorY="middle"
      >
        MEMORIAL BRIDGE
      </Text>

      {/* LED lighting strips */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Box
          key={`led-${i}`}
          args={[1.5, 0.08, 0.08]}
          position={[-bridgeLength / 2 + (i + 0.5) * (bridgeLength / 20), bridgeHeight / 2 - 0.3, 0]}
        >
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={0.8}
          />
        </Box>
      ))}

      {/* Purnell Center connection point (simplified building facade) */}
      <Box
        args={[0.8, bridgeHeight + 2, 15]}
        position={[bridgeLength / 2 + 0.4, 0, 0]}
      >
        <meshStandardMaterial
          color="#665544"
          roughness={0.6}
        />
      </Box>

      {/* Purnell sign */}
      <Text
        position={[bridgeLength / 2 + 1, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        PURNELL CENTER
      </Text>

      <Text
        position={[bridgeLength / 2 + 1, -0.8, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        fontSize={0.5}
        color="#cccccc"
        anchorX="center"
        anchorY="middle"
      >
        For the Arts
      </Text>
    </group>
  );
}
