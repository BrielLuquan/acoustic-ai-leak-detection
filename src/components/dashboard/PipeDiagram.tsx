import { motion } from "framer-motion";
import type { Prediction } from "@/lib/supabaseClient";
import { pipeLength, sensorPositions, type PipeGeometry } from "@/lib/pipeConfig";

interface Props {
  prediction: Prediction | null;
  distanceM: number | null;
  geometry: PipeGeometry;
}

const X_LEFT = 80;
const X_RIGHT = 520;

export function PipeDiagram({ prediction, distanceM, geometry }: Props) {
  const span = pipeLength(geometry);
  const pos = sensorPositions(geometry);

  function metersToX(m: number) {
    const ratio = span === 0 ? 0 : Math.max(0, Math.min(1, m / span));
    return X_LEFT + ratio * (X_RIGHT - X_LEFT);
  }

  const sensors: { id: "A" | "B" | "C"; cx: number; pred: Prediction; meters: number }[] = [
    { id: "A", cx: metersToX(pos.A), pred: "leak_near_A", meters: pos.A },
    { id: "B", cx: metersToX(pos.B), pred: "leak_near_B", meters: pos.B },
    { id: "C", cx: metersToX(pos.C), pred: "leak_near_C", meters: pos.C },
  ];

  const isLeak = prediction && prediction !== "normal";
  const leakX = isLeak && distanceM != null ? metersToX(distanceM) : null;

  // Tick count proportional to span, capped to keep diagram readable
  const tickCount = Math.min(13, Math.max(5, Math.round(span) + 1));
  const ticks = Array.from({ length: tickCount }).map((_, i) => {
    const m = (i * span) / (tickCount - 1);
    return { x: metersToX(m), m };
  });

  return (
    <div className="panel relative">
      <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-foreground/30" />
      <span className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-foreground/30" />
      <span className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-foreground/30" />
      <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-foreground/30" />

      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="status-dot bg-primary animate-signal" />
          <span className="panel-title">Pipeline Topology · Mission Sector-07</span>
        </div>
        <span className="data-label tabular-nums">SPAN {span.toFixed(2)}m · 3 NODES</span>
      </div>

      <div className="relative w-full mx-auto max-w-[640px]">
        <svg viewBox="0 0 600 180" className="w-full h-auto max-h-[220px]" preserveAspectRatio="xMidYMid meet">
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

          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x} x2={t.x}
              y1={104} y2={i % 3 === 0 ? 112 : 108}
              stroke="hsl(var(--muted-foreground) / 0.4)"
              strokeWidth={1}
            />
          ))}

          {[
            { x1: 0,                  x2: sensors[0].cx, active: prediction === "leak_near_A" },
            { x1: sensors[0].cx,      x2: sensors[1].cx, active: prediction === "leak_near_A" || prediction === "leak_near_B" },
            { x1: sensors[1].cx,      x2: sensors[2].cx, active: prediction === "leak_near_B" || prediction === "leak_near_C" },
            { x1: sensors[2].cx,      x2: 600,           active: prediction === "leak_near_C" },
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

          <rect x={0}   y={66} width={6} height={28} fill="hsl(var(--border))" />
          <rect x={594} y={66} width={6} height={28} fill="hsl(var(--border))" />

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
                  {s.meters.toFixed(2)}m
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
