import type { KeyboardData } from '../types';
import { getNetName } from './matrix';

export interface RouteSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  layer: 'F.Cu' | 'B.Cu';
  width: number;
  net: number;
  side: 'left' | 'right';
}

export interface NetDefinition {
  id: number;
  name: string;
}

export interface PadMapping {
  footprint: string;
  pads: Record<string, { x: number; y: number }>;
}

const PAD_MAPPINGS: Record<string, PadMapping> = {
  mx: {
    footprint: 'keebs:Switch_MX_1.00u',
    pads: {
      '1': { x: -3.81, y: -2.54 },
      '2': { x: 2.54, y: -5.08 },
    }
  },
  choc: {
    footprint: 'keebs:Switch_Choc_V1_V2_1.00u',
    pads: {
      '1': { x: 0, y: -5.9 },
      '2': { x: 5, y: -3.8 },
    }
  },
  diode: {
    footprint: 'keebs:Diode_SOD-123',
    pads: {
      '1': { x: -1.65, y: 0 }, // Cathode
      '2': { x: 1.65, y: 0 }, // Anode
    }
  },
  pro_micro: {
    footprint: 'keebs:Arduino_Pro_Micro',
    pads: {
      '1': { x: -7.62, y: -13.97 },
      '2': { x: -7.62, y: -11.43 },
      '5': { x: -7.62, y: -3.81 },
      '6': { x: -7.62, y: -1.27 },
      '7': { x: -7.62, y: 1.27 },
      '8': { x: -7.62, y: 3.81 },
      '9': { x: -7.62, y: 6.35 },
      '10': { x: -7.62, y: 8.89 },
      '11': { x: -7.62, y: 11.43 },
      '12': { x: -7.62, y: 13.97 },
      '13': { x: 7.62, y: 13.97 },
      '14': { x: 7.62, y: 11.43 },
      '15': { x: 7.62, y: 8.89 },
      '16': { x: 7.62, y: 6.35 },
      '17': { x: 7.62, y: 3.81 },
      '18': { x: 7.62, y: 1.27 },
      '19': { x: 7.62, y: -1.27 },
      '20': { x: 7.62, y: -3.81 },
    }
  }
};

const rotatePoint = (x: number, y: number, rotationDeg: number) => {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos
  };
};

export const generateMatrixRoutes = (data: KeyboardData): { segments: RouteSegment[], nets: NetDefinition[] } => {
  const { layout, diodes, pcb_config } = data;
  const segments: RouteSegment[] = [];
  const netMap = new Map<string, number>();
  const nets: NetDefinition[] = [{ id: 0, name: "" }];

  const getNetId = (name: string): number => {
    if (!netMap.has(name)) {
      const id = nets.length;
      netMap.set(name, id);
      nets.push({ id, name });
    }
    return netMap.get(name)!;
  };

  const diodeDir = pcb_config.diodeDirection || 'col2row';

  // 1. Key to Diode connections
  layout.forEach(key => {
    if (key.matrixRow === undefined || key.matrixCol === undefined) return;

    const diode = diodes?.find(d => d.keyId === key.id);
    if (!diode) return;

    const keyPads = PAD_MAPPINGS[key.switchType]?.pads || PAD_MAPPINGS.mx.pads;
    const diodePads = PAD_MAPPINGS.diode.pads;

    const keyPin = diodeDir === 'col2row' ? '2' : '1';
    const keyLocalPad = keyPads[keyPin];
    const keyRotatedPad = rotatePoint(keyLocalPad.x, keyLocalPad.y, key.rotation);
    const keyGlobalPad = { x: key.x + keyRotatedPad.x, y: key.y + keyRotatedPad.y };

    const diodePin = '2'; // Anode
    const diodeLocalPad = diodePads[diodePin];
    const diodeRotatedPad = rotatePoint(diodeLocalPad.x, diodeLocalPad.y, diode.rotation);
    const diodeGlobalPad = { x: diode.x + diodeRotatedPad.x, y: diode.y + diodeRotatedPad.y };

    const netName = getNetName(key.matrixRow, key.matrixCol, 'diode');
    const netId = getNetId(netName);

    segments.push({
      x1: keyGlobalPad.x, y1: keyGlobalPad.y,
      x2: diodeGlobalPad.x, y2: diodeGlobalPad.y,
      layer: 'B.Cu', width: 0.25, net: netId,
      side: key.side || 'left'
    });
  });

  // 2. Row connections
  const rows = Array.from(new Set(layout.map(k => k.matrixRow).filter(r => r !== undefined)));
  rows.forEach(rowIdx => {
    const rowKeys = layout.filter(k => k.matrixRow === rowIdx).sort((a, b) => a.x - b.x);
    const netName = getNetName(rowIdx!, 0, 'row');
    const netId = getNetId(netName);

    for (let i = 0; i < rowKeys.length - 1; i++) {
      const k1 = rowKeys[i];
      const k2 = rowKeys[i+1];

      let p1, p2;
      if (diodeDir === 'col2row') {
        const pads = PAD_MAPPINGS[k1.switchType]?.pads || PAD_MAPPINGS.mx.pads;
        const r1 = rotatePoint(pads['1'].x, pads['1'].y, k1.rotation);
        const r2 = rotatePoint(pads['1'].x, pads['1'].y, k2.rotation);
        p1 = { x: k1.x + r1.x, y: k1.y + r1.y };
        p2 = { x: k2.x + r2.x, y: k2.y + r2.y };
      } else {
        const d1 = diodes?.find(d => d.keyId === k1.id);
        const d2 = diodes?.find(d => d.keyId === k2.id);
        if (!d1 || !d2) continue;
        const pads = PAD_MAPPINGS.diode.pads;
        const r1 = rotatePoint(pads['1'].x, pads['1'].y, d1.rotation);
        const r2 = rotatePoint(pads['1'].x, pads['1'].y, d2.rotation);
        p1 = { x: d1.x + r1.x, y: d1.y + r1.y };
        p2 = { x: d2.x + r2.x, y: d2.y + r2.y };
      }

      segments.push({
        x1: p1.x, y1: p1.y,
        x2: p2.x, y2: p2.y,
        layer: 'B.Cu', width: 0.25, net: netId,
        side: k1.side || 'left'
      });
    }
  });

  // 3. Column connections
  const cols = Array.from(new Set(layout.map(k => k.matrixCol).filter(c => c !== undefined)));
  cols.forEach(colIdx => {
    const colKeys = layout.filter(k => k.matrixCol === colIdx).sort((a, b) => a.y - b.y);
    const netName = getNetName(0, colIdx!, 'col');
    const netId = getNetId(netName);

    for (let i = 0; i < colKeys.length - 1; i++) {
      const k1 = colKeys[i];
      const k2 = colKeys[i+1];

      let p1, p2;
      if (diodeDir === 'col2row') {
        const d1 = diodes?.find(d => d.keyId === k1.id);
        const d2 = diodes?.find(d => d.keyId === k2.id);
        if (!d1 || !d2) continue;
        const pads = PAD_MAPPINGS.diode.pads;
        const r1 = rotatePoint(pads['1'].x, pads['1'].y, d1.rotation);
        const r2 = rotatePoint(pads['1'].x, pads['1'].y, d2.rotation);
        p1 = { x: d1.x + r1.x, y: d1.y + r1.y };
        p2 = { x: d2.x + r2.x, y: d2.y + r2.y };
      } else {
        const pads = PAD_MAPPINGS[k1.switchType]?.pads || PAD_MAPPINGS.mx.pads;
        const r1 = rotatePoint(pads['2'].x, pads['2'].y, k1.rotation);
        const r2 = rotatePoint(pads['2'].x, pads['2'].y, k2.rotation);
        p1 = { x: k1.x + r1.x, y: k1.y + r1.y };
        p2 = { x: k2.x + r2.x, y: k2.y + r2.y };
      }

      segments.push({
        x1: p1.x, y1: p1.y,
        x2: p2.x, y2: p2.y,
        layer: 'B.Cu', width: 0.25, net: netId,
        side: k1.side || 'left'
      });
    }
  });

  return { segments, nets };
};
