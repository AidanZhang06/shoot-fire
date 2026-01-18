import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NavigationGraphImpl } from '../navigation/NavigationGraph';

interface PathHighlighterProps {
  graph: NavigationGraphImpl;
  currentPath?: string[]; // Current path being taken
  blockedPaths?: string[]; // Blocked edge keys (format: "fromId-toId")
  blockedNodes?: string[]; // Blocked node IDs
  visible?: boolean;
}

type PathType = 'safe' | 'blocked' | 'warning' | 'recommended';

export function PathHighlighter({
  graph,
  currentPath = [],
  blockedPaths = [],
  blockedNodes = [],
  visible = true
}: PathHighlighterProps) {
  const [blockedLines, safeLines, warningLines, recommendedLines] = useMemo(() => {
    if (!visible) return [[], [], [], []];

    const blocked: THREE.Line[] = [];
    const safe: THREE.Line[] = [];
    const warning: THREE.Line[] = [];
    const recommended: THREE.Line[] = [];

    // Create lines for blocked edges
    blockedPaths.forEach(edgeKey => {
      const [fromId, toId] = edgeKey.split('-');
      const fromNode = graph.getNode(fromId);
      const toNode = graph.getNode(toId);

      if (fromNode && toNode) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(...fromNode.position),
          new THREE.Vector3(...toNode.position)
        ]);
        const material = new THREE.LineBasicMaterial({
          color: 0xff0000, // Red
          linewidth: 3,
          opacity: 0.8,
          transparent: true
        });
        blocked.push(new THREE.Line(geometry, material));
      }
    });

    // Create lines for blocked nodes (show as small spheres)
    blockedNodes.forEach(nodeId => {
      const node = graph.getNode(nodeId);
      if (node) {
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          opacity: 0.6,
          transparent: true
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(...node.position);
        blocked.push(sphere as any); // Type hack for mixed geometry
      }
    });

    // Create lines for current path
    if (currentPath.length > 1) {
      for (let i = 0; i < currentPath.length - 1; i++) {
        const fromNode = graph.getNode(currentPath[i]);
        const toNode = graph.getNode(currentPath[i + 1]);

        if (fromNode && toNode) {
          const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(...fromNode.position),
            new THREE.Vector3(...toNode.position)
          ]);

          // Determine path type based on node states
          const fromSmoke = fromNode.smokeLevel || 0;
          const toSmoke = toNode.smokeLevel || 0;
          const avgSmoke = (fromSmoke + toSmoke) / 2;
          const isBlocked = fromNode.blocked || toNode.blocked;

          let pathType: PathType = 'safe';
          let color = 0x00ff00; // Green
          let opacity = 0.6;

          if (isBlocked) {
            pathType = 'blocked';
            color = 0xff0000; // Red
            opacity = 0.8;
          } else if (avgSmoke > 0.7) {
            pathType = 'warning';
            color = 0xff8800; // Orange
            opacity = 0.7;
          } else if (avgSmoke > 0.3) {
            pathType = 'warning';
            color = 0xffff00; // Yellow
            opacity = 0.6;
          } else {
            pathType = 'safe';
            color = 0x00ff00; // Green
            opacity = 0.5;
          }

          const material = new THREE.LineBasicMaterial({
            color,
            linewidth: 4,
            opacity,
            transparent: true
          });

          const line = new THREE.Line(geometry, material);

          if (pathType === 'blocked') {
            blocked.push(line);
          } else if (pathType === 'warning') {
            warningLines.push(line);
          } else {
            safe.push(line);
          }
        }
      }
    }

    return [blocked, safe, warning, recommended];
  }, [graph, currentPath, blockedPaths, blockedNodes, visible]);

  // Animate pulsing effect
  useFrame(({ clock }) => {
    const pulse = Math.sin(clock.elapsedTime * 2) * 0.2 + 0.8;
    
    [...safeLines, ...warningLines].forEach(line => {
      if (line.material instanceof THREE.MeshBasicMaterial || 
          line.material instanceof THREE.LineBasicMaterial) {
        line.material.opacity = (line.material.opacity || 0.5) * pulse;
      }
    });
  });

  if (!visible) return null;

  return (
    <group>
      {/* Blocked paths - red */}
      {blockedLines.map((line, index) => (
        <primitive key={`blocked-${index}`} object={line} />
      ))}

      {/* Safe paths - green */}
      {safeLines.map((line, index) => (
        <primitive key={`safe-${index}`} object={line} />
      ))}

      {/* Warning paths - yellow/orange */}
      {warningLines.map((line, index) => (
        <primitive key={`warning-${index}`} object={line} />
      ))}
    </group>
  );
}

