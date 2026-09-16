import { useState, useEffect } from "react";
import { BarChart2, RefreshCw, AlertCircle } from "lucide-react";
import { getAnalytics } from "@/lib/api";
import { loadTrainingResult } from "@/lib/store";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ScatterController,
} from 'chart.js';
import { Bar, Scatter } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend, ScatterController
);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#9ca3af', font: { size: 12 } } },
    tooltip: {
      backgroundColor: '#1f2937', titleColor: '#f3f4f6',
      bodyColor: '#d1d5db', borderColor: '#374151', borderWidth: 1,
    }
  },
  scales: {
    x: { grid: { color: '#1f2937' }, ticks: { color: '#6b7280' } },
    y: { grid: { color: '#1f2937' }, ticks: { color: '#6b7280' } }
  }
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'live' | 'cached'>('live');

  const loadAnalytics = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await getAnalytics();
      if (res.error) {
        // Try cached data
        const cached = loadTrainingResult();
        if (cached) {
          setData(cached);
          setSource('cached');
        } else {
          setError(res.error);
        }
      } else {
        setData(res);
        setSource('live');
      }
    } catch {
      const cached = loadTrainingResult();
      if (cached) {
        setData(cached);
        setSource('cached');
      } else {
        setError('Could not load analytics. Train a model first.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { loadAnalytics(); }, []);

  const featureImportanceData = data ? {
    labels: (data.feature_importances || []).map((f: any) => f.feature),
    datasets: [{
      label: 'Feature Importance',
      data: (data.feature_importances || []).map((f: any) => (f.importance * 100).toFixed(2)),
      backgroundColor: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
      borderRadius: 6,
      borderSkipped: false,
    }]
  } : null;

  const cvData = data ? {
    labels: ['Fold 1', 'Fold 2', 'Fold 3', 'Fold 4', 'Fold 5'],
    datasets: [
      { label: 'Random Forest', data: data.cv_results?.['Random Forest']?.scores || [], backgroundColor: 'rgba(99,102,241,0.7)', borderRadius: 4 },
      { label: 'Linear Regression', data: data.cv_results?.['Linear Regression']?.scores || [], backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4 },
      { label: 'Decision Tree', data: data.cv_results?.['Decision Tree']?.scores || [], backgroundColor: 'rgba(245,158,11,0.7)', borderRadius: 4 },
    ]
  } : null;

  const avpData = data ? {
    datasets: [{
      label: 'Actual vs Predicted',
      data: (data.actual_vs_predicted || []).slice(0, 80).map((d: any) => ({ x: d.actual, y: d.predicted })),
      backgroundColor: 'rgba(99,102,241,0.5)',
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  } : null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics</h2>
          <p className="text-gray-400 mt-1 text-sm">Model performance, feature importance, and prediction accuracy.</p>
        </div>
        <button
          onClick={() => loadAnalytics()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {source === 'cached' && data && (
        <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl p-3 flex items-center gap-2 mb-6 text-xs text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Showing cached results from your last training session. Train a new model to refresh live data.
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {!data && !error && !loading && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center">
          <BarChart2 className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">No analytics yet. Upload data and train the model first.</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(data.cv_results || {}).map(([name, stats]: [string, any]) => (
              <div key={name} className={`bg-gray-900 rounded-xl border p-4 ${name === 'Random Forest' ? 'border-indigo-600/50' : 'border-gray-800'}`}>
                <p className="text-xs text-gray-500 mb-1">{name}</p>
                <p className="text-2xl font-bold text-white">{(stats.mean * 100).toFixed(1)}%</p>
                <p className="text-xs text-gray-400">Mean R² Score</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-gray-500">±{(stats.std * 100).toFixed(2)}%</span>
                  <span className="text-gray-600">var: {stats.variance.toFixed(5)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h3 className="font-semibold text-white text-sm mb-1">Feature Importance (Random Forest)</h3>
            <p className="text-xs text-gray-500 mb-5">Which student factors best predict final exam score</p>
            <div style={{ height: 220 }}>
              {featureImportanceData && (
                <Bar data={featureImportanceData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } }, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, title: { display: true, text: 'Importance (%)', color: '#6b7280' } } } }} />
              )}
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h3 className="font-semibold text-white text-sm mb-1">Cross-Validation R² Scores per Fold</h3>
            <p className="text-xs text-gray-500 mb-5">Lower variance across folds = more consistent model (Random Forest wins)</p>
            <div style={{ height: 220 }}>
              {cvData && (
                <Bar data={cvData} options={{ ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, min: 0, max: 1, title: { display: true, text: 'R² Score', color: '#6b7280' } } } }} />
              )}
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h3 className="font-semibold text-white text-sm mb-1">Actual vs Predicted (Random Forest)</h3>
            <p className="text-xs text-gray-500 mb-5">Points close to the diagonal = accurate predictions</p>
            <div style={{ height: 260 }}>
              {avpData && (
                <Scatter data={avpData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } }, scales: { x: { ...chartDefaults.scales.x, title: { display: true, text: 'Actual Score', color: '#6b7280' } }, y: { ...chartDefaults.scales.y, title: { display: true, text: 'Predicted Score', color: '#6b7280' } } } }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
