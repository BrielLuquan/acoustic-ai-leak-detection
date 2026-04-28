import numpy as np
import joblib

model = joblib.load("../model/leak_model.pkl")

sample = np.array([[0.8, 0.3, 0.1]])

prediction = model.predict(sample)

print("Estimated leak position:", prediction[0])