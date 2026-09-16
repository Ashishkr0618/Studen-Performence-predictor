function randNormal(mean: number, std: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + std * z;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function generateSampleCSV(rows = 1200): string {
  const headers = ['attendance', 'study_hours', 'assignments', 'quiz_score', 'participation', 'previous_marks', 'final_score'];
  const lines: string[] = [headers.join(',')];

  for (let i = 0; i < rows; i++) {
    const attendance = clamp(randNormal(78, 12), 40, 100);
    const study_hours = clamp(randNormal(15, 5), 1, 40);
    const assignments = clamp(randNormal(80, 15), 20, 100);
    const quiz_score = clamp(randNormal(70, 12), 20, 100);
    const participation = clamp(randNormal(6.5, 1.8), 0, 10);
    const previous_marks = clamp(randNormal(72, 14), 30, 100);
    const noise = randNormal(0, 5);
    const final_score = clamp(
      0.25 * previous_marks +
      0.20 * quiz_score +
      0.15 * assignments +
      0.15 * attendance +
      0.15 * study_hours * 2 +
      0.10 * participation * 5 +
      noise,
      20, 100
    );

    lines.push([
      attendance.toFixed(1),
      study_hours.toFixed(1),
      assignments.toFixed(1),
      quiz_score.toFixed(1),
      participation.toFixed(1),
      previous_marks.toFixed(1),
      final_score.toFixed(1),
    ].join(','));
  }

  return lines.join('\n');
}

export function downloadCSV(content: string, filename = 'student_data.csv') {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
