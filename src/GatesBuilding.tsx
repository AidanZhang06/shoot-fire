import React, { useMemo } from 'react';
import { Box, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Room {
  x: number;
  z: number;
  width: number;
  depth: number;
  label: string;
  color?: string;
}

interface FloorSection {
  x: number;
  z: number;
  width: number;
  depth: number;
  rooms: Room[];
}

export function GatesBuilding() {
  const floorHeight = 3.5;
  const wallThickness = 0.3;

  // Define the unique L-shaped structure of Gates building for each floor
  const buildingFloors = useMemo(() => {
    const floors = [];

    for (let floorNum = 1; floorNum <= 9; floorNum++) {
      const floorSections: FloorSection[] = [];

      // Main wing (horizontal section)
      const mainWingWidth = 45;
      const mainWingDepth = 18;

      // Side wing (vertical section) - creates the L-shape
      const sideWingWidth = 15;
      const sideWingDepth = 35;

      // Different floors have different overhangs (cantilever effect)
      let mainExtension = 0;
      let sideExtension = 0;

      if (floorNum >= 2 && floorNum <= 4) {
        // Lower-middle floors extend out
        mainExtension = 3;
      } else if (floorNum >= 5 && floorNum <= 7) {
        // Middle-upper floors extend even more
        mainExtension = 5;
        sideExtension = 2;
      } else if (floorNum >= 8) {
        // Top floors are slightly smaller
        mainExtension = 2;
        sideExtension = 1;
      }

      // Main wing section
      const mainSection: FloorSection = {
        x: 0,
        z: 0,
        width: mainWingWidth + mainExtension,
        depth: mainWingDepth,
        rooms: []
      };

      // Generate rooms for main section
      const mainRoomsPerRow = Math.floor(Math.random() * 3) + 5; // 5-7 rooms
      const mainRoomWidth = mainSection.width / mainRoomsPerRow;
      const mainRoomsPerCol = 2; // 2 rooms deep
      const mainRoomDepth = mainSection.depth / mainRoomsPerCol;

      for (let row = 0; row < mainRoomsPerRow; row++) {
        for (let col = 0; col < mainRoomsPerCol; col++) {
          const roomTypes = ['Office', 'Lab', 'Classroom', 'Study', 'Conference', 'Research'];
          const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
          const roomNum = `${floorNum}${String.fromCharCode(65 + row)}${col + 1}`;

          mainSection.rooms.push({
            x: mainSection.x - mainSection.width / 2 + (row + 0.5) * mainRoomWidth,
            z: mainSection.z - mainSection.depth / 2 + (col + 0.5) * mainRoomDepth,
            width: mainRoomWidth,
            depth: mainRoomDepth,
            label: `${roomNum}\n${roomType}`
          });
        }
      }

      floorSections.push(mainSection);

      // Side wing section (perpendicular to main wing)
      const sideSection: FloorSection = {
        x: -mainWingWidth / 2 + sideWingWidth / 2,
        z: sideWingDepth / 2,
        width: sideWingWidth + sideExtension,
        depth: sideWingDepth,
        rooms: []
      };

      // Generate rooms for side section
      const sideRoomsPerRow = 2;
      const sideRoomWidth = sideSection.width / sideRoomsPerRow;
      const sideRoomsPerCol = Math.floor(Math.random() * 3) + 4; // 4-6 rooms
      const sideRoomDepth = sideSection.depth / sideRoomsPerCol;

      for (let row = 0; row < sideRoomsPerRow; row++) {
        for (let col = 0; col < sideRoomsPerCol; col++) {
          const roomTypes = ['Office', 'Lab', 'Meeting', 'Server', 'Storage', 'Lounge'];
          const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
          const roomNum = `${floorNum}${String.fromCharCode(72 + row)}${col + 1}`;

          sideSection.rooms.push({
            x: sideSection.x - sideSection.width / 2 + (row + 0.5) * sideRoomWidth,
            z: sideSection.z - sideSection.depth / 2 + (col + 0.5) * sideRoomDepth,
            width: sideRoomWidth,
            depth: sideRoomDepth,
            label: `${roomNum}\n${roomType}`
          });
        }
      }

      floorSections.push(sideSection);

      // Special features for certain floors
      if (floorNum === 5) {
        // Add a circular auditorium on floor 5
        const auditorium: Room = {
          x: 10,
          z: 0,
          width: 8,
          depth: 8,
          label: 'Auditorium',
          color: '#ff6600'
        };
        mainSection.rooms.push(auditorium);
      }

      floors.push({
        floorNumber: floorNum,
        sections: floorSections
      });
    }

    return floors;
  }, []);

  return (
    <group>
      {/* Render each floor */}
      {buildingFloors.map((floor, floorIndex) => (
        <group key={floorIndex} position={[0, floorIndex * floorHeight, 0]}>
          {/* Floor label */}
          <Text
            position={[0, floorHeight + 1, 0]}
            fontSize={1.2}
            color="#00ffff"
            anchorX="center"
            anchorY="middle"
          >
            FLOOR {floor.floorNumber}
          </Text>

          {/* Render each section of the floor */}
          {floor.sections.map((section, sectionIndex) => (
            <group key={sectionIndex}>
              {/* Floor plate */}
              <Box
                args={[section.width, 0.2, section.depth]}
                position={[section.x, -0.1, section.z]}
              >
                <meshStandardMaterial color="#555555" />
              </Box>

              {/* Section outer walls */}
              {/* North wall */}
              <Box
                args={[section.width + wallThickness * 2, floorHeight, wallThickness]}
                position={[section.x, floorHeight / 2, section.z + section.depth / 2]}
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
                args={[section.width + wallThickness * 2, floorHeight, wallThickness]}
                position={[section.x, floorHeight / 2, section.z - section.depth / 2]}
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
                args={[wallThickness, floorHeight, section.depth + wallThickness * 2]}
                position={[section.x + section.width / 2, floorHeight / 2, section.z]}
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
                args={[wallThickness, floorHeight, section.depth + wallThickness * 2]}
                position={[section.x - section.width / 2, floorHeight / 2, section.z]}
              >
                <meshStandardMaterial
                  color="#ffffff"
                  transparent
                  opacity={0.3}
                  emissive="#4444ff"
                  emissiveIntensity={0.2}
                />
              </Box>

              {/* Rooms within this section */}
              {section.rooms.map((room, roomIndex) => (
                <group key={roomIndex}>
                  {/* Room walls - create interior partitions */}
                  {/* North wall */}
                  <Box
                    args={[room.width - wallThickness, floorHeight * 0.9, wallThickness * 0.5]}
                    position={[room.x, floorHeight / 2, room.z + room.depth / 2]}
                  >
                    <meshStandardMaterial
                      color={room.color || '#ffffff'}
                      transparent
                      opacity={0.2}
                      emissive="#4444ff"
                      emissiveIntensity={0.1}
                    />
                  </Box>

                  {/* South wall */}
                  <Box
                    args={[room.width - wallThickness, floorHeight * 0.9, wallThickness * 0.5]}
                    position={[room.x, floorHeight / 2, room.z - room.depth / 2]}
                  >
                    <meshStandardMaterial
                      color={room.color || '#ffffff'}
                      transparent
                      opacity={0.2}
                      emissive="#4444ff"
                      emissiveIntensity={0.1}
                    />
                  </Box>

                  {/* East wall with occasional door */}
                  {Math.random() > 0.4 ? (
                    <Box
                      args={[wallThickness * 0.5, floorHeight * 0.9, room.depth - wallThickness]}
                      position={[room.x + room.width / 2, floorHeight / 2, room.z]}
                    >
                      <meshStandardMaterial
                        color={room.color || '#ffffff'}
                        transparent
                        opacity={0.2}
                        emissive="#4444ff"
                        emissiveIntensity={0.1}
                      />
                    </Box>
                  ) : (
                    // Door opening
                    <Box
                      args={[wallThickness * 1.2, 2.2, 1.0]}
                      position={[room.x + room.width / 2, 1.1, room.z]}
                    >
                      <meshStandardMaterial color="#8b4513" transparent opacity={0.7} />
                    </Box>
                  )}

                  {/* West wall with occasional door */}
                  {Math.random() > 0.4 ? (
                    <Box
                      args={[wallThickness * 0.5, floorHeight * 0.9, room.depth - wallThickness]}
                      position={[room.x - room.width / 2, floorHeight / 2, room.z]}
                    >
                      <meshStandardMaterial
                        color={room.color || '#ffffff'}
                        transparent
                        opacity={0.2}
                        emissive="#4444ff"
                        emissiveIntensity={0.1}
                      />
                    </Box>
                  ) : (
                    // Door opening
                    <Box
                      args={[wallThickness * 1.2, 2.2, 1.0]}
                      position={[room.x - room.width / 2, 1.1, room.z]}
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

          {/* Stairs connecting to next floor */}
          {floorIndex < buildingFloors.length - 1 && (
            <group position={[-20, 0, 0]}>
              {Array.from({ length: 10 }).map((_, stepIndex) => {
                const stepHeight = floorHeight / 10;
                const stepDepth = 0.35;
                return (
                  <Box
                    key={stepIndex}
                    args={[2.5, stepHeight, stepDepth]}
                    position={[0, stepIndex * stepHeight + stepHeight / 2, -stepIndex * stepDepth]}
                  >
                    <meshStandardMaterial color="#654321" transparent opacity={0.7} />
                  </Box>
                );
              })}
              <Text
                position={[0, 0.5, 0.8]}
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
        </group>
      ))}

      {/* Add the distinctive cantilever support pillars */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Box
          key={`pillar-${i}`}
          args={[1.5, floorHeight * 3, 1.5]}
          position={[-15 + i * 10, floorHeight * 1.5, -8]}
        >
          <meshStandardMaterial
            color="#666666"
            metalness={0.6}
            roughness={0.4}
          />
        </Box>
      ))}
    </group>
  );
}
