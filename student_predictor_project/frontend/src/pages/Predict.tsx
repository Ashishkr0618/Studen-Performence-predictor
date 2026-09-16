import { useState, useEffect } from "react";
import { LineChart, AlertCircle, Sparkles, BrainCircuit } from "lucide-react";
import { predict, checkHealth } from "@/lib/api";
import { loadTrainingResult } from "@/lib/store";

const FEATURES = [
  { key: 'attendance', label: 'Attendance (%)', min: 0, max: 100, default: 75 },
  { key: 'study_hours', label: 'Study Hours / week', min: 0, max: 40, default: 15 },
  { key: 'assignments', label: 'Assignments Completed (%)', min: 0, max: 100, default: 80 },
  { key: 'quiz_score', label: 'Quiz Score (avg)', min: 0, max: 100, default: 70 },
  { key: 'participation', label: 'Participation Score', min: 0, max: 10, default: 7 },
  { key: 'previous_marks', label: 'Previous Marks (%)', min: 0, max: 100, default: 72 },
];

const MODEL_COLORS: Record<string, string> = {
  'Random Forest': 'text-indigo-400',
  'Linear Regression': 'text-emerald-400',
  'Decision Tree': 'text-amber-400',
};

export default function PredictPage() {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(FEATURES.map(f => [f.key, f.default]))
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelReady, setModelReady] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth()
      .then(data => setModelReady(data?.trained === true))
      .catch(() => setModelReady(false));
  }, []);

  const handleSlider = (key: string, val: number) => {
    setValues(v => ({ ...v, [key]: val }));
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await predict(values);
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        setModelReady(true);
      }
    } catch {
      setError('Could not reach the ML server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const scoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent performance expected';
    if (score >= 60) return 'Average performance expected';
    return 'Below average — needs improvement';
  };

  const cached = loadTrainingResult();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Predict Exam Score</h2>
        <p className="text-gray-400 mt-1 text-sm">Adjust the sliders to set student features and predict the final exam score.</p>
      </div>

      {modelReady === false && !cached && (
        <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl p-4 flex items-start gap-3 mb-6">
          <BrainCircuit className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-amber-300 text-sm font-medium">Model not trained yet</p>
            <p className="text-amber-500 text-xs mt-0.5">Go to the <span className="text-amber-300 font-medium">Upload</span> tab, upload a dataset, then go to <span className="text-amber-300 font-medium">Train</span> to train the model. Predictions will be available after training.</p>
          </div>
        </div>
      )}

      {modelReady === false && cached && (
        <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl p-3 flex items-center gap-2 mb-6 text-xs text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Model not in memory. Re-upload your CSV and retrain to enable predictions.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <LineChart className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-white text-sm">Input Features</h3>
          </div>
          {FEATURES.map(f => (
            <div key={f.key}>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-300">{f.label}</label>
                <input
                  type="number"
                  value={values[f.key]}
                  min={f.min}
                  max={f.max}
                  onChange={e => handleSlider(f.key, Number(e.target.value))}
                  className="w-16 text-right bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.key === 'participation' ? 0.5 : 1}
                value={values[f.key]}
                onChange={e => handleSlider(f.key, Number(e.target.value))}
                className="w-full h-1.5 appearance-none bg-gray-700 rounded-full cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                <span>{f.min}</span><span>{f.max}</span>
              </div>
            </div>
          ))}
          <button
            onClick={handlePredict}
            disabled={loading || modelReady === false}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors mt-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Predicting...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Predict Score</>
            )}
          </button>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {result ? (
            <>
              <div className="bg-gray-900 rounded-xl border border-indigo-600/50 p-6 text-center">
                <p className="text-gray-400 text-sm mb-2">Random Forest Prediction</p>
                <p className={`text-6xl font-bold mb-2 ${scoreColor(result.primary_prediction)}`}>
                  {result.primary_prediction.toFixed(1)}
                </p>
                <p className="text-gray-500 text-sm">out of 100</p>
                <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      result.primary_prediction >= 80 ? 'bg-green-500' :
                      result.primary_prediction >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, result.primary_prediction)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">{scoreLabel(result.primary_prediction)}</p>
              </div>

              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-4">All Model Predictions</p>
                <div className="space-y-3">
                  {Object.entries(result.predictions || {}).map(([name, score]: [string, any]) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          name === 'Random Forest' ? 'bg-indigo-400' :
                          name === 'Linear Regression' ? 'bg-emerald-400' : 'bg-amber-400'
                        }`} />
                        <span className="text-gray-300 text-sm">{name}</span>
                        {name === 'Random Forest' && (
                          <span className="text-xs bg-indigo-600/30 text-indigo-400 px-1.5 py-0.5 rounded">Best</span>
                        )}
                      </div>
                      <span className={`font-mono font-semibold ${MODEL_COLORS[name] || 'text-white'}`}>
                        {Number(score).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Input Summary</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(result.input_features || {}).map(([feat, val]: [string, any]) => (
                    <div key={feat} className="flex justify-between items-center bg-gray-800 rounded-lg px-3 py-2">
                      <span className="text-gray-400 text-xs">{feat}</span>
                      <span className="text-white text-xs font-mono">{Number(val).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center">
              <Sparkles className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Set the student features and click</p>
              <p className="text-indigo-400 text-sm font-medium">Predict Score</p>
              <p className="text-gray-600 text-xs mt-2">Model must be trained first.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
