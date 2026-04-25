import type { KeyConfig } from '../types';

/**
 * Automatically infers row and column indices for a given layout based on physical positions.
 * This works by grouping keys that have similar Y coordinates into rows and X coordinates into columns.
 */
export const inferMatrix = (layout: KeyConfig[], tolerance: number = 5): KeyConfig[] => {
  if (layout.length === 0) return [];

  // 1. Sort by Y to find rows
  const sortedByY = [...layout].sort((a, b) => a.y - b.y);
  const rows: KeyConfig[][] = [];
  let currentGroup: KeyConfig[] = [];

  sortedByY.forEach((key, i) => {
    if (i === 0) {
      currentGroup.push(key);
    } else {
      const prevKey = sortedByY[i - 1];
      if (Math.abs(key.y - prevKey.y) < tolerance) {
        currentGroup.push(key);
      } else {
        rows.push(currentGroup);
        currentGroup = [key];
      }
    }
  });
  rows.push(currentGroup);

  // 2. Assign Row Indices
  rows.sort((a, b) => a[0].y - b[0].y).forEach((row, rowIndex) => {
    row.forEach(key => {
      key.matrixRow = rowIndex;
    });
  });

  // 3. Sort by X to find columns
  const sortedByX = [...layout].sort((a, b) => a.x - b.x);
  const cols: KeyConfig[][] = [];
  currentGroup = [];

  sortedByX.forEach((key, i) => {
    if (i === 0) {
      currentGroup.push(key);
    } else {
      const prevKey = sortedByX[i - 1];
      if (Math.abs(key.x - prevKey.x) < tolerance) {
        currentGroup.push(key);
      } else {
        cols.push(currentGroup);
        currentGroup = [key];
      }
    }
  });
  cols.push(currentGroup);

  // 4. Assign Column Indices
  cols.sort((a, b) => a[0].x - b[0].x).forEach((col, colIndex) => {
    col.forEach(key => {
      key.matrixCol = colIndex;
    });
  });

  return layout;
};

/**
 * Generates a consistent net name for KiCad.
 */
export const getNetName = (row: number, col: number, type: 'row' | 'col' | 'diode'): string => {
  switch (type) {
    case 'row': return `ROW${row}`;
    case 'col': return `COL${col}`;
    case 'diode': return `NET_R${row}_C${col}`;
    default: return 'GND';
  }
};
