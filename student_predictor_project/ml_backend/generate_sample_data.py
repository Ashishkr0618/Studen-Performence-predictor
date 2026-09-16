"""
Generate a sample student performance CSV dataset.
Usage: python3 generate_sample_data.py
"""
import numpy as np
import pandas as pd

np.random.seed(42)
n = 1200

attendance = np.clip(np.random.normal(78, 12, n), 40, 100)
study_hours = np.clip(np.random.normal(15, 5, n), 1, 40)
assignments = np.clip(np.random.normal(80, 15, n), 20, 100)
quiz_score = np.clip(np.random.normal(70, 12, n), 20, 100)
participation = np.clip(np.random.normal(6.5, 1.8, n), 0, 10)
previous_marks = np.clip(np.random.normal(72, 14, n), 30, 100)

noise = np.random.normal(0, 5, n)
final_score = (
    0.25 * previous_marks +
    0.20 * quiz_score +
    0.15 * assignments +
    0.15 * attendance +
    0.15 * study_hours * 2 +
    0.10 * participation * 5 +
    noise
)
final_score = np.clip(final_score, 20, 100).round(1)

df = pd.DataFrame({
    'attendance': attendance.round(1),
    'study_hours': study_hours.round(1),
    'assignments': assignments.round(1),
    'quiz_score': quiz_score.round(1),
    'participation': participation.round(1),
    'previous_marks': previous_marks.round(1),
    'final_score': final_score
})

df.to_csv('sample_student_data.csv', index=False)
print(f"Generated {len(df)} rows -> sample_student_data.csv")
print(df.describe().round(2))
