import os
import io
import pickle
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.model_selection import KFold, cross_val_score
from sklearn.preprocessing import StandardScaler

app = Flask(__name__)
CORS(app)

FEATURES = ['attendance', 'study_hours', 'assignments', 'quiz_score', 'participation', 'previous_marks']

model_store = {
    'models': {},
    'scaler': None,
    'trained': False,
    'cv_results': {},
    'feature_importances': [],
    'actual_vs_predicted': [],
    'dataset_info': {}
}


def validate_and_clean(df):
    for col in FEATURES + ['final_score']:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")
    df = df[FEATURES + ['final_score']].copy()
    df = df.dropna()
    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    df = df.dropna()
    return df


@app.route('/ml/api/ml/health', methods=['GET'])
@app.route('/api/ml/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'trained': model_store['trained']})


@app.route('/ml/api/ml/upload', methods=['POST'])
@app.route('/api/ml/upload', methods=['POST'])
def upload_csv():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'File must be a CSV'}), 400

    try:
        content = file.read().decode('utf-8')
        df = pd.read_csv(io.StringIO(content))

        if len(df) < 100:
            return jsonify({'error': f'Dataset too small. Got {len(df)} rows, need at least 100.'}), 400

        df_clean = validate_and_clean(df)

        model_store['dataset_info'] = {
            'rows': len(df_clean),
            'columns': list(df_clean.columns),
            'feature_stats': {}
        }
        for col in FEATURES + ['final_score']:
            model_store['dataset_info']['feature_stats'][col] = {
                'min': float(df_clean[col].min()),
                'max': float(df_clean[col].max()),
                'mean': float(df_clean[col].mean()),
                'std': float(df_clean[col].std())
            }

        model_store['_df_json'] = df_clean.to_json()

        return jsonify({
            'success': True,
            'rows': len(df_clean),
            'info': model_store['dataset_info']
        })
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to parse CSV: {str(e)}'}), 500


@app.route('/ml/api/ml/train', methods=['POST'])
@app.route('/api/ml/train', methods=['POST'])
def train():
    if '_df_json' not in model_store:
        return jsonify({'error': 'No dataset uploaded. Please upload a CSV first.'}), 400

    try:
        df = pd.read_json(io.StringIO(model_store['_df_json']))
        X = df[FEATURES].values
        y = df['final_score'].values

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        model_store['scaler'] = pickle.dumps(scaler)

        models = {
            'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'Linear Regression': LinearRegression(),
            'Decision Tree': DecisionTreeRegressor(random_state=42, max_depth=8)
        }

        kf = KFold(n_splits=5, shuffle=True, random_state=42)
        cv_results = {}

        for name, model in models.items():
            scores = cross_val_score(model, X_scaled, y, cv=kf, scoring='r2')
            cv_results[name] = {
                'scores': scores.tolist(),
                'mean': float(scores.mean()),
                'std': float(scores.std()),
                'variance': float(scores.var())
            }
            model.fit(X_scaled, y)
            model_store['models'][name] = pickle.dumps(model)

        model_store['cv_results'] = cv_results
        model_store['trained'] = True

        rf_model = pickle.loads(model_store['models']['Random Forest'])
        model_store['feature_importances'] = [
            {'feature': f, 'importance': float(imp)}
            for f, imp in zip(FEATURES, rf_model.feature_importances_)
        ]
        model_store['feature_importances'].sort(key=lambda x: x['importance'], reverse=True)

        rf_preds = rf_model.predict(X_scaled)
        sample_indices = np.random.choice(len(y), min(100, len(y)), replace=False)
        model_store['actual_vs_predicted'] = [
            {'actual': float(y[i]), 'predicted': float(rf_preds[i])}
            for i in sample_indices
        ]

        return jsonify({
            'success': True,
            'cv_results': cv_results,
            'feature_importances': model_store['feature_importances'],
            'best_model': 'Random Forest',
            'dataset_size': len(df)
        })
    except Exception as e:
        return jsonify({'error': f'Training failed: {str(e)}'}), 500


@app.route('/ml/api/ml/predict', methods=['POST'])
@app.route('/api/ml/predict', methods=['POST'])
def predict():
    if not model_store['trained']:
        return jsonify({'error': 'No trained model. Please train first.'}), 400

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No input data provided'}), 400

    try:
        input_values = [float(data.get(f, 0)) for f in FEATURES]
        input_array = np.array(input_values).reshape(1, -1)

        scaler = pickle.loads(model_store['scaler'])
        input_scaled = scaler.transform(input_array)

        predictions = {}
        for name, model_bytes in model_store['models'].items():
            model = pickle.loads(model_bytes)
            pred = model.predict(input_scaled)[0]
            predictions[name] = round(float(pred), 2)

        return jsonify({
            'success': True,
            'predictions': predictions,
            'primary_prediction': predictions.get('Random Forest', 0),
            'input_features': dict(zip(FEATURES, input_values))
        })
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500


@app.route('/ml/api/ml/analytics', methods=['GET'])
@app.route('/api/ml/analytics', methods=['GET'])
def analytics():
    if not model_store['trained']:
        return jsonify({'error': 'No trained model available'}), 400

    return jsonify({
        'cv_results': model_store['cv_results'],
        'feature_importances': model_store['feature_importances'],
        'actual_vs_predicted': model_store['actual_vs_predicted'],
        'dataset_info': model_store['dataset_info']
    })


if __name__ == '__main__':
    port = int(os.environ.get('ML_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
