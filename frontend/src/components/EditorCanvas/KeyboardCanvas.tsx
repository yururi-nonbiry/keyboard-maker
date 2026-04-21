import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Float } from '@react-three/drei';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import KeySwitch from './KeySwitch';
import Plate from './Plate';

const KeyboardCanvas: React.FC = () => {
  const { data, selectKey, selectedKeyId } = useKeyboardStore();
  const isEditing = selectedKeyId !== null;

  return (
    <Canvas
      shadows
      camera={{ position: [100, 150, 200], fov: 45 }}
      style={{ height: '100%', width: '100%' }}
      onPointerMissed={() => selectKey(null)}
    >
      <color attach="background" args={['#0a0a0c']} />
      <fog attach="fog" args={['#0a0a0c', 200, 600]} />
      
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <spotLight position={[100, 200, 100]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-100, -100, -100]} intensity={0.5} />
        
        <Environment preset="city" />

        <Float 
          speed={isEditing ? 0 : 1.5} 
          rotationIntensity={isEditing ? 0 : 0.2} 
          floatIntensity={isEditing ? 0 : 0.5}
        >
          <group position={[0, 0, 0]}>
            {data.layout.map((key) => (
              <KeySwitch key={key.id} config={key} />
            ))}
            <Plate />
          </group>
        </Float>

        <ContactShadows 
          opacity={0.4} 
          scale={400} 
          blur={2} 
          far={10} 
          resolution={256} 
          color="#000000" 
        />
      </Suspense>

      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        makeDefault 
      />
    </Canvas>
  );
};

export default KeyboardCanvas;
