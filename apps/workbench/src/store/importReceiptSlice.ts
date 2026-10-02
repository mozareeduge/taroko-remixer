import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ValidationIssue } from "@taroko/schema";
import type { ImportReceiptState } from "./types.js";
import type { ImportReceipt } from "@taroko/core";

const initialState: ImportReceiptState = {
  visible: false,
  filename: null,
  timestamp: null,
  issues: [],
  repairCount: 0,
  fullReceipt: null,
};

export interface ImportReceiptPayload {
  filename: string | null;
  issues: ValidationIssue[];
  repairCount: number;
  fullReceipt?: ImportReceipt | null;
}

const importReceiptSlice = createSlice({
  name: "importReceipt",
  initialState,
  reducers: {
    showReceipt(state, action: PayloadAction<ImportReceiptPayload>) {
      state.visible = true;
      state.filename = action.payload.filename;
      state.timestamp = new Date().toISOString();
      state.issues = action.payload.issues;
      state.repairCount = action.payload.repairCount;
      state.fullReceipt = action.payload.fullReceipt ?? null;
    },
    dismissReceipt(state) {
      state.visible = false;
    },
    clearReceipt(state) {
      state.visible = false;
      state.filename = null;
      state.timestamp = null;
      state.issues = [];
      state.repairCount = 0;
      state.fullReceipt = null;
    },
  },
});

export const { showReceipt, dismissReceipt, clearReceipt } = importReceiptSlice.actions;
export default importReceiptSlice.reducer;
