import { motion } from "framer-motion";
import type { Prediction } from "@/lib/supabaseClient";

interface Props {
  prediction: Prediction | null;
}

const sensors: { id: "A" | "B" | "C"; cx: number; pred: Prediction }[] = [
  { id: "A", cx: 80,  pred: "leak_near_A" },
  { id: "B", cx: 300, pred: "leak_near_B" },
  { id: "C", cx: 520, pred: "leak_near_C" },
];

export function PipeDiagram({ prediction }: Props) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="status-dot bg-primary animate-signal" />
          <span className="panel-title">Pipeline Topology</span>
        </div>
        <span className="data-label">SECTOR-07 · 600m span</span>
      </div>

      <div className="relative w-full">
        <svg viewBox="0 0 600 160" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="pipeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--surface-alt))" />
              <stop offset="50%" stopColor="hsl(var(--border))" />
              <stop offset="100%" stopColor="hsl(var(--surface-alt))" />
            </linearGradient>
            <linearGradient id="leakGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--error) / 0.3)" />
              <stop offset="50%" stopColor="hsl(var(--error))" />
              <stop offset="100%" stopColor="hsl(var(--error) / 0.3)" />
            </linearGradient>
          </defs>

          {/* Pipe segments between sensors */}
          {[
            { x1: 0,   x2: 80,  active: prediction === "leak_near_A" },
            { x1: 80,  x2: 300, active: prediction === "leak_near_A" || prediction === "leak_near_B" },
            { x1: 300, x2: 520, active: prediction === "leak_near_B" || prediction === "leak_near_C" },
            { x1: 520, x2: 600, active: prediction === "leak_near_C" },
          ].map((seg, i) => (
            <g key={i}>
              <rect
                x={seg.x1}
                y={70}
                width={seg.x2 - seg.x1}
                height={20}
                fill="url(#pipeFill)"
                stroke="hsl(var(--border))"
                strokeWidth={1}
              />
              {seg.active && (
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  x={seg.x1}
                  y={70}
                  width={seg.x2 - seg.x1}
                  height={20}
                  fill="url(#leakGlow)"
                />
              )}
            </g>
          ))}

          {/* End caps */}
          <rect x={0}   y={66} width={6} height={28} fill="hsl(var(--border))" />
          <rect x={594} y={66} width={6} height={28} fill="hsl(var(--border))" />

          {/* Sensors */}
          {sensors.map((s) => {
            const isLeak = prediction === s.pred;
            return (
              <g key={s.id}>
                {/* connecting stem */}
                <line x1={s.cx} y1={50} x2={s.cx} y2={70} stroke="hsl(var(--border))" strokeWidth={1.5} />

                {/* Outer pulse ring on alert */}
                {isLeak && (
                  <motion.circle
                    cx={s.cx} cy={36} r={20}
                    fill="none"
                    stroke="hsl(var(--error))"
                    strokeWidth={1.5}
                    initial={{ opacity: 0.8, r: 18 }}
                    animate={{ opacity: 0, r: 36 }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <circle
                  cx={s.cx} cy={36} r={14}
                  fill="hsl(var(--surface))"
                  stroke={isLeak ? "hsl(var(--error))" : "hsl(var(--primary))"}
                  strokeWidth={1.5}
                />
                <circle
                  cx={s.cx} cy={36} r={5}
                  fill={isLeak ? "hsl(var(--error))" : "hsl(var(--primary))"}
                  className={isLeak ? "animate-signal" : ""}
                />
                <text
                  x={s.cx} y={120}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize={11}
                  fill={isLeak ? "hsl(var(--error))" : "hsl(var(--muted-foreground))"}
                  letterSpacing={2}
                >
                  SENSOR {s.id}
                </text>
                <text
                  x={s.cx} y={138}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize={9}
                  fill="hsl(var(--muted-foreground) / 0.6)"
                  letterSpacing={1}
                >
                  {s.cx === 80 ? "0m" : s.cx === 300 ? "300m" : "600m"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
