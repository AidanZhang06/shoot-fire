import React from 'react';
import { Line } from '@react-three/drei';
import { Path } from '../navigation/types';

interface PathHighlighterProps {
  path: Path | null;
  color?: string;
  visible?: boolean;
}

export function PathHighlighter({ path, color = '#00ffff', visible = true }: PathHighlighterProps) {
  if (!path || !visible || path.nodes.length < 2) return null;

  // Get positions for all nodes in the path
  const points: [number, number, number][] = [];
  
  // This would need access to the navigation graph to get actual positions
  // For now, this is a placeholder structure
  // In real implementation, you'd pass node positions from the graph

  return (
    <group>
      {/* Draw line connecting path nodes */}
      {points.length > 1 && (
        <Line
          points={points}
          color={color}
          lineWidth={3}
          dashed={false}
        />
      )}
      
      {/* Highlight nodes along path */}
      {points.map((point, index) => (
        <mesh key={`path-node-${index}`} position={point}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

