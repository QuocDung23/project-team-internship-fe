// Root of the app. Wraps every routed page in the main layout (sidebar +
// content area) and mounts the operations console.

import type { ReactElement } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./app/layout/MainLayout";
import { DashboardPage } from "./app/pages/DashboardPage";
import { MonitoringPage } from "./app/pages/MonitoringPage";
import { DriversPage } from "./app/pages/DriversPage";
import { FleetPage } from "./app/pages/FleetPage";
import { AlertsPage } from "./app/pages/AlertsPage";
import { SettingsPage } from "./app/pages/SettingsPage";

export default function App(): ReactElement {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
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