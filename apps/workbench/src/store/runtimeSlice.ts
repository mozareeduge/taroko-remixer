import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RuntimeState, RuntimeStatus } from "./types.js";
import type { TarokoEvent } from "@taroko/schema";

const RECENT_EVENT_MAX = 100;

const initialState: RuntimeState = {
  status: "stopped",
  runState: { tick: 0, queue: [], currentScene: null, currentStanza: null },
  recentEventIds: [],
};

const runtimeSlice = createSlice({
  name: "runtime",
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<RuntimeStatus>) {
      state.status = action.payload;
    },
    start(state) {
      state.status = "running";
    },
    pause(state) {
      state.status = "paused";
    },
    stop(state) {
      state.status = "stopped";
      state.runState = { tick: 0, queue: [], currentScene: null, currentStanza: null };
      state.recentEventIds = [];
    },
    recordEvent(state, action: PayloadAction<TarokoEvent>) {
      const ev = action.payload;
      state.runState.tick = ev.tick + 1;
      state.runState.currentScene = ev.type !== "error" ? (ev.sceneId ?? null) : null;
      state.runState.currentStanza = ev.type !== "error" ? (ev.stanzaId ?? null) : null;
      // Flush queue after each event (queue is managed externally in generate loop)
      state.recentEventIds.push(ev.id);
      if (state.recentEventIds.length > RECENT_EVENT_MAX) {
        state.recentEventIds.shift();
      }
    },
    resetRunState(state) {
      state.runState = { tick: 0, queue: [], currentScene: null, currentStanza: null };
      state.recentEventIds = [];
    },
  },
});

export const { setStatus, start, pause, stop, recordEvent, resetRunState } = runtimeSlice.actions;
export default runtimeSlice.reducer;
