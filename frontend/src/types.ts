export interface KeyboardMetadata {
  name: string;
  author: string;
  version: string;
  description?: string;
}

export type SwitchType = 'mx' | 'choc' | 'choc_v2' | 'x_switch' | 'ec';

export type KeyboardType = 'integrated' | 'split';

export interface KeyConfig {
  id: string;
  x: number; // in mm
  y: number; // in mm
  rotation: number; // in degrees
  switchType: SwitchType;
  keycapSize: {
    width: number; // in units (e.g. 1u, 1.25u)
    height: number;
  };
  stabilizer?: boolean;
  side?: 'left' | 'right';
}

export interface PcbConfig {
  controllerType: string;
  controllerPosition: { x: number; y: number; rotation: number };
  diodeDirection: 'col2row' | 'row2col';
  footprintAttributes: Record<string, string>;
}

export interface CaseConfig {
  outlineType: 'rectangle' | 'polygon';
  screwHoles: { x: number; y: number }[];
  wallThickness: number;
  cornerRadius: number;
  plateThickness: number;
  typingAngle: number; // in degrees
  tentingAngle: number; // in degrees
  splitRotation: number; // in degrees
}

export interface KeyboardData {
  metadata: KeyboardMetadata;
  type: KeyboardType;
  layout: KeyConfig[];
  pcb_config: PcbConfig;
  case_config: CaseConfig;
}
