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

export function HillmanBuilding() {
  const floorHeight = 3.5;
  const wallThickness = 0.3;
  const numFloors = 7;

  const buildingConfig = useMemo(() => {
    const floors = [];
    const buildingWidth = 35;
    const buildingDepth = 25;
    const hallwayWidth = 3; // Central hallway

    for (let floorNum = 1; floorNum <= numFloors; floorNum++) {
      const rooms: Room[] = [];

      // Generate room layout with central hallway
      const roomsPerRow = 4;
      const roomsPerCol = 2; // 2 columns, one on each side of hallway
      const roomWidth = (buildingWidth - hallwayWidth) / 2 / roomsPerRow;
      const roomDepth = buildingDepth / roomsPerCol;

      // Left side rooms
      for (let row = 0; row < roomsPerRow; row++) {
        for (let col = 0; col < roomsPerCol; col++) {
          const roomTypes = ['Lab', 'Office', 'Classroom', 'Study'];
          const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
          const roomNum = `H${floorNum}${String.fromCharCode(65 + row)}${col + 1}`;

          rooms.push({
            x: -buildingWidth / 2 + (row + 0.5) * roomWidth,
            z: -buildingDepth / 2 + (col + 0.5) * roomDepth,
            width: roomWidth - 0.5,
            depth: roomDepth - 0.5,
            label: `${roomNum}\n${roomType}`,
            type: roomType.toLowerCase()
          });
        }
      }

      // Right side rooms
      for (let row = 0; row < roomsPerRow; row++) {
        for (let col = 0; col < roomsPerCol; col++) {
          const roomTypes = ['Lab', 'Office', 'Classroom', 'Study'];
          const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
          const roomNum = `H${floorNum}${String.fromCharCode(69 + row)}${col + 1}`;

          rooms.push({
            x: hallwayWidth / 2 + (row + 0.5) * roomWidth,
            z: -buildingDepth / 2 + (col + 0.5) * roomDepth,
            width: roomWidth - 0.5,
            depth: roomDepth - 0.5,
            label: `${roomNum}\n${roomType}`,
            type: roomType.toLowerCase()
          });
        }
      }

      floors.push({
        floorNumber: floorNum,
        buildingWidth,
        buildingDepth,
        hallwayWidth,
        rooms
      });
    }

    return { floors, buildingWidth, buildingDepth };
  }, []);

  return (
    <group position={[-60, 0, 0]}>
      {buildingConfig.floors.map((floor: any, floorIndex) => {
        const isGlassFloor = floorIndex >= 3 && floorIndex <= 4;

        const outerWallMaterial = isGlassFloor ? (
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
          <group key={floorIndex} position={[0, floorIndex * floorHeight, 0]}>
            {/* Floor label */}
            <Text
              position={[0, floorHeight + 1, floor.buildingDepth / 2 + 3]}
              fontSize={0.8}
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
            <Box
              args={[floor.buildingWidth + wallThickness * 2, floorHeight, wallThickness]}
              position={[0, floorHeight / 2, floor.buildingDepth / 2]}
            >
              {outerWallMaterial}
            </Box>

            <Box
              args={[floor.buildingWidth + wallThickness * 2, floorHeight, wallThickness]}
              position={[0, floorHeight / 2, -floor.buildingDepth / 2]}
            >
              {outerWallMaterial}
            </Box>

            <Box
              args={[wallThickness, floorHeight, floor.buildingDepth + wallThickness * 2]}
              position={[floor.buildingWidth / 2, floorHeight / 2, 0]}
            >
              {outerWallMaterial}
            </Box>

            <Box
              args={[wallThickness, floorHeight, floor.buildingDepth + wallThickness * 2]}
              position={[-floor.buildingWidth / 2, floorHeight / 2, 0]}
            >
              {outerWallMaterial}
            </Box>

            {/* Central hallway floor marking */}
            <Box
              args={[floor.hallwayWidth, 0.21, floor.buildingDepth]}
              position={[0, -0.09, 0]}
            >
              <meshStandardMaterial
                color="#666666"
                transparent
                opacity={0.8}
              />
            </Box>

            {/* Rooms */}
            {floor.rooms.map((room: Room, roomIndex: number) => {
              const roomColor = '#ffffff';
              const roomOpacity = 0.05;

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
                      emissiveIntensity={0.05}
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
                      emissiveIntensity={0.05}
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
                      emissiveIntensity={0.05}
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
                      emissiveIntensity={0.05}
                    />
                  </Box>

                  {/* Room label */}
                  <Text
                    position={[room.x, 0.3, room.z]}
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
