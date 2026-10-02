import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { uid } from "@taroke/core";

export interface SurfaceRecord {
  id: string;
  tick: number;
  surface: string;
  deviceName?: string;
  route?: string;
  trace?: string;
  consumedInputs?: Array<{
    slot: string;
    tray: string;
    sourceLiteral: string;
    direct?: boolean;
    derived?: boolean;
  }>;
  trigger?: { name: string; type: string; text: string };
}

export interface SurfaceState {
  lines: string[];           // backward-compat display array
  records: SurfaceRecord[];  // provenance-backed records
  retention: number;
  selectedIndex: number | null;
  followActive: boolean;
  followPolicy: boolean;
}

const initialState: SurfaceState = {
  lines: [],
  records: [],
  retention: 28,
  selectedIndex: null,
  followActive: true,
  followPolicy: true,
};

function enforceRetention<T>(arr: T[], max: number): T[] {
  return arr.length > max ? arr.slice(-max) : arr;
}

const surfaceSlice = createSlice({
  name: "surface",
  initialState,
  reducers: {
    appendSurfaceLine(state, action: PayloadAction<string>) {
      const surface = action.payload;
      state.lines.push(surface);
      state.records.push({ id: uid("sl"), tick: 0, surface });
      state.lines = enforceRetention(state.lines, state.retention);
      state.records = enforceRetention(state.records, state.retention);
    },
    appendSurfaceRecord(state, action: PayloadAction<SurfaceRecord>) {
      const rec = action.payload;
      state.lines.push(rec.surface);
      state.records.push(rec);
      state.lines = enforceRetention(state.lines, state.retention);
      state.records = enforceRetention(state.records, state.retention);
    },
    clearSurface(state) {
      state.lines = [];
      state.records = [];
      state.selectedIndex = null;
    },
    setRetention(state, action: PayloadAction<number>) {
      const n = Math.max(1, action.payload);
      state.retention = n;
      state.lines = enforceRetention(state.lines, n);
      state.records = enforceRetention(state.records, n);
    },
    selectLine(state, action: PayloadAction<number | null>) {
      state.selectedIndex = action.payload;
    },
    setFollowActive(state, action: PayloadAction<boolean>) {
      state.followActive = action.payload;
    },
    setFollowPolicy(state, action: PayloadAction<boolean>) {
      state.followPolicy = action.payload;
    },
  },
});

export const {
  appendSurfaceLine,
  appendSurfaceRecord,
  clearSurface,
  setRetention,
  selectLine,
  setFollowActive,
  setFollowPolicy,
} = surfaceSlice.actions;
export default surfaceSlice.reducer;
