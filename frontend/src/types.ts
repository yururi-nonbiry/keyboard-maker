export interface KeyboardMetadata {
  name: string;
  author: string;
  version: string;
  description?: string;
}

export type SwitchType = 'mx' | 'choc' | 'choc_v2' | 'x_switch' | 'ec';

export type ControllerType = 'pro_micro' | 'elite_c' | 'xiao_rp2040' | 'xiao_ble' | 'pico' | 'bluepill';

export type KeyboardType = 'integrated' | 'split';

export type KeycapProfile = 'cherry' | 'oem' | 'dsa' | 'xda' | 'choc' | 'mbk';

export interface KeyConfig {
  id: string;
  x: number; // in mm
  y: number; // in mm
  rotation: number; // in degrees
  switchType: SwitchType;
  keycapProfile?: KeycapProfile;
  keycapSize: {
    width: number; // in units (e.g. 1u, 1.25u)
    height: number;
  };
  stabilizer?: boolean;
  side?: 'left' | 'right';
}

export interface DiodeConfig {
  id: string;
  keyId?: string; // Optional reference to the key it belongs to
  x: number; // in mm
  y: number; // in mm
  rotation: number; // in degrees
  side: 'left' | 'right';
  mountingSide: 'top' | 'bottom';
}

export interface PcbConfig {
  controllerType: ControllerType;
  controllerPosition: { x: number; y: number; rotation: number };
  diodeDirection: 'col2row' | 'row2col';
  autoDiodeOffset: { x: number; y: number; rotation: number };
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
  pcbMargin: number; // in mm
  plateOffset: number; // in mm, relative to PCB edge
  defaultKeycapProfile: KeycapProfile;
}

export interface TrackballConfig {
  id: string;
  x: number; // in mm
  y: number; // in mm
  z: number; // in mm, vertical offset
  diameter: number; // in mm, typically 34mm or 55mm
  sensorType: 'pmw3360' | 'pmw3389' | 'adns9800';
  sensorAngle?: number; // angle around the ball in degrees
  sensorRotation?: number; // rotation of the sensor chip in degrees
  rotation: number; // in degrees
  side?: 'left' | 'right';
}

export interface ControllerConfig {
  id: string;
  type: ControllerType;
  x: number; // in mm
  y: number; // in mm
  rotation: number; // in degrees
  side: 'left' | 'right';
  mountingSide: 'top' | 'bottom';
}

export interface BatteryConfig {
  id: string;
  x: number; // in mm
  y: number; // in mm
  width: number; // in mm
  height: number; // in mm
  thickness: number; // in mm
  rotation: number; // in degrees
  side: 'left' | 'right';
  mountingSide: 'top' | 'bottom';
  connectorEnabled?: boolean;
  connectorX?: number;
  connectorY?: number;
  connectorMountingSide?: 'top' | 'bottom';
}

export interface MountingHole {
  id: string;
  x: number; // in mm
  y: number; // in mm
  diameter: number; // in mm
  side?: 'left' | 'right';
}

export interface KeyboardData {
  metadata: KeyboardMetadata;
  type: KeyboardType;
  layout: KeyConfig[];
  pcb_config: PcbConfig;
  case_config: CaseConfig;
  trackballs?: TrackballConfig[];
  controllers?: ControllerConfig[];
  batteries?: BatteryConfig[];
  diodes?: DiodeConfig[];
  mountingHoles?: MountingHole[];
}
