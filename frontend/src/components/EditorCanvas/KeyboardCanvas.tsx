import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Float, Grid } from '@react-three/drei';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import KeySwitch from './KeySwitch';
import Plate from './Plate';
import Case from './Case';
import PCB from './PCB';
import MicroController from './MicroController';
import Trackball from './Trackball';
import Battery from './Battery';

import type { BoundingBox3D } from '../../utils/geometry';
import { calculateBoundingBox, calculateFullBoundingBox3D } from '../../utils/geometry';

const KeyboardCanvas: React.FC = () => {
  const { data, selectKey, selectedKeyId, selectTrackball, selectedTrackballId, selectController, selectedControllerId, selectBattery, selectedBatteryId, gridVisible, gridSize } = useKeyboardStore();

  const groundY = -12;
  const { typingAngle, tentingAngle, splitRotation, splitGap } = data.case_config;
  const keyPitch = data.case_config.keyPitch;
  
  const isEditing = selectedKeyId !== null || selectedTrackballId !== null || selectedControllerId !== null || selectedBatteryId !== null;

  const leftKeys = data.layout.filter(k => k.side === 'left' || !k.side);
  const rightKeys = data.layout.filter(k => k.side === 'right');

  const leftTrackballs = (data.trackballs || []).filter(t => t.side === 'left' || !t.side);
  const rightTrackballs = (data.trackballs || []).filter(t => t.side === 'right');

  const leftBatteries = (data.batteries || []).filter(b => b.side === 'left' || !b.side);
  const rightBatteries = (data.batteries || []).filter(b => b.side === 'right');

  const bbox = calculateBoundingBox(data.layout, keyPitch);
  const centerOffset = bbox ? [-bbox.centerX, 0, -bbox.centerY] : [0, 0, 0];

  const leftFullBbox = calculateFullBoundingBox3D(leftKeys, leftTrackballs, data.controllers?.filter(c => c.side === 'left'), leftBatteries, keyPitch);
  const rightFullBbox = calculateFullBoundingBox3D(rightKeys, rightTrackballs, data.controllers?.filter(c => c.side === 'right'), rightBatteries, keyPitch);
  
  const getLiftOffset = (bbox: BoundingBox3D | null, tentingDeg: number, splitDeg: number, typingDeg: number) => {
    if (!bbox) return 0;
    const tent = tentingDeg * (Math.PI / 180);
    const split = splitDeg * (Math.PI / 180);
    const typing = typingDeg * (Math.PI / 180);
    
    // Corners in local coordinate system
    // Three.js coordinates: x=X, y=Height, z=Y
    const xMin = bbox.minX - bbox.centerX;
    const xMax = bbox.maxX - bbox.centerX;
    const yMin = bbox.minY - bbox.centerY; // Layout Y -> Three.js Z
    const yMax = bbox.maxY - bbox.centerY; // Layout Y -> Three.js Z
    const zMin = bbox.minZ; // Height -> Three.js Y
    const zMax = bbox.maxZ; // Height -> Three.js Y

    const corners = [
      { x: xMin, y: zMin, z: yMin },
      { x: xMax, y: zMin, z: yMin },
      { x: xMin, y: zMin, z: yMax },
      { x: xMax, y: zMin, z: yMax },
      { x: xMin, y: zMax, z: yMin },
      { x: xMax, y: zMax, z: yMin },
      { x: xMin, y: zMax, z: yMax },
      { x: xMax, y: zMax, z: yMax },
    ];

    let minRelWorldY = Infinity;
    corners.forEach(p => {
      // Rotation order in Three.js (default XYZ):
      // Rotation prop [0, split, tenting] means:
      // Rotate X (0), then Y (split), then Z (tenting)
      
      // Rotate around Y (split)
      const x1 = p.x * Math.cos(split) + p.z * Math.sin(split);
      const y1 = p.y;
      const z1 = -p.x * Math.sin(split) + p.z * Math.cos(split);
      
      // Rotate around Z (tenting)
      const y2 = x1 * Math.sin(tent) + y1 * Math.cos(tent);
      const z2 = z1;
      
      // Parent rotation: [typingAngle, 0, 0] (X)
      // worldY = y2 * cos(typing) - z2 * sin(typing)
      const relWorldY = y2 * Math.cos(typing) - z2 * Math.sin(typing);
      if (relWorldY < minRelWorldY) minRelWorldY = relWorldY;
    });

    // We want (lift + minRelWorldY_at_lift_0) * cos(typing) = groundY is NOT correct.
    // The Lift is applied to the child group's position before parent rotation.
    // Parent relative Y = lift + y2
    // Parent relative Z = z2
    // World Y = (lift + y2) * cos(typing) - z2 * sin(typing)
    // World Y = lift * cos(typing) + (y2 * cos(typing) - z2 * sin(typing))
    // We want min(World Y) = groundY
    // lift * cos(typing) + minRelWorldY = groundY
    // lift = (groundY - minRelWorldY) / cos(typing)
    
    return (groundY - minRelWorldY) / Math.cos(typing);
  };

  const leftLift = getLiftOffset(leftFullBbox, tentingAngle, splitRotation, typingAngle);
  const rightLift = getLiftOffset(rightFullBbox, -tentingAngle, -splitRotation, typingAngle);
  
  const integratedBbox = calculateFullBoundingBox3D(data.layout, data.trackballs, data.controllers, data.batteries, keyPitch);
  const integratedLift = getLiftOffset(integratedBbox, 0, 0, typingAngle);

  return (
    <Canvas
      shadows
      camera={{ position: [150, 200, 250], fov: 45, up: [0, 1, 0], near: 0.1, far: 2000 }}
      style={{ height: '100%', width: '100%' }}
    >
      <color attach="background" args={['#0a0a0c']} />
      <fog attach="fog" args={['#0a0a0c', 200, 1000]} />
      
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <spotLight position={[100, 200, 100]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-100, -100, -100]} intensity={0.5} />
        
        <Environment preset="city" />

        <Float 
          speed={isEditing ? 0 : 1.5} 
          rotationIntensity={isEditing ? 0 : 0.2} 
          floatIntensity={isEditing ? 0 : 0.5}
        >
          {/* Apply typing angle tilt and centering offset */}
          <group 
            rotation={[typingAngle * (Math.PI / 180), 0, 0]}
            position={[0, 0, 0]}
          >
            {data.type === 'integrated' ? (
              <group position={[centerOffset[0], integratedLift, centerOffset[2]]}>
                {data.layout.map((key) => (
                  <KeySwitch key={key.id} config={key} />
                ))}
                <Plate />
                <PCB />
                <Case />
                {(data.trackballs || []).map((t) => (
                  <Trackball key={t.id} config={t} />
                ))}
                {(data.controllers || []).map((c) => (
                  <MicroController 
                    key={c.id}
                    type={c.type}
                    position={[c.x, c.mountingSide === 'bottom' ? -4 : -2, c.y]}
                    rotation={[c.mountingSide === 'bottom' ? Math.PI : 0, 0, (c.rotation * Math.PI) / 180]}
                    mountingSide={c.mountingSide}
                  />
                ))}
                {(data.batteries || []).map((b) => (
                  <Battery 
                    key={b.id}
                    id={b.id}
                    width={b.width}
                    height={b.height}
                    thickness={b.thickness}
                    position={[b.x, b.mountingSide === 'bottom' ? -4 : -2, b.y]}
                    rotation={[b.mountingSide === 'bottom' ? Math.PI : 0, 0, (b.rotation * Math.PI) / 180]}
                    mountingSide={b.mountingSide}
                  />
                ))}
              </group>
            ) : (
              <>
                {/* Left Side */}
                <group 
                  rotation={[0, splitRotation * (Math.PI / 180), tentingAngle * (Math.PI / 180)]}
                  position={[-splitGap / 2, leftLift, 0]}
                >
                  {leftFullBbox && (
                    <group position={[-leftFullBbox.centerX, 0, -leftFullBbox.centerY]}>
                      {leftKeys.map((key) => (
                        <KeySwitch key={key.id} config={key} />
                      ))}
                      <Plate side="left" />
                      <PCB side="left" />
                      <Case side="left" />
                      {leftTrackballs.map((t) => (
                        <Trackball key={t.id} config={t} />
                      ))}
                      {(data.controllers || []).filter(c => c.side === 'left' || !c.side).map((c) => (
                        <MicroController 
                          key={c.id}
                          type={c.type}
                          position={[c.x, c.mountingSide === 'bottom' ? -4 : -2, c.y]}
                          rotation={[c.mountingSide === 'bottom' ? Math.PI : 0, 0, (c.rotation * Math.PI) / 180]}
                          mountingSide={c.mountingSide}
                          side="left"
                        />
                      ))}
                      {leftBatteries.map((b) => (
                        <Battery 
                          key={b.id}
                          id={b.id}
                          width={b.width}
                          height={b.height}
                          thickness={b.thickness}
                          position={[b.x, b.mountingSide === 'bottom' ? -4 : -2, b.y]}
                          rotation={[b.mountingSide === 'bottom' ? Math.PI : 0, 0, (b.rotation * Math.PI) / 180]}
                          mountingSide={b.mountingSide}
                          side="left"
                        />
                      ))}
                    </group>
                  )}
                </group>

                {/* Right Side */}
                <group 
                  rotation={[0, -splitRotation * (Math.PI / 180), -tentingAngle * (Math.PI / 180)]}
                  position={[splitGap / 2, rightLift, 0]}
                >
                  {rightFullBbox && (
                    <group position={[-rightFullBbox.centerX, 0, -rightFullBbox.centerY]}>
                      {rightKeys.map((key) => (
                        <KeySwitch key={key.id} config={key} />
                      ))}
                      <Plate side="right" />
                      <PCB side="right" />
                      <Case side="right" />
                      {rightTrackballs.map((t) => (
                        <Trackball key={t.id} config={t} />
                      ))}
                      {(data.controllers || []).filter(c => c.side === 'right').map((c) => (
                        <MicroController 
                          key={c.id}
                          type={c.type}
                          position={[c.x, c.mountingSide === 'bottom' ? -4 : -2, c.y]}
                          rotation={[c.mountingSide === 'bottom' ? Math.PI : 0, 0, (c.rotation * Math.PI) / 180]}
                          mountingSide={c.mountingSide}
                          side="right"
                        />
                      ))}
                      {rightBatteries.map((b) => (
                        <Battery 
                          key={b.id}
                          id={b.id}
                          width={b.width}
                          height={b.height}
                          thickness={b.thickness}
                          position={[b.x, b.mountingSide === 'bottom' ? -4 : -2, b.y]}
                          rotation={[b.mountingSide === 'bottom' ? Math.PI : 0, 0, (b.rotation * Math.PI) / 180]}
                          mountingSide={b.mountingSide}
                          side="right"
                        />
                      ))}
                    </group>
                  )}
                </group>
              </>
            )}

            {gridVisible && (
              <Grid
                infiniteGrid
                fadeDistance={1000}
                fadeStrength={5}
                cellSize={gridSize / 4}
                sectionSize={gridSize}
                sectionColor="#4f46e5"
                cellColor="#2e2e3a"
                position={[0, groundY + 0.1, 0]} // Grid slightly above shadow plane
              />
            )}
          </group>
        </Float>

        <ContactShadows 
          opacity={0.4} 
          scale={400} 
          blur={2} 
          far={20} 
          resolution={256} 
          color="#000000" 
          position={[0, groundY, 0]}
        />
      </Suspense>

      <OrbitControls 
        target={[0, 0, 0]} // Always orbit around the centered keyboard
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        makeDefault 
      />

      {/* Background plane for deselection */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -10, 0]} 
        onClick={() => {
          selectKey(null);
          selectTrackball(null);
          selectController(null);
          selectBattery(null);
        }}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </Canvas>
  );
};

export default KeyboardCanvas;

