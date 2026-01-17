import React from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';

/**
 * The iconic 650-foot concrete Helix walkway
 * Spirals from Level 3 (lower lobby) up through the central atrium to Level 9
 */
export function ConcreteHelix() {
  const helixLength = 198; // 650 feet ≈ 198 meters
  const totalHeight = 34; // From Level 3 to Level 9 (about 80 feet vertical)
  const radius = 5.5; // Spiral radius
  const walkwayWidth = 2.5; // Width of the walkway
  const walkwayThickness = 0.2; // Thickness of concrete walkway

  // Number of segments to create smooth spiral
  const segments = 150;
  const rotations = 4.5; // Number of complete rotations

  // Generate helix path segments
  const helixSegments = [];
  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI * 2 * rotations;
    const y = t * totalHeight - 24.4; // Start at Level 3 (-24.4m)
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    helixSegments.push({
      x,
      y,
      z,
      angle,
      t
    });
  }

  return (
    <group>
      {/* Central support column through atrium */}
      <Cylinder
        args={[0.8, 1.2, totalHeight + 5, 12]}
        position={[0, -24.4 + totalHeight / 2, 0]}
      >
        <meshStandardMaterial
          color="#888888"
          roughness={0.8}
        />
      </Cylinder>

      {/* Helix walkway segments */}
      {helixSegments.map((segment, index) => {
        if (index === 0) return null;

        const prevSegment = helixSegments[index - 1];
        const dx = segment.x - prevSegment.x;
        const dy = segment.y - prevSegment.y;
        const dz = segment.z - prevSegment.z;
        const segmentLength = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Calculate rotation to align with path
        const horizontalAngle = Math.atan2(dz, dx);
        const verticalAngle = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

        return (
          <group key={index}>
            {/* Walkway segment */}
            <Box
              args={[segmentLength, walkwayThickness, walkwayWidth]}
              position={[
                (segment.x + prevSegment.x) / 2,
                (segment.y + prevSegment.y) / 2,
                (segment.z + prevSegment.z) / 2
              ]}
              rotation={[0, horizontalAngle, verticalAngle]}
            >
              <meshStandardMaterial
                color="#b8b8a8"
                roughness={0.9}
              />
            </Box>

            {/* Outer railing */}
            <Cylinder
              args={[0.05, 0.05, 1.2, 8]}
              position={[
                segment.x + Math.cos(segment.angle) * (walkwayWidth / 2),
                segment.y + 0.6,
                segment.z + Math.sin(segment.angle) * (walkwayWidth / 2)
              ]}
            >
              <meshStandardMaterial
                color="#666666"
                metalness={0.8}
                roughness={0.2}
              />
            </Cylinder>

            {/* Inner railing */}
            <Cylinder
              args={[0.05, 0.05, 1.2, 8]}
              position={[
                segment.x - Math.cos(segment.angle) * (walkwayWidth / 2),
                segment.y + 0.6,
                segment.z - Math.sin(segment.angle) * (walkwayWidth / 2)
              ]}
            >
              <meshStandardMaterial
                color="#666666"
                metalness={0.8}
                roughness={0.2}
              />
            </Cylinder>

            {/* Support beams every 10 segments */}
            {index % 10 === 0 && (
              <Box
                args={[0.3, segment.y + 24.4 - 0.5, 0.3]}
                position={[segment.x, (segment.y - 24.4) / 2 - 24.4, segment.z]}
              >
                <meshStandardMaterial
                  color="#999999"
                  roughness={0.7}
                />
              </Box>
            )}

            {/* Level markers at key points */}
            {index % 30 === 0 && (
              <Text
                position={[
                  segment.x * 1.3,
                  segment.y + 2,
                  segment.z * 1.3
                ]}
                fontSize={0.5}
                color="#ffff00"
                anchorX="center"
                anchorY="middle"
              >
                ⟳ HELIX
              </Text>
            )}
          </group>
        );
      })}

      {/* Entry platform at Level 3 */}
      <Cylinder
        args={[radius + 1, radius + 1, 0.4, 32]}
        position={[0, -24.4, 0]}
      >
        <meshStandardMaterial color="#999999" />
      </Cylinder>

      {/* Exit platform at top */}
      <Cylinder
        args={[radius + 1, radius + 1, 0.4, 32]}
        position={[0, 9, 0]}
      >
        <meshStandardMaterial color="#999999" />
      </Cylinder>

      {/* Signage at bottom */}
      <Text
        position={[0, -23, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        THE HELIX
      </Text>

      <Text
        position={[0, -24, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.6}
        color="#aaaaaa"
        anchorX="center"
        anchorY="middle"
      >
        650-foot Concrete Spiral
      </Text>
    </group>
  );
}
