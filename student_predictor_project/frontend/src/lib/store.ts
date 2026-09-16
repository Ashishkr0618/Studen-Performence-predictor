const KEY = 'student_predictor_state';

export interface TrainingResult {
  cv_results: Record<string, { scores: number[]; mean: number; std: number; variance: number }>;
  feature_importances: { feature: string; importance: number }[];
  actual_vs_predicted: { actual: number; predicted: number }[];
  dataset_info: { rows: number };
  best_model: string;
  dataset_size: number;
  trained_at: string;
}

export function saveTrainingResult(data: TrainingResult) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export function loadTrainingResult(): TrainingResult | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearTrainingResult() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
