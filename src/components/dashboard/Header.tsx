import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  status: "live" | "normal" | "leak";
  lastUpdate?: string;
}

const labels: Record<Props["status"], { text: string; tone: string; dot: string; ring: string }> = {
  live:   { text: "INITIALIZING",   tone: "text-muted-foreground", dot: "bg-muted-foreground", ring: "border-border bg-surface-alt" },
  normal: { text: "ALL SYSTEMS NOMINAL", tone: "text-success",     dot: "bg-success",          ring: "border-success/40 bg-success/10" },
  leak:   { text: "ANOMALY · ACTION REQ", tone: "text-error",      dot: "bg-error",            ring: "border-error/50 bg-error/10" },
};

function useMissionClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatUTC(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`;
}

export function Header({ status, lastUpdate }: Props) {
  const s = labels[status];
  const now = useMissionClock();

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="border-b border-border/60 bg-surface/70 backdrop-blur-md"
    >
      {/* Top brand row */}
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-md border border-primary/40 bg-primary/[0.08] shadow-[0_0_24px_-12px_hsl(var(--primary)/0.6)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h3l2-7 4 14 2-7h7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-balance text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                ACOUSTIC AI · MISSION CONTROL
              </h1>
              <span className="hidden sm:inline-block rounded-sm border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.2em] text-warning">
                CLASSIFIED · OPS
              </span>
            </div>
            <p className="data-label mt-0.5">PIPELINE · SECTOR-07 · NODE-A1 · GRID 47.3°N / 8.5°E</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Telemetry label="MISSION T" value={formatUTC(now)} mono />
          {lastUpdate && (
            <Telemetry label="LAST SYNC" value={lastUpdate} mono />
          )}
          <div className={`flex items-center gap-2.5 rounded-md border px-3 py-2 ${s.ring}`}>
            <span
              className={`status-dot ${s.dot} ${status !== "live" ? "animate-pulse-success" : ""}`}
              style={status === "leak" ? { animation: "pulse-error 1.4s ease-in-out infinite" } : undefined}
            />
            <span className={`text-xs font-semibold tracking-[0.14em] ${s.tone}`}>
              {s.text}
            </span>
          </div>
        </div>
      </div>

      {/* Telemetry strip */}
      <div className="border-t border-border/40 bg-background/40">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 overflow-x-auto px-6 py-1.5 text-[10px] font-mono tracking-[0.18em] text-muted-foreground">
          <span><span className="text-foreground/70">CH</span> 3 ACTIVE</span>
          <span className="hidden sm:inline">SAMPLE RATE · 44.1 kHz</span>
          <span className="hidden md:inline">UPLINK · 99.97%</span>
          <span className="hidden md:inline">MODEL · RFR-1 / ACX-1</span>
          <span className="hidden lg:inline">PIPE PRESS · 4.2 BAR</span>
          <span className="hidden lg:inline">FLOW · 218 L/MIN</span>
          <span><span className={status === "leak" ? "text-error" : "text-success"}>●</span> TELEMETRY {status === "leak" ? "ALERT" : "NOMINAL"}</span>
        </div>
      </div>
    </motion.header>
  );
}

function Telemetry({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="hidden text-right md:block">
      <p className="data-label">{label}</p>
      <p className={`text-sm text-foreground ${mono ? "data-value" : ""} tabular-nums`}>{value}</p>
    </div>
  );
}
