import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hzjyujafbwfbjhggvhgv.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6anl1amFmYndmYmpoZ2d2aGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMzkzOTcsImV4cCI6MjA5MjgxNTM5N30.PP6-LX1JbZ1l_iBHoHLIbUkqgEWaYc3VQnSe60roBqk";

export type Prediction =
  | "normal"
  | "leak_near_A"
  | "leak_near_B"
  | "leak_near_C";

export interface SensorReading {
  id: number;
  sensorA: number;
  sensorB: number;
  sensorC: number;
  prediction: Prediction;
  distance_m: number | null;
  created_at: string;
}

export interface LeakEvent {
  id: number;
  reading_id: number | null;
  prediction: Prediction;
  distance_m: number | null;
  location_label: string;
  confidence: number;
  status: "open" | "resolved";
  detected_at: string;
  resolved_at: string | null;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// Re-export for convenience
export { predictLeak, ruleBasedPredict } from "./predictor";
export type { PredictionResult, SensorInput, LeakClass } from "./predictor";
