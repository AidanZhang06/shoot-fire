import React from 'react';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

interface QuadrantConfig {
  /**
   * Floor number (1-indexed)
   */
  floor: number;
  /**
   * Sections of the floor to create quadrants for
   */
  sections: Array<{
    x: number;
    z: number;
    width: number;
    depth: number;
  }>;
}

interface FloorQuadrantsProps {
  /**
   * Configuration for each floor's quadrants
   */
  quadrants: QuadrantConfig[];
  /**
   * Height of each floor
   * @default 3.5
   */
  floorHeight?: number;
  /**
   * Opacity of the quadrant dividers (0 = invisible, 1 = fully visible)
   * @default 0.0 (invisible)
   */
  opacity?: number;
  /**
   * Color of the quadrant dividers
   * @default "#00ff00"
   */
  color?: string;
  /**
   * Thickness of the quadrant divider lines
   * @default 0.01
   */
  lineThickness?: number;
}

/**
 * FloorQuadrants component
 * 
 * Creates invisible (or barely visible) quadrant dividers on building floors
 * to help visualize where files should be placed. Divides each section into
 * 4 quadrants using X and Z axis dividers.
 */
export function FloorQuadrants({
  quadrants,
  floorHeight = 3.5,
  opacity = 0.0,
  color = "#00ff00",
  lineThickness = 0.01
}: FloorQuadrantsProps) {
  return (
    <group>
      {quadrants.map((config, configIdx) => {
        const yPos = (config.floor - 1) * floorHeight + 0.001; // Slightly above floor

        return (
          <group key={configIdx}>
            {config.sections.map((section, sectionIdx) => {
              // Create quadrant dividers: one vertical line (X-axis) and one horizontal line (Z-axis)
              // This divides the section into 4 quadrants: NE, NW, SE, SW

              return (
                <group key={sectionIdx}>
                  {/* Vertical divider (along Z-axis, splitting X in half) */}
                  <Box
                    args={[lineThickness, 0.05, section.depth]}
                    position={[section.x, yPos, section.z]}
                  >
                    <meshStandardMaterial
                      color={color}
                      transparent={true}
                      opacity={opacity}
                      side={THREE.DoubleSide}
                      emissive={color}
                      emissiveIntensity={opacity > 0 ? 0.1 : 0}
                    />
                  </Box>

                  {/* Horizontal divider (along X-axis, splitting Z in half) */}
                  <Box
                    args={[section.width, 0.05, lineThickness]}
                    position={[section.x, yPos, section.z]}
                  >
                    <meshStandardMaterial
                      color={color}
                      transparent={true}
                      opacity={opacity}
                      side={THREE.DoubleSide}
                      emissive={color}
                      emissiveIntensity={opacity > 0 ? 0.1 : 0}
                    />
                  </Box>
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

