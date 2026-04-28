import joblib
import numpy as np

data = joblib.load("model.joblib")
model = data["model"]

def predict(sensorA, sensorB, sensorC):
    X = np.array([[sensorA, sensorB, sensorC]])
    result = model.predict(X)[0]
    return round(result, 2)

# test
print(predict(300, 120, 100))