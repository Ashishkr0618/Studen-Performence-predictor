# Student Exam Performance Predictor

A full-stack ML web application that predicts student exam scores using Random Forest, Linear Regression, and Decision Tree models with 5-fold cross-validation.

---

## Project Structure

```
student_predictor_project/
│
├── ML_CODE_EXPLAINED.md         ← Full ML code explanation (read this first!)
│
├── ml_backend/                  ← Python / Flask / scikit-learn
│   ├── app.py                   ← Main Flask API server (all ML logic)
│   ├── generate_sample_data.py  ← Script to generate sample CSV data
│   ├── run.sh                   ← Dev server startup script
│   └── start_prod.sh            ← Production (gunicorn) startup script
│
└── frontend/                    ← React + Vite + TypeScript + Tailwind CSS
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── src/
        ├── App.tsx              ← Router setup
        ├── main.tsx             ← React entry point
        ├── index.css            ← Dark theme + Tailwind
        ├── pages/
        │   ├── Upload.tsx       ← CSV upload + sample data generator
        │   ├── Train.tsx        ← Model training + CV results display
        │   ├── Predict.tsx      ← Slider-based score prediction
        │   └── Analytics.tsx    ← Charts (feature importance, CV, scatter)
        ├── components/
        │   └── Layout.tsx       ← Sidebar + ML server status indicator
        └── lib/
            ├── api.ts           ← All HTTP calls to the Flask backend
            ├── sampleData.ts    ← Client-side CSV generator (no server needed)
            ├── store.ts         ← LocalStorage persistence for training results
            └── utils.ts         ← Shared utility functions
```

---

## How to Run Locally

### Backend (Flask)
```bash
pip install flask flask-cors scikit-learn pandas numpy gunicorn
cd ml_backend
python app.py
# Server runs on http://localhost:5100
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## ML Models Used

| Model              | Algorithm           | Strength                        |
|--------------------|---------------------|---------------------------------|
| Random Forest      | Ensemble of trees   | Best accuracy, lowest variance  |
| Linear Regression  | Weighted line fit   | Fast, interpretable baseline    |
| Decision Tree      | Single tree         | Visual, but higher variance     |

All models are evaluated using **5-fold cross-validation** with **R² score**.

---

## Input Features → Target

| Feature          | Target        |
|------------------|---------------|
| attendance (%)   | final_score   |
| study_hours      |               |
| assignments (%)  |               |
| quiz_score       |               |
| participation    |               |
| previous_marks   |               |

---

## ML Code Reference

See **`ML_CODE_EXPLAINED.md`** for a detailed walkthrough of:
- Data preprocessing & scaling
- All 3 model implementations
- K-Fold cross-validation logic
- Feature importance extraction
- Prediction pipeline
- API endpoint reference
