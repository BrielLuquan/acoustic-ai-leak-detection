import pandas as pd
from sklearn.model_selection import train_test_split

df = pd.read_csv("iot_data.csv")

X = df[["A", "B", "C"]]
y = df["leak_position"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)