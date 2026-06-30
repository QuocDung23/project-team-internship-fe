import { useState, useEffect } from "react";
import {
  Truck,
  ClockClockwise,
  Timer,
  MapPin,
  Gauge,
  BatteryLow,
  Thermometer,
  SpinnerGap,
  CheckCircle,
  Wrench,
  StopCircle,
} from "@phosphor-icons/react";
import {
  getVehicleQueue,
  getVehicleQueueStats,
  getFleetKpi,
  type VehicleSnapshot,
  type VehicleQueueStats,
  type FleetKpi,
} from "../data/mockMetrics";
import { StatusBadge } from "../component/ui/monitoring/StatusBadge";
import { formatTime } from "../hook/useTicker";

const STATUS_CONFIG: Record<VehicleSnapshot["status"], { label: string; tone: "active" | "warn" | "critical" | "neutral"; icon: React.ReactNode }> = {
  waiting: { label: "Đang đợi", tone: "warn", icon: <Timer size={12} /> },
  loading: { label: "Đang xếp hàng", tone: "active", icon: <SpinnerGap size={12} className="animate-spin" /> },
  in_transit: { label: "Đang chạy", tone: "active", icon: <Truck size={12} /> },
  idle: { label: "Idle", tone: "neutral", icon: <StopCircle size={12} /> },
  maintenance: { label: "Bảo dưỡng", tone: "critical", icon: <Wrench size={12} /> },
};

function VehicleCard({ vehicle }: { vehicle: VehicleSnapshot }) {
  const cfg = STATUS_CONFIG[vehicle.status];
  const isWaitingLong = vehicle.status === "waiting" && vehicle.waitMinutes > 20;

  return (
    <div className={`panel flex flex-col gap-3 px-4 py-3 transition-colors ${
      isWaitingLong ? "border-amber-500/25" : ""
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold text-zinc-100">{vehicle.driverName}</p>
          <p className="font-mono-num text-[10px] text-zinc-500">{vehicle.licensePlate}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge tone={cfg.tone} label={cfg.label} />
          <span className="inline-flex items-center gap-1 font-mono-num text-[10px] text-zinc-500">
            <ClockClockwise size={10} />
            {formatTime(vehicle.lastUpdate)}
          </span>
        </div>
      </div>

      {/* ID row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400">
        <span className="font-mono-num text-zinc-300">{vehicle.id}</span>
        <span className="inline-flex items-center gap-1">
          <MapPin size={11} />
          {vehicle.team}
        </span>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-2 rounded-md bg-[color:var(--color-surface-2)] p-2">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
          <Gauge size={11} className="shrink-0 text-zinc-500" />
          <span className="font-mono-num text-zinc-200">{vehicle.speedKmh}</span>
          <span>km/h</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
          <BatteryLow size={11} className="shrink-0 text-zinc-500" />
          <span className="font-mono-num text-zinc-200">{vehicle.fuelPercent}</span>
          <span>%</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
          <Thermometer size={11} className="shrink-0 text-zinc-500" />
          <span className={`font-mono-num ${vehicle.engineTemp > 90 ? "text-amber-300" : "text-zinc-200"}`}>
            {vehicle.engineTemp}°C
          </span>
        </div>
        {vehicle.status === "waiting" && (
          <div className="flex items-center gap-1.5 text-[10px]">
            <Timer size={11} className={`shrink-0 ${isWaitingLong ? "text-amber-300" : "text-zinc-500"}`} />
            <span className={`font-mono-num ${isWaitingLong ? "text-amber-300" : "text-zinc-200"}`}>
              {vehicle.waitMinutes}p
            </span>
          </div>
        )}
        {vehicle.status === "loading" && (
          <div className="flex flex-col gap-0.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-hairline)]">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${vehicle.loadProgress}%` }}
              />
            </div>
            <span className="font-mono-num text-[9px] text-zinc-500">{vehicle.loadProgress}%</span>
          </div>
        )}
      </div>

      {/* Wait time warning */}
      {isWaitingLong && (
        <div className="flex items-center gap-1.5 rounded bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-300">
          <Timer size={11} />
          Chờ lâu · {vehicle.waitMinutes}p
        </div>
      )}
    </div>
  );
}

function QueueStatsBar({ stats }: { stats: VehicleQueueStats }) {
  return (
    <div className="panel flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
      {[
        { label: "Đang đợi", value: stats.waitingCount, tone: "warn" as const },
        { label: "Đang xếp hàng", value: stats.loadingCount, tone: "active" as const },
        { label: "Đang chạy", value: stats.transitCount, tone: "active" as const },
        { label: "Hoàn thành hôm nay", value: stats.completedToday, tone: "neutral" as const },
        { label: "TB chờ", value: `${stats.avgWaitMinutes}p`, tone: stats.avgWaitMinutes > 20 ? "warn" as const : "neutral" as const },
      ].map(({ label, value, tone }) => (
        <div key={label} className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">{label}</span>
          <span className={`font-mono-num text-[13px] font-semibold ${
            tone === "warn" ? "text-amber-400" : tone === "active" ? "text-emerald-400" : "text-zinc-200"
          }`}>
            {value}
          </span>
        </div>
      ))}
      {Object.entries(stats.queueByTeam).length > 0 && (
        <>
          <div className="h-3 w-px bg-[color:var(--color-hairline)]" />
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">Theo khu vực:</span>
            {Object.entries(stats.queueByTeam).map(([team, count]) => (
              <span key={team} className="text-[11px] text-zinc-300">
                {team}: <span className="font-mono-num font-semibold text-zinc-100">{count}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type ViewMode = "waiting" | "all";

export function FleetPage() {
  const [vehicles, setVehicles] = useState<VehicleSnapshot[]>([]);
  const [stats, setStats] = useState<VehicleQueueStats | null>(null);
  const [kpi, setKpi] = useState<FleetKpi | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  useEffect(() => {
    setVehicles(getVehicleQueue());
    setStats(getVehicleQueueStats());
    setKpi(getFleetKpi());
  }, []);

  const displayed = viewMode === "waiting"
    ? vehicles.filter((v) => v.status === "waiting" || v.status === "loading")
    : vehicles;

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 md:p-6">
      {/* Header */}
      <header className="panel flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-100">
            <Truck size={18} weight="duotone" className="text-emerald-400" />
            Đội xe
          </h1>
          <p className="mt-0.5 text-[12px] text-zinc-400">
            Quản lý xe · cập nhật liên tục từ central backend
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)] px-2.5 py-1.5 text-[11px] text-zinc-400">
            <ClockClockwise size={12} />
            <span className="font-mono-num">{new Date().toLocaleTimeString("vi-VN")}</span>
          </div>
          <div className="flex items-center gap-1">
            {(["all", "waiting"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  viewMode === m
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {m === "all" ? "Tất cả xe" : "Xe đợi / xếp hàng"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* KPI row */}
      {kpi && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Tổng xe", value: kpi.totalVehicles, icon: <Truck size={14} />, tone: "text-zinc-100" },
            { label: "Đang chạy", value: kpi.activeVehicles, icon: <CheckCircle size={14} />, tone: "text-emerald-400" },
            { label: "Chuyến hôm nay", value: kpi.todayTrips, icon: <MapPin size={14} />, tone: "text-zinc-100" },
            { label: "Quãng đường", value: `${kpi.totalDistanceKm} km`, icon: <Gauge size={14} />, tone: "text-zinc-100" },
          ].map(({ label, value, icon, tone }) => (
            <div key={label} className="panel flex items-center gap-3 px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-surface-2)] text-zinc-400">
                {icon}
              </span>
              <div>
                <p className={`font-mono-num text-lg font-semibold ${tone}`}>{value}</p>
                <p className="text-[10px] text-zinc-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Queue stats bar */}
      {stats && <QueueStatsBar stats={stats} />}

      {/* Vehicle grid */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {displayed.length === 0 ? (
          <div className="panel flex flex-col items-center justify-center gap-3 py-16">
            <CheckCircle size={32} className="text-emerald-400" />
            <p className="text-[13px] text-zinc-500">Không có xe nào đang đợi hoặc xếp hàng</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {displayed.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
