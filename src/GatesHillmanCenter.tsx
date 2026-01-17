import React, { useMemo } from 'react';
import { Box, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Room {
  x: number;
  z: number;
  width: number;
  depth: number;
  label: string;
  type?: string;
}

export function GatesHillmanCenter() {
  const floorHeight = 3.5;
  const wallThickness = 0.3;

  // Define the complex floor-by-floor structure
  const building = useMemo(() => {
    const levels = [];

    // LEVEL 1-2: Underground Parking (2 levels)
    for (let parkingLevel = 1; parkingLevel <= 2; parkingLevel++) {
      const rooms: Room[] = [];
      const width = 50;
      const depth = 35;

      // Parking spaces
      const parkingRows = 10;
      const parkingCols = 15;

      levels.push({
        level: parkingLevel - 2, // -1 and -2
        label: `PARKING L${parkingLevel}`,
        width,
        depth,
        rooms,
        isParking: true,
        offsetY: -(3 - parkingLevel) * floorHeight - 24.4 // Underground, accounting for elevation
      });
    }

    // LEVEL 3: Lower Campus Entry (Base of Helix)
    const level3Rooms: Room[] = [];
    const l3Width = 55;
    const l3Depth = 40;

    // 3000-level classrooms
    for (let i = 0; i < 8; i++) {
      level3Rooms.push({
        x: -l3Width / 2 + (i + 0.5) * (l3Width / 8),
        z: l3Depth / 4,
        width: l3Width / 8 - 1,
        depth: l3Depth / 3,
        label: `300${i}\nClassroom`,
        type: 'classroom'
      });
    }

    levels.push({
      level: 3,
      label: 'LEVEL 3 - Lower Entry',
      width: l3Width,
      depth: l3Depth,
      rooms: level3Rooms,
      offsetY: -24.4, // 80 feet = ~24.4 meters below Forbes Ave
      hasAtriumBase: true
    });

    // LEVEL 4: Pausch Bridge & Administration
    const level4Rooms: Room[] = [];
    const l4Width = 60;
    const l4Depth = 42;

    // Admin office 4107
    level4Rooms.push({
      x: 0,
      z: 0,
      width: 12,
      depth: 10,
      label: '4107\nBuilding Facilities',
      type: 'admin'
    });

    // 4100-series classrooms
    for (let i = 0; i < 6; i++) {
      level4Rooms.push({
        x: -l4Width / 2 + (i + 0.5) * (l4Width / 6),
        z: l4Depth / 3,
        width: l4Width / 6 - 1,
        depth: l4Depth / 4,
        label: `410${i}\nClassroom`,
        type: 'classroom'
      });
    }

    levels.push({
      level: 4,
      label: 'LEVEL 4 - Pausch Bridge',
      width: l4Width,
      depth: l4Depth,
      rooms: level4Rooms,
      offsetY: -24.4 + 3 * floorHeight,
      hasPauschBridge: true
    });

    // LEVEL 5: La Prima Café & Social Hub
    const level5Rooms: Room[] = [];
    const l5Width = 58;
    const l5Depth = 40;

    // La Prima Café
    level5Rooms.push({
      x: -15,
      z: 0,
      width: 15,
      depth: 12,
      label: 'La Prima\nCafé',
      type: 'cafe'
    });

    // Dean's Suite
    level5Rooms.push({
      x: 15,
      z: 0,
      width: 12,
      depth: 10,
      label: 'Dean Suite',
      type: 'admin'
    });

    // 5000-series offices
    for (let i = 0; i < 8; i++) {
      level5Rooms.push({
        x: -l5Width / 2 + (i + 0.5) * (l5Width / 8),
        z: -l5Depth / 3,
        width: l5Width / 8 - 1,
        depth: 8,
        label: `500${i}\nOffice`,
        type: 'office'
      });
    }

    levels.push({
      level: 5,
      label: 'LEVEL 5 - Student Hub',
      width: l5Width,
      depth: l5Depth,
      rooms: level5Rooms,
      offsetY: -24.4 + 4 * floorHeight
    });

    // LEVEL 6: Research & Collaboration
    const level6Rooms: Room[] = [];
    const l6Width = 56;
    const l6Depth = 38;

    // 6000-series labs with glass partitions
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 6; col++) {
        level6Rooms.push({
          x: -l6Width / 2 + (col + 0.5) * (l6Width / 6),
          z: -l6Depth / 2 + (row + 0.5) * (l6Depth / 3),
          width: l6Width / 6 - 1,
          depth: l6Depth / 3 - 1,
          label: `60${row}${col}\nLab`,
          type: 'lab'
        });
      }
    }

    levels.push({
      level: 6,
      label: 'LEVEL 6 - Research',
      width: l6Width,
      depth: l6Depth,
      rooms: level6Rooms,
      offsetY: -24.4 + 5 * floorHeight
    });

    // LEVEL 7: Research Peak (with green roof terrace)
    const level7Rooms: Room[] = [];
    const l7Width = 52;
    const l7Depth = 36;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        level7Rooms.push({
          x: -l7Width / 2 + (col + 0.5) * (l7Width / 5),
          z: -l7Depth / 2 + (row + 0.5) * (l7Depth / 3),
          width: l7Width / 5 - 1,
          depth: l7Depth / 3 - 1,
          label: `70${row}${col}\nResearch`,
          type: 'research'
        });
      }
    }

    levels.push({
      level: 7,
      label: 'LEVEL 7',
      width: l7Width,
      depth: l7Depth,
      rooms: level7Rooms,
      offsetY: -24.4 + 6 * floorHeight,
      hasGreenRoof: true
    });

    // LEVEL 8: Research Peak
    const level8Rooms: Room[] = [];
    const l8Width = 48;
    const l8Depth = 34;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 5; col++) {
        level8Rooms.push({
          x: -l8Width / 2 + (col + 0.5) * (l8Width / 5),
          z: -l8Depth / 2 + (row + 0.5) * (l8Depth / 2),
          width: l8Width / 5 - 1,
          depth: l8Depth / 2 - 1,
          label: `80${row}${col}\nPhD Office`,
          type: 'office'
        });
      }
    }

    levels.push({
      level: 8,
      label: 'LEVEL 8',
      width: l8Width,
      depth: l8Depth,
      rooms: level8Rooms,
      offsetY: -24.4 + 7 * floorHeight
    });

    // LEVEL 9: Top Floor (Forbes Avenue level)
    const level9Rooms: Room[] = [];
    const l9Width = 45;
    const l9Depth = 32;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        level9Rooms.push({
          x: -l9Width / 2 + (col + 0.5) * (l9Width / 4),
          z: -l9Depth / 2 + (row + 0.5) * (l9Depth / 2),
          width: l9Width / 4 - 1,
          depth: l9Depth / 2 - 1,
          label: `90${row}${col}\nSenior Office`,
          type: 'office'
        });
      }
    }

    levels.push({
      level: 9,
      label: 'LEVEL 9 - Forbes Ave',
      width: l9Width,
      depth: l9Depth,
      rooms: level9Rooms,
      offsetY: 0, // Forbes Avenue level is ground zero
      hasGreenRoof: true
    });

    return levels;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {building.map((level, levelIndex) => {
        // Black zinc material for outer walls
        const outerWallMaterial = (
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.7}
            roughness={0.3}
          />
        );

        // Silver window surrounds
        const windowMaterial = (
          <meshStandardMaterial
            color="#c0c0c0"
            metalness={0.9}
            roughness={0.1}
          />
        );

        // Glass material for interior
        const glassMaterial = (
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={level.isParking ? 0.1 : 0.3}
            emissive="#4466aa"
            emissiveIntensity={0.15}
          />
        );

        return (
          <group key={levelIndex} position={[0, level.offsetY, 0]}>
            {/* Floor label */}
            <Text
              position={[0, floorHeight + 1, level.depth / 2 + 5]}
              fontSize={1}
              color={level.level >= 3 ? '#00ffff' : '#ffff00'}
              anchorX="center"
              anchorY="middle"
            >
              {level.label}
            </Text>

            {/* Floor plate */}
            <Box
              args={[level.width, 0.3, level.depth]}
              position={[0, 0, 0]}
            >
              <meshStandardMaterial
                color={level.isParking ? '#333333' : (level.hasGreenRoof ? '#2a5f1a' : '#555555')}
              />
            </Box>

            {/* Outer walls with black zinc tiles */}
            {/* North wall */}
            <Box
              args={[level.width + wallThickness * 2, floorHeight, wallThickness]}
              position={[0, floorHeight / 2, level.depth / 2]}
            >
              {outerWallMaterial}
            </Box>

            {/* South wall */}
            <Box
              args={[level.width + wallThickness * 2, floorHeight, wallThickness]}
              position={[0, floorHeight / 2, -level.depth / 2]}
            >
              {outerWallMaterial}
            </Box>

            {/* East wall */}
            <Box
              args={[wallThickness, floorHeight, level.depth + wallThickness * 2]}
              position={[level.width / 2, floorHeight / 2, 0]}
            >
              {outerWallMaterial}
            </Box>

            {/* West wall */}
            <Box
              args={[wallThickness, floorHeight, level.depth + wallThickness * 2]}
              position={[-level.width / 2, floorHeight / 2, 0]}
            >
              {outerWallMaterial}
            </Box>

            {/* Window surrounds - silver accent frames */}
            {!level.isParking && (
              <>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Box
                    key={`window-n-${i}`}
                    args={[level.width / 9, floorHeight * 0.6, 0.1]}
                    position={[-level.width / 2 + (i + 0.5) * (level.width / 8), floorHeight / 2, level.depth / 2 + 0.2]}
                  >
                    {windowMaterial}
                  </Box>
                ))}
              </>
            )}

            {/* Central atrium space (for Helix) */}
            {level.hasAtriumBase && (
              <Box
                args={[12, floorHeight * 3, 12]}
                position={[0, floorHeight * 1.5, 0]}
              >
                <meshStandardMaterial
                  color="#000000"
                  transparent
                  opacity={0.05}
                />
              </Box>
            )}

            {/* Pausch Bridge connection point */}
            {level.hasPauschBridge && (
              <Box
                args={[4, floorHeight, 0.5]}
                position={[level.width / 2 + 2, floorHeight / 2, 0]}
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

            {/* Green roof terrace */}
            {level.hasGreenRoof && (
              <Box
                args={[level.width * 0.4, 0.4, level.depth * 0.3]}
                position={[level.width * 0.25, floorHeight + 0.2, level.depth * 0.2]}
              >
                <meshStandardMaterial color="#1a4a0a" />
              </Box>
            )}

            {/* Rooms */}
            {level.rooms.map((room, roomIndex) => {
              const roomColor =
                room.type === 'cafe' ? '#ff8844' :
                room.type === 'admin' ? '#4488ff' :
                room.type === 'lab' ? '#88ff44' :
                room.type === 'research' ? '#ff44ff' :
                '#ffffff';

              return (
                <group key={roomIndex}>
                  {/* Room walls */}
                  <Box
                    args={[room.width - wallThickness, floorHeight * 0.85, wallThickness * 0.4]}
                    position={[room.x, floorHeight / 2, room.z + room.depth / 2]}
                  >
                    <meshStandardMaterial
                      color={roomColor}
                      transparent
                      opacity={0.2}
                      emissive={roomColor}
                      emissiveIntensity={0.1}
                    />
                  </Box>

                  <Box
                    args={[room.width - wallThickness, floorHeight * 0.85, wallThickness * 0.4]}
                    position={[room.x, floorHeight / 2, room.z - room.depth / 2]}
                  >
                    <meshStandardMaterial
                      color={roomColor}
                      transparent
                      opacity={0.2}
                      emissive={roomColor}
                      emissiveIntensity={0.1}
                    />
                  </Box>

                  <Box
                    args={[wallThickness * 0.4, floorHeight * 0.85, room.depth - wallThickness]}
                    position={[room.x + room.width / 2, floorHeight / 2, room.z]}
                  >
                    <meshStandardMaterial
                      color={roomColor}
                      transparent
                      opacity={0.2}
                      emissive={roomColor}
                      emissiveIntensity={0.1}
                    />
                  </Box>

                  <Box
                    args={[wallThickness * 0.4, floorHeight * 0.85, room.depth - wallThickness]}
                    position={[room.x - room.width / 2, floorHeight / 2, room.z]}
                  >
                    <meshStandardMaterial
                      color={roomColor}
                      transparent
                      opacity={0.2}
                      emissive={roomColor}
                      emissiveIntensity={0.1}
                    />
                  </Box>

                  {/* Room label */}
                  <Text
                    position={[room.x, 0.4, room.z]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    fontSize={0.3}
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
