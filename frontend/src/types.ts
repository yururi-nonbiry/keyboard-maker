export interface KeyboardMetadata {
  name: string;
  author: string;
  version: string;
  description?: string;
}

export type SwitchType = 'mx' | 'choc' | 'choc_v2' | 'x_switch' | 'ec';

export type ControllerType = 'pro_micro' | 'elite_c' | 'xiao_rp2040' | 'pico' | 'bluepill';

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
  controllerType: ControllerType;
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
  splitGap: number; // in mm
  keyPitch: number; // in mm
}

export interface TrackballConfig {
  id: string;
  x: number; // in mm
  y: number; // in mm
  diameter: number; // in mm, typically 34mm or 55mm
  sensorType: 'pmw3360' | 'pmw3389' | 'adns9800';
  side?: 'left' | 'right';
}

export interface KeyboardData {
  metadata: KeyboardMetadata;
  type: KeyboardType;
  layout: KeyConfig[];
  trackballs?: TrackballConfig[];
  pcb_config: PcbConfig;
  case_config: CaseConfig;
}
