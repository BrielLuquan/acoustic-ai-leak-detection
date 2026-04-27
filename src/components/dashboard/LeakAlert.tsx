import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { LeakEvent, PredictionResult, Prediction } from "@/lib/supabaseClient";

interface Props {
  prediction: Prediction | null;
  result: PredictionResult | null;
  activeEvent: LeakEvent | null;
  onConfirmFix: () => Promise<void>;
  resolving: boolean;
}

export function LeakAlert({ prediction, result, activeEvent, onConfirmFix, resolving }: Props) {
  const isLeak = prediction && prediction !== "normal";
  const isReady = prediction !== null;

  const locationText = result?.location_label
    ?? (isLeak ? "Localizing acoustic anomaly…" : "");

  return (
    <div
      className={`panel relative overflow-hidden transition-colors duration-300 ${
        isLeak
          ? "border-error/60 bg-error/[0.04] animate-pulse-error"
          : isReady
          ? "border-success/30 bg-success/[0.03]"
          : ""
      }`}
    >
      {/* HUD corner brackets */}
      <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-foreground/30" />
      <span className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-foreground/30" />
      <span className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-foreground/30" />
      <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-foreground/30" />

      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span
            className={`status-dot ${
              isLeak ? "bg-error animate-signal" : isReady ? "bg-success" : "bg-muted-foreground"
            }`}
          />
          <span className="panel-title">Leak Detection · ML Inference</span>
        </div>
        <span className="data-label">
          {result?.source === "ml_model" ? "MODEL · RFR-1" : "MODEL · ACX-1 (RULE)"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={prediction ?? "idle"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex items-center gap-6"
        >
          <div
            className={`grid h-20 w-20 shrink-0 place-items-center rounded-lg border ${
              isLeak
                ? "border-error/60 bg-error/10 text-error"
                : isReady
                ? "border-success/40 bg-success/10 text-success"
                : "border-border bg-surface-alt text-muted-foreground"
            }`}
          >
            {isLeak ? (
              <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v6M12 22a8 8 0 0 0 8-8c0-3-2-5-4-7l-4-5-4 5c-2 2-4 4-4 7a8 8 0 0 0 8 8z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : isReady ? (
              <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12l4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-9 w-9 animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" opacity="0.3" />
                <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
              </svg>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className={`text-balance text-2xl font-semibold tracking-tight sm:text-3xl ${
              isLeak ? "text-error" : isReady ? "text-success" : "text-muted-foreground"
            }`}>
              {isLeak ? "LEAK DETECTED" : isReady ? "NO LEAK DETECTED" : "AWAITING SIGNAL"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLeak
                ? `Acoustic anomaly · ${locationText}`
                : isReady
                ? "All channels within nominal acoustic range."
                : "Submit a reading to begin inference."}
            </p>

            {result && isLeak && (
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <Metric label="DISTANCE" value={result.distance_m != null ? `${result.distance_m.toFixed(2)} m` : "—"} />
                <Metric label="CONFIDENCE" value={`${(result.confidence * 100).toFixed(1)}%`} />
                <Metric label="SOURCE" value={result.source === "ml_model" ? "ML MODEL" : "HEURISTIC"} />
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {activeEvent && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-center justify-between gap-4 rounded-md border border-error/40 bg-error/[0.06] px-4 py-3"
        >
          <div className="min-w-0">
            <p className="data-label text-error">ACTIVE INCIDENT · #{activeEvent.id}</p>
            <p className="text-xs text-foreground/90 mt-0.5 truncate">
              {activeEvent.location_label}
            </p>
          </div>
          <Button
            type="button"
            onClick={onConfirmFix}
            disabled={resolving}
            className="h-9 bg-success text-success-foreground hover:bg-success/90 font-semibold tracking-wide"
          >
            {resolving ? "RESOLVING…" : "✓ CONFIRM FIX"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border/60 bg-surface-alt px-2.5 py-1.5">
      <p className="data-label leading-none">{label}</p>
      <p className="data-value text-sm text-foreground mt-1">{value}</p>
    </div>
  );
}
