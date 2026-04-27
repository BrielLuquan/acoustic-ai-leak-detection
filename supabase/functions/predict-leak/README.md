# predict-leak edge function

Acoustic leak prediction proxy. Forwards sensor readings to a Python ML service
(RandomForestRegressor / LSTM exposed via FastAPI or Flask) and falls back to a
rule-based heuristic when the ML service is unavailable.

## Reference Python service

```python
# server.py
from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.ensemble import RandomForestRegressor
import numpy as np, joblib, os

PIPE_LENGTH_M = 600.0
app = FastAPI()

# Load a trained model produced by train.py
model: RandomForestRegressor = joblib.load(os.getenv("MODEL_PATH", "model.joblib"))

class Reading(BaseModel):
    sensorA: float
    sensorB: float
    sensorC: float

@app.post("/predict")
def predict(r: Reading):
    X = np.array([[r.sensorA, r.sensorB, r.sensorC]])
    distance = float(model.predict(X)[0])  # meters from sensor A
    distance = max(0.0, min(PIPE_LENGTH_M, distance))

    spread = (max(r.sensorA, r.sensorB, r.sensorC) - min(r.sensorA, r.sensorB, r.sensorC))
    spread /= max(r.sensorA, r.sensorB, r.sensorC) or 1.0
    if spread < 0.08:
        return {"prediction": "normal", "distance_m": None,
                "location_label": "Pipeline nominal", "confidence": 0.9}

    nearest = "A" if distance < 150 else "C" if distance > 450 else "B"
    return {
        "prediction": f"leak_near_{nearest}",
        "distance_m": round(distance, 2),
        "location_label": f"{distance:.2f}m from A",
        "confidence": min(0.99, 0.6 + spread * 0.4),
    }
```

```python
# train.py — RandomForestRegressor on synthetic acoustic data
from sklearn.ensemble import RandomForestRegressor
import numpy as np, joblib

rng = np.random.default_rng(7)
N = 5000
distances = rng.uniform(0, 600, N)            # ground truth leak position
positions = np.array([0, 300, 600])

# Inverse-distance acoustic intensity model + noise
def synth(d):
    base = 100.0 / (1.0 + 0.04 * np.abs(positions - d))
    return base + rng.normal(0, 2.0, 3)

X = np.array([synth(d) for d in distances])
y = distances
model = RandomForestRegressor(n_estimators=200, max_depth=12, random_state=7).fit(X, y)
joblib.dump(model, "model.joblib")
```

Run `uvicorn server:app --host 0.0.0.0 --port 8000` and set the public URL as
`ML_API_URL` in Supabase secrets.
