import type { KeyConfig } from '../types';

export interface CollisionResult {
  hasCollision: boolean;
  collidingKeyIds: string[];
}

export const checkInterference = (layout: KeyConfig[], keyPitch: number = 19.05): Record<string, boolean> => {
  const collisions: Record<string, boolean> = {};
  const UNIT = keyPitch; // Use provided key pitch

  for (let i = 0; i < layout.length; i++) {
    const keyA = layout[i];
    const rectA = {
      left: keyA.x - (keyA.keycapSize.width * UNIT) / 2 + 0.5,
      right: keyA.x + (keyA.keycapSize.width * UNIT) / 2 - 0.5,
      top: keyA.y - (keyA.keycapSize.height * UNIT) / 2 + 0.5,
      bottom: keyA.y + (keyA.keycapSize.height * UNIT) / 2 - 0.5,
    };

    for (let j = i + 1; j < layout.length; j++) {
      const keyB = layout[j];
      const rectB = {
        left: keyB.x - (keyB.keycapSize.width * UNIT) / 2 + 0.5,
        right: keyB.x + (keyB.keycapSize.width * UNIT) / 2 - 0.5,
        top: keyB.y - (keyB.keycapSize.height * UNIT) / 2 + 0.5,
        bottom: keyB.y + (keyB.keycapSize.height * UNIT) / 2 - 0.5,
      };

      const intersects = !(
        rectA.right < rectB.left ||
        rectA.left > rectB.right ||
        rectA.bottom < rectB.top ||
        rectA.top > rectB.bottom
      );

      if (intersects) {
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

export const calculateBoundingBox = (keys: KeyConfig[], keyPitch: number = 19.05, padding: number = 0): BoundingBox | null => {
  if (keys.length === 0) return null;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const UNIT = keyPitch;

  keys.forEach(key => {
    const halfW = (key.keycapSize.width * UNIT) / 2;
    const halfH = (key.keycapSize.height * UNIT) / 2;
    minX = Math.min(minX, key.x - halfW);
    maxX = Math.max(maxX, key.x + halfW);
    minY = Math.min(minY, key.y - halfH);
    maxY = Math.max(maxY, key.y + halfH);
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
