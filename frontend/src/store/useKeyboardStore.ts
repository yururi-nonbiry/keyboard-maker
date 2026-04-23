import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { KeyboardData, KeyConfig, KeyboardMetadata, PcbConfig, CaseConfig, SwitchType, KeyboardType, TrackballConfig, ControllerConfig, BatteryConfig } from '../types';
import { checkInterference, calculateBoundingBox } from '../utils/geometry';

interface KeyboardState {
  data: KeyboardData;
  selectedKeyId: string | null;
  collisions: Record<string, boolean>;
  
  // Actions
  updateMetadata: (metadata: Partial<KeyboardMetadata>) => void;
  addKey: (key: KeyConfig) => void;
  updateKey: (id: string, config: Partial<KeyConfig>) => void;
  removeKey: (id: string) => void;
  selectKey: (id: string | null) => void;
  updatePcbConfig: (config: Partial<PcbConfig>) => void;
  updateCaseConfig: (config: Partial<CaseConfig>) => void;
  updateKeyboardType: (type: KeyboardType) => void;
  setKeyboardData: (data: KeyboardData) => void;
  
  // Trackball Actions
  addTrackball: (trackball: TrackballConfig) => void;
  updateTrackball: (id: string, config: Partial<TrackballConfig>) => void;
  removeTrackball: (id: string) => void;
  selectTrackball: (id: string | null) => void;

  // Controller Actions
  addController: (controller: ControllerConfig) => void;
  updateController: (id: string, config: Partial<ControllerConfig>) => void;
  removeController: (id: string) => void;
  selectController: (id: string | null) => void;
  
  // Battery Actions
  addBattery: (battery: BatteryConfig) => void;
  updateBattery: (id: string, config: Partial<BatteryConfig>) => void;
  removeBattery: (id: string) => void;
  selectBattery: (id: string | null) => void;
  
  // Grid Settings
  gridVisible: boolean;
  gridSnapping: boolean;
  gridSize: number;
  toggleGridVisible: () => void;
  toggleGridSnapping: () => void;
  setGridSize: (size: number) => void;

  // View Mode
  viewMode: '2D' | '3D';
  setViewMode: (mode: '2D' | '3D') => void;

  // Split Mode
  splitMode: boolean;
  tempSplitX: number | null;
  toggleSplitMode: () => void;
  setTempSplitX: (x: number | null) => void;
  applySplit: (x: number) => void;

  selectedTrackballId: string | null;
  selectedControllerId: string | null;
  selectedBatteryId: string | null;

  // Visibility Settings
  showKeycaps: boolean;
  showPlate: boolean;
  showCaseBase: boolean;
  showCaseWalls: boolean;
  showPCB: boolean;
  showSwitches: boolean;
  showTrackballs: boolean;
  showControllers: boolean;
  showSockets: boolean;
  toggleKeycapsVisible: () => void;
  togglePlateVisible: () => void;
  toggleCaseBaseVisible: () => void;
  toggleCaseWallsVisible: () => void;
  togglePCBVisible: () => void;
  toggleSwitchesVisible: () => void;
  toggleTrackballsVisible: () => void;
  toggleControllersVisible: () => void;
  toggleSocketsVisible: () => void;
}

const DEFAULT_METADATA: KeyboardMetadata = {
  name: '新規キーボードプロジェクト',
  author: 'Anonymous',
  version: '1.0.0',
};

const DEFAULT_PCB: PcbConfig = {
  controllerType: 'pro_micro',
  controllerPosition: { x: 0, y: 0, rotation: 0 },
  diodeDirection: 'col2row',
  footprintAttributes: {},
};

const DEFAULT_CASE: CaseConfig = {
  outlineType: 'rectangle',
  screwHoles: [],
  wallThickness: 3,
  cornerRadius: 4,
  plateThickness: 1.5,
  typingAngle: 6,
  tentingAngle: 0,
  splitRotation: 0,
  splitGap: 40,
  keyPitch: 19.05,
  pcbMargin: 3.0,
  plateOffset: 0.0,
  defaultKeycapProfile: 'cherry',
};

const INITIAL_LAYOUT: KeyConfig[] = Array.from({ length: 9 }, (_, i) => ({
  id: `key-${i}`,
  x: (i % 3) * 19.05, // Standard spacing
  y: Math.floor(i / 3) * 19.05,
  rotation: 0,
  switchType: 'mx' as SwitchType,
  keycapSize: { width: 1, height: 1 },
  side: 'left', // Default side
}));

export const useKeyboardStore = create<KeyboardState>()(
  persist(
    (set) => ({
      data: {
        metadata: DEFAULT_METADATA,
        type: 'integrated',
        layout: INITIAL_LAYOUT,
        trackballs: [],
        controllers: [],
        batteries: [],
        pcb_config: DEFAULT_PCB,
        case_config: DEFAULT_CASE,
      },
      selectedKeyId: null,
      selectedTrackballId: null,
      selectedControllerId: null,
      selectedBatteryId: null,
      collisions: {},
      gridVisible: true,
      gridSnapping: true,
      gridSize: 19.05,
      viewMode: '3D',
      splitMode: false,
      tempSplitX: null,
      showKeycaps: true,
      showPlate: true,
      showCaseBase: true,
      showCaseWalls: true,
      showPCB: true,
      showSwitches: true,
      showTrackballs: true,
      showControllers: true,
      showSockets: true,

      toggleKeycapsVisible: () => set((state) => ({ showKeycaps: !state.showKeycaps })),
      togglePlateVisible: () => set((state) => ({ showPlate: !state.showPlate })),
      toggleCaseBaseVisible: () => set((state) => ({ showCaseBase: !state.showCaseBase })),
      toggleCaseWallsVisible: () => set((state) => ({ showCaseWalls: !state.showCaseWalls })),
      togglePCBVisible: () => set((state) => ({ showPCB: !state.showPCB })),
      toggleSwitchesVisible: () => set((state) => ({ showSwitches: !state.showSwitches })),
      toggleTrackballsVisible: () => set((state) => ({ showTrackballs: !state.showTrackballs })),
      toggleControllersVisible: () => set((state) => ({ showControllers: !state.showControllers })),
      toggleSocketsVisible: () => set((state) => ({ showSockets: !state.showSockets })),

      toggleSplitMode: () => set((state) => ({ splitMode: !state.splitMode })),
      setTempSplitX: (tempSplitX) => set({ tempSplitX }),
      applySplit: (x) => set((state) => {
        const newData = { 
          ...state.data, 
          type: 'split' as const,
          layout: state.data.layout.map(k => ({
            ...k,
            side: k.x >= x ? 'right' as const : 'left' as const
          }))
        };
        return { 
          data: newData, 
          splitMode: false, 
          tempSplitX: null,
          viewMode: '2D' // Switch to 2D to see the result clearly if not already there
        };
      }),

      toggleGridVisible: () => set((state) => ({ gridVisible: !state.gridVisible })),
      toggleGridSnapping: () => set((state) => ({ gridSnapping: !state.gridSnapping })),
      setGridSize: (gridSize) => set({ gridSize }),
      setViewMode: (viewMode) => set({ viewMode }),

      updateMetadata: (metadata) =>
        set((state) => ({
          data: { ...state.data, metadata: { ...state.data.metadata, ...metadata } },
        })),

      addKey: (key) =>
        set((state) => {
          const keyWithSide = { ...key };
          if (state.data.type === 'split' && !keyWithSide.side) {
            keyWithSide.side = keyWithSide.x >= 0 ? 'right' : 'left';
          }
          const newLayout = [...state.data.layout, keyWithSide];
          return {
            data: { ...state.data, layout: newLayout },
            collisions: checkInterference(newLayout, state.data.case_config.keyPitch),
          };
        }),

      updateKey: (id, config) =>
        set((state) => {
          const newLayout = state.data.layout.map((k) => (k.id === id ? { ...k, ...config } : k));
          return {
            data: { ...state.data, layout: newLayout },
            collisions: checkInterference(newLayout, state.data.case_config.keyPitch),
          };
        }),

      removeKey: (id) =>
        set((state) => {
          const newLayout = state.data.layout.filter((k) => k.id !== id);
          return {
            data: { ...state.data, layout: newLayout },
            collisions: checkInterference(newLayout, state.data.case_config.keyPitch),
            selectedKeyId: state.selectedKeyId === id ? null : state.selectedKeyId,
          };
        }),

      selectKey: (id) => set((state) => ({ 
        selectedKeyId: id, 
        selectedTrackballId: id ? null : state.selectedTrackballId,
        selectedControllerId: id ? null : state.selectedControllerId,
        selectedBatteryId: id ? null : state.selectedBatteryId
      })),

      updatePcbConfig: (pcb_config) =>
        set((state) => ({
          data: { ...state.data, pcb_config: { ...state.data.pcb_config, ...pcb_config } },
        })),

      updateCaseConfig: (case_config) =>
        set((state) => {
          const newData = { ...state.data, case_config: { ...state.data.case_config, ...case_config } };
          const newGridSize = case_config.keyPitch !== undefined ? case_config.keyPitch : state.gridSize;
          return {
            data: newData,
            gridSize: newGridSize,
            collisions: checkInterference(newData.layout, newData.case_config.keyPitch),
          };
        }),

      updateKeyboardType: (type) =>
        set((state) => {
          const newData = { ...state.data, type };
          
          // If switching to split and all keys are currently on one side, try to auto-split
          if (type === 'split') {
            const hasRightKeys = state.data.layout.some(k => k.side === 'right');
            if (!hasRightKeys) {
              const bbox = calculateBoundingBox(state.data.layout, state.data.case_config.keyPitch);
              if (bbox) {
                const centerX = bbox.centerX;
                newData.layout = state.data.layout.map(k => ({
                  ...k,
                  side: k.x >= centerX ? 'right' : 'left'
                }));
              }
            }

            // Also handle controllers for split
            if (!newData.controllers || newData.controllers.length === 0) {
              newData.controllers = [
                { id: `mcu-left-${Date.now()}`, type: 'pro_micro', x: 0, y: -60, rotation: 0, side: 'left', mountingSide: 'top' },
                { id: `mcu-right-${Date.now()}`, type: 'pro_micro', x: 0, y: -60, rotation: 0, side: 'right', mountingSide: 'top' }
              ];
            } else if (newData.controllers.length === 1) {
              const existing = newData.controllers[0];
              const otherSide = existing.side === 'left' ? 'right' : 'left';
              newData.controllers.push({
                ...existing,
                id: `mcu-${otherSide}-${Date.now()}`,
                side: otherSide
              });
            }
          }
          
          return { data: newData };
        }),

      addTrackball: (trackball) =>
        set((state) => ({
          data: {
            ...state.data,
            trackballs: [...(state.data.trackballs || []), trackball],
          },
        })),

      updateTrackball: (id, config) =>
        set((state) => ({
          data: {
            ...state.data,
            trackballs: (state.data.trackballs || []).map((t) =>
              t.id === id ? { ...t, ...config } : t
            ),
          },
        })),

      removeTrackball: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            trackballs: (state.data.trackballs || []).filter((t) => t.id !== id),
          },
          selectedTrackballId: state.selectedTrackballId === id ? null : state.selectedTrackballId,
        })),

      selectTrackball: (id) => set((state) => ({ 
        selectedTrackballId: id, 
        selectedKeyId: id ? null : state.selectedKeyId,
        selectedControllerId: id ? null : state.selectedControllerId,
        selectedBatteryId: id ? null : state.selectedBatteryId
      })),

      addController: (controller) =>
        set((state) => ({
          data: {
            ...state.data,
            controllers: [...(state.data.controllers || []), controller],
          },
        })),

      updateController: (id, config) =>
        set((state) => ({
          data: {
            ...state.data,
            controllers: (state.data.controllers || []).map((c) =>
              c.id === id ? { ...c, ...config } : c
            ),
          },
        })),

      removeController: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            controllers: (state.data.controllers || []).filter((c) => c.id !== id),
          },
          selectedControllerId: state.selectedControllerId === id ? null : state.selectedControllerId,
        })),

      selectController: (id) => set((state) => ({ 
        selectedControllerId: id, 
        selectedKeyId: id ? null : state.selectedKeyId,
        selectedTrackballId: id ? null : state.selectedTrackballId,
        selectedBatteryId: id ? null : state.selectedBatteryId
      })),
  
      addBattery: (battery) =>
        set((state) => ({
          data: {
            ...state.data,
            batteries: [
              ...(state.data.batteries || []),
              {
                ...battery,
                connectorEnabled: false,
                connectorX: battery.x,
                connectorY: battery.y + 10,
                connectorMountingSide: battery.mountingSide
              }
            ],
          },
        })),
  
      updateBattery: (id, config) =>
        set((state) => ({
          data: {
            ...state.data,
            batteries: (state.data.batteries || []).map((b) =>
              b.id === id ? { ...b, ...config } : b
            ),
          },
        })),
  
      removeBattery: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            batteries: (state.data.batteries || []).filter((b) => b.id !== id),
          },
          selectedBatteryId: state.selectedBatteryId === id ? null : state.selectedBatteryId,
        })),
  
      selectBattery: (id) => set((state) => ({ 
        selectedBatteryId: id, 
        selectedKeyId: id ? null : state.selectedKeyId,
        selectedTrackballId: id ? null : state.selectedTrackballId,
        selectedControllerId: id ? null : state.selectedControllerId
      })),

      setKeyboardData: (data) => set({ 
        data, 
        collisions: checkInterference(data.layout, data.case_config.keyPitch || 19.05) 
      }),
    }),
    {
      name: 'keyboard-maker-storage',
      storage: createJSONStorage(() => localStorage),
      // Recalculate collisions after rehydration to ensure accuracy
      onRehydrateStorage: () => {
        return (rehydratedState) => {
          if (rehydratedState) {
            rehydratedState.collisions = checkInterference(rehydratedState.data.layout, rehydratedState.data.case_config.keyPitch);
          }
        };
      },
    }
  )
);

