// Mock driver metrics generator for the monitoring console.
// Mirrors the shape that the real central-backend WebSocket would push so the
// UI can later swap to live data without touching components.

export type MetricKind = "ear" | "mar" | "pitch";
export type MetricStatus = "active" | "warn" | "critical";

export interface MetricSample {
  ts: number;
  value: number;
}

export interface MetricSeries {
  kind: MetricKind;
  unit: string;
  samples: MetricSample[];
}

export interface DriverSnapshot {
  ts: number;
  ear: number;
  mar: number;
  pitch: number;
  dwsScore: number;
  status: MetricStatus;
  eyesOpen: boolean;
  mouthClosed: boolean;
  onPhone: boolean;
  seatbelt: boolean;
}

const SERIES_CAPACITY = 60; // ~2 phút ở tần suất 2s

const RANGES = {
  ear: { min: 0.08, max: 0.34, base: 0.28, warn: 0.22, critical: 0.16 },
  mar: { min: 0.10, max: 0.85, base: 0.42, warn: 0.55, critical: 0.70 },
  pitch: { min: -25, max: 35, base: 12, warn: 20, critical: 28 },
} as const;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function jitter(value: number, magnitude: number): number {
  return value + (Math.random() - 0.5) * magnitude;
}

function statusFor(kind: MetricKind, value: number): MetricStatus {
  const r = RANGES[kind];
  if (value <= r.critical) return "critical";
  if (value <= r.warn) return "warn";
  return "active";
}

function nextValue(kind: MetricKind, current: number): number {
  const r = RANGES[kind];
  const drift = kind === "pitch" ? 1.4 : 0.02;
  let next = jitter(current, drift);
  // Periodic drift toward critical so the demo occasionally surfaces an alert.
  if (Math.random() > 0.92) {
    next = r.critical + Math.random() * 0.02;
  } else if (Math.random() > 0.85) {
    next = r.warn - 0.01 - Math.random() * 0.04;
  }
  return clamp(Number(next.toFixed(3)), r.min, r.max);
}

function makeSeries(kind: MetricKind, unit: string, seed: number): MetricSeries {
  const r = RANGES[kind];
  const now = Date.now();
  const samples: MetricSample[] = [];
  let value: number = r.base;
  for (let i = SERIES_CAPACITY - 1; i >= 0; i--) {
    value = nextValue(kind, value);
    samples.push({ ts: now - i * 2000 + (seed % 7) * 137, value });
  }
  return { kind, unit, samples };
}

export interface MockMetricsBundle {
  snapshot: DriverSnapshot;
  series: Record<MetricKind, MetricSeries>;
  alerts: MockAlert[];
}

export interface MockAlert {
  id: string;
  ts: number;
  severity: "warn" | "critical";
  title: string;
  detail: string;
}

function buildAlerts(): MockAlert[] {
  const now = Date.now();
  return [
    {
      id: "A-2401",
      ts: now - 12_000,
      severity: "warn",
      title: "Buồn ngủ nhẹ",
      detail: "EAR = 0.19 trong 2.1s liên tục",
    },
    {
      id: "A-2400",
      ts: now - 45_000,
      severity: "critical",
      title: "Ngáp kéo dài",
      detail: "MAR = 0.71 vượt ngưỡng 1.8s",
    },
    {
      id: "A-2399",
      ts: now - 96_000,
      severity: "warn",
      title: "Nghiêng đầu",
      detail: "Pitch = 22.4° lệch trục lái",
    },
  ];
}

let bundle: MockMetricsBundle | null = null;

function dwsScore(snap: DriverSnapshot): number {
  // Trọng số cố định cho demo. Thực tế sẽ do model backend trả.
  const earPart = clamp((snap.ear - 0.10) / 0.22, 0, 1) * 40;
  const marPart = clamp(1 - (snap.mar - 0.10) / 0.65, 0, 1) * 30;
  const pitchPart = clamp(1 - Math.abs(snap.pitch) / 30, 0, 1) * 20;
  const phonePenalty = snap.onPhone ? -10 : 0;
  return Math.round(earPart + marPart + pitchPart + phonePenalty);
}

function buildSnapshot(series: Record<MetricKind, MetricSeries>): DriverSnapshot {
  const earLast = series.ear.samples.at(-1);
  const marLast = series.mar.samples.at(-1);
  const pitchLast = series.pitch.samples.at(-1);
  const ear = earLast?.value ?? 0.28;
  const mar = marLast?.value ?? 0.42;
  const pitch = pitchLast?.value ?? 12;
  const eyesOpen = ear > 0.18;
  const mouthClosed = mar < 0.55;
  const onPhone = Math.random() > 0.92;
  const seatbelt = true;
  const status: MetricStatus =
    statusFor("ear", ear) === "critical" ||
    statusFor("mar", mar) === "critical" ||
    statusFor("pitch", pitch) === "critical"
      ? "critical"
      : statusFor("ear", ear) === "warn" ||
          statusFor("mar", mar) === "warn" ||
          statusFor("pitch", pitch) === "warn"
        ? "warn"
        : "active";
  const snap: DriverSnapshot = {
    ts: Date.now(),
    ear,
    mar,
    pitch,
    dwsScore: 0,
    status,
    eyesOpen,
    mouthClosed,
    onPhone,
    seatbelt,
  };
  snap.dwsScore = dwsScore(snap);
  return snap;
}

export function getMockMetrics(): MockMetricsBundle {
  if (bundle) return bundle;
  const series: Record<MetricKind, MetricSeries> = {
    ear: makeSeries("ear", "", 1),
    mar: makeSeries("mar", "", 3),
    pitch: makeSeries("pitch", "°", 5),
  };
  const snapshot = buildSnapshot(series);
  bundle = { snapshot, series, alerts: buildAlerts() };
  return bundle;
}

// Tick the simulation forward. Returns the fresh snapshot and mutates series in place.
export function tickMockMetrics(): DriverSnapshot {
  if (!bundle) getMockMetrics();
  const b = bundle!;
  const ts = Date.now();
  (["ear", "mar", "pitch"] as MetricKind[]).forEach((kind) => {
    const s = b.series[kind];
    const lastVal = s.samples.at(-1)?.value;
    if (lastVal === undefined) return;
    s.samples.push({ ts, value: nextValue(kind, lastVal) });
    if (s.samples.length > SERIES_CAPACITY) s.samples.shift();
  });
  b.snapshot = buildSnapshot(b.series);
  return b.snapshot;
}