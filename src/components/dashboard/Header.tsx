import { motion } from "framer-motion";

interface Props {
  status: "live" | "normal" | "leak";
  lastUpdate?: string;
}

const labels: Record<Props["status"], { text: string; tone: string; dot: string }> = {
  live:   { text: "INITIALIZING",   tone: "text-muted-foreground", dot: "bg-muted-foreground" },
  normal: { text: "SYSTEM NORMAL",  tone: "text-success",          dot: "bg-success" },
  leak:   { text: "LEAK DETECTED",  tone: "text-error",            dot: "bg-error" },
};

export function Header({ status, lastUpdate }: Props) {
  const s = labels[status];
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="border-b border-border/60 bg-surface/60 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="grid h-10 w-10 place-items-center rounded-md border border-border bg-surface-alt">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h3l2-7 4 14 2-7h7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-balance text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Acoustic AI Monitoring System
            </h1>
            <p className="data-label mt-0.5">PIPELINE · SECTOR-07 · NODE-A1</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {lastUpdate && (
            <div className="hidden text-right md:block">
              <p className="data-label">Last sync</p>
              <p className="data-value text-sm text-foreground">{lastUpdate}</p>
            </div>
          )}
          <div className={`flex items-center gap-2.5 rounded-md border px-3 py-2 ${
            status === "leak"
              ? "border-error/50 bg-error/10"
              : status === "normal"
              ? "border-success/40 bg-success/10"
              : "border-border bg-surface-alt"
          }`}>
            <span className={`status-dot ${s.dot} ${status !== "live" ? "animate-pulse-success" : ""}`}
              style={status === "leak" ? { animation: "pulse-error 1.4s ease-in-out infinite" } : undefined} />
            <span className={`text-xs font-semibold tracking-[0.14em] ${s.tone}`}>
              {s.text}
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
