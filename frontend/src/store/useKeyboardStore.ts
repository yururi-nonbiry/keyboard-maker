import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { KeyboardData, KeyConfig, KeyboardMetadata, PcbConfig, CaseConfig, SwitchType, KeyboardType, TrackballConfig, ControllerConfig, BatteryConfig, DiodeConfig, MountingHole } from '../types';
import { checkInterference, calculateBoundingBox } from '../utils/geometry';
import { inferMatrix } from '../utils/matrix';

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
  autoAssignMatrix: () => void;
  updateKeyMatrix: (id: string, row: number, col: number) => void;
  
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

  // Diode Actions
  addDiode: (diode: DiodeConfig) => void;
  updateDiode: (id: string, config: Partial<DiodeConfig>) => void;
  removeDiode: (id: string) => void;
  selectDiode: (id: string | null) => void;
  autoPlaceDiodes: () => void;
  
  // Mounting Hole Actions
  addMountingHole: (hole: MountingHole) => void;
  updateMountingHole: (id: string, config: Partial<MountingHole>) => void;
  removeMountingHole: (id: string) => void;
  selectMountingHole: (id: string | null) => void;
  
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
  selectedDiodeId: string | null;
  selectedMountingHoleId: string | null;

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
  showDiodes: boolean;
  showMatrix: boolean;
  toggleKeycapsVisible: () => void;
  togglePlateVisible: () => void;
  toggleCaseBaseVisible: () => void;
  toggleCaseWallsVisible: () => void;
  togglePCBVisible: () => void;
  toggleSwitchesVisible: () => void;
  toggleTrackballsVisible: () => void;
  toggleControllersVisible: () => void;
  toggleSocketsVisible: () => void;
  toggleDiodesVisible: () => void;
  toggleMatrixVisible: () => void;
  
  // UI State
  settingsModalOpen: boolean;
  toggleSettingsModal: (open?: boolean) => void;

  // Toolbox State
  toolboxVisibleItems: Record<string, boolean>;
  toggleToolboxItem: (itemId: string) => void;
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
  autoDiodeOffset: { x: 0, y: 8, rotation: 0 },
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
        diodes: [],
        pcb_config: DEFAULT_PCB,
        case_config: DEFAULT_CASE,
        mountingHoles: [],
      },
      selectedKeyId: null,
      selectedTrackballId: null,
      selectedControllerId: null,
      selectedBatteryId: null,
      selectedDiodeId: null,
      selectedMountingHoleId: null,
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
      showDiodes: true,
      showMatrix: true,
      settingsModalOpen: false,
      toolboxVisibleItems: {
        key: true,
        trackball: true,
        mcu: true,
        battery: true,
        hole: true,
      },

      toggleKeycapsVisible: () => set((state) => ({ showKeycaps: !state.showKeycaps })),
      togglePlateVisible: () => set((state) => ({ showPlate: !state.showPlate })),
      toggleCaseBaseVisible: () => set((state) => ({ showCaseBase: !state.showCaseBase })),
      toggleCaseWallsVisible: () => set((state) => ({ showCaseWalls: !state.showCaseWalls })),
      togglePCBVisible: () => set((state) => ({ showPCB: !state.showPCB })),
      toggleSwitchesVisible: () => set((state) => ({ showSwitches: !state.showSwitches })),
      toggleTrackballsVisible: () => set((state) => ({ showTrackballs: !state.showTrackballs })),
      toggleControllersVisible: () => set((state) => ({ showControllers: !state.showControllers })),
      toggleSocketsVisible: () => set((state) => ({ showSockets: !state.showSockets })),
      toggleDiodesVisible: () => set((state) => ({ showDiodes: !state.showDiodes })),
      toggleMatrixVisible: () => set((state) => ({ showMatrix: !state.showMatrix })),

      toggleSettingsModal: (open) => set((state) => ({ 
        settingsModalOpen: open !== undefined ? open : !state.settingsModalOpen 
      })),

      toggleToolboxItem: (itemId) => set((state) => ({
        toolboxVisibleItems: {
          ...state.toolboxVisibleItems,
          [itemId]: !state.toolboxVisibleItems[itemId]
        }
      })),

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
            collisions: checkInterference(
              newLayout, 
              state.data.trackballs, 
              state.data.controllers, 
              state.data.batteries, 
              state.data.case_config.keyPitch
            ),
          };
        }),

      updateKey: (id, config) =>
        set((state) => {
          const newLayout = state.data.layout.map((k) => (k.id === id ? { ...k, ...config } : k));
          return {
            data: { ...state.data, layout: newLayout },
            collisions: checkInterference(
              newLayout, 
              state.data.trackballs, 
              state.data.controllers, 
              state.data.batteries, 
              state.data.case_config.keyPitch
            ),
          };
        }),

      removeKey: (id) =>
        set((state) => {
          const newLayout = state.data.layout.filter((k) => k.id !== id);
          return {
            data: { ...state.data, layout: newLayout },
            collisions: checkInterference(
              newLayout, 
              state.data.trackballs, 
              state.data.controllers, 
              state.data.batteries, 
              state.data.case_config.keyPitch
            ),
            selectedKeyId: state.selectedKeyId === id ? null : state.selectedKeyId,
          };
        }),

      selectKey: (id) => set((state) => ({ 
        selectedKeyId: id, 
        selectedTrackballId: id ? null : state.selectedTrackballId,
        selectedControllerId: id ? null : state.selectedControllerId,
        selectedBatteryId: id ? null : state.selectedBatteryId,
        selectedDiodeId: id ? null : state.selectedDiodeId,
        selectedMountingHoleId: id ? null : state.selectedMountingHoleId
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
            collisions: checkInterference(
              newData.layout, 
              newData.trackballs, 
              newData.controllers, 
              newData.batteries, 
              newData.case_config.keyPitch
            ),
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
        set((state) => {
          const newTrackballs = [...(state.data.trackballs || []), trackball];
          return {
            data: {
              ...state.data,
              trackballs: newTrackballs,
            },
            collisions: checkInterference(
              state.data.layout,
              newTrackballs,
              state.data.controllers,
              state.data.batteries,
              state.data.case_config.keyPitch
            ),
          };
        }),

      updateTrackball: (id, config) =>
        set((state) => {
          const newTrackballs = (state.data.trackballs || []).map((t) =>
            t.id === id ? { ...t, ...config } : t
          );
          return {
            data: {
              ...state.data,
              trackballs: newTrackballs,
            },
            collisions: checkInterference(
              state.data.layout,
              newTrackballs,
              state.data.controllers,
              state.data.batteries,
              state.data.case_config.keyPitch
            ),
          };
        }),

      removeTrackball: (id) =>
        set((state) => {
          const newTrackballs = (state.data.trackballs || []).filter((t) => t.id !== id);
          return {
            data: {
              ...state.data,
              trackballs: newTrackballs,
            },
            collisions: checkInterference(
              state.data.layout,
              newTrackballs,
              state.data.controllers,
              state.data.batteries,
              state.data.case_config.keyPitch
            ),
            selectedTrackballId: state.selectedTrackballId === id ? null : state.selectedTrackballId,
          };
        }),

      selectTrackball: (id) => set((state) => ({ 
        selectedTrackballId: id, 
        selectedKeyId: id ? null : state.selectedKeyId,
        selectedControllerId: id ? null : state.selectedControllerId,
        selectedBatteryId: id ? null : state.selectedBatteryId,
        selectedDiodeId: id ? null : state.selectedDiodeId
      })),

      addController: (controller) =>
        set((state) => {
          const newControllers = [...(state.data.controllers || []), controller];
          return {
            data: {
              ...state.data,
              controllers: newControllers,
            },
            collisions: checkInterference(
              state.data.layout,
              state.data.trackballs,
              newControllers,
              state.data.batteries,
              state.data.case_config.keyPitch
            ),
          };
        }),

      updateController: (id, config) =>
        set((state) => {
          const newControllers = (state.data.controllers || []).map((c) =>
            c.id === id ? { ...c, ...config } : c
          );
          return {
            data: {
              ...state.data,
              controllers: newControllers,
            },
            collisions: checkInterference(
              state.data.layout,
              state.data.trackballs,
              newControllers,
              state.data.batteries,
              state.data.case_config.keyPitch
            ),
          };
        }),

      removeController: (id) =>
        set((state) => {
          const newControllers = (state.data.controllers || []).filter((c) => c.id !== id);
          return {
            data: {
              ...state.data,
              controllers: newControllers,
            },
            collisions: checkInterference(
              state.data.layout,
              state.data.trackballs,
              newControllers,
              state.data.batteries,
              state.data.case_config.keyPitch
            ),
            selectedControllerId: state.selectedControllerId === id ? null : state.selectedControllerId,
          };
        }),

      selectController: (id) => set((state) => ({ 
        selectedControllerId: id, 
        selectedKeyId: id ? null : state.selectedKeyId,
        selectedTrackballId: id ? null : state.selectedTrackballId,
        selectedBatteryId: id ? null : state.selectedBatteryId,
        selectedDiodeId: id ? null : state.selectedDiodeId
      })),
  
      addBattery: (battery) =>
        set((state) => {
          const newBatteries = [
            ...(state.data.batteries || []),
            {
              ...battery,
              connectorEnabled: false,
              connectorX: battery.x,
              connectorY: battery.y + 10,
              connectorMountingSide: battery.mountingSide
            }
          ];
          return {
            data: {
              ...state.data,
              batteries: newBatteries,
            },
            collisions: checkInterference(
              state.data.layout,
              state.data.trackballs,
              state.data.controllers,
              newBatteries,
              state.data.case_config.keyPitch
            ),
          };
        }),
  
      updateBattery: (id, config) =>
        set((state) => {
          const newBatteries = (state.data.batteries || []).map((b) =>
            b.id === id ? { ...b, ...config } : b
          );
          return {
            data: {
              ...state.data,
              batteries: newBatteries,
            },
            collisions: checkInterference(
              state.data.layout,
              state.data.trackballs,
              state.data.controllers,
              newBatteries,
              state.data.case_config.keyPitch
            ),
          };
        }),
  
      removeBattery: (id) =>
        set((state) => {
          const newBatteries = (state.data.batteries || []).filter((b) => b.id !== id);
          return {
            data: {
              ...state.data,
              batteries: newBatteries,
            },
            collisions: checkInterference(
              state.data.layout,
              state.data.trackballs,
              state.data.controllers,
              newBatteries,
              state.data.case_config.keyPitch
            ),
            selectedBatteryId: state.selectedBatteryId === id ? null : state.selectedBatteryId,
          };
        }),
  
      selectBattery: (id) => set((state) => ({ 
        selectedBatteryId: id, 
        selectedKeyId: id ? null : state.selectedKeyId,
        selectedTrackballId: id ? null : state.selectedTrackballId,
        selectedControllerId: id ? null : state.selectedControllerId,
        selectedDiodeId: id ? null : state.selectedDiodeId
      })),

      addDiode: (diode) =>
        set((state) => ({
          data: {
            ...state.data,
            diodes: [...(state.data.diodes || []), diode],
          },
        })),

      updateDiode: (id, config) =>
        set((state) => ({
          data: {
            ...state.data,
            diodes: (state.data.diodes || []).map((d) =>
              d.id === id ? { ...d, ...config } : d
            ),
          },
        })),

      removeDiode: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            diodes: (state.data.diodes || []).filter((d) => d.id !== id),
          },
          selectedDiodeId: state.selectedDiodeId === id ? null : state.selectedDiodeId,
        })),

      selectDiode: (id) => set((state) => ({ 
        selectedDiodeId: id, 
        selectedKeyId: id ? null : state.selectedKeyId,
        selectedTrackballId: id ? null : state.selectedTrackballId,
        selectedControllerId: id ? null : state.selectedControllerId,
        selectedBatteryId: id ? null : state.selectedBatteryId
      })),

      autoPlaceDiodes: () => set((state) => {
        const { layout, pcb_config } = state.data;
        const { autoDiodeOffset } = pcb_config;
        
        const newDiodes: DiodeConfig[] = layout.map((key) => {
          // Calculate diode position relative to key position and rotation
          const rad = (key.rotation * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          
          // Apply offset in key's local coordinate system
          const localX = autoDiodeOffset.x;
          const localY = autoDiodeOffset.y;
          
          // Rotate offset
          const rotatedX = localX * cos - localY * sin;
          const rotatedY = localX * sin + localY * cos;
          
          return {
            id: `diode-${key.id}`,
            keyId: key.id,
            x: key.x + rotatedX,
            y: key.y + rotatedY,
            rotation: key.rotation + autoDiodeOffset.rotation,
            side: key.side || 'left',
            mountingSide: 'bottom', // Diodes are usually on the bottom
          };
        });
        
        return {
          data: {
            ...state.data,
            diodes: newDiodes,
          }
        };
      }),

      autoAssignMatrix: () => set((state) => {
        const newLayout = inferMatrix(state.data.layout);
        return {
          data: {
            ...state.data,
            layout: newLayout
          }
        };
      }),

      updateKeyMatrix: (id, row, col) => set((state) => ({
        data: {
          ...state.data,
          layout: state.data.layout.map(k => k.id === id ? { ...k, matrixRow: row, matrixCol: col } : k)
        }
      })),

      addMountingHole: (hole) =>
        set((state) => ({
          data: {
            ...state.data,
            mountingHoles: [...(state.data.mountingHoles || []), hole],
          },
        })),

      updateMountingHole: (id, config) =>
        set((state) => ({
          data: {
            ...state.data,
            mountingHoles: (state.data.mountingHoles || []).map((h) =>
              h.id === id ? { ...h, ...config } : h
            ),
          },
        })),

      removeMountingHole: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            mountingHoles: (state.data.mountingHoles || []).filter((h) => h.id !== id),
          },
          selectedMountingHoleId: state.selectedMountingHoleId === id ? null : state.selectedMountingHoleId,
        })),

      selectMountingHole: (id) => set((state) => ({ 
        selectedMountingHoleId: id, 
        selectedKeyId: id ? null : state.selectedKeyId,
        selectedTrackballId: id ? null : state.selectedTrackballId,
        selectedControllerId: id ? null : state.selectedControllerId,
        selectedBatteryId: id ? null : state.selectedBatteryId,
        selectedDiodeId: id ? null : state.selectedDiodeId
      })),

      setKeyboardData: (data) => set({ 
        data, 
        collisions: checkInterference(
          data.layout, 
          data.trackballs, 
          data.controllers, 
          data.batteries, 
          data.case_config.keyPitch || 19.05
        ) 
      }),
    }),
    {
      name: 'keyboard-maker-storage',
      storage: createJSONStorage(() => localStorage),
      // Recalculate collisions after rehydration to ensure accuracy
      onRehydrateStorage: () => {
        return (rehydratedState) => {
          if (rehydratedState) {
            // Ensure new fields are initialized for existing storage
            if (!rehydratedState.data.pcb_config.autoDiodeOffset) {
              rehydratedState.data.pcb_config.autoDiodeOffset = { x: 0, y: 8, rotation: 0 };
            }
            if (!rehydratedState.data.diodes) {
              rehydratedState.data.diodes = [];
            }
            if (!rehydratedState.data.mountingHoles) {
              rehydratedState.data.mountingHoles = [];
            }
            if (!rehydratedState.toolboxVisibleItems) {
              rehydratedState.toolboxVisibleItems = {
                key: true,
                trackball: true,
                mcu: true,
                battery: true,
                hole: true,
              };
            }
            if (rehydratedState.data.trackballs) {
              rehydratedState.data.trackballs.forEach((t: any) => {
                if (t.rotation === undefined) t.rotation = 0;
                if (t.mountingSide === undefined) t.mountingSide = 'bottom';
              });
            }
            rehydratedState.collisions = checkInterference(
              rehydratedState.data.layout,
              rehydratedState.data.trackballs,
              rehydratedState.data.controllers,
              rehydratedState.data.batteries,
              rehydratedState.data.case_config.keyPitch
            );
          }
        };
      },
    }
  )
);

