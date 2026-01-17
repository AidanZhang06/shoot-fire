import React from 'react';
import { Box, Cylinder } from '@react-three/drei';

export function ConnectingBridges() {
  const floorHeight = 3.5;
  const bridgeWidth = 4;
  const bridgeLength = 25; // Distance between Gates and Hillman
  const bridgeHeight = 2.8;

  // Bridges at different floor levels
  const bridgeFloors = [2, 3, 4, 5]; // Connect at floors 2, 3, 4, and 5

  return (
    <group>
      {bridgeFloors.map((floorNum) => {
        const yPos = (floorNum - 1) * floorHeight + floorHeight / 2;

        return (
          <group key={floorNum} position={[-30, yPos, 0]}>
            {/* Main bridge structure */}
            <Box args={[bridgeLength, bridgeHeight, bridgeWidth]}>
              <meshPhysicalMaterial
                color="#ffffff"
                transparent
                opacity={0.15}
                transmission={0.95}
                thickness={0.5}
                roughness={0.05}
                metalness={0.05}
              />
            </Box>

            {/* Glass walls on sides */}
            <Box
              args={[bridgeLength, bridgeHeight - 0.5, 0.1]}
              position={[0, 0, bridgeWidth / 2]}
            >
              <meshPhysicalMaterial
                color="#ffffff"
                transparent
                opacity={0.1}
                transmission={0.95}
                thickness={0.3}
                roughness={0.05}
                metalness={0.05}
              />
            </Box>

            <Box
              args={[bridgeLength, bridgeHeight - 0.5, 0.1]}
              position={[0, 0, -bridgeWidth / 2]}
            >
              <meshPhysicalMaterial
                color="#ffffff"
                transparent
                opacity={0.1}
                transmission={0.95}
                thickness={0.3}
                roughness={0.05}
                metalness={0.05}
              />
            </Box>

            {/* Floor */}
            <Box
              args={[bridgeLength, 0.15, bridgeWidth]}
              position={[0, -bridgeHeight / 2, 0]}
            >
              <meshStandardMaterial color="#666666" />
            </Box>

            {/* Support beams underneath */}
            <Box
              args={[bridgeLength, 0.3, 0.3]}
              position={[0, -bridgeHeight / 2 - 0.5, bridgeWidth / 4]}
            >
              <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
            </Box>

            <Box
              args={[bridgeLength, 0.3, 0.3]}
              position={[0, -bridgeHeight / 2 - 0.5, -bridgeWidth / 4]}
            >
              <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
            </Box>

            {/* Support columns at ends */}
            <Cylinder
              args={[0.4, 0.4, bridgeHeight + 2, 8]}
              position={[-bridgeLength / 2 + 2, -1, bridgeWidth / 3]}
            >
              <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
            </Cylinder>

            <Cylinder
              args={[0.4, 0.4, bridgeHeight + 2, 8]}
              position={[-bridgeLength / 2 + 2, -1, -bridgeWidth / 3]}
            >
              <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
            </Cylinder>

            <Cylinder
              args={[0.4, 0.4, bridgeHeight + 2, 8]}
              position={[bridgeLength / 2 - 2, -1, bridgeWidth / 3]}
            >
              <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
            </Cylinder>

            <Cylinder
              args={[0.4, 0.4, bridgeHeight + 2, 8]}
              position={[bridgeLength / 2 - 2, -1, -bridgeWidth / 3]}
            >
              <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
            </Cylinder>
          </group>
        );
      })}
    </group>
  );
}
