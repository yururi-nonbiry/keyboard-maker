import type { KeyConfig, ControllerType, ControllerConfig, TrackballConfig, BatteryConfig } from '../types';

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
export const checkInterference = (layout: KeyConfig[], keyPitch: number = 19.05): Record<string, boolean> => {
  const collisions: Record<string, boolean> = {};
  const UNIT = keyPitch;
  const BUFFER = 0.5; // Small buffer (0.25mm per side) to allow touching keys

  for (let i = 0; i < layout.length; i++) {
    const keyA = layout[i];
    const sideA = keyA.side || 'left';
    const cornersA = getCorners(keyA, UNIT, BUFFER);

    for (let j = i + 1; j < layout.length; j++) {
      const keyB = layout[j];
      const sideB = keyB.side || 'left';

      // If keys are on different sides of a split keyboard, they cannot collide
      if (sideA !== sideB) continue;

      const cornersB = getCorners(keyB, UNIT, BUFFER);

      if (intersectOBB(cornersA, cornersB)) {
        collisions[keyA.id] = true;
        collisions[keyB.id] = true;
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
    case 'xiao_rp2040': return { width: 18, length: 21 };
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
  keyPitch: number = 19.05,
  padding: number = 0
): BoundingBox3D | null => {
  const bbox2d = calculateFullBoundingBox(keys, trackballs, controllers, batteries, keyPitch, padding);
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
    allCorners.push(...getComponentCorners(t.x, t.y, t.diameter, t.diameter, 0));
  });

  controllers.forEach(c => {
    const dim = getControllerDimensions(c.type);
    allCorners.push(...getComponentCorners(c.x, c.y, dim.width, dim.length, c.rotation));
  });

  batteries.forEach(b => {
    allCorners.push(...getComponentCorners(b.x, b.y, b.width, b.height, b.rotation));
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
    const x1 = p.x * Math.cos(split) + p.z * Math.sin(split);
    const y1 = p.y;
    const z1 = -p.x * Math.sin(split) + p.z * Math.cos(split);
    const y2 = x1 * Math.sin(tent) + y1 * Math.cos(tent);
    const z2 = z1;
    const relWorldY = y2 * Math.cos(typing) - z2 * Math.sin(typing);
    if (relWorldY < minRelWorldY) minRelWorldY = relWorldY;
  });

  return (groundY - minRelWorldY) / Math.cos(typing);
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
  typingDeg: number
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

  const zDoublePrime = -x * sinS + z * cosS;
  const xPrime = x * cosS + z * sinS;
  
  const term1 = (groundY + zDoublePrime * sinTy) / cosTy - lift;
  const y = (term1 - xPrime * sinT) / cosT;
  
  return y;
};
