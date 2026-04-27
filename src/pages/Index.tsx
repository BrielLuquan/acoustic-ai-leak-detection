import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/dashboard/Header";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { LeakAlert } from "@/components/dashboard/LeakAlert";
import { PipeDiagram } from "@/components/dashboard/PipeDiagram";
import { SimulationPanel } from "@/components/dashboard/SimulationPanel";
import { HistoryPanel } from "@/components/dashboard/HistoryPanel";
import { SetupNotice } from "@/components/dashboard/SetupNotice";
import { toast } from "sonner";
import {
  supabase,
  predictLeak,
  type SensorReading,
  type Prediction,
  type PredictionResult,
  type LeakEvent,
} from "@/lib/supabaseClient";

const HISTORY_LIMIT = 10;

export default function Index() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [activeEvent, setActiveEvent] = useState<LeakEvent | null>(null);
  const [lastResult, setLastResult] = useState<PredictionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const latest = readings[0];
  const prediction: Prediction | null = latest?.prediction ?? null;

  const fetchHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from("sensor_data")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);
    if (error) {
      if (error.code === "42P01" || /sensor_data/i.test(error.message)) {
        setSetupError("The sensor_data / leak_events tables were not found in your Supabase project.");
      } else {
        setSetupError(error.message);
      }
      return;
    }
    setSetupError(null);
    setReadings((data ?? []) as SensorReading[]);

    // Load most recent open leak (best effort; ignore if table missing)
    const { data: ev } = await supabase
      .from("leak_events")
      .select("*")
      .eq("status", "open")
      .order("detected_at", { ascending: false })
      .limit(1);
    if (ev && ev.length > 0) setActiveEvent(ev[0] as LeakEvent);
    else setActiveEvent(null);
  }, []);

  useEffect(() => {
    fetchHistory();

    const channel = supabase
      .channel("acoustic:realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sensor_data" },
        (payload) => {
          const row = payload.new as SensorReading;
          setReadings((prev) => {
            if (prev.find((r) => r.id === row.id)) return prev;
            return [row, ...prev].slice(0, HISTORY_LIMIT);
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leak_events" },
        (payload) => {
          const row = (payload.new ?? payload.old) as LeakEvent;
          if (!row) return;
          if (payload.eventType === "INSERT" && row.status === "open") {
            setActiveEvent(row);
          } else if (
            payload.eventType === "UPDATE" &&
            (row as LeakEvent).status === "resolved"
          ) {
            setActiveEvent((cur) => (cur && cur.id === row.id ? null : cur));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchHistory]);

  const handleSubmit = useCallback(
    async (a: number, b: number, c: number) => {
      setBusy(true);
      try {
        const result = await predictLeak({ sensorA: a, sensorB: b, sensorC: c });
        setLastResult(result);

        const { data, error } = await supabase
          .from("sensor_data")
          .insert({
            sensorA: a,
            sensorB: b,
            sensorC: c,
            prediction: result.prediction,
            distance_m: result.distance_m,
          })
          .select()
          .single();

        if (error) {
          if (error.code === "42P01" || /sensor_data/i.test(error.message)) {
            setSetupError("The sensor_data / leak_events tables were not found in your Supabase project.");
            toast.error("Setup required", { description: "Run the SQL setup script first." });
          } else {
            toast.error("Failed to save reading", { description: error.message });
          }
          return;
        }

        if (data) {
          setReadings((prev) => {
            if (prev.find((r) => r.id === data.id)) return prev;
            return [data as SensorReading, ...prev].slice(0, HISTORY_LIMIT);
          });
        }

        // Open a leak event when a leak is detected and no active one exists
        if (result.prediction !== "normal") {
          if (!activeEvent) {
            const { data: ev, error: evErr } = await supabase
              .from("leak_events")
              .insert({
                reading_id: data?.id ?? null,
                prediction: result.prediction,
                distance_m: result.distance_m,
                location_label: result.location_label,
                confidence: result.confidence,
                status: "open",
              })
              .select()
              .single();
            if (!evErr && ev) setActiveEvent(ev as LeakEvent);
          }
          toast.error("Leak detected", { description: result.location_label });
        } else {
          toast.success("System normal", {
            description: `Confidence ${(result.confidence * 100).toFixed(0)}%`,
          });
        }
      } finally {
        setBusy(false);
      }
    },
    [activeEvent]
  );

  const handleConfirmFix = useCallback(async () => {
    if (!activeEvent) return;
    setResolving(true);
    try {
      const { error } = await supabase
        .from("leak_events")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", activeEvent.id);
      if (error) {
        toast.error("Failed to confirm fix", { description: error.message });
        return;
      }
      setActiveEvent(null);
      toast.success("Leak resolved", {
        description: `Incident #${activeEvent.id} marked as fixed.`,
      });
    } finally {
      setResolving(false);
    }
  }, [activeEvent]);

  const headerStatus = useMemo<"live" | "normal" | "leak">(() => {
    if (!latest) return "live";
    return latest.prediction === "normal" ? "normal" : "leak";
  }, [latest]);

  const lastUpdate = latest
    ? new Date(latest.created_at).toLocaleTimeString([], { hour12: false })
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header status={headerStatus} lastUpdate={lastUpdate} />

      <motion.main
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
        }}
        className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 space-y-6"
      >
        <Section><SetupNotice open={!!setupError} message={setupError ?? ""} /></Section>

        <div className="grid gap-6 lg:grid-cols-5">
          <Section className="lg:col-span-2">
            <LeakAlert
              prediction={prediction}
              result={lastResult}
              activeEvent={activeEvent}
              onConfirmFix={handleConfirmFix}
              resolving={resolving}
            />
          </Section>
          <Section className="lg:col-span-3">
            <PipeDiagram prediction={prediction} distanceM={lastResult?.distance_m ?? null} />
          </Section>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Section>
            <SensorCard
              label="Sensor A · Upstream"
              channel="A"
              value={latest?.sensorA ?? 0}
              isLeakSource={prediction === "leak_near_A"}
            />
          </Section>
          <Section>
            <SensorCard
              label="Sensor B · Midline"
              channel="B"
              value={latest?.sensorB ?? 0}
              isLeakSource={prediction === "leak_near_B"}
            />
          </Section>
          <Section>
            <SensorCard
              label="Sensor C · Downstream"
              channel="C"
              value={latest?.sensorC ?? 0}
              isLeakSource={prediction === "leak_near_C"}
            />
          </Section>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Section className="lg:col-span-2">
            <SimulationPanel onSubmit={handleSubmit} busy={busy} />
          </Section>
          <Section className="lg:col-span-3">
            <HistoryPanel readings={readings} />
          </Section>
        </div>

        <footer className="pt-4 pb-8 flex items-center justify-between text-[11px] text-muted-foreground tracking-[0.14em] uppercase font-mono">
          <span>© Acoustic AI · v1.1.0</span>
          <span>
            {lastResult?.source === "ml_model" ? "Model RFR-1 · Python ML" : "Model ACX-1 · Heuristic fallback"}
            {" · Inference < 50ms"}
          </span>
        </footer>
      </motion.main>
    </div>
  );
}

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
