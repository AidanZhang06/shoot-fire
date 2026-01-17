import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface FirstPersonCameraProps {
  targetPosition: [number, number, number];
  enabled: boolean;
  height?: number; // Eye height above ground
}

export function FirstPersonCamera({ targetPosition, enabled, height = 1.6 }: FirstPersonCameraProps) {
  const { camera, gl } = useThree();
  const cameraRef = useRef<THREE.Camera>(camera);
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3(...targetPosition));
  const currentPosRef = useRef<THREE.Vector3>(new THREE.Vector3(...targetPosition));
  
  // Rotation state
  const [rotation, setRotation] = useState({ yaw: 0, pitch: 0 });
  const isPointerLocked = useRef(false);
  const sensitivity = 0.002;

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  // Handle pointer lock for mouse look
  useEffect(() => {
    if (!enabled) {
      // Release pointer lock when disabled
      if (isPointerLocked.current) {
        document.exitPointerLock();
        isPointerLocked.current = false;
      }
      return;
    }

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === gl.domElement;
    };

    const handlePointerLockError = () => {
      console.warn('Pointer lock failed');
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isPointerLocked.current) return;

      // Update rotation based on mouse movement
      setRotation(prev => ({
        yaw: prev.yaw - event.movementX * sensitivity,
        pitch: Math.max(
          -Math.PI / 2, // Don't look straight up
          Math.min(
            Math.PI / 2, // Don't look straight down
            prev.pitch - event.movementY * sensitivity
          )
        )
      }));
    };

    const handleClick = () => {
      if (enabled && !isPointerLocked.current) {
        gl.domElement.requestPointerLock().catch(err => {
          console.warn('Could not lock pointer:', err);
        });
      }
    };

    // Handle ESC key to exit pointer lock
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isPointerLocked.current) {
        document.exitPointerLock();
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    gl.domElement.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      gl.domElement.removeEventListener('click', handleClick);
      if (isPointerLocked.current) {
        document.exitPointerLock();
      }
    };
  }, [enabled, gl]);

  useFrame(() => {
    if (!enabled) return;

    const target = new THREE.Vector3(...targetPosition);
    target.y += height; // Position camera at eye level

    // Smoothly interpolate camera position
    currentPosRef.current.lerp(target, 0.1);
    cameraRef.current.position.copy(currentPosRef.current);

    // Apply rotation (yaw and pitch)
    const euler = new THREE.Euler(rotation.pitch, rotation.yaw, 0, 'YXZ');
    cameraRef.current.rotation.copy(euler);
  });

  return null;
}
