import React, { useMemo } from 'react';
import { Box, Text } from '@react-three/drei';
import type { ControllerType } from '../../types';

interface MicroControllerProps {
  type: ControllerType;
  position: [number, number, number];
  rotation: [number, number, number];
  mountingSide?: 'top' | 'bottom';
  side?: 'left' | 'right';
}

const MicroController: React.FC<MicroControllerProps> = ({ type, position, rotation, mountingSide = 'top', side }) => {
  const dimensions = useMemo(() => {
    switch (type) {
      case 'pro_micro':
      case 'elite_c':
        return { width: 18, length: 33, height: 4, color: type === 'elite_c' ? '#2e2e2e' : '#1e3a8a' };
      case 'xiao_rp2040':
        return { width: 18, length: 21, height: 4, color: '#312e81' };
      case 'pico':
        return { width: 21, length: 51, height: 4, color: '#065f46' };
      case 'bluepill':
        return { width: 23, length: 53, height: 4, color: '#1e3a8a' };
      default:
        return { width: 18, length: 33, height: 4, color: '#444' };
    }
  }, [type]);

  const label = useMemo(() => {
    switch (type) {
      case 'pro_micro': return 'Pro Micro';
      case 'elite_c': return 'Elite-C';
      case 'xiao_rp2040': return 'XIAO RP2040';
      case 'pico': return 'RPi Pico';
      case 'bluepill': return 'Bluepill';
      default: return 'MCU';
    }
  }, [type]);

  return (
    <group position={position} rotation={rotation}>
      {/* PCB Body */}
      <Box args={[dimensions.width, dimensions.height, dimensions.length]} castShadow receiveShadow>
        <meshStandardMaterial color={dimensions.color} roughness={0.7} metalness={0.2} />
      </Box>

      {/* USB Connector Placeholder */}
      <Box args={[8, 3, 5]} position={[0, dimensions.height / 2 + 1, -dimensions.length / 2 + 2.5]}>
        <meshStandardMaterial color="#999" roughness={0.3} metalness={0.8} />
      </Box>

      {/* Label */}
      <group position={[0, (mountingSide === 'top' ? 1 : -1) * (dimensions.height / 2 + 0.1), 0]} rotation={[(mountingSide === 'top' ? -1 : 1) * Math.PI / 2, 0, 0]}>
        <Text
          fontSize={3}
          color="white"
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0]}
        >
          {label}
        </Text>
        {side && (
          <Text
            fontSize={2}
            color={side === 'left' ? '#60a5fa' : '#f87171'}
            anchorX="center"
            anchorY="middle"
            position={[0, -4, 0]}
          >
            {side.toUpperCase()}
          </Text>
        )}
      </group>

      {/* Pins Visualization (Optional, just simple lines/boxes) */}
      <group position={[0, -dimensions.height / 2 - 1, 0]}>
         {/* Left Pins */}
         <Box args={[1, 3, dimensions.length - 4]} position={[-dimensions.width / 2 + 2, 0, 0]}>
           <meshStandardMaterial color="#d4af37" />
         </Box>
         {/* Right Pins */}
         <Box args={[1, 3, dimensions.length - 4]} position={[dimensions.width / 2 - 2, 0, 0]}>
           <meshStandardMaterial color="#d4af37" />
         </Box>
      </group>
    </group>
  );
};

export default MicroController;
