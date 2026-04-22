import type { KeyConfig } from '../types';

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

/**
 * Calculates the bounding box for a set of keys, accounting for rotation.
 */
export const calculateBoundingBox = (keys: KeyConfig[], keyPitch: number = 19.05, padding: number = 0): BoundingBox | null => {
  if (keys.length === 0) return null;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const UNIT = keyPitch;

  keys.forEach(key => {
    // Get actual rotated corners for bounding box calculation
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

