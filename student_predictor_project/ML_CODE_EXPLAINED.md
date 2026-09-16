# Machine Learning Code — Student Exam Performance Predictor

This file explains every piece of ML code used in this project.

---

## 1. Tech Stack (ML Side)

| Library        | Purpose                                  |
|----------------|------------------------------------------|
| scikit-learn   | ML models, cross-validation, scaler      |
| pandas         | CSV loading, data cleaning               |
| numpy          | Array math, random sampling              |
| Flask          | Web server exposing ML as a REST API     |
| gunicorn       | Production WSGI server for Flask         |

---

## 2. Input Features

The model uses 6 input features to predict `final_score`:

| Feature          | Description                          | Range   |
|------------------|--------------------------------------|---------|
| attendance       | % of classes attended                | 0–100   |
| study_hours      | Hours spent studying per week        | 0–40    |
| assignments      | % of assignments completed           | 0–100   |
| quiz_score       | Average quiz score                   | 0–100   |
| participation    | Class participation score            | 0–10    |
| previous_marks   | Marks from previous exam             | 0–100   |

**Target variable:** `final_score` (numeric, 0–100)

---

## 3. Data Preprocessing (app.py — validate_and_clean)

```python
def validate_and_clean(df):
    # 1. Check all required columns exist
    for col in FEATURES + ['final_score']:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    # 2. Keep only the relevant columns
    df = df[FEATURES + ['final_score']].copy()

    # 3. Drop rows with any missing values
    df = df.dropna()

    # 4. Convert all columns to numeric (coerce errors to NaN, then drop)
    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    df = df.dropna()

    return df
```

**Why:** Real-world CSVs often have blank cells or non-numeric values. This ensures the model only trains on clean data.

---

## 4. Feature Scaling (StandardScaler)

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
```

**Why:** StandardScaler transforms each feature to have mean=0 and std=1. This is important for Linear Regression so that no feature dominates due to a different numeric scale.

---

## 5. The Three Models

### Model 1: Random Forest (Primary — Best Model)

```python
from sklearn.ensemble import RandomForestRegressor

model = RandomForestRegressor(n_estimators=100, random_state=42)
```

- **n_estimators=100** — builds 100 decision trees and averages their predictions
- **random_state=42** — ensures reproducibility
- **Why it's best:** Handles non-linear relationships, resistant to overfitting, produces feature importances
- **Output:** Feature importances showing which input factors matter most

### Model 2: Linear Regression (Baseline)

```python
from sklearn.linear_model import LinearRegression

model = LinearRegression()
```

- Simple baseline model assuming a linear relationship between features and score
- Fast to train, easy to interpret
- Less powerful for complex patterns

### Model 3: Decision Tree (Comparison)

```python
from sklearn.tree import DecisionTreeRegressor

model = DecisionTreeRegressor(random_state=42, max_depth=8)
```

- **max_depth=8** — limits tree depth to prevent overfitting
- More flexible than linear regression but tends to overfit without limits
- Higher variance across folds compared to Random Forest

---

## 6. K-Fold Cross-Validation

```python
from sklearn.model_selection import KFold, cross_val_score

kf = KFold(n_splits=5, shuffle=True, random_state=42)

for name, model in models.items():
    scores = cross_val_score(model, X_scaled, y, cv=kf, scoring='r2')
    cv_results[name] = {
        'scores': scores.tolist(),        # R² score for each of the 5 folds
        'mean': float(scores.mean()),     # Average accuracy
        'std': float(scores.std()),       # Standard deviation
        'variance': float(scores.var())  # Variance (lower = more consistent)
    }
```

**How 5-Fold CV works:**
1. Dataset is split into 5 equal parts (folds)
2. Model trains on 4 folds, tests on the remaining 1 fold
3. This repeats 5 times — each fold gets to be the test set once
4. Final score = average of all 5 test scores

**Metrics explained:**
- **R² (R-squared):** Measures how well the model explains variance. 1.0 = perfect, 0 = no better than guessing the mean
- **Mean R²:** Average performance across all 5 folds
- **Std Dev / Variance:** How much the score fluctuates — lower variance = more reliable model
- **Random Forest wins** because it has the lowest variance (most consistent)

---

## 7. Feature Importance (Random Forest only)

```python
rf_model = pickle.loads(model_store['models']['Random Forest'])

feature_importances = [
    {'feature': f, 'importance': float(imp)}
    for f, imp in zip(FEATURES, rf_model.feature_importances_)
]
feature_importances.sort(key=lambda x: x['importance'], reverse=True)
```

- `rf_model.feature_importances_` gives a score for each feature (sums to 1.0)
- Higher = that feature is more useful for making predictions
- Typically: `previous_marks` and `quiz_score` dominate

---

## 8. Actual vs Predicted (for Analytics chart)

```python
rf_preds = rf_model.predict(X_scaled)
sample_indices = np.random.choice(len(y), min(100, len(y)), replace=False)

actual_vs_predicted = [
    {'actual': float(y[i]), 'predicted': float(rf_preds[i])}
    for i in sample_indices
]
```

- Takes up to 100 random samples from the training data
- Compares what the model predicted vs the actual score
- Points close to the diagonal line in the scatter plot = accurate model

---

## 9. Making Predictions

```python
def predict():
    input_values = [float(data.get(f, 0)) for f in FEATURES]
    input_array = np.array(input_values).reshape(1, -1)

    # Apply the SAME scaler used during training
    scaler = pickle.loads(model_store['scaler'])
    input_scaled = scaler.transform(input_array)

    predictions = {}
    for name, model_bytes in model_store['models'].items():
        model = pickle.loads(model_bytes)
        pred = model.predict(input_scaled)[0]
        predictions[name] = round(float(pred), 2)
```

**Important:** The input must be scaled using the SAME scaler that was fitted during training — not re-fitted. Otherwise predictions will be wrong.

---

## 10. Model Persistence (In-Memory)

```python
model_store['models'][name] = pickle.dumps(model)   # save
model = pickle.loads(model_store['models'][name])    # load
```

- `pickle` serializes Python objects to bytes (and back)
- Models are stored in a Python dictionary in server memory
- **Limitation:** If the server restarts, models must be retrained

---

## 11. Sample Data Generator (generate_sample_data.py)

```python
final_score = (
    0.25 * previous_marks +    # 25% weight
    0.20 * quiz_score +         # 20% weight
    0.15 * assignments +        # 15% weight
    0.15 * attendance +         # 15% weight
    0.15 * study_hours * 2 +    # 15% weight (scaled)
    0.10 * participation * 5 +  # 10% weight (scaled)
    noise                        # random noise ±5
)
```

This formula mimics a realistic weighted grade calculation so the ML model can learn meaningful patterns.

---

## 12. API Endpoints Summary

| Method | Endpoint            | Purpose                                |
|--------|---------------------|----------------------------------------|
| GET    | /ml/api/ml/health   | Check if server is alive + model trained |
| POST   | /ml/api/ml/upload   | Upload & validate CSV dataset          |
| POST   | /ml/api/ml/train    | Train all 3 models with 5-fold CV      |
| POST   | /ml/api/ml/predict  | Get score predictions from all models  |
| GET    | /ml/api/ml/analytics| Get CV results + importances + avp data|
