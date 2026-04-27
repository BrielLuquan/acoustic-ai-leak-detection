import { motion, AnimatePresence } from "framer-motion";
import type { Prediction } from "@/lib/supabaseClient";

interface Props {
  prediction: Prediction | null;
}

const locationMap: Record<Exclude<Prediction, "normal">, string> = {
  leak_near_A: "Sensor A · Upstream segment",
  leak_near_B: "Sensor B · Midline segment",
  leak_near_C: "Sensor C · Downstream segment",
};

export function LeakAlert({ prediction }: Props) {
  const isLeak = prediction && prediction !== "normal";
  const isReady = prediction !== null;

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
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span
            className={`status-dot ${
              isLeak ? "bg-error animate-signal" : isReady ? "bg-success" : "bg-muted-foreground"
            }`}
          />
          <span className="panel-title">Leak Detection · ML Inference</span>
        </div>
        <span className="data-label">MODEL · ACX-1</span>
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

          <div className="min-w-0">
            <h2 className={`text-balance text-2xl font-semibold tracking-tight sm:text-3xl ${
              isLeak ? "text-error" : isReady ? "text-success" : "text-muted-foreground"
            }`}>
              {isLeak ? "LEAK DETECTED" : isReady ? "NO LEAK DETECTED" : "AWAITING SIGNAL"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLeak
                ? `Acoustic anomaly localized at ${locationMap[prediction]}`
                : isReady
                ? "All channels within nominal acoustic range."
                : "Submit a reading to begin inference."}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
