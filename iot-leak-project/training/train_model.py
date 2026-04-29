import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

# 🔹 STEP 1: Load dataset
df = pd.read_csv("../data/iot_data.csv")

# 🔹 STEP 2: Features and target
X = df[["A", "B", "C"]]
y = df["leak_position"]

# 🔹 STEP 3: Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 🔹 STEP 4: Train model
model = RandomForestRegressor(
    n_estimators=200,
    max_depth=12,
    random_state=42
)

model.fit(X_train, y_train)

# 🔹 STEP 5: Evaluate
preds = model.predict(X_test)

print("MAE:", mean_absolute_error(y_test, preds))
print("R2 Score:", r2_score(y_test, preds))

# 🔹 STEP 6: Save model
joblib.dump(model, "../model/leak_model.pkl")

print("Model saved successfully")