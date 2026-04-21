import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';

const Plate: React.FC = () => {
  const { data } = useKeyboardStore();
  const { plateThickness } = data.case_config;

  // Calculate bounding box of the layout
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  if (data.layout.length === 0) return null;

  data.layout.forEach(key => {
    const halfW = (key.keycapSize.width * 19.05) / 2;
    const halfH = (key.keycapSize.height * 19.05) / 2;
    minX = Math.min(minX, key.x - halfW);
    maxX = Math.max(maxX, key.x + halfW);
    minY = Math.min(minY, key.y - halfH);
    maxY = Math.max(maxY, key.y + halfH);
  });

  const padding = 10;
  const width = (maxX - minX) + padding * 2;
  const height = (maxY - minY) + padding * 2;
  const centerX = (maxX + minX) / 2;
  const centerY = (maxY + minY) / 2;

  return (
    <mesh position={[centerX, -1, centerY]}>
      <boxGeometry args={[width, plateThickness, height]} />
      <meshStandardMaterial 
        color="#2d2d35" 
        metalness={0.8} 
        roughness={0.2} 
      />
    </mesh>
  );
};

export default Plate;
