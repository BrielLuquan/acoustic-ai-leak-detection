import { motion, AnimatePresence } from "framer-motion";
import type { SensorReading } from "@/lib/supabaseClient";
import { usePipeGeometry, sensorPositions, pipeLength } from "@/lib/pipeConfig";
import type { PipeGeometry } from "@/lib/pipeConfig";

interface Props {
  readings: SensorReading[];
}

const predBadge: Record<string, { label: string; cls: string }> = {
  normal:      { label: "NORMAL",  cls: "border-success/40 bg-success/10 text-success" },
  leak_near_A: { label: "LEAK·A",  cls: "border-error/40 bg-error/10 text-error" },
  leak_near_B: { label: "LEAK·B",  cls: "border-error/40 bg-error/10 text-error" },
  leak_near_C: { label: "LEAK·C",  cls: "border-error/40 bg-error/10 text-error" },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

/** Weighted centroid distance fallback when the DB row has no distance_m. */
function estimateDistance(r: SensorReading, g: PipeGeometry): number {
  const pos = sensorPositions(g);
  const w = [r.sensorA, r.sensorB, r.sensorC];
  const p = [pos.A, pos.B, pos.C];
  const total = w.reduce((s, v) => s + v, 0) || 1;
  const d = w.reduce((s, v, i) => s + (v / total) * p[i], 0);
  return Math.max(0, Math.min(pipeLength(g), d));
}

export function HistoryPanel({ readings }: Props) {
  const [geometry] = usePipeGeometry();

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="status-dot bg-primary" />
          <span className="panel-title">Telemetry Log</span>
        </div>
        <span className="data-label">{readings.length} EVENTS</span>
      </div>

      <div className="grid grid-cols-12 gap-2 border-b border-border/60 pb-2 mb-1">
        <span className="data-label col-span-3">TIME</span>
        <span className="data-label col-span-1 text-right">A</span>
        <span className="data-label col-span-1 text-right">B</span>
        <span className="data-label col-span-1 text-right">C</span>
        <span className="data-label col-span-3 text-right">DISTANCE</span>
        <span className="data-label col-span-3 text-right">PREDICTION</span>
      </div>

      <ul className="divide-y divide-border/40">
        <AnimatePresence initial={false}>
          {readings.length === 0 && (
            <li className="py-8 text-center text-sm text-muted-foreground">
              No readings yet. Submit a simulation to populate the log.
            </li>
          )}
          {readings.map((r) => {
            const badge = predBadge[r.prediction] ?? predBadge.normal;
            return (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                className="grid grid-cols-12 gap-2 items-center py-2.5 text-sm"
              >
                <span className="col-span-3 data-value text-xs text-muted-foreground">
                  {formatTime(r.created_at)}
                </span>
                <span className="col-span-1 data-value text-right text-foreground">{r.sensorA.toFixed(1)}</span>
                <span className="col-span-1 data-value text-right text-foreground">{r.sensorB.toFixed(1)}</span>
                <span className="col-span-1 data-value text-right text-foreground">{r.sensorC.toFixed(1)}</span>
                <span className="col-span-3 data-value text-right text-xs text-muted-foreground">
                  {r.distance_m != null ? `${Number(r.distance_m).toFixed(2)} m` : "—"}
                </span>
                <span className="col-span-3 flex justify-end">
                  <span className={`rounded-sm border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] ${badge.cls}`}>
                    {badge.label}
                  </span>
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
