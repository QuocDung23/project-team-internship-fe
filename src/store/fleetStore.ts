// Live fleet store. Drivers are updated incrementally from telemetry events
// rather than re-built each tick, so referential equality on UI rows is preserved.

import { create } from "zustand";
import type { Driver } from "../types/fleet";
import { getSocket } from "../services/socket";

interface FleetState {
  drivers: Record<string, Driver>;
  connected: boolean;
  hydrate: () => void;
  applyTelemetry: (driver: Driver) => void;
  setConnected: (v: boolean) => void;
}

export const useFleetStore = create<FleetState>((set) => ({
  drivers: {},
  connected: false,
  hydrate: () => {
    const initial: Record<string, Driver> = {};
    // Seed import is deferred to avoid a circular dep with the socket service.
    import("../features/fleet/seed").then(({ seedDrivers }) => {
      seedDrivers().forEach((d) => {
        initial[d.id] = d;
      });
      set({ drivers: initial });
    });
  },
  applyTelemetry: (driver) =>
    set((state) => ({
      drivers: { ...state.drivers, [driver.id]: driver },
    })),
  setConnected: (v) => set({ connected: v }),
}));

// Bootstrap: connect the mock socket and stream telemetry into the store once.
let bootstrapped = false;
export function bootstrapFleet(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  const store = useFleetStore.getState();
  store.hydrate();
  const socket = getSocket();
  socket.onTelemetry((driver) => store.applyTelemetry(driver));
  socket.connect();
  useFleetStore.setState({ connected: socket.isConnected() });
}