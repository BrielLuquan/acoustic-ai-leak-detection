import { motion } from "framer-motion";
import type { Prediction } from "@/lib/supabaseClient";

interface Props {
  prediction: Prediction | null;
  distanceM: number | null;
}

const PIPE_LENGTH_M = 600;
const sensors: { id: "A" | "B" | "C"; cx: number; pred: Prediction; meters: number }[] = [
  { id: "A", cx: 80,  pred: "leak_near_A", meters: 0 },
  { id: "B", cx: 300, pred: "leak_near_B", meters: 300 },
  { id: "C", cx: 520, pred: "leak_near_C", meters: 600 },
];

function metersToX(m: number) {
  // pipe spans visually from x=80 (sensor A, 0m) to x=520 (sensor C, 600m)
  const ratio = Math.max(0, Math.min(1, m / PIPE_LENGTH_M));
  return 80 + ratio * (520 - 80);
}

export function PipeDiagram({ prediction, distanceM }: Props) {
  const isLeak = prediction && prediction !== "normal";
  const leakX = isLeak && distanceM != null ? metersToX(distanceM) : null;

  return (
    <div className="panel relative">
      {/* HUD corner brackets */}
      <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-foreground/30" />
      <span className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-foreground/30" />
      <span className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-foreground/30" />
      <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-foreground/30" />

      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="status-dot bg-primary animate-signal" />
          <span className="panel-title">Pipeline Topology · Mission Sector-07</span>
        </div>
        <span className="data-label">SPAN 600m · 3 NODES</span>
      </div>

      <div className="relative w-full">
        <svg viewBox="0 0 600 180" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
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

          {/* Distance ticks */}
          {Array.from({ length: 13 }).map((_, i) => {
            const x = 80 + (i * (520 - 80)) / 12;
            return (
              <line
                key={i}
                x1={x} x2={x}
                y1={104} y2={i % 3 === 0 ? 112 : 108}
                stroke="hsl(var(--muted-foreground) / 0.4)"
                strokeWidth={1}
              />
            );
          })}

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

          {/* Precise leak marker (from ML distance) */}
          {leakX != null && (
            <g>
              <motion.line
                x1={leakX} x2={leakX}
                y1={50} y2={110}
                stroke="hsl(var(--error))"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <motion.circle
                cx={leakX} cy={80} r={6}
                fill="hsl(var(--error))"
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.6, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <text
                x={leakX} y={46}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize={10}
                fill="hsl(var(--error))"
                letterSpacing={1}
              >
                ▼ {distanceM?.toFixed(2)}m
              </text>
            </g>
          )}

          {/* Sensors */}
          {sensors.map((s) => {
            const isHot = prediction === s.pred;
            return (
              <g key={s.id}>
                <line x1={s.cx} y1={50} x2={s.cx} y2={70} stroke="hsl(var(--border))" strokeWidth={1.5} />
                {isHot && (
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
                  stroke={isHot ? "hsl(var(--error))" : "hsl(var(--primary))"}
                  strokeWidth={1.5}
                />
                <circle
                  cx={s.cx} cy={36} r={5}
                  fill={isHot ? "hsl(var(--error))" : "hsl(var(--primary))"}
                  className={isHot ? "animate-signal" : ""}
                />
                <text
                  x={s.cx} y={132}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize={11}
                  fill={isHot ? "hsl(var(--error))" : "hsl(var(--muted-foreground))"}
                  letterSpacing={2}
                >
                  SENSOR {s.id}
                </text>
                <text
                  x={s.cx} y={148}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize={9}
                  fill="hsl(var(--muted-foreground) / 0.7)"
                  letterSpacing={1}
                >
                  {s.meters}m
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
