const ML_BASE = '/ml';
const TIMEOUT_MS = 60000;

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function checkHealth() {
  const res = await fetchWithTimeout(`${ML_BASE}/api/ml/health`);
  return res.json();
}

export async function uploadCSV(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetchWithTimeout(`${ML_BASE}/api/ml/upload`, { method: 'POST', body: form });
  return res.json();
}

export async function trainModel() {
  const res = await fetchWithTimeout(`${ML_BASE}/api/ml/train`, { method: 'POST' });
  return res.json();
}

export async function predict(features: Record<string, number>) {
  const res = await fetchWithTimeout(`${ML_BASE}/api/ml/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(features),
  });
  return res.json();
}

export async function getAnalytics() {
  const res = await fetchWithTimeout(`${ML_BASE}/api/ml/analytics`);
  return res.json();
}
