import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { calculateBoundingBox } from '../../utils/geometry';
import type { KeyConfig, TrackballConfig, ControllerConfig } from '../../types';

const UNIT = 19.05; // Standard key pitch

const Keyboard2D: React.FC = () => {
  const { 
    data, 
    selectedKeyId, 
    selectKey,
    updateKey,
    gridVisible,
    gridSnapping,
    gridSize,
    collisions,
    splitMode,
    tempSplitX,
    setTempSplitX,
    applySplit,
    selectedTrackballId,
    selectTrackball,
    updateTrackball,
    selectedControllerId,
    selectController,
    updateController
  } = useKeyboardStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingKeyId, setDraggingKeyId] = useState<string | null>(null);
  const [draggingTrackballId, setDraggingTrackballId] = useState<string | null>(null);
  const [draggingControllerId, setDraggingControllerId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [viewBox, setViewBox] = useState({ x: -250, y: -200, width: 500, height: 400 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hasMovedDuringPan, setHasMovedDuringPan] = useState(false);

  const { layout, type: keyboardType, case_config } = data;
  const { splitGap, splitRotation } = case_config;

  const leftKeys = useMemo(() => layout.filter(k => k.side === 'left' || !k.side), [layout]);
  const rightKeys = useMemo(() => layout.filter(k => k.side === 'right'), [layout]);

  const leftTrackballs = useMemo(() => (data.trackballs || []).filter(t => t.side === 'left' || !t.side), [data.trackballs]);
  const rightTrackballs = useMemo(() => (data.trackballs || []).filter(t => t.side === 'right'), [data.trackballs]);
  const leftControllers = useMemo(() => (data.controllers || []).filter(c => c.side === 'left' || !c.side), [data.controllers]);
  const rightControllers = useMemo(() => (data.controllers || []).filter(c => c.side === 'right'), [data.controllers]);

  const leftBbox = useMemo(() => calculateBoundingBox(leftKeys, case_config.keyPitch), [leftKeys, case_config.keyPitch]);
  const rightBbox = useMemo(() => calculateBoundingBox(rightKeys, case_config.keyPitch), [rightKeys, case_config.keyPitch]);
  const fullBbox = useMemo(() => calculateBoundingBox(layout, case_config.keyPitch), [layout, case_config.keyPitch]);

  // Adjust viewBox to fit the keyboard initialy or when layout changes significantly
  useEffect(() => {
    if (fullBbox) {
      const padding = 100;
      setViewBox({
        x: fullBbox.minX - padding,
        y: fullBbox.minY - padding,
        width: fullBbox.width + padding * 2,
        height: fullBbox.height + padding * 2
      });
    }
  }, [keyboardType, splitGap]);

  const getMousePos = (e: React.MouseEvent | MouseEvent | React.WheelEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return { x: svgPt.x, y: svgPt.y };
  };

  const handleMouseDown = (e: React.MouseEvent, keyId: string) => {
    e.stopPropagation();
    selectKey(keyId);
    setDraggingKeyId(keyId);
    
    const key = layout.find(k => k.id === keyId);
    if (key) {
      const mousePos = getMousePos(e);
      setDragOffset({
        x: mousePos.x - key.x,
        y: mousePos.y - key.y
      });
    }
  };

  const handleTrackballMouseDown = (e: React.MouseEvent, trackballId: string) => {
    e.stopPropagation();
    selectTrackball(trackballId);
    setDraggingTrackballId(trackballId);
    
    const trackball = (data.trackballs || []).find(t => t.id === trackballId);
    if (trackball) {
      const mousePos = getMousePos(e);
      setDragOffset({
        x: mousePos.x - trackball.x,
        y: mousePos.y - trackball.y
      });
    }
  };

  const handleControllerMouseDown = (e: React.MouseEvent, controllerId: string) => {
    e.stopPropagation();
    selectController(controllerId);
    setDraggingControllerId(controllerId);
    
    const controller = (data.controllers || []).find(c => c.id === controllerId);
    if (controller) {
      const mousePos = getMousePos(e);
      setDragOffset({
        x: mousePos.x - controller.x,
        y: mousePos.y - controller.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingKeyId) {
      const mousePos = getMousePos(e);
      const newX = mousePos.x - dragOffset.x;
      const newY = mousePos.y - dragOffset.y;
      
      const snapIncrement = gridSnapping ? gridSize / 4 : 0.25;
      const snap = (val: number) => Math.round(val / snapIncrement) * snapIncrement;

      updateKey(draggingKeyId, {
        x: snap(newX),
        y: snap(newY)
      });
    } else if (draggingTrackballId) {
      const mousePos = getMousePos(e);
      const newX = mousePos.x - dragOffset.x;
      const newY = mousePos.y - dragOffset.y;
      
      const snapIncrement = gridSnapping ? gridSize / 4 : 0.25;
      const snap = (val: number) => Math.round(val / snapIncrement) * snapIncrement;

      updateTrackball(draggingTrackballId, {
        x: snap(newX),
        y: snap(newY)
      });
    } else if (draggingControllerId) {
      const mousePos = getMousePos(e);
      const newX = mousePos.x - dragOffset.x;
      const newY = mousePos.y - dragOffset.y;
      
      const snapIncrement = gridSnapping ? gridSize / 4 : 0.25;
      const snap = (val: number) => Math.round(val / snapIncrement) * snapIncrement;

      updateController(draggingControllerId, {
        x: snap(newX),
        y: snap(newY)
      });
    } else if (isPanning) {
      const dx = (e.clientX - panStart.x) * (viewBox.width / (svgRef.current?.clientWidth || 1));
      const dy = (e.clientY - panStart.y) * (viewBox.height / (svgRef.current?.clientHeight || 1));
      
      if (Math.abs(e.clientX - panStart.x) > 2 || Math.abs(e.clientY - panStart.y) > 2) {
        setHasMovedDuringPan(true);
      }

      setViewBox(prev => ({
        ...prev,
        x: prev.x - dx,
        y: prev.y - dy
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (splitMode) {
      const mousePos = getMousePos(e);
      const snapIncrement = gridSnapping ? gridSize / 4 : 0.25;
      const snap = (val: number) => Math.round(val / snapIncrement) * snapIncrement;
      setTempSplitX(snap(mousePos.x));
    }
  };

  const handleMouseUp = () => {
    setDraggingKeyId(null);
    setDraggingTrackballId(null);
    setDraggingControllerId(null);
    setIsPanning(false);
  };

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (splitMode) return; // Prevent panning during split selection

    if (e.button === 0) { // Left click
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setHasMovedDuringPan(false);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;
    
    setViewBox(prev => {
      const mousePos = getMousePos(e);
      const newWidth = prev.width * scaleFactor;
      const newHeight = prev.height * scaleFactor;
      
      return {
        x: prev.x + (mousePos.x - prev.x) * (1 - scaleFactor),
        y: prev.y + (mousePos.y - prev.y) * (1 - scaleFactor),
        width: newWidth,
        height: newHeight
      };
    });
  };

  const renderKey = (key: KeyConfig) => {
    const isSelected = selectedKeyId === key.id;
    const hasCollision = collisions[key.id];
    const w = key.keycapSize.width * case_config.keyPitch - 1;
    const h = key.keycapSize.height * case_config.keyPitch - 1;

    return (
      <g 
        key={key.id}
        transform={`translate(${key.x}, ${key.y}) rotate(${-key.rotation})`}
        onMouseDown={(e) => !splitMode && handleMouseDown(e, key.id)}
        onClick={(e) => e.stopPropagation()}
        style={{ cursor: splitMode ? 'default' : 'move' }}
      >
        {/* Keycap Outer */}
        <rect
          x={-w/2}
          y={-h/2}
          width={w}
          height={h}
          rx={3}
          fill={isSelected ? 'rgba(96, 165, 250, 0.4)' : 'rgba(30, 58, 138, 0.6)'}
          stroke={hasCollision ? '#ef4444' : (isSelected ? '#60a5fa' : '#3b82f6')}
          strokeWidth={isSelected ? 2 : 1}
        />
        {/* Inner Detail */}
        <rect
          x={-w/2 + 2}
          y={-h/2 + 2}
          width={w - 4}
          height={h - 4}
          rx={2}
          fill="none"
          stroke="rgba(96, 165, 250, 0.2)"
          strokeWidth={0.5}
        />
        {/* Label */}
        <text
          y={1}
          textAnchor="middle"
          fontSize={6}
          fontWeight="bold"
          fill={isSelected ? '#fff' : '#60a5fa'}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {`${key.keycapSize.width}u`}
        </text>
      </g>
    );
  };

  const renderTrackball = (trackball: TrackballConfig) => {
    const isSelected = selectedTrackballId === trackball.id;
    const r = (trackball.diameter || 34) / 2;

    return (
      <g 
        key={trackball.id}
        transform={`translate(${trackball.x}, ${trackball.y})`}
        onMouseDown={(e) => !splitMode && handleTrackballMouseDown(e, trackball.id)}
        onClick={(e) => e.stopPropagation()}
        style={{ cursor: splitMode ? 'default' : 'move' }}
      >
        <circle
          r={r}
          fill={isSelected ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.6)'}
          stroke={isSelected ? '#f87171' : '#ef4444'}
          strokeWidth={isSelected ? 2 : 1}
        />
        <circle
          r={r - 4}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={0.5}
        />
        <text
          y={4}
          textAnchor="middle"
          fontSize={8}
          fontWeight="bold"
          fill="#fff"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {trackball.diameter}mm
        </text>
        {/* Sensor Position Indicator */}
        <circle
          cx={Math.sin((trackball.sensorAngle || 0) * Math.PI / 180) * (r * 0.7)}
          cy={0} // In 2D, it only moves left-right if it's rotating in X-Y plane
          r={3}
          fill="#4f46e5"
          stroke="#fff"
          strokeWidth={0.5}
        />
      </g>
    );
  };

  const renderController = (controller: ControllerConfig) => {
    const isSelected = selectedControllerId === controller.id;
    
    let dimensions = { width: 18, length: 33 };
    switch (controller.type) {
      case 'xiao_rp2040': dimensions = { width: 18, length: 21 }; break;
      case 'pico': dimensions = { width: 21, length: 51 }; break;
      case 'bluepill': dimensions = { width: 23, length: 53 }; break;
    }

    const { width: w, length: l } = dimensions;

    return (
      <g 
        key={controller.id}
        transform={`translate(${controller.x}, ${controller.y}) rotate(${-controller.rotation})`}
        onMouseDown={(e) => !splitMode && handleControllerMouseDown(e, controller.id)}
        onClick={(e) => e.stopPropagation()}
        style={{ cursor: splitMode ? 'default' : 'move' }}
      >
        {/* PCB Body */}
        <rect
          x={-w/2}
          y={-l/2}
          width={w}
          height={l}
          rx={2}
          fill={isSelected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.6)'}
          stroke={isSelected ? '#34d399' : '#10b981'}
          strokeWidth={isSelected ? 2 : 1}
        />
        {/* USB Connector Indicator */}
        <rect
          x={-4}
          y={-l/2 - 2}
          width={8}
          height={4}
          rx={1}
          fill="#999"
        />
        {/* Label */}
        <text
          y={2}
          textAnchor="middle"
          fontSize={5}
          fontWeight="bold"
          fill="#fff"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {controller.type.toUpperCase().replace('_', ' ')}
        </text>
        {/* Side Label (for split) */}
        <text
          y={-3}
          textAnchor="middle"
          fontSize={4}
          fontWeight="bold"
          fill={controller.side === 'left' ? '#60a5fa' : '#f87171'}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {controller.side.toUpperCase()}
        </text>
        {/* Mounting Side Indicator */}
        <text
          y={8}
          textAnchor="middle"
          fontSize={4}
          fill="rgba(255, 255, 255, 0.8)"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {controller.mountingSide.toUpperCase()}
        </text>
      </g>
    );
  };

  const renderHalf = (keys: KeyConfig[], bbox: any, side: 'left' | 'right') => {
    if (!bbox) return null;

    const rotation = side === 'left' ? splitRotation : -splitRotation;
    const offsetX = side === 'left' ? -splitGap / 2 : splitGap / 2;

    return (
      <g transform={`translate(${offsetX}, 0) rotate(${rotation})`}>
        {/* Plate Outline */}
        <rect
          x={-bbox.width/2}
          y={-bbox.height/2}
          width={bbox.width}
          height={bbox.height}
          rx={4}
          fill="rgba(30, 58, 138, 0.2)"
          stroke="#60a5fa"
          strokeWidth={1}
          strokeDasharray="4,2"
        />
        <g transform={`translate(${-bbox.centerX}, ${-bbox.centerY})`}>
          {keys.map(renderKey)}
          {(side === 'left' ? leftTrackballs : rightTrackballs).map(renderTrackball)}
          {(side === 'left' ? leftControllers : rightControllers).map(renderController)}
        </g>
      </g>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%', background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseDown={handleSvgMouseDown}
        onWheel={handleWheel}
        onClick={() => {
          if (splitMode && tempSplitX !== null) {
            applySplit(tempSplitX);
          } else if (!hasMovedDuringPan) {
            selectKey(null);
            selectTrackball(null);
            selectController(null);
          }
        }}
      >
        <defs>
          <pattern id="grid" width={UNIT} height={UNIT} patternUnits="userSpaceOnUse">
            <path d={`M ${UNIT} 0 L 0 0 0 ${UNIT}`} fill="none" stroke="rgba(96, 165, 250, 0.1)" strokeWidth="0.5" />
          </pattern>
          <pattern id="subgrid" width={UNIT/4} height={UNIT/4} patternUnits="userSpaceOnUse">
            <path d={`M ${UNIT/4} 0 L 0 0 0 ${UNIT/4}`} fill="none" stroke="rgba(96, 165, 250, 0.05)" strokeWidth="0.2" />
          </pattern>
        </defs>

        {/* Background Grid */}
        {gridVisible && (
          <>
            <rect x={viewBox.x} y={viewBox.y} width={viewBox.width} height={viewBox.height} fill="url(#subgrid)" />
            <rect x={viewBox.x} y={viewBox.y} width={viewBox.width} height={viewBox.height} fill="url(#grid)" />
          </>
        )}

        <g transform="translate(0, 0)">
          {keyboardType === 'integrated' ? (
            <g transform={fullBbox ? `translate(${-fullBbox.centerX}, ${-fullBbox.centerY})` : ''}>
              {/* Integrated Plate */}
              {fullBbox && (
                <rect
                  x={fullBbox.minX - 2}
                  y={fullBbox.minY - 2}
                  width={fullBbox.width + 4}
                  height={fullBbox.height + 4}
                  rx={4}
                  fill="rgba(30, 58, 138, 0.2)"
                  stroke="#60a5fa"
                  strokeWidth={1}
                  strokeDasharray="4,2"
                />
               )}
               {layout.map(renderKey)}
              {(data.trackballs || []).map(renderTrackball)}
              {(data.controllers || []).map(renderController)}
            </g>
          ) : (
            <>
              {renderHalf(leftKeys, leftBbox, 'left')}
              {renderHalf(rightKeys, rightBbox, 'right')}
            </>
          )}
        </g>

        {/* Split Mode Preview Line */}
        {splitMode && tempSplitX !== null && (
          <g>
            <line
              x1={tempSplitX}
              y1={viewBox.y}
              x2={tempSplitX}
              y2={viewBox.y + viewBox.height}
              stroke="#fbbf24"
              strokeWidth={2}
              strokeDasharray="4,2"
              className="split-line-animation"
            />
            <rect
              x={tempSplitX - 20}
              y={viewBox.y + 20}
              width={40}
              height={20}
              rx={4}
              fill="#fbbf24"
            />
            <text
              x={tempSplitX}
              y={viewBox.y + 34}
              textAnchor="middle"
              fontSize={10}
              fontWeight="bold"
              fill="#000"
            >
              SPLIT
            </text>
          </g>
        )}
      </svg>

      {/* Info Overlay */}
      <div style={{ position: 'absolute', bottom: 20, right: 20, color: '#60a5fa', fontSize: '0.75rem', pointerEvents: 'none' }} className="glass">
        <div style={{ padding: '8px 12px' }}>
          2D BLUEPRINT VIEW
        </div>
      </div>
    </div>
  );
};

export default Keyboard2D;
