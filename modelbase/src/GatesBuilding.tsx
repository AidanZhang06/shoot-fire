import React, { useMemo } from 'react';
import { Box, Text } from '@react-three/drei';
import { FloorQuadrants } from './components/FloorQuadrants';

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

interface GatesBuildingProps {
  playerPosition?: [number, number, number];
  renderDistance?: number;
}

export function GatesBuilding({ playerPosition = [0, 0, 0], renderDistance = 30 }: GatesBuildingProps = {}) {
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
      if (floorNum === 1) {
        // GROUND FLOOR - Lobby and public spaces
        rooms.push({
          x: 0,
          z: 0,
          width: 22,
          depth: 14,
          label: 'Main Lobby\n& Reception',
          type: 'lobby'
        });
        rooms.push({
          x: mainWingWidth * 0.3,
          z: 0,
          width: 8,
          depth: 8,
          label: 'Security\nDesk',
          type: 'security'
        });
        rooms.push({
          x: -mainWingWidth * 0.3,
          z: 0,
          width: 8,
          depth: 8,
          label: 'Mailroom\n& Package Center',
          type: 'admin'
        });
        rooms.push({
          x: -mainWingWidth / 2 + sideWingWidth / 2,
          z: sideWingDepth * 0.3,
          width: sideWingWidth - 2,
          depth: sideWingDepth * 0.4,
          label: 'Exhibition\nHall',
          type: 'lounge'
        });
      } else if (floorNum === 2) {
        // FLOOR 2 - Infrastructure and services
        rooms.push({
          x: mainWingWidth * 0.25,
          z: 0,
          width: 12,
          depth: 10,
          label: 'Server Room\nIT Infrastructure',
          type: 'server'
        });
        rooms.push({
          x: -mainWingWidth * 0.25,
          z: 0,
          width: 10,
          depth: 10,
          label: 'Mechanical\nRoom',
          type: 'mechanical'
        });
        rooms.push({
          x: -mainWingWidth / 2 + sideWingWidth / 2,
          z: sideWingDepth * 0.35,
          width: sideWingWidth - 2,
          depth: sideWingDepth * 0.5,
          label: 'Loading Dock\n& Facilities',
          type: 'storage'
        });
      } else if (floorNum >= 3 && floorNum <= 5) {
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
            z: 0,
            width: 10,
            depth: 10,
            label: '4100\nClassroom',
            type: 'classroom'
          });
        } else if (floorNum === 5) {
          // Floor 5 - Large social spaces, lounges, and café
          // Large café/dining area in west section
          rooms.push({
            x: -mainWingWidth * 0.3,
            z: 0,
            width: 18,
            depth: 16,
            label: 'La Prima Café\n& Dining Hall',
            type: 'cafe'
          });

          // Student lounge in east section
          rooms.push({
            x: mainWingWidth * 0.3,
            z: 0,
            width: 16,
            depth: 14,
            label: 'Student Lounge\n& Common Area',
            type: 'lounge'
          });

          // Side wing - faculty lounge
          rooms.push({
            x: -mainWingWidth / 2 + sideWingWidth / 2,
            z: sideWingDepth * 0.7,
            width: sideWingWidth - 2,
            depth: sideWingDepth * 0.35,
            label: 'Faculty\nLounge',
            type: 'lounge'
          });
        }
      } else if (floorNum === 6) {
        // Floor 6 - Large research commons, lounges, and collaborative spaces
        // Central innovation lab (large open space)
        rooms.push({
          x: 0,
          z: 0,
          width: 20,
          depth: 14,
          label: 'Innovation Lab\n& Research Commons',
          type: 'lab'
        });

        // East wing - large conference room
        rooms.push({
          x: mainWingWidth * 0.35,
          z: 0,
          width: 14,
          depth: 12,
          label: 'Grand Conference\nRoom',
          type: 'conference'
        });

        // West wing - lounge and breakout spaces
        rooms.push({
          x: -mainWingWidth * 0.35,
          z: 0,
          width: 14,
          depth: 12,
          label: 'Research Lounge\n& Breakout Space',
          type: 'lounge'
        });

        // Side wing - large lab/maker space
        rooms.push({
          x: -mainWingWidth / 2 + sideWingWidth / 2,
          z: sideWingDepth * 0.3,
          width: sideWingWidth - 2,
          depth: sideWingDepth * 0.5,
          label: 'Maker Space\n& Fabrication Lab',
          type: 'lab'
        });

        // Side wing - project rooms
        rooms.push({
          x: -mainWingWidth / 2 + sideWingWidth / 2,
          z: sideWingDepth * 0.75,
          width: sideWingWidth - 2,
          depth: sideWingDepth * 0.3,
          label: 'Project Team\nRooms',
          type: 'office'
        });
      } else if (floorNum >= 7) {
        // MODULAR floors (7-9) - dense office/lab grid with central hallway
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
        isGlassVolume: true,
        hasHallways: floorNum >= 6,
        mainHallwayWidth: floorNum >= 6 ? 2.5 : 0,
        sideHallwayWidth: floorNum >= 6 ? 2.0 : 0
      });
    }

    return levels;
  }, []);

  // Quadrant positions for all floors
  const quadrants = useMemo(() => {
    const result = [];
    for (let floorNum = 1; floorNum <= 9; floorNum++) {
      const mainWingWidth = 45 - (floorNum - 1) * 1.2;
      const offsetX = floorNum >= 7 ? 2 + (floorNum - 6) * 0.8 : 0;
      
      // Q1: East-Center (same Z as Q2)
      result.push({
        label: 'Q1',
        position: [-5 + mainWingWidth * 0.4 + offsetX, 0.5, 0],
        floor: floorNum
      });
      
      // Q2: Center (adjusted for offset, moved up a bit in Y)
      result.push({
        label: 'Q2',
        position: [-10 + offsetX, 1, 0],
        floor: floorNum
      });
      
      // Q3: West-North corner (adjusted for floor width and offset, moved +3 in Z)
      result.push({
        label: 'Q3',
        position: [+5 + -mainWingWidth * 0.4 + offsetX, 0.5, 15],
        floor: floorNum
      });
    }
    return result;
  }, []);

  // Generate invisible quadrant configs for all floors
  const quadrantConfigs = useMemo(() => {
    return building.map((level) => ({
      floor: level.floorNumber,
      sections: level.sections.map((section) => ({
        x: section.x,
        z: section.z,
        width: section.width,
        depth: section.depth,
      })),
    }));
  }, [building]);

  return (
    <group position={[0, 0, 0]}>
      {/* Invisible quadrant dividers for all floors */}
      <FloorQuadrants
        quadrants={quadrantConfigs}
        floorHeight={floorHeight}
        opacity={0.0}
        color="#00ff00"
      />
      {/* Quadrant labels - made invisible but keeping for reference */}
      {false && quadrants.map((quadrant, idx) => (
        <Text
          key={`quadrant-${idx}`}
          position={[quadrant.position[0], quadrant.floor * floorHeight + quadrant.position[1], quadrant.position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={2.5}
          color="#ffaa00"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="#000000"
        >
          {quadrant.label}
        </Text>
      ))}

      {building.map((level: Level, levelIndex: number) => {
        const yPos = levelIndex * floorHeight;

        // Materials - lightweight walls with good contrast
        const outerWallMaterial = (
          <meshBasicMaterial
            color="#a8d4f0"
            transparent
            opacity={0.25}
          />
        );

        return (
          <group key={levelIndex} position={[level.offsetX, yPos, 0]}>
            {/* Floor label */}
            <Text
              position={[0, floorHeight - 2, 30]}
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
                  <meshBasicMaterial color="#3a4a5a" />
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
                <meshBasicMaterial color="#a8d4f0" transparent opacity={0.25} />
              </Box>
            )}

            {/* Rooms - with distance-based culling */}
            {level.rooms.map((room: Room, roomIndex: number) => {
              // Calculate distance from player to room (3D distance)
              const roomWorldX = room.x + level.offsetX;
              const roomWorldY = yPos;
              const roomWorldZ = room.z;

              const distance = Math.sqrt(
                Math.pow(playerPosition[0] - roomWorldX, 2) +
                Math.pow(playerPosition[1] - roomWorldY, 2) +
                Math.pow(playerPosition[2] - roomWorldZ, 2)
              );

              // Only render if within render distance
              if (distance > renderDistance) {
                return null;
              }

              return (
                <group key={roomIndex}>
                  {/* Room walls - lightweight materials */}
                  <Box
                    args={[room.width - wallThickness * 0.5, floorHeight * 0.85, wallThickness * 0.3]}
                    position={[room.x, floorHeight / 2, room.z + room.depth / 2]}
                  >
                    <meshBasicMaterial color="#a8d4f0" transparent opacity={0.2} />
                  </Box>

                  <Box
                    args={[room.width - wallThickness * 0.5, floorHeight * 0.85, wallThickness * 0.3]}
                    position={[room.x, floorHeight / 2, room.z - room.depth / 2]}
                  >
                    <meshBasicMaterial color="#a8d4f0" transparent opacity={0.2} />
                  </Box>

                  <Box
                    args={[wallThickness * 0.3, floorHeight * 0.85, room.depth - wallThickness * 0.5]}
                    position={[room.x + room.width / 2, floorHeight / 2, room.z]}
                  >
                    <meshBasicMaterial color="#a8d4f0" transparent opacity={0.2} />
                  </Box>

                  <Box
                    args={[wallThickness * 0.3, floorHeight * 0.85, room.depth - wallThickness * 0.5]}
                    position={[room.x - room.width / 2, floorHeight / 2, room.z]}
                  >
                    <meshBasicMaterial color="#a8d4f0" transparent opacity={0.2} />
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

      {/* ROOF - Transparent */}
      <group position={[0, 9 * floorHeight, 0]}>
        <Box args={[45, 0.2, 18]} position={[0, 0, 0]}>
          <meshBasicMaterial color="#2a3a4a" transparent opacity={0.1} />
        </Box>
      </group>
    </group>
  );
}
