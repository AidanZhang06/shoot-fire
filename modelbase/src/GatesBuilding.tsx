import React, { useMemo } from 'react';
import { Box, Text } from '@react-three/drei';

interface Room {
  x: number;
  z: number;
  width: number;
  depth: number;
  label: string;
  type?: string;
}

interface FloorSection {
  x: number;
  z: number;
  width: number;
  depth: number;
  rotation?: number;
}

interface Level {
  floorNumber: number;
  sections: FloorSection[];
  rooms: Room[];
  offsetX: number;
  hasAtrium: boolean;
  isGlassVolume: boolean;
  hasHallways: boolean;
  mainHallwayWidth: number;
  sideHallwayWidth: number;
}

export function GatesBuilding() {
  const floorHeight = 3.5;
  const wallThickness = 0.3;
  const atriumSize = 10;

  // Define L-shaped building based on satellite view
  const building = useMemo(() => {
    const levels: Level[] = [];

    for (let floorNum = 1; floorNum <= 9; floorNum++) {
      const rooms: Room[] = [];

      // Main wing dimensions (horizontal, east-west)
      const mainWingWidth = 45 - (floorNum - 1) * 1.2;
      const mainWingDepth = 18;

      // Side wing dimensions (vertical, north-south)
      const sideWingWidth = 15;
      const sideWingDepth = 35 - (floorNum - 1) * 1;

      // Offset for upper floors (cantilever)
      const offsetX = floorNum >= 7 ? 2 + (floorNum - 6) * 0.8 : 0;

      // Define the two sections of the L-shape
      const sections: FloorSection[] = [
        // Main horizontal wing
        { x: 0, z: 0, width: mainWingWidth, depth: mainWingDepth },
        // Perpendicular side wing (extends south from west end)
        { x: -mainWingWidth / 2 + sideWingWidth / 2, z: sideWingDepth / 2, width: sideWingWidth, depth: sideWingDepth }
      ];

      // Room distribution based on floor type
      if (floorNum >= 3 && floorNum <= 5) {
        // PUBLIC floors - large spaces
        if (floorNum === 3) {
          // Lecture halls in main wing
          rooms.push({
            x: -mainWingWidth * 0.3,
            z: 0,
            width: 12,
            depth: 14,
            label: '3000\nLecture Hall',
            type: 'lecture'
          });
          rooms.push({
            x: mainWingWidth * 0.25,
            z: 0,
            width: 12,
            depth: 14,
            label: '3001\nLecture Hall',
            type: 'lecture'
          });
        } else if (floorNum === 4) {
          // Admin and classrooms
          rooms.push({
            x: -mainWingWidth * 0.3,
            z: 0,
            width: 10,
            depth: 10,
            label: '4107\nBuilding Facilities',
            type: 'admin'
          });
          rooms.push({
            x: mainWingWidth * 0.25,
            z: 6,
            width: 10,
            depth: 10,
            label: '4100\nClassroom',
            type: 'classroom'
          });
          rooms.push({
            x: mainWingWidth * 0.25,
            z: -6,
            width: 10,
            depth: 10,
            label: '4101\nClassroom',
            type: 'classroom'
          });
        } else if (floorNum === 5) {
          // Café and social spaces
          rooms.push({
            x: -mainWingWidth * 0.25,
            z: 0,
            width: 16,
            depth: 14,
            label: 'La Prima Café',
            type: 'cafe'
          });
          rooms.push({
            x: mainWingWidth * 0.25,
            z: 0,
            width: 10,
            depth: 10,
            label: 'Dean Suite',
            type: 'admin'
          });
        }
      } else if (floorNum >= 6) {
        // MODULAR floors - dense office/lab grid with central hallway
        const hallwayWidth = 2.5; // Central hallway through main wing

        // Main wing offices with hallway
        const mainRoomsPerRow = 6;
        const mainRoomsPerCol = 2;
        const roomDepthEach = (mainWingDepth - hallwayWidth) / 2 / mainRoomsPerCol;

        for (let row = 0; row < mainRoomsPerRow; row++) {
          const roomWidth = mainWingWidth / mainRoomsPerRow;
          const xPos = -mainWingWidth / 2 + (row + 0.5) * roomWidth;

          // Skip atrium area on floor 6
          if (floorNum === 6 && Math.abs(xPos) < atriumSize / 2) continue;

          // North side rooms (above hallway)
          for (let col = 0; col < mainRoomsPerCol; col++) {
            const zPos = hallwayWidth / 2 + (col + 0.5) * roomDepthEach;

            rooms.push({
              x: xPos,
              z: zPos,
              width: roomWidth - 0.8,
              depth: roomDepthEach - 0.5,
              label: `${floorNum}${row}${col}N\n${floorNum >= 8 ? 'PhD' : 'Lab'}`,
              type: floorNum >= 8 ? 'office' : 'lab'
            });
          }

          // South side rooms (below hallway)
          for (let col = 0; col < mainRoomsPerCol; col++) {
            const zPos = -hallwayWidth / 2 - (col + 0.5) * roomDepthEach;

            rooms.push({
              x: xPos,
              z: zPos,
              width: roomWidth - 0.8,
              depth: roomDepthEach - 0.5,
              label: `${floorNum}${row}${col}S\n${floorNum >= 8 ? 'PhD' : 'Lab'}`,
              type: floorNum >= 8 ? 'office' : 'lab'
            });
          }
        }

        // Side wing offices with central hallway
        const sideHallwayWidth = 2.0;
        const sideRoomsPerRow = 2;
        const sideRoomsPerCol = 5;
        const sideRoomWidthEach = (sideWingWidth - sideHallwayWidth) / 2 / sideRoomsPerRow;

        for (let col = 0; col < sideRoomsPerCol; col++) {
          const zPos = (col + 0.5) * (sideWingDepth / sideRoomsPerCol);

          // East side rooms
          for (let row = 0; row < sideRoomsPerRow; row++) {
            const xPos = -mainWingWidth / 2 + sideWingWidth / 2 + sideHallwayWidth / 2 + (row + 0.5) * sideRoomWidthEach;

            rooms.push({
              x: xPos,
              z: zPos,
              width: sideRoomWidthEach - 0.5,
              depth: sideWingDepth / sideRoomsPerCol - 0.8,
              label: `${floorNum}S${row}${col}E\n${floorNum >= 8 ? 'Office' : 'Lab'}`,
              type: floorNum >= 8 ? 'office' : 'lab'
            });
          }

          // West side rooms
          for (let row = 0; row < sideRoomsPerRow; row++) {
            const xPos = -mainWingWidth / 2 + sideWingWidth / 2 - sideHallwayWidth / 2 - (row + 0.5) * sideRoomWidthEach;

            rooms.push({
              x: xPos,
              z: zPos,
              width: sideRoomWidthEach - 0.5,
              depth: sideWingDepth / sideRoomsPerCol - 0.8,
              label: `${floorNum}S${row}${col}W\n${floorNum >= 8 ? 'Office' : 'Lab'}`,
              type: floorNum >= 8 ? 'office' : 'lab'
            });
          }
        }
      }

      levels.push({
        floorNumber: floorNum,
        sections,
        rooms,
        offsetX,
        hasAtrium: floorNum >= 3 && floorNum <= 6,
        isGlassVolume: floorNum >= 6 && floorNum <= 7,
        hasHallways: floorNum >= 6,
        mainHallwayWidth: floorNum >= 6 ? 2.5 : 0,
        sideHallwayWidth: floorNum >= 6 ? 2.0 : 0
      });
    }

    return levels;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {building.map((level: Level, levelIndex: number) => {
        const yPos = levelIndex * floorHeight;

        // Materials
        const outerWallMaterial = level.isGlassVolume ? (
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.15}
            transmission={0.95}
            thickness={0.5}
            roughness={0.05}
            metalness={0.05}
          />
        ) : (
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.3}
            metalness={0.7}
            roughness={0.3}
          />
        );

        return (
          <group key={levelIndex} position={[level.offsetX, yPos, 0]}>
            {/* Floor label */}
            <Text
              position={[0, floorHeight + 1.5, 30]}
              fontSize={0.8}
              color="#00ffff"
              anchorX="center"
              anchorY="middle"
            >
              FLOOR {level.floorNumber}
            </Text>

            {/* Render each section of the L-shape */}
            {level.sections.map((section: FloorSection, sectionIndex: number) => (
              <group key={sectionIndex}>
                {/* Floor plate */}
                <Box
                  args={[section.width, 0.3, section.depth]}
                  position={[section.x, 0, section.z]}
                >
                  <meshStandardMaterial color="#555555" />
                </Box>

                {/* Atrium void in main wing only, for L3-L6 */}
                {level.hasAtrium && sectionIndex === 0 && (
                  <Box
                    args={[atriumSize, 0.31, atriumSize]}
                    position={[section.x, 0, section.z]}
                  >
                    <meshStandardMaterial
                      color="#000000"
                      transparent
                      opacity={0.05}
                    />
                  </Box>
                )}

                {/* Hallway markings for modular floors */}
                {level.hasHallways && sectionIndex === 0 && (
                  <Box
                    args={[section.width, 0.31, level.mainHallwayWidth]}
                    position={[section.x, 0.01, section.z]}
                  >
                    <meshStandardMaterial
                      color="#666666"
                      transparent
                      opacity={0.8}
                    />
                  </Box>
                )}

                {level.hasHallways && sectionIndex === 1 && (
                  <Box
                    args={[level.sideHallwayWidth, 0.31, section.depth]}
                    position={[section.x, 0.01, section.z]}
                  >
                    <meshStandardMaterial
                      color="#666666"
                      transparent
                      opacity={0.8}
                    />
                  </Box>
                )}

                {/* Section outer walls */}
                {/* North wall */}
                <Box
                  args={[section.width + wallThickness * 2, floorHeight, wallThickness]}
                  position={[section.x, floorHeight / 2, section.z + section.depth / 2]}
                >
                  {outerWallMaterial}
                </Box>

                {/* South wall */}
                <Box
                  args={[section.width + wallThickness * 2, floorHeight, wallThickness]}
                  position={[section.x, floorHeight / 2, section.z - section.depth / 2]}
                >
                  {outerWallMaterial}
                </Box>

                {/* East wall */}
                <Box
                  args={[wallThickness, floorHeight, section.depth + wallThickness * 2]}
                  position={[section.x + section.width / 2, floorHeight / 2, section.z]}
                >
                  {outerWallMaterial}
                </Box>

                {/* West wall */}
                <Box
                  args={[wallThickness, floorHeight, section.depth + wallThickness * 2]}
                  position={[section.x - section.width / 2, floorHeight / 2, section.z]}
                >
                  {outerWallMaterial}
                </Box>
              </group>
            ))}

            {/* Pausch Bridge connection on floor 4 */}
            {level.floorNumber === 4 && (
              <Box
                args={[8, floorHeight, 4]}
                position={[level.sections[0].width / 2 + 4, floorHeight / 2, 0]}
              >
                <meshStandardMaterial
                  color="#88ccff"
                  transparent
                  opacity={0.4}
                  emissive="#0088ff"
                  emissiveIntensity={0.3}
                />
              </Box>
            )}

            {/* Rooms */}
            {level.rooms.map((room: Room, roomIndex: number) => {
              const roomColor =
                room.type === 'cafe' ? '#ff8844' :
                room.type === 'admin' ? '#4488ff' :
                room.type === 'lab' ? '#88ff44' :
                room.type === 'lecture' ? '#ff44ff' :
                '#ffffff';

              const roomOpacity = (room.type === 'office' || room.type === 'lab') ? 0.05 : 0.15;

              return (
                <group key={roomIndex}>
                  {/* Room walls */}
                  <Box
                    args={[room.width - wallThickness * 0.5, floorHeight * 0.85, wallThickness * 0.3]}
                    position={[room.x, floorHeight / 2, room.z + room.depth / 2]}
                  >
                    <meshStandardMaterial
                      color={roomColor}
                      transparent
                      opacity={roomOpacity}
                      emissive={roomColor}
                      emissiveIntensity={0.08}
                    />
                  </Box>

                  <Box
                    args={[room.width - wallThickness * 0.5, floorHeight * 0.85, wallThickness * 0.3]}
                    position={[room.x, floorHeight / 2, room.z - room.depth / 2]}
                  >
                    <meshStandardMaterial
                      color={roomColor}
                      transparent
                      opacity={roomOpacity}
                      emissive={roomColor}
                      emissiveIntensity={0.08}
                    />
                  </Box>

                  <Box
                    args={[wallThickness * 0.3, floorHeight * 0.85, room.depth - wallThickness * 0.5]}
                    position={[room.x + room.width / 2, floorHeight / 2, room.z]}
                  >
                    <meshStandardMaterial
                      color={roomColor}
                      transparent
                      opacity={roomOpacity}
                      emissive={roomColor}
                      emissiveIntensity={0.08}
                    />
                  </Box>

                  <Box
                    args={[wallThickness * 0.3, floorHeight * 0.85, room.depth - wallThickness * 0.5]}
                    position={[room.x - room.width / 2, floorHeight / 2, room.z]}
                  >
                    <meshStandardMaterial
                      color={roomColor}
                      transparent
                      opacity={roomOpacity}
                      emissive={roomColor}
                      emissiveIntensity={0.08}
                    />
                  </Box>

                  {/* Room label */}
                  <Text
                    position={[room.x, 0.4, room.z]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    fontSize={0.25}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                  >
                    {room.label}
                  </Text>
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
