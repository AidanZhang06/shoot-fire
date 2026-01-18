import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FireAlarmLightsProps {
  active: boolean;
  floor?: number;
}

export function FireAlarmLights({ active, floor = 6 }: FireAlarmLightsProps) {
  const lightRefs = useRef<THREE.PointLight[]>([]);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!active) return;

    timeRef.current += delta;

    // Blink pattern: on for 0.3s, off for 0.3s
    const blinkCycle = 0.6;
    const phase = (timeRef.current % blinkCycle) / blinkCycle;
    const isOn = phase < 0.5;

    lightRefs.current.forEach(light => {
      if (light) {
        light.intensity = isOn ? 0.8 : 0.1;
      }
    });
  });

  if (!active) {
    return null;
  }

  const floorHeight = 3.5;
  const yPos = (floor - 1) * floorHeight + 3.2; // Near ceiling

  // Alarm light positions around the building
  const alarmPositions: [number, number, number][] = [
    // Main wing - distributed along hallway
    [-15, yPos, 0],
    [-8, yPos, 0],
    [0, yPos, 0],
    [8, yPos, 0],
    [15, yPos, 0],

    // Side wing
    [-15, yPos, 8],
    [-15, yPos, 16],

    // Near exits
    [-18, yPos, 3],
    [18, yPos, 3],
  ];

  return (
    <group>
      {alarmPositions.map((position, index) => (
        <group key={`alarm-${index}`} position={position}>
          {/* Small red light fixture */}
          <mesh>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial
              color="#ff0000"
              emissive="#ff0000"
              emissiveIntensity={0.5}
            />
          </mesh>

          {/* Point light for blinking effect */}
          <pointLight
            ref={(el) => {
              if (el) lightRefs.current[index] = el;
            }}
            color="#ff0000"
            intensity={0.8}
            distance={10}
            decay={2}
          />
        </group>
      ))}
    </group>
  );
}
