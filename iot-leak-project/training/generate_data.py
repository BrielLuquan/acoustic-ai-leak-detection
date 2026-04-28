import numpy as np
import pandas as pd

np.random.seed(42)

N = 5000  # dataset size

# Simulated leak position (0m to 600m pipeline)
leak_position = np.random.uniform(0, 600, N)

# 3 sensors placed along pipeline
sensor_A = np.zeros(N)
sensor_B = np.zeros(N)
sensor_C = np.zeros(N)

# distance-based signal attenuation model
def signal_strength(distance):
    return np.exp(-distance / 120) + np.random.normal(0, 0.02)

for i in range(N):
    pos = leak_position[i]

    sensor_A[i] = signal_strength(abs(pos - 0))
    sensor_B[i] = signal_strength(abs(pos - 300))
    sensor_C[i] = signal_strength(abs(pos - 600))

df = pd.DataFrame({
    "A": sensor_A,
    "B": sensor_B,
    "C": sensor_C,
    "leak_position": leak_position
})

df.to_csv("iot_data.csv", index=False)

print("Dataset created")