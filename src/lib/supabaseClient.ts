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
  created_at: string;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export function predictLeak(
  a: number,
  b: number,
  c: number
): Prediction {
  const max = Math.max(a, b, c);
  // Treat as "normal" when readings are low or near-equal (within 8% spread)
  const min = Math.min(a, b, c);
  const spread = max === 0 ? 0 : (max - min) / max;
  if (spread < 0.08) return "normal";
  if (max === a) return "leak_near_A";
  if (max === b) return "leak_near_B";
  return "leak_near_C";
}
