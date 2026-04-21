import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { KeyboardData, KeyConfig, KeyboardMetadata, PcbConfig, CaseConfig, SwitchType, KeyboardType } from '../types';
import { checkInterference } from '../utils/geometry';

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
        pcb_config: DEFAULT_PCB,
        case_config: DEFAULT_CASE,
      },
      selectedKeyId: null,
      collisions: {},
      gridVisible: true,
      gridSnapping: true,
      gridSize: 19.05,
      viewMode: '3D',

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
          const newLayout = [...state.data.layout, key];
          return {
            data: { ...state.data, layout: newLayout },
            collisions: checkInterference(newLayout),
          };
        }),

      updateKey: (id, config) =>
        set((state) => {
          const newLayout = state.data.layout.map((k) => (k.id === id ? { ...k, ...config } : k));
          return {
            data: { ...state.data, layout: newLayout },
            collisions: checkInterference(newLayout),
          };
        }),

      removeKey: (id) =>
        set((state) => {
          const newLayout = state.data.layout.filter((k) => k.id !== id);
          return {
            data: { ...state.data, layout: newLayout },
            collisions: checkInterference(newLayout),
            selectedKeyId: state.selectedKeyId === id ? null : state.selectedKeyId,
          };
        }),

      selectKey: (id) => set({ selectedKeyId: id }),

      updatePcbConfig: (pcb_config) =>
        set((state) => ({
          data: { ...state.data, pcb_config: { ...state.data.pcb_config, ...pcb_config } },
        })),

      updateCaseConfig: (case_config) =>
        set((state) => ({
          data: { ...state.data, case_config: { ...state.data.case_config, ...case_config } },
        })),

      updateKeyboardType: (type) =>
        set((state) => ({
          data: { ...state.data, type },
        })),

      setKeyboardData: (data) => set({ 
        data, 
        collisions: checkInterference(data.layout) 
      }),
    }),
    {
      name: 'keyboard-maker-storage',
      storage: createJSONStorage(() => localStorage),
      // Recalculate collisions after rehydration to ensure accuracy
      onRehydrateStorage: () => {
        return (rehydratedState) => {
          if (rehydratedState) {
            rehydratedState.collisions = checkInterference(rehydratedState.data.layout);
          }
        };
      },
    }
  )
);

