import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Info, Download, Sparkles } from "lucide-react";
import { uploadCSV } from "@/lib/api";
import { generateSampleCSV, downloadCSV } from "@/lib/sampleData";

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file (.csv extension required).');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await uploadCSV(file);
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError('Could not reach the ML server. Please wait a moment and try again — the server may still be starting up.');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleGenerateSample = () => {
    setGenerating(true);
    setTimeout(() => {
      const csv = generateSampleCSV(1200);
      downloadCSV(csv, 'student_sample_data.csv');
      setGenerating(false);
    }, 100);
  };

  const handleGenerateAndUpload = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const csv = generateSampleCSV(1200);
      const blob = new Blob([csv], { type: 'text/csv' });
      const file = new File([blob], 'student_sample_data.csv', { type: 'text/csv' });
      setGenerating(false);
      setLoading(true);
      const data = await uploadCSV(file);
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError('Could not reach the ML server. Please wait a moment and try again.');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Upload Dataset</h2>
        <p className="text-gray-400 mt-1 text-sm">Upload a CSV file with student performance data, or generate a sample dataset to get started instantly.</p>
      </div>

      {/* Quick Start */}
      <div className="bg-indigo-900/20 border border-indigo-700/40 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-indigo-300">Quick Start — No CSV? No problem.</span>
        </div>
        <p className="text-gray-400 text-xs mb-4">Generate a ready-to-use sample dataset with 1,200 rows of realistic student data.</p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleGenerateAndUpload}
            disabled={generating || loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            {(generating || loading) ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" /> Generate &amp; Upload</>
            )}
          </button>
          <button
            onClick={handleGenerateSample}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Sample CSV
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors mb-6 ${
          dragging ? 'border-indigo-500 bg-indigo-600/10' : 'border-gray-700 hover:border-gray-600 bg-gray-900'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
        <Upload className="w-10 h-10 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-300 font-medium">Drag & drop your CSV here</p>
        <p className="text-gray-500 text-sm mt-1">or click to browse files</p>
        {loading && <p className="text-indigo-400 text-sm mt-4 animate-pulse">Uploading and validating...</p>}
      </div>

      {/* Required Columns */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-gray-300">Required CSV columns</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['attendance', 'study_hours', 'assignments', 'quiz_score', 'participation', 'previous_marks', 'final_score'].map(col => (
            <span key={col} className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-md text-xs font-mono border border-gray-700">
              {col}
            </span>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-3">All values should be numeric. Missing values are dropped automatically.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-red-300 text-sm font-medium">Upload failed</p>
            <p className="text-red-400 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="bg-green-900/20 border border-green-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="font-medium text-green-300">Dataset uploaded successfully</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <p className="text-2xl font-bold text-white">{result.rows?.toLocaleString()}</p>
              <p className="text-gray-400 text-sm">Total rows</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <p className="text-2xl font-bold text-white">7</p>
              <p className="text-gray-400 text-sm">Columns found</p>
            </div>
          </div>
          {result.info?.feature_stats && (
            <div>
              <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide font-medium">Feature Summary</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result.info.feature_stats).slice(0, 6).map(([feat, stats]: [string, any]) => (
                  <div key={feat} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                    <p className="text-gray-300 text-xs font-medium mb-1">{feat}</p>
                    <p className="text-white text-sm">mean: <span className="text-indigo-400">{stats.mean.toFixed(1)}</span></p>
                    <p className="text-gray-500 text-xs">range: {stats.min.toFixed(0)} – {stats.max.toFixed(0)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 text-sm text-gray-400 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Now go to the <span className="text-indigo-400 font-medium">Train</span> tab to build the model.
          </div>
        </div>
      )}
    </div>
  );
}
