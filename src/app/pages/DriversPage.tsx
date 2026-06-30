import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import {
  Users,
  Eye,
  EyeClosed,
  SmileyXEyes,
  Phone,
  PhoneDisconnect,
  Seatbelt,
  Warning,
  MagnifyingGlass,
  Plus,
  ClockClockwise,
} from "@phosphor-icons/react";
import { useFleetStore } from "../store/fleetStore";
import { seedDrivers } from "../data/seed";
import { StatusBadge } from "../component/ui/monitoring/StatusBadge";
import { formatTime } from "../hook/useTicker";
import type { Driver, DriverStatus } from "../types";

const EYE_ICONS: Record<Driver["eyeState"], ReactNode> = {
  open: <Eye size={14} className="text-emerald-400" />,
  closed: <EyeClosed size={14} className="text-red-400" />,
  yawning: <SmileyXEyes size={14} className="text-amber-400" />,
};

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

type EyeFilter = "all" | "open" | "closed" | "yawning";
type StatusFilter = "all" | DriverStatus;

function DriverRow({ driver }: { driver: Driver }) {
  const earColor =
    driver.ear < 0.17 ? "text-red-400" : driver.ear < 0.22 ? "text-amber-400" : "text-emerald-400";
  const earHint =
    driver.ear < 0.17 ? "Mắt nhắm nghiêm trọng" : driver.ear < 0.22 ? "Mắt hơi khép" : "Mắt mở bình thường";

  return (
    <tr className="border-b border-[color:var(--color-hairline)]/50 transition-colors hover:bg-[color:var(--color-surface-2)]/30">
      {/* ID */}
      <td className="py-2.5 pr-3 font-mono-num text-[11px] text-zinc-500">{driver.id}</td>
      {/* Name */}
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
            driver.status === "critical" ? "bg-red-500/15 text-red-300" :
            driver.status === "warn" ? "bg-amber-500/15 text-amber-300" :
            driver.status === "offline" ? "bg-zinc-500/15 text-zinc-400" :
            "bg-emerald-500/15 text-emerald-300"
          }`}>
            {driver.name.charAt(0)}
          </div>
          <span className="text-[12px] font-medium text-zinc-100">{driver.name}</span>
        </div>
      </td>
      {/* License */}
      <td className="py-2.5 pr-3 font-mono-num text-[11px] text-zinc-400">{driver.licensePlate}</td>
      {/* Team */}
      <td className="py-2.5 pr-3 text-[11px] text-zinc-400">{driver.team}</td>
      {/* EAR */}
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-1.5" title={earHint}>
          <span className={`font-mono-num text-[12px] font-medium ${earColor}`}>
            {driver.ear.toFixed(3)}
          </span>
          {EYE_ICONS[driver.eyeState]}
        </div>
      </td>
      {/* Status */}
      <td className="py-2.5 pr-3">
        <StatusBadge tone={STATUS_TONE[driver.status]} label={STATUS_LABEL[driver.status]} />
      </td>
      {/* Flags */}
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-1.5">
          {driver.onPhone ? (
            <span title="Đang dùng điện thoại" className="flex items-center justify-center rounded bg-red-500/10 p-1 text-red-400">
              <Phone size={12} weight="fill" />
            </span>
          ) : (
            <span className="flex items-center justify-center rounded bg-emerald-500/10 p-1 text-emerald-400/40">
              <PhoneDisconnect size={12} />
            </span>
          )}
          {driver.seatbelt ? (
            <span title="Đai an toàn" className="flex items-center justify-center rounded bg-emerald-500/10 p-1 text-emerald-400/40">
              <Seatbelt size={12} />
            </span>
          ) : (
            <span title="Không đai an toàn" className="flex items-center justify-center rounded bg-red-500/10 p-1 text-red-400">
              <Seatbelt size={12} weight="fill" />
            </span>
          )}
        </div>
      </td>
      {/* Alerts */}
      <td className="py-2.5 pr-3">
        {driver.totalAlerts > 0 ? (
          <span className={`inline-flex items-center gap-1 font-mono-num text-[11px] font-medium ${
            driver.totalAlerts >= 5 ? "text-red-300" : "text-amber-300"
          }`}>
            <Warning size={11} />
            {driver.totalAlerts}
          </span>
        ) : (
          <span className="font-mono-num text-[11px] text-zinc-600">0</span>
        )}
      </td>
      {/* Phone */}
      <td className="py-2.5 pr-3 font-mono-num text-[11px] text-zinc-500">{driver.phone}</td>
      {/* Last update */}
      <td className="py-2.5 pl-3 font-mono-num text-[10px] text-zinc-500">
        <div className="flex items-center gap-1">
          <ClockClockwise size={10} className="text-zinc-600" />
          {formatTime(driver.lastUpdate)}
        </div>
      </td>
    </tr>
  );
}

export function DriversPage() {
  const fleetDrivers = useFleetStore((s) => s.drivers);
  const hydrate = useFleetStore((s) => s.hydrate);
  const [search, setSearch] = useState("");
  const [eyeFilter, setEyeFilter] = useState<EyeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if (Object.keys(fleetDrivers).length === 0) {
      hydrate();
    }
  }, [hydrate, fleetDrivers]);

  const allDrivers = Object.values(fleetDrivers).length > 0
    ? Object.values(fleetDrivers)
    : seedDrivers();

  const filtered = allDrivers.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.id.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (eyeFilter !== "all" && d.eyeState !== eyeFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: allDrivers.length,
    active: allDrivers.filter((d) => d.status === "active").length,
    warn: allDrivers.filter((d) => d.status === "warn").length,
    critical: allDrivers.filter((d) => d.status === "critical").length,
    offline: allDrivers.filter((d) => d.status === "offline").length,
    eyesOpen: allDrivers.filter((d) => d.eyeState === "open").length,
    eyesClosed: allDrivers.filter((d) => d.eyeState === "closed").length,
    yawning: allDrivers.filter((d) => d.eyeState === "yawning").length,
    onPhone: allDrivers.filter((d) => d.onPhone).length,
  };

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 md:p-6">
      {/* Header */}
      <header className="panel flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-100">
            <Users size={18} weight="duotone" className="text-violet-400" />
            Quản lý tài xế
          </h1>
          <p className="mt-0.5 text-[12px] text-zinc-400">
            {stats.total} tài xế · {stats.active} hoạt động · {stats.offline} offline
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-3 py-1.5 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/25 hover:bg-emerald-500/25 transition-colors">
          <Plus size={13} weight="bold" />
          Thêm tài xế
        </button>
      </header>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {[
          { label: "Bình thường", value: stats.active, tone: "text-emerald-400" },
          { label: "Cảnh báo", value: stats.warn, tone: "text-amber-400" },
          { label: "Nguy hiểm", value: stats.critical, tone: "text-red-400" },
          { label: "Offline", value: stats.offline, tone: "text-zinc-400" },
          { label: "Dùng điện thoại", value: stats.onPhone, tone: "text-red-400" },
        ].map(({ label, value, tone }) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px]">
            <span className="text-zinc-500">{label}:</span>
            <span className={`font-mono-num font-semibold ${tone}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex items-center">
          <MagnifyingGlass size={13} className="absolute left-2.5 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên hoặc mã tài xế..."
            className="w-52 rounded-md border border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)] pl-8 pr-3 py-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-emerald-500/40"
          />
        </div>
        <div className="h-3 w-px bg-[color:var(--color-hairline)]" />
        {/* Eye filter */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-zinc-500">Mắt:</span>
          {(["all", "open", "yawning", "closed"] as EyeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setEyeFilter(f)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                eyeFilter === f
                  ? f === "closed" ? "bg-red-500/20 text-red-300" : f === "yawning" ? "bg-amber-500/20 text-amber-300" : f === "open" ? "bg-emerald-500/20 text-emerald-300" : "bg-[color:var(--color-surface-2)] text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f === "all" ? "Tất cả" : f === "open" ? "Mở" : f === "yawning" ? "Ngáp" : "Nhắm"}
            </button>
          ))}
        </div>
        <div className="h-3 w-px bg-[color:var(--color-hairline)]" />
        {/* Status filter */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-zinc-500">Trạng thái:</span>
          {(["all", "active", "warn", "critical", "offline"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                statusFilter === f
                  ? f === "critical" ? "bg-red-500/20 text-red-300" : f === "warn" ? "bg-amber-500/20 text-amber-300" : f === "offline" ? "bg-zinc-500/20 text-zinc-300" : "bg-emerald-500/20 text-emerald-300"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f === "all" ? "Tất cả" : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="panel flex flex-1 flex-col gap-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="sticky top-0 z-10 border-b border-[color:var(--color-hairline)] bg-[color:var(--color-surface-1)] text-[10px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="py-2 pr-3 font-medium">Mã</th>
                <th className="py-2 pr-3 font-medium">Tài xế</th>
                <th className="py-2 pr-3 font-medium">Biển số</th>
                <th className="py-2 pr-3 font-medium">Khu vực</th>
                <th className="py-2 pr-3 font-medium">EAR</th>
                <th className="py-2 pr-3 font-medium">Trạng thái</th>
                <th className="py-2 pr-3 font-medium">Cờ</th>
                <th className="py-2 pr-3 font-medium">Cảnh báo</th>
                <th className="py-2 pr-3 font-medium">Điện thoại</th>
                <th className="py-2 pl-3 font-medium">Cập nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-hairline)]/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[12px] text-zinc-500">
                    Không tìm thấy tài xế nào phù hợp
                  </td>
                </tr>
              ) : (
                filtered.map((d) => <DriverRow key={d.id} driver={d} />)
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[color:var(--color-hairline)] px-4 py-2 text-[10px] text-zinc-500">
          Hiển thị {filtered.length} / {allDrivers.length} tài xế
          {filtered.length !== allDrivers.length && (
            <button
              onClick={() => { setSearch(""); setEyeFilter("all"); setStatusFilter("all"); }}
              className="ml-2 text-emerald-400 hover:text-emerald-300"
            >
              Xoá bộ lọc
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
