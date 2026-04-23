import type { KeyConfig, ControllerType, ControllerConfig, TrackballConfig, BatteryConfig, MountingHole } from '../types';

export interface CollisionResult {
  hasCollision: boolean;
  collidingKeyIds: string[];
}

interface Point {
  x: number;
  y: number;
}

/**
 * Calculates the 4 corners of a generic component, accounting for rotation.
 */
export const getComponentCorners = (
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number = 0,
  buffer: number = 0
): Point[] => {
  const w = width - buffer;
  const h = height - buffer;
  const angle = (rotation * Math.PI) / 180;
  
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  const hw = w / 2;
  const hh = h / 2;
  
  // 4 corners relative to center
  const corners = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh }
  ];
  
  // Rotate and translate to absolute coordinates
  return corners.map(p => ({
    x: x + p.x * cos - p.y * sin,
    y: y + p.x * sin + p.y * cos
  }));
};

/**
 * Calculates the 4 corners of a keycap, accounting for rotation and an optional buffer.
 */
const getCorners = (key: KeyConfig, unit: number, buffer: number = 0): Point[] => {
  return getComponentCorners(
    key.x,
    key.y,
    key.keycapSize.width * unit,
    key.keycapSize.height * unit,
    key.rotation,
    buffer
  );
};

/**
 * Calculates the 4 corners of a trackball sensor PCB, accounting for sensor placement.
 */
export const getTrackballPCBCorners = (t: TrackballConfig): Point[] => {
  const r = t.diameter / 2;
  const sensorAngleRad = ((t.sensorAngle || 0) * Math.PI) / 180;
  
  // Offset of the PCB center from the ball center projected onto 2D plane
  const offsetDistance = (r + 3) * Math.sin(sensorAngleRad);
  
  const rotationRad = ((t.rotation || 0) * Math.PI) / 180;
  const cosR = Math.cos(rotationRad);
  const sinR = Math.sin(rotationRad);

  const centerX = t.x + offsetDistance * cosR;
  const centerY = t.y + offsetDistance * sinR;
  
  // The PCB is 28x28. If it's tilted, its footprint in X changes.
  // We use the projected width.
  const projectedWidth = Math.max(1.6, 28 * Math.abs(Math.cos(sensorAngleRad)));
  const projectedHeight = 28;

  return getComponentCorners(centerX, centerY, projectedWidth, projectedHeight, (t.rotation || 0) + (t.sensorRotation || 0));
};

/**
 * Gets the axes (normals) to check for the Separating Axis Theorem.
 */
const getAxes = (corners: Point[]): Point[] => {
  const axes: Point[] = [];
  for (let i = 0; i < corners.length; i++) {
    const p1 = corners[i];
    const p2 = corners[(i + 1) % corners.length];
    const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
    // Normal vector
    axes.push({ x: -edge.y, y: edge.x });
  }
  return axes;
};

/**
 * Projects corners onto an axis and returns the min/max range.
 */
const project = (corners: Point[], axis: Point) => {
  let min = Infinity;
  let max = -Infinity;
  const len = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
  const normAxis = { x: axis.x / len, y: axis.y / len };

  for (const p of corners) {
    const dot = p.x * normAxis.x + p.y * normAxis.y;
    if (dot < min) min = dot;
    if (dot > max) max = dot;
  }
  return { min, max };
};

/**
 * Checks if two oriented bounding boxes intersect using Separating Axis Theorem.
 */
const intersectOBB = (cornersA: Point[], cornersB: Point[]): boolean => {
  const axes = [...getAxes(cornersA), ...getAxes(cornersB)];
  for (const axis of axes) {
    const p1 = project(cornersA, axis);
    const p2 = project(cornersB, axis);
    if (p1.max < p2.min || p2.max < p1.min) return false;
  }
  return true;
};

/**
 * Checks for interference (overlaps) between keys in the layout.
 * For split keyboards, it only checks collisions between keys on the same side.
 */
export const checkInterference = (
  layout: KeyConfig[], 
  trackballs: TrackballConfig[] = [],
  controllers: ControllerConfig[] = [],
  batteries: BatteryConfig[] = [],
  keyPitch: number = 19.05
): Record<string, boolean> => {
  const collisions: Record<string, boolean> = {};
  const UNIT = keyPitch;
  const BUFFER = 0.5; // Small buffer (0.25mm per side) to allow touching components

  const allComponents: { id: string; side: string; corners: Point[] }[] = [];

  // Keys
  layout.forEach(key => {
    allComponents.push({
      id: key.id,
      side: key.side || 'left',
      corners: getCorners(key, UNIT, BUFFER)
    });
  });

  // Trackball PCBs
  trackballs.forEach(t => {
    allComponents.push({
      id: t.id,
      side: t.side || 'left',
      corners: getTrackballPCBCorners(t)
    });
  });

  // Controllers
  controllers.forEach(c => {
    const dim = getControllerDimensions(c.type);
    allComponents.push({
      id: c.id,
      side: c.side || 'left',
      corners: getComponentCorners(c.x, c.y, dim.width, dim.length, c.rotation, BUFFER)
    });
  });

  // Batteries
  batteries.forEach(b => {
    allComponents.push({
      id: b.id,
      side: b.side || 'left',
      corners: getComponentCorners(b.x, b.y, b.width, b.height, b.rotation, BUFFER)
    });
  });

  for (let i = 0; i < allComponents.length; i++) {
    for (let j = i + 1; j < allComponents.length; j++) {
      const a = allComponents[i];
      const b = allComponents[j];

      // Components on different sides of a split keyboard cannot collide
      if (a.side !== b.side) continue;

      if (intersectOBB(a.corners, b.corners)) {
        collisions[a.id] = true;
        collisions[b.id] = true;
      }
    }
  }

  return collisions;
};

export interface BoundingBox {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface BoundingBox3D extends BoundingBox {
  minZ: number;
  maxZ: number;
  centerZ: number;
  depth: number;
}

/**
 * Calculates the bounding box for a set of keys, accounting for rotation.
 */
export const calculateBoundingBox = (keys: KeyConfig[], keyPitch: number = 19.05, padding: number = 0): BoundingBox | null => {
  if (keys.length === 0) return null;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const UNIT = keyPitch;

  keys.forEach(key => {
    const corners = getCorners(key, UNIT, 0);
    corners.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
  });

  return {
    width: (maxX - minX) + padding * 2,
    height: (maxY - minY) + padding * 2,
    centerX: (maxX + minX) / 2,
    centerY: (maxY + minY) / 2,
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding,
  };
};

/**
 * Calculates the bounding box for any set of points.
 */
export const calculatePointsBoundingBox = (points: Point[], padding: number = 0): BoundingBox | null => {
  if (points.length === 0) return null;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  points.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });

  return {
    width: (maxX - minX) + padding * 2,
    height: (maxY - minY) + padding * 2,
    centerX: (maxX + minX) / 2,
    centerY: (maxY + minY) / 2,
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding,
  };
};

/**
 * Returns dimensions (width, length) for a given controller type.
 */
export const getControllerDimensions = (type: ControllerType): { width: number; length: number } => {
  switch (type) {
    case 'xiao_rp2040':
    case 'xiao_ble': return { width: 18, length: 21 };
    case 'pico': return { width: 21, length: 51 };
    case 'bluepill': return { width: 23, length: 53 };
    case 'pro_micro':
    case 'elite_c':
    default: return { width: 18, length: 33 };
  }
};

/**
 * Calculates a 3D bounding box that encompasses all provided components.
 */
export const calculateFullBoundingBox3D = (
  keys: KeyConfig[],
  trackballs: TrackballConfig[] = [],
  controllers: ControllerConfig[] = [],
  batteries: BatteryConfig[] = [],
  mountingHoles: MountingHole[] = [],
  keyPitch: number = 19.05,
  padding: number = 0
): BoundingBox3D | null => {
  const bbox2d = calculateFullBoundingBox(keys, trackballs, controllers, batteries, mountingHoles, keyPitch, padding);
  if (!bbox2d) return null;

  let minZ = 0;
  let maxZ = 0;

  if (keys.length > 0) {
    minZ = Math.min(minZ, -5); 
    maxZ = Math.max(maxZ, 12); 
  }

  trackballs.forEach(t => {
    const ballCenterZ = (t.z ?? -6.5) + (t.diameter / 2 - 2);
    const ballRadius = t.diameter / 2;
    const pcbZ = ballCenterZ - 7;
    minZ = Math.min(minZ, pcbZ - 2);
    maxZ = Math.max(maxZ, ballCenterZ + ballRadius);
  });

  controllers.forEach(c => {
    const baseZ = c.mountingSide === 'bottom' ? -4 : -2;
    minZ = Math.min(minZ, baseZ - 2);
    maxZ = Math.max(maxZ, baseZ + 3);
  });

  batteries.forEach(b => {
    const baseZ = b.mountingSide === 'bottom' ? -4 : -2;
    minZ = Math.min(minZ, baseZ - b.thickness);
    maxZ = Math.max(maxZ, baseZ + b.thickness);

    if (b.connectorEnabled && b.connectorMountingSide) {
      const connZ = b.connectorMountingSide === 'bottom' ? -4 : -2;
      minZ = Math.min(minZ, connZ - 2);
      maxZ = Math.max(maxZ, connZ + 4);
    }
  });

  minZ = Math.min(minZ, -9); 

  return {
    ...bbox2d,
    minZ: minZ - padding,
    maxZ: maxZ + padding,
    centerZ: (minZ + maxZ) / 2,
    depth: maxZ - minZ + padding * 2,
  };
};

export const calculateFullBoundingBox = (
  keys: KeyConfig[],
  trackballs: TrackballConfig[] = [],
  controllers: ControllerConfig[] = [],
  batteries: BatteryConfig[] = [],
  mountingHoles: MountingHole[] = [],
  keyPitch: number = 19.05,
  padding: number = 0
): BoundingBox | null => {
  const allCorners: Point[] = [];

  keys.forEach(key => {
    allCorners.push(...getComponentCorners(
      key.x,
      key.y,
      key.keycapSize.width * keyPitch,
      key.keycapSize.height * keyPitch,
      key.rotation
    ));
  });

  trackballs.forEach(t => {
    allCorners.push(...getTrackballPCBCorners(t));
    // Also include the ball itself
    allCorners.push(...getComponentCorners(t.x, t.y, t.diameter, t.diameter, 0));
  });

  controllers.forEach(c => {
    const dim = getControllerDimensions(c.type);
    allCorners.push(...getComponentCorners(c.x, c.y, dim.width, dim.length, c.rotation));
  });

  batteries.forEach(b => {
    allCorners.push(...getComponentCorners(b.x, b.y, b.width, b.height, b.rotation));
    if (b.connectorEnabled && b.connectorX !== undefined && b.connectorY !== undefined) {
      // Connector size approx 6x5mm
      allCorners.push(...getComponentCorners(b.connectorX, b.connectorY, 6, 5, 0));
    }
  });

  mountingHoles.forEach(h => {
    allCorners.push(...getComponentCorners(h.x, h.y, h.diameter, h.diameter, 0));
  });

  return calculatePointsBoundingBox(allCorners, padding);
};

/**
 * Calculates the vertical lift required to keep the keyboard above the ground plane.
 */
export const calculateLift = (
  bbox: BoundingBox3D | null,
  groundY: number,
  tentingDeg: number,
  splitDeg: number,
  typingDeg: number
): number => {
  if (!bbox) return 0;
  const tent = tentingDeg * (Math.PI / 180);
  const split = splitDeg * (Math.PI / 180);
  const typing = typingDeg * (Math.PI / 180);
  
  const cosT = Math.cos(tent);
  const sinT = Math.sin(tent);
  const cosS = Math.cos(split);
  const sinS = Math.sin(split);
  const cosTy = Math.cos(typing);
  const sinTy = Math.sin(typing);

  const xMin = bbox.minX - bbox.centerX;
  const xMax = bbox.maxX - bbox.centerX;
  const yMin = bbox.minY - bbox.centerY;
  const yMax = bbox.maxY - bbox.centerY;
  const zMin = bbox.minZ;
  const zMax = bbox.maxZ;

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
    // Rotation Order: Z (tent) -> Y (split) -> X (typing)
    // 1. Z Rotation (tent)
    const pz_x = p.x * cosT - p.y * sinT;
    const pz_y = p.x * sinT + p.y * cosT;
    const pz_z = p.z;

    // 2. Y Rotation (split)
    const py_y = pz_y;
    const py_z = -pz_x * sinS + pz_z * cosS;

    // 3. X Rotation (typing)
    const relWorldY = py_y * cosTy - py_z * sinTy;
    
    if (relWorldY < minRelWorldY) minRelWorldY = relWorldY;
  });

  // The denominator is the vertical projection of the local Y axis:
  // d(WorldY) / d(LocalY) = cos(T)*cos(Ty) - sin(T)*sin(S)*sin(Ty)
  const denominator = cosT * cosTy - sinT * sinS * sinTy;
  return (groundY - minRelWorldY) / denominator;
};

/**
 * Calculates the local Y coordinate for a point (x, z) to reach the ground plane.
 */
export const calculateGroundedY = (
  x: number,
  z: number,
  groundY: number,
  lift: number,
  tentingDeg: number,
  splitDeg: number,
  typingDeg: number,
  pivotX: number = 0,
  pivotZ: number = 0
): number => {
  const tent = tentingDeg * (Math.PI / 180);
  const split = splitDeg * (Math.PI / 180);
  const typing = typingDeg * (Math.PI / 180);
  
  const cosT = Math.cos(tent);
  const sinT = Math.sin(tent);
  const cosS = Math.cos(split);
  const sinS = Math.sin(split);
  const cosTy = Math.cos(typing);
  const sinTy = Math.sin(typing);

  const dx = x - pivotX;
  const dz = z - pivotZ;

  // Solving for y_total = y_local + lift:
  // WorldY = y_total * (cosT * cosTy - sinT * sinS * sinTy) + dx * (sinT * cosTy + cosT * sinS * sinTy) - dz * cosS * sinTy
  // Set WorldY = groundY and solve for y_total
  
  const termX = dx * (sinT * cosTy + cosT * sinS * sinTy);
  const termZ = dz * cosS * sinTy;
  const denominator = cosT * cosTy - sinT * sinS * sinTy;
  
  const yTotal = (groundY - termX + termZ) / denominator;
  return yTotal - lift;
};

/**
 * Traces the organic boundary of a set of rectangles on a grid.
 * Useful for generating PCB and Plate outlines that follow component silhouettes.
 */
export const getGridBoundary = (
  addRects: { centerX: number; centerY: number; width: number; height: number; angle: number }[], 
  subShapes: { centerX: number; centerY: number; radius: number }[] = [],
  bridgeRects: { centerX: number; centerY: number; width: number; height: number; angle: number }[] = [],
  resolution: number = 1.0
): { x: number; y: number }[] => {
  if (addRects.length === 0) return [];

  // 1. Calculate Bounding Box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  [...addRects, ...bridgeRects].forEach(r => {
    const diag = Math.sqrt(r.width * r.width + r.height * r.height) / 2;
    minX = Math.min(minX, r.centerX - diag);
    maxX = Math.max(maxX, r.centerX + diag);
    minY = Math.min(minY, r.centerY - diag);
    maxY = Math.max(maxY, r.centerY + diag);
  });
  subShapes.forEach(s => {
    minX = Math.min(minX, s.centerX - s.radius);
    maxX = Math.max(maxX, s.centerX + s.radius);
    minY = Math.min(minY, s.centerY - s.radius);
    maxY = Math.max(maxY, s.centerY + s.radius);
  });

  minX -= resolution * 3;
  minY -= resolution * 3;
  maxX += resolution * 3;
  maxY += resolution * 3;

  const width = Math.ceil((maxX - minX) / resolution);
  const height = Math.ceil((maxY - minY) / resolution);

  // 2. Fill Grid
  const grid = new Uint8Array(width * height);
  const isPointInRect = (px: number, py: number, r: any) => {
    const dx = px - r.centerX;
    const dy = py - r.centerY;
    const cos = Math.cos(-r.angle);
    const sin = Math.sin(-r.angle);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    return Math.abs(rx) <= r.width / 2 && Math.abs(ry) <= r.height / 2;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = minX + x * resolution;
      const py = minY + y * resolution;
      
      // Additive
      let occupied = false;
      for (const r of addRects) {
        if (isPointInRect(px, py, r)) {
          occupied = true;
          break;
        }
      }

      // Subtractive
      if (occupied) {
        for (const s of subShapes) {
          const distSq = (px - s.centerX) ** 2 + (py - s.centerY) ** 2;
          if (distSq <= s.radius ** 2) {
            occupied = false;
            break;
          }
        }
      }

      // Bridges (always additive, even over cutouts)
      if (!occupied) {
        for (const r of bridgeRects) {
          if (isPointInRect(px, py, r)) {
            occupied = true;
            break;
          }
        }
      }

      if (occupied) grid[y * width + x] = 1;
    }
  }

  // 3. Boundary Tracing
  const get = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    return grid[y * width + x];
  };

  let startX = -1, startY = -1;
  outer: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (get(x, y)) {
        startX = x;
        startY = y;
        break outer;
      }
    }
  }

  if (startX === -1) return [];

  const boundary: {x: number, y: number}[] = [];
  let currX = startX, currY = startY;
  let prevX = startX - 1, prevY = startY; 

  const dxs = [0, 1, 1, 1, 0, -1, -1, -1];
  const dys = [-1, -1, 0, 1, 1, 1, 0, -1];

  let limit = 8000; 
  do {
    boundary.push({ x: minX + currX * resolution, y: minY + currY * resolution });
    
    let dir = 0;
    for (let d = 0; d < 8; d++) {
      if (currX + dxs[d] === prevX && currY + dys[d] === prevY) {
        dir = d;
        break;
      }
    }

    let found = false;
    for (let i = 1; i <= 8; i++) {
      const nextDir = (dir + i) % 8;
      const nx = currX + dxs[nextDir];
      const ny = currY + dys[nextDir];
      if (get(nx, ny)) {
        prevX = currX + dxs[(nextDir + 7) % 8]; 
        prevY = currY + dys[(nextDir + 7) % 8];
        currX = nx;
        currY = ny;
        found = true;
        break;
      }
    }
    if (!found || --limit < 0) break;
  } while (currX !== startX || currY !== startY);

  // 4. Simplify Path
  if (boundary.length < 3) return boundary;
  const simplified: {x: number, y: number}[] = [boundary[0]];
  for (let i = 1; i < boundary.length; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = boundary[i];
    const next = boundary[(i + 1) % boundary.length];
    
    const cross = (curr.x - prev.x) * (next.y - curr.y) - (curr.y - prev.y) * (next.x - curr.x);
    if (Math.abs(cross) > 0.001) {
      simplified.push(curr);
    }
  }

  return simplified;
};

