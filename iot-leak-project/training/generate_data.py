import numpy as np
import pandas as pd
import os

np.random.seed(42)

N = 5000

leak_position = np.random.uniform(0, 600, N)

sensor_A = []
sensor_B = []
sensor_C = []

def signal_strength(distance):
    return np.exp(-distance / 120) + np.random.normal(0, 0.02)

for pos in leak_position:
    sensor_A.append(signal_strength(abs(pos - 0)))
    sensor_B.append(signal_strength(abs(pos - 300)))
    sensor_C.append(signal_strength(abs(pos - 600)))

df = pd.DataFrame({
    "A": sensor_A,
    "B": sensor_B,
    "C": sensor_C,
    "leak_position": leak_position
})

# create data folder if it doesn't exist
os.makedirs("../data", exist_ok=True)

df.to_csv("../data/iot_data.csv", index=False)

print("Dataset created at ../data/iot_data.csv")