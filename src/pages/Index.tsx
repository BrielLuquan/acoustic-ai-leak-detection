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
} from "@/lib/supabaseClient";

const HISTORY_LIMIT = 10;

export default function Index() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [busy, setBusy] = useState(false);
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
      // 42P01 = relation does not exist
      if (error.code === "42P01" || /sensor_data/i.test(error.message)) {
        setSetupError("The sensor_data table was not found in your Supabase project.");
      } else {
        setSetupError(error.message);
      }
      return;
    }
    setSetupError(null);
    setReadings((data ?? []) as SensorReading[]);
  }, []);

  useEffect(() => {
    fetchHistory();

    const channel = supabase
      .channel("sensor_data:realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sensor_data" },
        (payload) => {
          const row = payload.new as SensorReading;
          setReadings((prev) => [row, ...prev].slice(0, HISTORY_LIMIT));
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
      const prediction = predictLeak(a, b, c);
      try {
        const { data, error } = await supabase
          .from("sensor_data")
          .insert({ sensorA: a, sensorB: b, sensorC: c, prediction })
          .select()
          .single();

        if (error) {
          if (error.code === "42P01" || /sensor_data/i.test(error.message)) {
            setSetupError("The sensor_data table was not found in your Supabase project.");
            toast.error("Setup required", { description: "Create the sensor_data table first." });
          } else {
            toast.error("Failed to save reading", { description: error.message });
          }
          return;
        }

        // Optimistic prepend (realtime will dedupe via id check)
        if (data) {
          setReadings((prev) => {
            if (prev.find((r) => r.id === data.id)) return prev;
            return [data as SensorReading, ...prev].slice(0, HISTORY_LIMIT);
          });
        }
        toast.success(
          prediction === "normal" ? "System normal" : `Leak detected: ${prediction.replace("leak_near_", "Sensor ")}`
        );
      } finally {
        setBusy(false);
      }
    },
    []
  );

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

        {/* Top: alert + pipe diagram */}
        <div className="grid gap-6 lg:grid-cols-5">
          <Section className="lg:col-span-2">
            <LeakAlert prediction={prediction} />
          </Section>
          <Section className="lg:col-span-3">
            <PipeDiagram prediction={prediction} />
          </Section>
        </div>

        {/* Sensor row */}
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

        {/* Bottom: simulation + history */}
        <div className="grid gap-6 lg:grid-cols-5">
          <Section className="lg:col-span-2">
            <SimulationPanel onSubmit={handleSubmit} busy={busy} />
          </Section>
          <Section className="lg:col-span-3">
            <HistoryPanel readings={readings} />
          </Section>
        </div>

        <footer className="pt-4 pb-8 flex items-center justify-between text-[11px] text-muted-foreground tracking-[0.14em] uppercase font-mono">
          <span>© Acoustic AI · v1.0.0</span>
          <span>Model ACX-1 · Inference latency &lt; 50ms</span>
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
