import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';

export const Lighting: React.FC = () => {
  const data = useKeyboardStore((state) => state.data);
  const config = data.lighting_config;

  if (!config?.underglowEnabled) return null;

  return (
    <group>
      {/* Simulation of underglow using point lights or rect area lights */}
      {/* For a simple implementation, we place lights under the PCB area */}
      <pointLight 
        position={[0, -2, 0]} 
        color={config.underglowColor || '#ffffff'} 
        intensity={2} 
        distance={50}
        decay={2}
      />
      
      {/* Visual representation of the glow on the surface below */}
      <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 150]} />
        <meshStandardMaterial 
          color={config.underglowColor || '#ffffff'} 
          transparent 
          opacity={0.1}
          emissive={config.underglowColor || '#ffffff'}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
};
