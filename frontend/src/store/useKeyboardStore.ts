import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { KeyboardData, KeyConfig, KeyboardMetadata, PcbConfig, CaseConfig, SwitchType, KeyboardType, TrackballConfig } from '../types';
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
        pcb_config: DEFAULT_PCB,
        case_config: DEFAULT_CASE,
      },
      selectedKeyId: null,
      selectedTrackballId: null,
      collisions: {},
      gridVisible: true,
      gridSnapping: true,
      gridSize: 19.05,
      viewMode: '3D',
      splitMode: false,
      tempSplitX: null,

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

      selectKey: (id) => set((state) => ({ selectedKeyId: id, selectedTrackballId: id ? null : state.selectedTrackballId })),

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

      selectTrackball: (id) => set((state) => ({ selectedTrackballId: id, selectedKeyId: id ? null : state.selectedKeyId })),

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

