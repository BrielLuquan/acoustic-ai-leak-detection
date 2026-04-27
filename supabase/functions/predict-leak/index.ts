// Supabase Edge Function: predict-leak
//
// Proxies sensor readings to an external Python ML service
// (FastAPI / Flask hosting RandomForestRegressor or LSTM).
//
// Deployment:
//   1. Set secret in Supabase:  ML_API_URL = https://your-ml-service/predict
//      (optional)               ML_API_KEY = <bearer-token>
//   2. Deploy:                  supabase functions deploy predict-leak --no-verify-jwt
//
// Expected ML response shape (any of these field names accepted):
//   { prediction: "leak_near_A" | "leak_near_B" | "leak_near_C" | "normal",
//     distance_m: 10.54,          // or "distance" / "location_m"
//     confidence: 0.92,           // optional, 0-1
//     location_label: "10.54m from A" }  // optional

// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PIPE_LENGTH_M = 600;

interface SensorInput {
  sensorA: number;
  sensorB: number;
  sensorC: number;
}

function ruleBasedPredict(input: SensorInput) {
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
  const weights = [a, b, c];
  const positions = [0, 300, 600];
  const total = weights.reduce((s, w) => s + w, 0) || 1;
  const distance = Math.max(
    0,
    Math.min(
      PIPE_LENGTH_M,
      weights.reduce((s, w, i) => s + (w / total) * positions[i], 0),
    ),
  );
  const cls =
    max === a ? "leak_near_A" : max === c ? "leak_near_C" : "leak_near_B";
  const nearest = cls === "leak_near_A" ? "A" : cls === "leak_near_C" ? "C" : "B";
  return {
    prediction: cls,
    distance_m: Number(distance.toFixed(2)),
    location_label: `${distance.toFixed(2)}m from A · nearest sensor ${nearest}`,
    confidence: Math.min(0.99, 0.6 + spread * 0.4),
    source: "rule_based",
  };
}

function normalizeMLResponse(raw: any) {
  const distance =
    typeof raw.distance_m === "number"
      ? raw.distance_m
      : typeof raw.distance === "number"
      ? raw.distance
      : typeof raw.location_m === "number"
      ? raw.location_m
      : null;
  return {
    prediction: raw.prediction ?? "normal",
    distance_m: distance,
    location_label:
      raw.location_label ??
      (distance != null
        ? `${distance.toFixed(2)}m from A`
        : "Pipeline nominal"),
    confidence: typeof raw.confidence === "number" ? raw.confidence : 0.85,
    source: "ml_model",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Partial<SensorInput>;
    const a = Number(body.sensorA);
    const b = Number(body.sensorB);
    const c = Number(body.sensorC);
    if ([a, b, c].some((v) => Number.isNaN(v) || v < 0)) {
      return new Response(
        JSON.stringify({ error: "sensorA, sensorB, sensorC must be non-negative numbers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ML_API_URL = Deno.env.get("ML_API_URL");
    const ML_API_KEY = Deno.env.get("ML_API_KEY");

    if (ML_API_URL) {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (ML_API_KEY) headers.Authorization = `Bearer ${ML_API_KEY}`;
        const upstream = await fetch(ML_API_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({ sensorA: a, sensorB: b, sensorC: c }),
        });
        if (upstream.ok) {
          const raw = await upstream.json();
          const result = normalizeMLResponse(raw);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.warn("ML upstream failed, status:", upstream.status);
      } catch (err) {
        console.warn("ML upstream error:", err);
      }
    }

    // Fallback
    const fallback = ruleBasedPredict({ sensorA: a, sensorB: b, sensorC: c });
    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
