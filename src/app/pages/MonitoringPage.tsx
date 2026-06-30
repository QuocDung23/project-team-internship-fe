// Driver detail monitoring page. Wires mock telemetry into a single
// operator-focused console layout.

import { useEffect, useState } from "react";
import {
  getMockMetrics,
  tickMockMetrics,
  type DriverSnapshot,
} from "../../features/monitoring/mockMetrics";
import { seedDrivers } from "../../features/fleet/seed";
import { useTicker } from "../../hooks/useTicker";
import { DriverHeader } from "../../features/monitoring/components/DriverHeader";
import { CabinCam } from "../../features/monitoring/components/CabinCam";
import { MetricCard } from "../../features/monitoring/components/MetricCard";
import { HeadFaceCard } from "../../features/monitoring/components/HeadFaceCard";
import { MetricTimeline } from "../../features/monitoring/components/MetricTimeline";
import { AlertLog } from "../../features/monitoring/components/AlertLog";
import type { Driver } from "../../types/fleet";

export function MonitoringPage() {
  // Use the first seeded driver as the "currently monitored" subject.
  const driver: Driver = seedDrivers()[0]!;
  const bundle = getMockMetrics();

  // Hold both the latest snapshot and the series locally so we can rerender
  // on every tick without rebuilding the bundle (which keeps sparklines
  // referentially stable per sample).
  const [series, setSeries] = useState(bundle.series);
  const [snap, setSnap] = useState<DriverSnapshot>(bundle.snapshot);

  // Light tick so the dashboard reads as a live feed (matches the 2.2s
  // cadence of the real WebSocket mock).
  useTicker(2200);
  useEffect(() => {
    const id = window.setInterval(() => {
      tickMockMetrics();
      setSnap(getMockMetrics().snapshot);
      setSeries({ ...getMockMetrics().series });
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  const earStatus = bucket(snap.ear, 0.22, 0.16);
  const marStatus = bucketReverse(snap.mar, 0.55, 0.70);
  const pitchStatus = bucketAbs(snap.pitch, 20, 28);
  const headStatus = overall(snap);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <DriverHeader
        driver={driver}
        route="Sài Gòn → Vũng Tàu · QL51"
        status={headStatus}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="flex flex-col gap-4">
          <CabinCam
            eyesOpen={snap.eyesOpen}
            mouthClosed={snap.mouthClosed}
            onPhone={snap.onPhone}
            seatbelt={snap.seatbelt}
          />
          <MetricTimeline series={series} />
          <AlertLog alerts={bundle.alerts} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <MetricCard
            label="EAR"
            value={snap.ear.toFixed(2)}
            status={earStatus}
            statusLabel={statusWord(earStatus)}
            thresholds={{ warn: 0.22, critical: 0.16 }}
            range={{ min: 0.08, max: 0.34 }}
            hint="Tỉ lệ khép mở mắt. Thấp = buồn ngủ."
          />
          <MetricCard
            label="MAR"
            value={snap.mar.toFixed(2)}
            status={marStatus}
            statusLabel={statusWord(marStatus)}
            thresholds={{ warn: 0.55, critical: 0.70 }}
            higherIsWorse
            range={{ min: 0.10, max: 0.85 }}
            hint="Tỉ lệ mở miệng. Cao = ngáp."
          />
          <MetricCard
            label="DWS Score"
            value={String(snap.dwsScore)}
            unit="/100"
            status={dwsStatus(snap.dwsScore)}
            statusLabel={dwsLabel(snap.dwsScore)}
            thresholds={{ warn: 60, critical: 40 }}
            higherIsWorse
            range={{ min: 0, max: 100 }}
            hint="Chỉ số tổng hợp trạng thái lái xe."
          />
          <MetricCard
            label="Pitch"
            value={snap.pitch.toFixed(1)}
            unit="°"
            status={pitchStatus}
            statusLabel={statusWord(pitchStatus)}
            thresholds={{ warn: 20, critical: 28 }}
            higherIsWorse
            range={{ min: -25, max: 35 }}
            hint="Góc nghiêng đầu so với trục lái."
          />
          <HeadFaceCard
            eyesOpen={snap.eyesOpen}
            mouthClosed={snap.mouthClosed}
            onPhone={snap.onPhone}
            seatbelt={snap.seatbelt}
            status={headStatus}
          />
        </div>
      </div>

      <footer className="mt-2 flex items-center justify-between border-t border-[color:var(--color-hairline)] pt-3 text-[11px] text-zinc-500">
        <span>
          Sentinel Fleet Console · v0.4 · Cập nhật mỗi 2.2s từ central backend (mock)
        </span>
        <span className="font-mono-num">
          {new Date().toLocaleTimeString("vi-VN")}
        </span>
      </footer>
    </div>
  );
}

// --- Status derivation helpers (locked to the same threshold table used in
// the metric cards so the right rail and timeline never disagree).

type S = DriverSnapshot["status"];

function bucket(value: number, warn: number, critical: number): S {
  if (value <= critical) return "critical";
  if (value <= warn) return "warn";
  return "active";
}

function bucketReverse(value: number, warn: number, critical: number): S {
  if (value >= critical) return "critical";
  if (value >= warn) return "warn";
  return "active";
}

function bucketAbs(value: number, warn: number, critical: number): S {
  const abs = Math.abs(value);
  if (abs >= critical) return "critical";
  if (abs >= warn) return "warn";
  return "active";
}

function overall(s: DriverSnapshot): S {
  const rules: S[] = [
    bucket(s.ear, 0.22, 0.16),
    bucketReverse(s.mar, 0.55, 0.70),
    bucketAbs(s.pitch, 20, 28),
  ];
  if (rules.includes("critical") || s.onPhone) return "critical";
  if (rules.includes("warn")) return "warn";
  return "active";
}

function statusWord(s: S): string {
  switch (s) {
    case "active":
      return "Bình thường";
    case "warn":
      return "Cảnh báo";
    case "critical":
      return "Nguy hiểm";
  }
}

function dwsStatus(score: number): S {
  if (score < 40) return "critical";
  if (score < 60) return "warn";
  return "active";
}

function dwsLabel(score: number): string {
  if (score < 40) return "Nguy hiểm";
  if (score < 60) return "Cần chú ý";
  if (score < 80) return "Ổn định";
  return "An toàn";
}