/**
 * Modular leak predictor.
 *
 * Strategy:
 *   1. If a Supabase Edge Function is deployed at `predict-leak`, call it.
 *      The edge function should proxy to your real ML service
 *      (Python FastAPI / Flask exposing RandomForestRegressor or LSTM).
 *   2. Otherwise fall back to a deterministic rule-based heuristic
 *      that mimics the contract of the real model: leak class +
 *      estimated distance from the upstream sensor (Sensor A).
 *
 * The contract returned by either path is identical so the rest of
 * the app does not care which backend produced the result.
 */

import { supabase } from "./supabaseClient";

export type LeakClass =
  | "normal"
  | "leak_near_A"
  | "leak_near_B"
  | "leak_near_C";

export interface SensorInput {
  sensorA: number;
  sensorB: number;
  sensorC: number;
}

export interface PredictionResult {
  prediction: LeakClass;
  /** Estimated distance of the leak from sensor A, meters. null when normal. */
  distance_m: number | null;
  /** Human readable e.g. "10.54m from A". */
  location_label: string;
  /** Confidence 0-1 reported by the model (or heuristic). */
  confidence: number;
  /** Where the prediction came from. */
  source: "ml_model" | "rule_based";
}

/* ---------- Rule-based fallback (mirrors the ML contract) ---------- */

const PIPE_LENGTH_M = 600;
const SENSOR_POS_M: Record<"A" | "B" | "C", number> = { A: 0, B: 300, C: 600 };

export function ruleBasedPredict(input: SensorInput): PredictionResult {
  const { sensorA: a, sensorB: b, sensorC: c } = input;
  const max = Math.max(a, b, c);
  const min = Math.min(a, b, c);
  const spread = max === 0 ? 0 : (max - min) / max;

  if (spread < 0.08) {
    return {
      prediction: "normal",
      distance_m: null,
      location_label: "Pipeline nominal",
      confidence: 0.5 + (1 - spread) * 0.4,
      source: "rule_based",
    };
  }

  // Localize: weighted centroid biased toward the loudest sensor.
  const weights = [a, b, c];
  const positions = [SENSOR_POS_M.A, SENSOR_POS_M.B, SENSOR_POS_M.C];
  const total = weights.reduce((s, w) => s + w, 0) || 1;
  const distance = weights.reduce((s, w, i) => s + (w / total) * positions[i], 0);
  const clamped = Math.max(0, Math.min(PIPE_LENGTH_M, distance));

  let cls: LeakClass = "leak_near_B";
  if (max === a) cls = "leak_near_A";
  else if (max === c) cls = "leak_near_C";

  const nearest =
    cls === "leak_near_A" ? "A" : cls === "leak_near_C" ? "C" : "B";

  return {
    prediction: cls,
    distance_m: Number(clamped.toFixed(2)),
    location_label: `${clamped.toFixed(2)}m from A · nearest sensor ${nearest}`,
    confidence: Math.min(0.99, 0.6 + spread * 0.4),
    source: "rule_based",
  };
}

/* ---------- ML edge-function path ---------- */

let mlAvailable: boolean | null = null;

/**
 * Calls the deployed `predict-leak` Supabase Edge Function.
 * Returns null if the function is unavailable, so callers can fall back.
 */
async function callMLModel(input: SensorInput): Promise<PredictionResult | null> {
  if (mlAvailable === false) return null;
  try {
    const { data, error } = await supabase.functions.invoke("predict-leak", {
      body: input,
    });
    if (error) {
      mlAvailable = false;
      return null;
    }
    if (!data || typeof data.prediction !== "string") return null;
    mlAvailable = true;
    return {
      prediction: data.prediction as LeakClass,
      distance_m:
        typeof data.distance_m === "number" ? data.distance_m : null,
      location_label:
        data.location_label ??
        (data.distance_m != null ? `${data.distance_m}m from A` : "Pipeline nominal"),
      confidence: typeof data.confidence === "number" ? data.confidence : 0.8,
      source: "ml_model",
    };
  } catch {
    mlAvailable = false;
    return null;
  }
}

/**
 * Public entry point. Tries ML first, falls back to heuristic.
 */
export async function predictLeak(input: SensorInput): Promise<PredictionResult> {
  const ml = await callMLModel(input);
  if (ml) return ml;
  return ruleBasedPredict(input);
}
