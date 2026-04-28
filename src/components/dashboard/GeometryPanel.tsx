import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  DEFAULT_GEOMETRY,
  pipeLength,
  usePipeGeometry,
  type PipeGeometry,
} from "@/lib/pipeConfig";

export function GeometryPanel() {
  const [geo, setGeo] = usePipeGeometry();
  const [ab, setAb] = useState(String(geo.ab));
  const [bc, setBc] = useState(String(geo.bc));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAb(String(geo.ab));
    setBc(String(geo.bc));
  }, [geo.ab, geo.bc]);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const nab = parseFloat(ab);
    const nbc = parseFloat(bc);
    if ([nab, nbc].some((v) => Number.isNaN(v) || v <= 0)) {
      setError("Distances must be positive numbers (meters).");
      return;
    }
    if (nab > 10000 || nbc > 10000) {
      setError("Each segment must be ≤ 10,000 m.");
      return;
    }
    const next: PipeGeometry = { ab: nab, bc: nbc };
    setGeo(next);
    toast.success("Geometry updated", {
      description: `Pipe span ${pipeLength(next).toFixed(2)} m`,
    });
  }

  function reset() {
    setGeo(DEFAULT_GEOMETRY);
    toast.success("Geometry reset to defaults");
  }

  const total = (parseFloat(ab) || 0) + (parseFloat(bc) || 0);

  return (
    <form onSubmit={apply} className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="status-dot bg-primary animate-signal" />
          <span className="panel-title">Pipe Geometry · Sensor Layout</span>
        </div>
        <span className="data-label tabular-nums">
          SPAN {total.toFixed(2)}m
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
        Configure real-world spacing between acoustic sensors. Sensor A is the
        upstream reference (0 m). Leak distance estimates use these values.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="data-label">A → B (meters)</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={ab}
            onChange={(e) => setAb(e.target.value)}
            className="mt-1.5 h-11 bg-surface-alt border-border font-mono text-foreground tabular-nums focus-visible:ring-primary/40"
          />
        </div>
        <div>
          <Label className="data-label">B → C (meters)</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={bc}
            onChange={(e) => setBc(e.target.value)}
            className="mt-1.5 h-11 bg-surface-alt border-border font-mono text-foreground tabular-nums focus-visible:ring-primary/40"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-error">{error}</p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] font-mono text-muted-foreground tabular-nums">
        <div className="rounded border border-border/60 bg-surface-alt/40 px-2 py-1.5">
          <div className="data-label text-[9px]">A POS</div>
          <div className="text-foreground">0.00 m</div>
        </div>
        <div className="rounded border border-border/60 bg-surface-alt/40 px-2 py-1.5">
          <div className="data-label text-[9px]">B POS</div>
          <div className="text-foreground">{(parseFloat(ab) || 0).toFixed(2)} m</div>
        </div>
        <div className="rounded border border-border/60 bg-surface-alt/40 px-2 py-1.5">
          <div className="data-label text-[9px]">C POS</div>
          <div className="text-foreground">{total.toFixed(2)} m</div>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button
          type="submit"
          className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-hover))] font-semibold tracking-wide transition-all active:scale-[0.98]"
        >
          APPLY GEOMETRY
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={reset}
          className="h-11 border-border tracking-wide"
        >
          RESET
        </Button>
      </div>
    </form>
  );
}
