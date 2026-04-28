from sklearn.ensemble import RandomForestRegressor

model = RandomForestRegressor(
    n_estimators=200,
    max_depth=12,
    random_state=42
)

model.fit(X_train, y_train)
from sklearn.metrics import mean_absolute_error, r2_score

preds = model.predict(X_test)

print("MAE:", mean_absolute_error(y_test, preds))
print("R2 Score:", r2_score(y_test, preds))

import joblib

joblib.dump(model, "../model/leak_model.pkl")

print("Model saved successfully")