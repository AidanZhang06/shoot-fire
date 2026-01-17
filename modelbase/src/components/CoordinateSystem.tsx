import React, { useMemo } from 'react';
import * as THREE from 'three';

interface CoordinateSystemProps {
  /**
   * Position where to place the axes helper in world space
   * @default [0, 0, 0]
   */
  position?: [number, number, number];

  /**
   * Size of the axes lines
   * @default 5
   */
  size?: number;

  /**
   * Whether to show the axes helper
   * @default true
   */
  visible?: boolean;
}

/**
 * Visual Coordinate System Helper
 *
 * Displays color-coded axes in the scene:
 * - Red = X-axis (Right/Left)
 * - Green = Y-axis (Up/Down)
 * - Blue = Z-axis (Forward/Backward)
 *
 * Note: In Three.js convention:
 * - +X is Right
 * - +Y is Up
 * - +Z is "Backward" (towards camera by default)
 * - -Z is "Forward" (away from camera)
 */
export function CoordinateSystem({
  position = [0, 0, 0],
  size = 5,
  visible = true
}: CoordinateSystemProps) {
  // Create the axes helper
  const axes = useMemo(() => new THREE.AxesHelper(size), [size]);

  if (!visible) return null;

  return (
    <primitive object={axes} position={position} />
  );
}
