import React, { useMemo } from 'react';
import { Box, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Room {
  x: number;
  z: number;
  width: number;
  depth: number;
  label: string;
}

interface Floor {
  rooms: Room[];
  floorNumber: number;
}

export function RandomSchoolBuilding() {
  // Generate random building configuration
  const buildingConfig = useMemo(() => {
    const numFloors = Math.floor(Math.random() * 3) + 3; // 3-5 floors
    const roomsPerRow = Math.floor(Math.random() * 2) + 3; // 3-4 rooms per row
    const roomsPerCol = Math.floor(Math.random() * 2) + 3; // 3-4 rooms per column
    const roomWidth = 6;
    const roomDepth = 5;
    const wallThickness = 0.3;
    const floorHeight = 3.5;

    const buildingWidth = roomsPerRow * roomWidth + (roomsPerRow + 1) * wallThickness;
    const buildingDepth = roomsPerCol * roomDepth + (roomsPerCol + 1) * wallThickness;

    // Generate floors
    const floors: Floor[] = [];
    for (let f = 0; f < numFloors; f++) {
      const rooms: Room[] = [];

      // Generate rooms in grid
      for (let row = 0; row < roomsPerRow; row++) {
        for (let col = 0; col < roomsPerCol; col++) {
          const x = -buildingWidth / 2 + (row + 0.5) * roomWidth + (row + 1) * wallThickness;
          const z = -buildingDepth / 2 + (col + 0.5) * roomDepth + (col + 1) * wallThickness;

          // Generate random room type
          const roomTypes = ['Classroom', 'Lab', 'Office', 'Library', 'Study', 'Lecture'];
          const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
          const roomNumber = `${f + 1}${String.fromCharCode(65 + row)}${col + 1}`;

          rooms.push({
            x,
            z,
            width: roomWidth,
            depth: roomDepth,
            label: `${roomNumber}\n${roomType}`
          });
        }
      }

      floors.push({
        rooms,
        floorNumber: f + 1
      });
    }

    return {
      numFloors,
      roomsPerRow,
      roomsPerCol,
      roomWidth,
      roomDepth,
      wallThickness,
      floorHeight,
      buildingWidth,
      buildingDepth,
      floors
    };
  }, []);

  const { buildingWidth, buildingDepth, wallThickness, floorHeight, floors } = buildingConfig;

  return (
    <group>
      {/* Render each floor */}
      {floors.map((floor, floorIndex) => (
        <group key={floorIndex} position={[0, floorIndex * floorHeight, 0]}>
          {/* Floor plate */}
          <Box
            args={[buildingWidth, 0.2, buildingDepth]}
            position={[0, -0.1, 0]}
          >
            <meshStandardMaterial color="#555555" />
          </Box>

          {/* Outer walls */}
          {/* North wall */}
          <Box
            args={[buildingWidth + wallThickness * 2, floorHeight, wallThickness]}
            position={[0, floorHeight / 2, buildingDepth / 2]}
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
            args={[buildingWidth + wallThickness * 2, floorHeight, wallThickness]}
            position={[0, floorHeight / 2, -buildingDepth / 2]}
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
            args={[wallThickness, floorHeight, buildingDepth + wallThickness * 2]}
            position={[buildingWidth / 2, floorHeight / 2, 0]}
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
            args={[wallThickness, floorHeight, buildingDepth + wallThickness * 2]}
            position={[-buildingWidth / 2, floorHeight / 2, 0]}
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
              {/* Room walls (4 walls per room) */}
              {/* North wall */}
              <Box
                args={[room.width, floorHeight, wallThickness]}
                position={[room.x, floorHeight / 2, room.z + room.depth / 2]}
              >
                <meshStandardMaterial
                  color="#ffffff"
                  transparent
                  opacity={0.25}
                  emissive="#4444ff"
                  emissiveIntensity={0.15}
                />
              </Box>

              {/* South wall */}
              <Box
                args={[room.width, floorHeight, wallThickness]}
                position={[room.x, floorHeight / 2, room.z - room.depth / 2]}
              >
                <meshStandardMaterial
                  color="#ffffff"
                  transparent
                  opacity={0.25}
                  emissive="#4444ff"
                  emissiveIntensity={0.15}
                />
              </Box>

              {/* East wall (with random door) */}
              {Math.random() > 0.3 ? (
                <>
                  <Box
                    args={[wallThickness, floorHeight, room.depth]}
                    position={[room.x + room.width / 2, floorHeight / 2, room.z]}
                  >
                    <meshStandardMaterial
                      color="#ffffff"
                      transparent
                      opacity={0.25}
                      emissive="#4444ff"
                      emissiveIntensity={0.15}
                    />
                  </Box>
                </>
              ) : (
                // Door in east wall
                <>
                  <Box
                    args={[wallThickness, floorHeight, room.depth * 0.3]}
                    position={[room.x + room.width / 2, floorHeight / 2, room.z - room.depth * 0.35]}
                  >
                    <meshStandardMaterial
                      color="#ffffff"
                      transparent
                      opacity={0.25}
                      emissive="#4444ff"
                      emissiveIntensity={0.15}
                    />
                  </Box>
                  <Box
                    args={[wallThickness, floorHeight, room.depth * 0.3]}
                    position={[room.x + room.width / 2, floorHeight / 2, room.z + room.depth * 0.35]}
                  >
                    <meshStandardMaterial
                      color="#ffffff"
                      transparent
                      opacity={0.25}
                      emissive="#4444ff"
                      emissiveIntensity={0.15}
                    />
                  </Box>
                  <Box
                    args={[wallThickness * 1.5, 2.2, 1.2]}
                    position={[room.x + room.width / 2, 1.1, room.z]}
                  >
                    <meshStandardMaterial color="#8b4513" transparent opacity={0.8} />
                  </Box>
                </>
              )}

              {/* West wall (with random door) */}
              {Math.random() > 0.3 ? (
                <Box
                  args={[wallThickness, floorHeight, room.depth]}
                  position={[room.x - room.width / 2, floorHeight / 2, room.z]}
                >
                  <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.25}
                    emissive="#4444ff"
                    emissiveIntensity={0.15}
                  />
                </Box>
              ) : (
                // Door in west wall
                <>
                  <Box
                    args={[wallThickness, floorHeight, room.depth * 0.3]}
                    position={[room.x - room.width / 2, floorHeight / 2, room.z - room.depth * 0.35]}
                  >
                    <meshStandardMaterial
                      color="#ffffff"
                      transparent
                      opacity={0.25}
                      emissive="#4444ff"
                      emissiveIntensity={0.15}
                    />
                  </Box>
                  <Box
                    args={[wallThickness, floorHeight, room.depth * 0.3]}
                    position={[room.x - room.width / 2, floorHeight / 2, room.z + room.depth * 0.35]}
                  >
                    <meshStandardMaterial
                      color="#ffffff"
                      transparent
                      opacity={0.25}
                      emissive="#4444ff"
                      emissiveIntensity={0.15}
                    />
                  </Box>
                  <Box
                    args={[wallThickness * 1.5, 2.2, 1.2]}
                    position={[room.x - room.width / 2, 1.1, room.z]}
                  >
                    <meshStandardMaterial color="#8b4513" transparent opacity={0.8} />
                  </Box>
                </>
              )}

              {/* Room label */}
              <Text
                position={[room.x, 0.3, room.z]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.4}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                {room.label}
              </Text>
            </group>
          ))}

          {/* Stairs (connecting to next floor) */}
          {floorIndex < floors.length - 1 && (
            <group position={[buildingWidth / 2 - 2, 0, buildingDepth / 2 - 2]}>
              {Array.from({ length: 10 }).map((_, stepIndex) => {
                const stepHeight = floorHeight / 10;
                const stepDepth = 0.3;
                return (
                  <Box
                    key={stepIndex}
                    args={[2, stepHeight, stepDepth]}
                    position={[0, stepIndex * stepHeight + stepHeight / 2, -stepIndex * stepDepth]}
                  >
                    <meshStandardMaterial color="#654321" transparent opacity={0.7} />
                  </Box>
                );
              })}
              {/* Stair label */}
              <Text
                position={[0, 0.5, 0.5]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.5}
                color="#ffff00"
                anchorX="center"
                anchorY="middle"
              >
                STAIRS
              </Text>
            </group>
          )}

          {/* Floor number label */}
          <Text
            position={[0, floorHeight + 0.5, 0]}
            fontSize={0.8}
            color="#00ffff"
            anchorX="center"
            anchorY="middle"
          >
            FLOOR {floor.floorNumber}
          </Text>
        </group>
      ))}
    </group>
  );
}
