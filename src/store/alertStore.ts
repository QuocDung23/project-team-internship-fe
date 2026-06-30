// Alert store: holds the latest unacknowledged critical event so the
// EmergencyAlertModal can latch onto a single payload and the recent event log
// can render the tail of the stream.

import { create } from "zustand";
import type { FleetEvent } from "../types/fleet";

interface AlertState {
  log: FleetEvent[];
  pending: FleetEvent | null;
  push: (event: FleetEvent) => void;
  acknowledge: () => void;
}

const MAX_LOG = 24;

export const useAlertStore = create<AlertState>((set) => ({
  log: [],
  pending: null,
  push: (event) =>
    set((state) => ({
      log: [event, ...state.log].slice(0, MAX_LOG),
      pending: state.pending ?? event,
    })),
  acknowledge: () => set({ pending: null }),
}));