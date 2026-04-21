import type { KeyConfig } from '../types';

export interface CollisionResult {
  hasCollision: boolean;
  collidingKeyIds: string[];
}

export const checkInterference = (layout: KeyConfig[]): Record<string, boolean> => {
  const collisions: Record<string, boolean> = {};
  const UNIT = 19.05; // Standard key spacing in mm

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
