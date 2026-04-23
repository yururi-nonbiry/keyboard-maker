import type { KeyboardData } from '../types';
import { getGridBoundary } from './geometry';

const FOOTPRINT_MAP: Record<string, string> = {
  mx: 'keebs:Switch_MX_1.00u',
  choc: 'keebs:Switch_Choc_V1_V2_1.00u',
  choc_v2: 'keebs:Switch_Choc_V1_V2_1.00u',
  x_switch: 'keebs:Switch_X_Switch',
  ec: 'keebs:Switch_EC',
};

const CONTROLLER_MAP: Record<string, string> = {
  pro_micro: 'keebs:Arduino_Pro_Micro',
  elite_c: 'keebs:Elite-C',
  xiao_rp2040: 'keebs:Seeeduino_XIAO',
  xiao_ble: 'keebs:Seeeduino_XIAO',
  pico: 'keebs:RPi_Pico',
  bluepill: 'keebs:BluePill_STM32F103C8',
};

const DIODE_FOOTPRINT = 'keebs:Diode_SOD-123';
const MOUNTING_HOLE_PREFIX = 'MountingHole:MountingHole_';

/**
 * Generates a KiCad .kicad_pcb S-expression string from keyboard data.
 */
export const generateKicadPcb = (data: KeyboardData): string => {
  const { layout, trackballs, controllers, batteries, diodes, mountingHoles, case_config } = data;
  const timestamp = Math.floor(Date.now() / 1000).toString(16);

  let sExp = `(kicad_pcb (version 20211014) (generator "Keyboard Maker")\n`;
  
  // Basic Setup
  sExp += `  (paper "A4")\n`;
  sExp += `  (setup\n`;
  sExp += `    (stackup\n`;
  sExp += `      (layer "F.Cu" (type "copper"))\n`;
  sExp += `      (layer "B.Cu" (type "copper"))\n`;
  sExp += `    )\n`;
  sExp += `  )\n`;

  // Layers
  const layers = [
    [0, "F.Cu", "signal"],
    [31, "B.Cu", "signal"],
    [32, "B.Adhes", "user", "B.Adhesive"],
    [33, "F.Adhes", "user", "F.Adhesive"],
    [34, "B.Paste", "user"],
    [35, "F.Paste", "user"],
    [36, "B.SilkS", "user", "B.Silkscreen"],
    [37, "F.SilkS", "user", "F.Silkscreen"],
    [38, "B.Mask", "user"],
    [39, "F.Mask", "user"],
    [40, "Dwgs.User", "user", "User.Drawings"],
    [41, "Cmts.User", "user", "User.Comments"],
    [42, "Eco1.User", "user", "User.Eco1"],
    [43, "Eco2.User", "user", "User.Eco2"],
    [44, "Edge.Cuts", "user"],
    [45, "Margin", "user"],
    [46, "B.CrtYd", "user", "B.Courtyard"],
    [47, "F.CrtYd", "user", "F.Courtyard"],
    [48, "B.Fab", "user"],
    [49, "F.Fab", "user"]
  ];

  layers.forEach(([id, name, type, alias]) => {
    sExp += `  (layer ${id} "${name}" ${type}${alias ? ` "${alias}"` : ''})\n`;
  });

  sExp += `\n`;

  // 1. Board Outline (Edge.Cuts)
  const pcbMargin = case_config.pcbMargin || 0;
  const keyPitch = case_config.keyPitch || 19.05;

  const renderSide = (side?: 'left' | 'right') => {
    const sideKeys = side ? layout.filter(k => k.side === side) : layout;
    if (sideKeys.length === 0) return;

    const addRects = sideKeys.map(k => ({
      centerX: k.x,
      centerY: k.y,
      width: k.keycapSize.width * keyPitch + pcbMargin * 2,
      height: k.keycapSize.height * keyPitch + pcbMargin * 2,
      angle: (k.rotation * Math.PI) / 180
    }));

    const boundary = getGridBoundary(addRects, [], [], 1.0);
    if (boundary.length > 2) {
      sExp += `  (gr_poly\n`;
      sExp += `    (pts\n`;
      boundary.forEach(p => {
        sExp += `      (xy ${p.x.toFixed(4)} ${p.y.toFixed(4)})\n`;
      });
      sExp += `    )\n`;
      sExp += `    (layer "Edge.Cuts") (width 0.1) (tstamp "${timestamp}")\n`;
      sExp += `  )\n`;
    }
  };

  if (data.type === 'split') {
    renderSide('left');
    renderSide('right');
  } else {
    renderSide();
  }

  sExp += `\n`;

  // 2. Footprints: Keys
  layout.forEach((key, i) => {
    const fp = FOOTPRINT_MAP[key.switchType] || FOOTPRINT_MAP.mx;
    const ref = `SW${i + 1}`;
    sExp += `  (footprint "${fp}" (at ${key.x.toFixed(4)} ${key.y.toFixed(4)} ${key.rotation.toFixed(2)}) (layer "F.Cu")\n`;
    sExp += `    (tstamp "${timestamp}-${key.id}")\n`;
    sExp += `    (property "Reference" "${ref}" (at 0 -2.5 ${key.rotation.toFixed(2)}) (layer "F.SilkS") (effects (font (size 1 1) (thickness 0.15))))\n`;
    sExp += `    (property "Value" "${key.switchType}" (at 0 2.5 ${key.rotation.toFixed(2)}) (layer "F.Fab") (effects (font (size 1 1) (thickness 0.15))))\n`;
    sExp += `  )\n`;
  });

  // 3. Footprints: Controllers
  (controllers || []).forEach((c, i) => {
    const fp = CONTROLLER_MAP[c.type] || CONTROLLER_MAP.pro_micro;
    const ref = `MCU${i + 1}`;
    const layer = c.mountingSide === 'bottom' ? 'B.Cu' : 'F.Cu';
    sExp += `  (footprint "${fp}" (at ${c.x.toFixed(4)} ${c.y.toFixed(4)} ${c.rotation.toFixed(2)}) (layer "${layer}")\n`;
    sExp += `    (tstamp "${timestamp}-${c.id}")\n`;
    sExp += `    (property "Reference" "${ref}" (at 0 -2 ${c.rotation.toFixed(2)}) (layer "${c.mountingSide === 'bottom' ? 'B.SilkS' : 'F.SilkS'}") (effects (font (size 1 1) (thickness 0.15))))\n`;
    sExp += `  )\n`;
  });

  // 4. Footprints: Diodes
  (diodes || []).forEach((d, i) => {
    const ref = `D${i + 1}`;
    const layer = d.mountingSide === 'bottom' ? 'B.Cu' : 'F.Cu';
    sExp += `  (footprint "${DIODE_FOOTPRINT}" (at ${d.x.toFixed(4)} ${d.y.toFixed(4)} ${d.rotation.toFixed(2)}) (layer "${layer}")\n`;
    sExp += `    (tstamp "${timestamp}-${d.id}")\n`;
    sExp += `    (property "Reference" "${ref}" (at 0 -1.5 ${d.rotation.toFixed(2)}) (layer "${d.mountingSide === 'bottom' ? 'B.SilkS' : 'F.SilkS'}") (effects (font (size 0.8 0.8) (thickness 0.12))))\n`;
    sExp += `  )\n`;
  });

  // 5. Footprints: Mounting Holes
  (mountingHoles || []).forEach((h, i) => {
    const fp = `${MOUNTING_HOLE_PREFIX}${h.diameter.toFixed(1)}mm_M${Math.floor(h.diameter)}`;
    const ref = `H${i + 1}`;
    sExp += `  (footprint "${fp}" (at ${h.x.toFixed(4)} ${h.y.toFixed(4)}) (layer "F.Cu")\n`;
    sExp += `    (tstamp "${timestamp}-${h.id}")\n`;
    sExp += `    (property "Reference" "${ref}" (at 0 -3) (layer "F.SilkS") (effects (font (size 1 1) (thickness 0.15))))\n`;
    sExp += `  )\n`;
  });

  // 6. Trackball & Battery (Drawings only for now)
  (trackballs || []).forEach((t) => {
    sExp += `  (gr_circle (center ${t.x.toFixed(4)} ${t.y.toFixed(4)}) (end ${(t.x + t.diameter / 2).toFixed(4)} ${t.y.toFixed(4)}) (layer "Dwgs.User") (width 0.15) (tstamp "${timestamp}-${t.id}"))\n`;
  });
  (batteries || []).forEach((b) => {
    const halfW = b.width / 2;
    const halfH = b.height / 2;
    sExp += `  (gr_rect (start ${(b.x - halfW).toFixed(4)} ${(b.y - halfH).toFixed(4)}) (end ${(b.x + halfW).toFixed(4)} ${(b.y + halfH).toFixed(4)}) (layer "Dwgs.User") (width 0.15) (tstamp "${timestamp}-${b.id}"))\n`;
  });

  sExp += `)\n`;
  return sExp;
};
