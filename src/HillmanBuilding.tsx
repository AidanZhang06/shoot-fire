import React, { useMemo } from 'react';
import { Box, Text } from '@react-three/drei';

interface Room {
  x: number;
  z: number;
  width: number;
  depth: number;
  label: string;
}

export function HillmanBuilding() {
  const floorHeight = 3.5;
  const wallThickness = 0.3;
  const numFloors = 7; // Hillman has 7 floors

  // Hillman building configuration - more rectangular than Gates
  const buildingConfig = useMemo(() => {
    const floors = [];
    const buildingWidth = 35;
    const buildingDepth = 25;

    for (let floorNum = 1; floorNum <= numFloors; floorNum++) {
      const rooms: Room[] = [];

      // Generate room layout
      const roomsPerRow = Math.floor(Math.random() * 2) + 4; // 4-5 rooms
      const roomsPerCol = Math.floor(Math.random() * 2) + 3; // 3-4 rooms
      const roomWidth = buildingWidth / roomsPerRow;
      const roomDepth = buildingDepth / roomsPerCol;

      for (let row = 0; row < roomsPerRow; row++) {
        for (let col = 0; col < roomsPerCol; col++) {
          const roomTypes = ['Lab', 'Office', 'Classroom', 'Study', 'Conference', 'Library'];
          const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
          const roomNum = `H${floorNum}${String.fromCharCode(65 + row)}${col + 1}`;

          rooms.push({
            x: -buildingWidth / 2 + (row + 0.5) * roomWidth,
            z: -buildingDepth / 2 + (col + 0.5) * roomDepth,
            width: roomWidth,
            depth: roomDepth,
            label: `${roomNum}\n${roomType}`
          });
        }
      }

      floors.push({
        floorNumber: floorNum,
        buildingWidth,
        buildingDepth,
        rooms
      });
    }

    return { floors, buildingWidth, buildingDepth };
  }, []);

  return (
    <group position={[-60, 0, 0]}> {/* Position to the left of Gates */}
      {buildingConfig.floors.map((floor, floorIndex) => (
        <group key={floorIndex} position={[0, floorIndex * floorHeight, 0]}>
          {/* Floor label */}
          <Text
            position={[0, floorHeight + 1, 0]}
            fontSize={1.2}
            color="#00ffff"
            anchorX="center"
            anchorY="middle"
          >
            HILLMAN {floor.floorNumber}
          </Text>

          {/* Floor plate */}
          <Box
            args={[floor.buildingWidth, 0.2, floor.buildingDepth]}
            position={[0, -0.1, 0]}
          >
            <meshStandardMaterial color="#555555" />
          </Box>

          {/* Outer walls */}
          {/* North wall */}
          <Box
            args={[floor.buildingWidth + wallThickness * 2, floorHeight, wallThickness]}
            position={[0, floorHeight / 2, floor.buildingDepth / 2]}
          >
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.3}
              emissive="#4444ff"
              emissiveIntensity={0.2}
            />
          </Box>

          {/* South wall */}
          <Box
            args={[floor.buildingWidth + wallThickness * 2, floorHeight, wallThickness]}
            position={[0, floorHeight / 2, -floor.buildingDepth / 2]}
          >
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.3}
              emissive="#4444ff"
              emissiveIntensity={0.2}
            />
          </Box>

          {/* East wall */}
          <Box
            args={[wallThickness, floorHeight, floor.buildingDepth + wallThickness * 2]}
            position={[floor.buildingWidth / 2, floorHeight / 2, 0]}
          >
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.3}
              emissive="#4444ff"
              emissiveIntensity={0.2}
            />
          </Box>

          {/* West wall */}
          <Box
            args={[wallThickness, floorHeight, floor.buildingDepth + wallThickness * 2]}
            position={[-floor.buildingWidth / 2, floorHeight / 2, 0]}
          >
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.3}
              emissive="#4444ff"
              emissiveIntensity={0.2}
            />
          </Box>

          {/* Rooms */}
          {floor.rooms.map((room, roomIndex) => (
            <group key={roomIndex}>
              {/* Room walls */}
              <Box
                args={[room.width - wallThickness, floorHeight * 0.9, wallThickness * 0.5]}
                position={[room.x, floorHeight / 2, room.z + room.depth / 2]}
              >
                <meshStandardMaterial
                  color="#ffffff"
                  transparent
                  opacity={0.2}
                  emissive="#4444ff"
                  emissiveIntensity={0.1}
                />
              </Box>

              <Box
                args={[room.width - wallThickness, floorHeight * 0.9, wallThickness * 0.5]}
                position={[room.x, floorHeight / 2, room.z - room.depth / 2]}
              >
                <meshStandardMaterial
                  color="#ffffff"
                  transparent
                  opacity={0.2}
                  emissive="#4444ff"
                  emissiveIntensity={0.1}
                />
              </Box>

              {Math.random() > 0.4 ? (
                <Box
                  args={[wallThickness * 0.5, floorHeight * 0.9, room.depth - wallThickness]}
                  position={[room.x + room.width / 2, floorHeight / 2, room.z]}
                >
                  <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.2}
                    emissive="#4444ff"
                    emissiveIntensity={0.1}
                  />
                </Box>
              ) : (
                <Box
                  args={[wallThickness * 1.2, 2.2, 1.0]}
                  position={[room.x + room.width / 2, 1.1, room.z]}
                >
                  <meshStandardMaterial color="#8b4513" transparent opacity={0.7} />
                </Box>
              )}

              {/* Room label */}
              <Text
                position={[room.x, 0.3, room.z]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.35}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                {room.label}
              </Text>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}
