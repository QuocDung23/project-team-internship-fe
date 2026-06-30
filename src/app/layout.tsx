// Root layout wrapper for the operations console. Owns the BrowserRouter
// and the shared shell (sidebar + content area). Routed pages are rendered
// inside <MainLayout> via <Outlet />.
//
// Keeping the layout as a file (rather than a folder/index.tsx) makes the
// component boundary explicit and matches the project structure convention
// (src/app/<file>.tsx as the entry layer).

import type { ReactElement } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./component/layout/MainLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { MonitoringView } from "./pages/MonitoringView";
import { DriversPage } from "./pages/DriversPage";
import { FleetPage } from "./pages/FleetPage";
import { AlertsPage } from "./pages/AlertsPage";
import { SettingsPage } from "./pages/SettingsPage";

export function AppLayout(): ReactElement {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/monitoring" element={<MonitoringView />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/fleet" element={<FleetPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="*"
            element={
              <div className="flex flex-1 items-center justify-center p-6">
                <div className="panel px-6 py-8 text-center text-[12px] text-zinc-400">
                  Không tìm thấy trang.
                </div>
              </div>
            }
          />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}