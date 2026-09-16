import { useState, useEffect } from "react";
import { BrainCircuit, Play, CheckCircle, AlertCircle, TrendingUp, Award, Clock } from "lucide-react";
import { trainModel } from "@/lib/api";
import { saveTrainingResult, loadTrainingResult } from "@/lib/store";

const BAR_COLORS: Record<string, string> = {
  'Random Forest': 'bg-indigo-500',
  'Linear Regression': 'bg-emerald-500',
  'Decision Tree': 'bg-amber-500',
};

export default function TrainPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadTrainingResult();
    if (saved) setResult(saved);
  }, []);

  const handleTrain = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await trainModel();
      if (data.error) {
        setError(data.error);
      } else {
        const toSave = { ...data, trained_at: new Date().toISOString() };
        saveTrainingResult(toSave);
        setResult(toSave);
      }
    } catch {
      setError('Could not reach the ML server. Make sure the ML server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Train Models</h2>
          <p className="text-gray-400 mt-1 text-sm">Train all three models with 5-fold cross-validation. Upload a dataset first.</p>
        </div>
        <button
          onClick={handleTrain}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Training...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Train Models
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center mb-6">
          <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Training in progress...</p>
          <p className="text-gray-400 text-sm mt-1">Running 5-fold cross-validation on 3 models. This may take up to 30 seconds for large datasets.</p>
        </div>
      )}

      {!result && !error && !loading && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center">
          <BrainCircuit className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Upload a dataset first, then click <span className="text-indigo-400 font-medium">Train Models</span>.</p>
          <p className="text-gray-600 text-xs mt-2">Trains Random Forest, Linear Regression &amp; Decision Tree with 5-fold CV.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-red-300 text-sm font-medium">Training failed</p>
            <p className="text-red-400 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6">
          <div className="bg-green-900/20 border border-green-800 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-green-300 font-medium">Training complete</p>
              <p className="text-green-600 text-xs">
                {result.dataset_size?.toLocaleString()} samples · 5-fold cross-validation
                {result.trained_at && ` · ${new Date(result.trained_at).toLocaleString()}`}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-amber-400">
              <Award className="w-4 h-4" />
              <span className="text-xs font-medium">Best: Random Forest</span>
            </div>
          </div>

          {/* Model cards */}
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(result.cv_results || {}).map(([name, stats]: [string, any]) => {
              const colorClass = BAR_COLORS[name] || 'bg-gray-500';
              const isBest = name === 'Random Forest';
              return (
                <div key={name} className={`bg-gray-900 rounded-xl border p-5 ${isBest ? 'border-indigo-600/50' : 'border-gray-800'}`}>
                  {isBest && (
                    <div className="flex items-center gap-1 mb-3">
                      <Award className="w-3 h-3 text-amber-400" />
                      <span className="text-xs text-amber-400 font-medium">Best Model</span>
                    </div>
                  )}
                  <h3 className="font-semibold text-white text-sm mb-4">{name}</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Mean R²</span>
                        <span className="text-white font-mono">{stats.mean.toFixed(4)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colorClass}`}
                          style={{ width: `${Math.max(0, Math.min(100, stats.mean * 100))}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Std Dev</span>
                      <span className="text-white font-mono">{stats.std.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Variance</span>
                      <span className={`font-mono ${isBest ? 'text-green-400' : 'text-gray-300'}`}>
                        {stats.variance.toFixed(6)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CV bar chart */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-white text-sm">Cross-Validation Scores per Fold</h3>
            </div>
            {Object.entries(result.cv_results || {}).map(([name, stats]: [string, any]) => (
              <div key={name} className="mb-5 last:mb-0">
                <p className="text-xs text-gray-400 mb-2">{name}  <span className="text-gray-600">mean={stats.mean.toFixed(3)}  variance={stats.variance.toFixed(5)}</span></p>
                <div className="flex gap-2 flex-wrap">
                  {stats.scores.map((score: number, i: number) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="relative h-20 w-10 bg-gray-800 rounded overflow-hidden flex items-end">
                        <div
                          className={`w-full ${BAR_COLORS[name] || 'bg-gray-500'} opacity-90`}
                          style={{ height: `${Math.max(5, Math.abs(score) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 mt-1 font-mono">{score.toFixed(3)}</span>
                      <span className="text-xs text-gray-600">F{i+1}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Feature importance */}
          <div className="bg-indigo-900/20 border border-indigo-800/50 rounded-xl p-5">
            <h3 className="font-semibold text-white text-sm mb-3">Feature Importance (Random Forest)</h3>
            <div className="space-y-2">
              {(result.feature_importances || []).map((fi: any) => (
                <div key={fi.feature}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 font-medium">{fi.feature}</span>
                    <span className="text-indigo-400 font-mono">{(fi.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${fi.importance * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
