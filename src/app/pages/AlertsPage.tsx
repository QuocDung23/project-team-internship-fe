import { useState, useEffect, type ReactNode } from "react";
import {
  Warning,
  ShieldWarning,
  ClockClockwise,
  CheckCircle,
  Funnel,
  Truck,
  MapPin,
  Eye,
  SmileyXEyes,
} from "@phosphor-icons/react";
import { getFleetEvents, refreshFleetEvents, type MockFleetEvent } from "../data/mockMetrics";
import { StatusBadge } from "../component/ui/monitoring/StatusBadge";
import { formatTime } from "../hook/useTicker";

type SeverityFilter = "all" | "warn" | "critical";
type TypeFilter = "all" | "drowsiness_alert" | "yawn_alert" | "distraction_alert" | "speed_alert" | "collision_warning" | "lane_departure";

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: "Tất cả",
  drowsiness_alert: "Buồn ngủ",
  yawn_alert: "Ngáp",
  distraction_alert: "Mất tập trung",
  speed_alert: "Tốc độ",
  collision_warning: "Va chạm",
  lane_departure: "Lệch làn",
};

const TYPE_ICONS: Record<string, ReactNode> = {
  drowsiness_alert: <SmileyXEyes size={14} />,
  yawn_alert: <Eye size={14} />,
  distraction_alert: <Warning size={14} />,
  speed_alert: <Truck size={14} />,
  collision_warning: <ShieldWarning size={14} />,
  lane_departure: <MapPin size={14} />,
};

function AlertRow({ event }: { event: MockFleetEvent }) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border p-3.5 transition-colors ${
        event.severity === "critical"
          ? "border-red-500/20 bg-red-500/5"
          : "border-amber-500/15 bg-amber-500/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white ${
            event.severity === "critical" ? "bg-red-500/30" : "bg-amber-500/20"
          }`}>
            {TYPE_ICONS[event.type] ?? <Warning size={14} />}
          </span>
          <div>
            <p className="text-[12px] font-medium text-zinc-100">{event.driverName}</p>
            <p className="font-mono-num text-[10px] text-zinc-500">{event.licensePlate}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge
            tone={event.severity === "critical" ? "critical" : "warn"}
            label={event.severity === "critical" ? "Nguy hiểm" : "Cảnh báo"}
          />
          <span className="font-mono-num text-[10px] text-zinc-500">
            {formatTime(event.timestamp)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <Truck size={11} />
          {event.driverId}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin size={11} />
          {event.location}
        </span>
        {event.ear > 0 && (
          <span className="font-mono-num">
            EAR: <span className={event.ear < 0.17 ? "text-red-300" : "text-zinc-300"}>{event.ear.toFixed(3)}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[10px] text-zinc-400">
          {TYPE_LABELS[event.type as TypeFilter]}
        </span>
      </div>

      {event.acknowledged && (
        <div className="flex items-center gap-1 text-[10px] text-emerald-400">
          <CheckCircle size={11} weight="fill" />
          Đã xác nhận
        </div>
      )}
    </div>
  );
}

export function AlertsPage() {
  const [events, setEvents] = useState<MockFleetEvent[]>([]);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [showAcknowledged, setShowAcknowledged] = useState(true);

  useEffect(() => {
    setEvents(getFleetEvents());
  }, []);

  const filtered = events.filter((e) => {
    if (!showAcknowledged && e.acknowledged) return false;
    if (severityFilter !== "all" && e.severity !== severityFilter) return false;
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    return true;
  });

  const criticalCount = events.filter((e) => e.severity === "critical" && !e.acknowledged).length;
  const warnCount = events.filter((e) => e.severity === "warn" && !e.acknowledged).length;

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 md:p-6">
      {/* Header */}
      <header className="panel flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-100">
            <Warning size={18} weight="duotone" className="text-amber-400" />
            Nhật ký cảnh báo
          </h1>
          <p className="mt-0.5 text-[12px] text-zinc-400">
            Stream cảnh báo thời gian thực · cập nhật liên tục từ central backend
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-300 ring-1 ring-red-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                {criticalCount} nguy hiểm
              </span>
            )}
            {warnCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300 ring-1 ring-amber-500/20">
                {warnCount} cảnh báo
              </span>
            )}
            {criticalCount === 0 && warnCount === 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Không có cảnh báo mới
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setEvents(refreshFleetEvents());
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)] px-2.5 py-1.5 text-[11px] text-zinc-400 hover:text-zinc-200"
          >
            <ClockClockwise size={12} />
            Refresh
          </button>
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Tổng sự kiện", value: events.length, tone: "neutral" as const },
          { label: "Nguy hiểm", value: criticalCount, tone: "critical" as const },
          { label: "Cảnh báo", value: warnCount, tone: "warn" as const },
          { label: "Đã xác nhận", value: events.filter((e) => e.acknowledged).length, tone: "active" as const },
        ].map(({ label, value, tone }) => (
          <div key={label} className="panel flex flex-col gap-2 px-4 py-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
            <span className={`font-mono-num text-2xl font-semibold ${
              tone === "critical" ? "text-red-400" : tone === "warn" ? "text-amber-400" : tone === "active" ? "text-emerald-400" : "text-zinc-100"
            }`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <Funnel size={13} />
          Lọc:
        </div>
        <div className="flex items-center gap-1">
          {(["all", "critical", "warn"] as SeverityFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                severityFilter === s
                  ? s === "critical" ? "bg-red-500/20 text-red-300" : s === "warn" ? "bg-amber-500/20 text-amber-300" : "bg-[color:var(--color-surface-2)] text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {s === "all" ? "Tất cả" : s === "critical" ? "Nguy hiểm" : "Cảnh báo"}
            </button>
          ))}
        </div>
        <div className="h-3 w-px bg-[color:var(--color-hairline)]" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="rounded-md border border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)] px-2.5 py-1 text-[11px] text-zinc-300 outline-none focus:border-emerald-500/40"
        >
          {(Object.entries(TYPE_LABELS) as [TypeFilter, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <input
            type="checkbox"
            checked={showAcknowledged}
            onChange={(e) => setShowAcknowledged(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-[color:var(--color-hairline)] accent-emerald-500"
          />
          Hiển thị đã xác nhận
        </label>
      </div>

      {/* Alert list */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="panel flex flex-col items-center justify-center gap-3 py-16">
            <Warning size={32} className="text-zinc-600" />
            <p className="text-[13px] text-zinc-500">Không có cảnh báo nào phù hợp</p>
          </div>
        ) : (
          filtered.map((event) => <AlertRow key={event.id} event={event} />)
        )}
      </div>
    </div>
  );
}
