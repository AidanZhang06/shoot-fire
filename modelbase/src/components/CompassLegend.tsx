import React from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CompassLegendProps {
  rotation?: number; // Camera rotation in degrees
}

/**
 * CompassLegend - Shows directional orientation (N, S, E, W) with dynamic arrow
 * Arrow points in the direction the camera is facing
 */
export function CompassLegend({ rotation = 0 }: CompassLegendProps) {
  const compassStyle: React.CSSProperties = {
    position: 'absolute',
    top: '15px',
    left: '15px',
    width: '70px',
    height: '70px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '50%',
    border: '2px solid #ff6b35',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: 'bold',
    color: '#ffffff',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
  };

  const directionStyle = (position: 'top' | 'bottom' | 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute',
    fontSize: '12px',
    color: position === 'top' ? '#ff4444' : '#aaaaaa',
    fontWeight: position === 'top' ? '900' : 'bold',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
    ...(position === 'top' && { top: '4px', left: '50%', transform: 'translateX(-50%)' }),
    ...(position === 'bottom' && { bottom: '4px', left: '50%', transform: 'translateX(-50%)' }),
    ...(position === 'left' && { left: '6px', top: '50%', transform: 'translateY(-50%)' }),
    ...(position === 'right' && { right: '6px', top: '50%', transform: 'translateY(-50%)' })
  });

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    width: '0',
    height: '0',
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderBottom: '18px solid #ff6b35',
    top: '50%',
    left: '50%',
    transformOrigin: '50% 100%',
    transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
    transition: 'transform 0.1s ease-out',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))'
  };

  return (
    <div style={compassStyle}>
      {/* North - highlighted as primary reference */}
      <div style={directionStyle('top')}>N</div>

      {/* East */}
      <div style={directionStyle('right')}>E</div>

      {/* South */}
      <div style={directionStyle('bottom')}>S</div>

      {/* West */}
      <div style={directionStyle('left')}>W</div>

      {/* Dynamic arrow pointing in camera direction */}
      <div style={arrowStyle} />

      {/* Center dot */}
      <div style={{
        width: '4px',
        height: '4px',
        backgroundColor: '#ff6b35',
        borderRadius: '50%',
        position: 'absolute'
      }} />
    </div>
  );
}

/**
 * CameraRotationTracker - Component placed inside Canvas to track camera rotation
 * Updates parent component with camera rotation angle
 */
export function CameraRotationTracker({ onRotationChange }: { onRotationChange: (rotation: number) => void }) {
  const { camera } = useThree();

  useFrame(() => {
    // Get camera's direction vector
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // Calculate angle in degrees (0° = North/+Z, 90° = East/+X)
    const angle = Math.atan2(direction.x, direction.z) * (180 / Math.PI);
    onRotationChange(-angle);
  });

  return null;
}

