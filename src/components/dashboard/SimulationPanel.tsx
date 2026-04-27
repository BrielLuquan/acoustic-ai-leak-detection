import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onSubmit: (a: number, b: number, c: number) => Promise<void>;
  busy?: boolean;
}

export function SimulationPanel({ onSubmit, busy }: Props) {
  const [a, setA] = useState("42");
  const [b, setB] = useState("38");
  const [c, setC] = useState("45");
  const [error, setError] = useState<string | null>(null);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const na = parseFloat(a), nb = parseFloat(b), nc = parseFloat(c);
    if ([na, nb, nc].some((v) => Number.isNaN(v) || v < 0)) {
      setError("Sensor values must be non-negative numbers.");
      return;
    }
    await onSubmit(na, nb, nc);
  }

  function randomize() {
    setA((Math.random() * 80 + 10).toFixed(1));
    setB((Math.random() * 80 + 10).toFixed(1));
    setC((Math.random() * 80 + 10).toFixed(1));
  }

  function injectLeak() {
    const ch = ["A", "B", "C"][Math.floor(Math.random() * 3)] as "A" | "B" | "C";
    const high = (Math.random() * 20 + 75).toFixed(1);
    const low1 = (Math.random() * 20 + 15).toFixed(1);
    const low2 = (Math.random() * 20 + 15).toFixed(1);
    if (ch === "A") { setA(high); setB(low1); setC(low2); }
    if (ch === "B") { setB(high); setA(low1); setC(low2); }
    if (ch === "C") { setC(high); setA(low1); setB(low2); }
  }

  return (
    <form onSubmit={handle} className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="status-dot bg-secondary animate-signal" />
          <span className="panel-title">Simulation · Manual Input</span>
        </div>
        <button type="button" onClick={randomize} className="data-label hover:text-primary transition-colors">
          ⟳ RANDOMIZE
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Sensor A", val: a, set: setA },
          { label: "Sensor B", val: b, set: setB },
          { label: "Sensor C", val: c, set: setC },
        ].map((f) => (
          <div key={f.label}>
            <Label className="data-label">{f.label}</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={f.val}
              onChange={(e) => f.set(e.target.value)}
              className="mt-1.5 h-11 bg-surface-alt border-border font-mono text-foreground tabular-nums focus-visible:ring-primary/40"
            />
          </div>
        ))}
      </div>

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs text-error">
          {error}
        </motion.p>
      )}

      <div className="mt-5 flex gap-2">
        <Button
          type="submit"
          disabled={busy}
          className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-hover))] font-semibold tracking-wide transition-all active:scale-[0.98]"
        >
          {busy ? "PROCESSING…" : "SIMULATE READING"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={injectLeak}
          className="h-11 border-error/40 bg-error/[0.06] text-error hover:bg-error/10 hover:text-error tracking-wide"
        >
          ⚠ INJECT LEAK
        </Button>
      </div>
    </form>
  );
}
