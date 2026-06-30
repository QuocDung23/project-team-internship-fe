// Landing dashboard for the operations console. High-level fleet KPIs that
// give the operator a one-glance status before drilling into a single driver.

import { useEffect, type ReactNode } from "react";
import {
  Truck,
  Users,
  Warning,
  ShieldCheck,
  ArrowUpRight,
  ClockClockwise,
} from "@phosphor-icons/react";
import { useFleetStore } from "../../store/fleetStore";
import { useTicker, formatTime } from "../../hooks/useTicker";
import { StatusBadge } from "../../features/monitoring/components/StatusBadge";
import type { DriverStatus } from "../../types/fleet";

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "active" | "warn" | "critical" | "neutral";
  icon: ReactNode;
}

function KpiCard({ label, value, hint, tone = "neutral", icon }: KpiCardProps) {
  return (
    <div className="panel flex flex-col gap-3 px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[color:var(--color-surface-2)] text-zinc-400">
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono-num text-3xl font-semibold leading-none text-zinc-100">
          {value}
        </span>
        {tone !== "neutral" && (
          <StatusBadge tone={tone} label={tone === "active" ? "OK" : tone === "warn" ? "Warn" : "Risk"} withDot />
        )}
      </div>
      {hint && <p className="text-[11px] text-zinc-500">{hint}</p>}
    </div>
  );
}

const STATUS_LABEL: Record<DriverStatus, string> = {
  active: "Bình thường",
  warn: "Cảnh báo",
  critical: "Nguy hiểm",
  offline: "Offline",
};

const STATUS_TONE: Record<DriverStatus, "active" | "warn" | "critical" | "neutral"> = {
  active: "active",
  warn: "warn",
  critical: "critical",
  offline: "neutral",
};

export function DashboardPage() {
  const drivers = useFleetStore((s) => s.drivers);
  const hydrate = useFleetStore((s) => s.hydrate);
  const connected = useFleetStore((s) => s.connected);
  const now = useTicker(1000);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const list = Object.values(drivers);
  const total = list.length;
  const active = list.filter((d) => d.status === "active").length;
  const warn = list.filter((d) => d.status === "warn").length;
  const critical = list.filter((d) => d.status === "critical").length;
  const offline = list.filter((d) => d.status === "offline").length;
  const totalAlerts = list.reduce((sum, d) => sum + d.totalAlerts, 0);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Top welcome strip */}
      <header className="panel flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-zinc-100">
            Tổng quan đội xe
          </h1>
          <p className="mt-0.5 text-[12px] text-zinc-400">
            Ca trực đang chạy · 3 khu vực · cập nhật liên tục từ central backend
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)] px-2.5 py-1.5 text-zinc-400">
            <ClockClockwise size={12} />
            <span className="font-mono-num">{formatTime(now)}</span>
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 ring-1 ${
              connected
                ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25"
                : "bg-zinc-500/10 text-zinc-300 ring-zinc-500/25"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-zinc-400"}`} />
            {connected ? "Live" : "Connecting"}
          </span>
        </div>
      </header>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Tổng xe đang chạy"
          value={total}
          hint={`${active} bình thường · ${offline} offline`}
          tone="active"
          icon={<Truck size={16} weight="duotone" />}
        />
        <KpiCard
          label="Tài xế online"
          value={total - offline}
          hint={`${total} tài xế trong hệ thống`}
          icon={<Users size={16} weight="duotone" />}
        />
        <KpiCard
          label="Cảnh báo ca"
          value={totalAlerts}
          hint={`${warn} cảnh báo · ${critical} nguy hiểm`}
          tone={critical > 0 ? "critical" : warn > 0 ? "warn" : "active"}
          icon={<Warning size={16} weight="duotone" />}
        />
        <KpiCard
          label="Tỉ lệ an toàn"
          value={total === 0 ? "—" : `${Math.round((active / total) * 100)}%`}
          hint="DWS score trung bình ca"
          tone={critical > 0 ? "warn" : "active"}
          icon={<ShieldCheck size={16} weight="duotone" />}
        />
      </div>

      {/* Driver snapshot table */}
      <section className="panel flex flex-col gap-3 px-5 py-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-semibold tracking-tight text-zinc-100">
              Trạng thái tài xế theo thời gian thực
            </h2>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Bảng này cập nhật mỗi 2.2s từ socket mock. Click vào từng dòng để vào giám sát chi tiết.
            </p>
          </div>
          <a
            href="/monitoring"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
          >
            Xem giám sát chi tiết
            <ArrowUpRight size={12} weight="bold" />
          </a>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="text-[10px] uppercase tracking-wider text-zinc-500">
              <tr className="border-b border-[color:var(--color-hairline)]">
                <th className="py-2 pr-3 font-medium">Mã</th>
                <th className="py-2 pr-3 font-medium">Tài xế</th>
                <th className="py-2 pr-3 font-medium">Biển số</th>
                <th className="py-2 pr-3 font-medium">Khu vực</th>
                <th className="py-2 pr-3 font-medium">EAR</th>
                <th className="py-2 pr-3 font-medium">Trạng thái</th>
                <th className="py-2 pr-3 font-medium">Cảnh báo ca</th>
                <th className="py-2 pl-3 font-medium">Cập nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {list.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[12px] text-zinc-500">
                    Đang tải dữ liệu từ socket...
                  </td>
                </tr>
              )}
              {list.slice(0, 8).map((d) => (
                <tr key={d.id} className="hover:bg-[color:var(--color-surface-2)]/40">
                  <td className="py-2.5 pr-3 font-mono-num text-zinc-300">{d.id}</td>
                  <td className="py-2.5 pr-3 font-medium text-zinc-100">{d.name}</td>
                  <td className="py-2.5 pr-3 font-mono-num text-zinc-400">{d.licensePlate}</td>
                  <td className="py-2.5 pr-3 text-zinc-400">{d.team}</td>
                  <td className="py-2.5 pr-3 font-mono-num text-zinc-200">{d.ear.toFixed(2)}</td>
                  <td className="py-2.5 pr-3">
                    <StatusBadge
                      tone={STATUS_TONE[d.status]}
                      label={STATUS_LABEL[d.status]}
                    />
                  </td>
                  <td className="py-2.5 pr-3 font-mono-num text-amber-300">{d.totalAlerts}</td>
                  <td className="py-2.5 pl-3 font-mono-num text-zinc-500">
                    {formatTime(d.lastUpdate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}