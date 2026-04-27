import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

interface Props {
  label: string;
  channel: "A" | "B" | "C";
  value: number;
  max?: number;
  isLeakSource: boolean;
}

const channelColors: Record<Props["channel"], string> = {
  A: "from-primary/80 to-primary",
  B: "from-secondary/80 to-secondary",
  C: "from-[hsl(260,90%,65%)] to-[hsl(280,90%,70%)]",
};

export function SensorCard({ label, channel, value, max = 100, isLeakSource }: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const display = useMotionValue(0);
  const rounded = useTransform(display, (v) => v.toFixed(1));

  useEffect(() => {
    const controls = animate(display, value, {
      duration: 0.4,
      ease: [0.2, 0.8, 0.2, 1],
    });
    return controls.stop;
  }, [value, display]);

  // Build 24 vertical bars to mimic an acoustic waveform meter
  const bars = Array.from({ length: 24 }, (_, i) => {
    const threshold = ((i + 1) / 24) * 100;
    const active = pct >= threshold;
    return { active, height: 30 + Math.sin(i * 0.6 + value * 0.05) * 60 };
  });

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.6, 1] }}
      className={`panel relative overflow-hidden transition-[box-shadow,border-color] duration-200 ${
        isLeakSource
          ? "border-error/60 animate-pulse-error"
          : "hover:border-primary/40 hover:bg-surface-alt"
      }`}
    >
      {/* corner brackets */}
      <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-border/80" />
      <span className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-border/80" />
      <span className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-border/80" />
      <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-border/80" />

      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className={`status-dot ${isLeakSource ? "bg-error animate-signal" : "bg-success"}`} />
          <span className="panel-title">{label}</span>
        </div>
        <span className="data-label">CH-{channel}</span>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <motion.span className="data-value text-4xl font-medium text-foreground">
            {rounded}
          </motion.span>
          <span className="ml-1.5 text-sm text-muted-foreground">dB</span>
          <p className="data-label mt-1">acoustic intensity</p>
        </div>
        <div className={`text-right ${isLeakSource ? "text-error" : "text-muted-foreground"}`}>
          <p className="data-label">status</p>
          <p className="text-xs font-semibold tracking-wider mt-1">
            {isLeakSource ? "ANOMALY" : "NOMINAL"}
          </p>
        </div>
      </div>

      {/* Waveform meter */}
      <div className="mt-5 flex h-14 items-end gap-[3px]">
        {bars.map((b, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              height: b.active ? `${b.height}%` : "12%",
              opacity: b.active ? 1 : 0.25,
            }}
            transition={{ duration: 0.3, delay: i * 0.005 }}
            className={`flex-1 rounded-sm bg-gradient-to-t ${
              isLeakSource ? "from-error/70 to-error" : channelColors[channel]
            }`}
          />
        ))}
      </div>

      {/* Linear progress */}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-alt">
          <motion.div
            className={`h-full ${isLeakSource ? "bg-error" : "bg-primary"}`}
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </div>
        <span className="data-value text-xs text-muted-foreground w-10 text-right">
          {pct.toFixed(0)}%
        </span>
      </div>
    </motion.div>
  );
}
