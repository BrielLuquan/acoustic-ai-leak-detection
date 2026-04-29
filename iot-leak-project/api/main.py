from fastapi import FastAPI, WebSocket
import joblib
import numpy as np
import json
import os

app = FastAPI()

# Load model safely
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "model", "leak_model.pkl")
model = joblib.load(MODEL_PATH)

@app.get("/")
def test():
    return {"status": "API working"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    while True:
        data = await websocket.receive_text()
        data = json.loads(data)

        # 🔥 NEW: multi-sensor input
        A = data["A"]
        B = data["B"]
        C = data["C"]

        X = np.array([[A, B, C]])
        prediction = model.predict(X)[0]

        # 🔥 Convert to meaningful message
        sensors = [0, 300, 600]
        nearest_sensor_index = np.argmin([abs(prediction - s) for s in sensors])
        sensor_names = ["A", "B", "C"]
        nearest_sensor = sensor_names[nearest_sensor_index]

        distance_from_sensor = abs(prediction - sensors[nearest_sensor_index])

        result = {
            "leak_position_m": round(float(prediction), 2),
            "nearest_sensor": nearest_sensor,
            "distance_from_sensor_m": round(distance_from_sensor, 2)
        }

        await websocket.send_text(json.dumps(result))
