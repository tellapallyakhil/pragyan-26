"""
TriageAI — ML Inference Module
================================
Loads the trained models and provides a `classify()` function
that takes raw patient data and returns risk_level + department.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib

# ─────────────────────────────── LOAD MODELS ───────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')

risk_model = joblib.load(os.path.join(MODEL_DIR, 'risk_classifier.joblib'))
dept_model = joblib.load(os.path.join(MODEL_DIR, 'dept_classifier.joblib'))
risk_le = joblib.load(os.path.join(MODEL_DIR, 'risk_label_encoder.joblib'))
dept_le = joblib.load(os.path.join(MODEL_DIR, 'dept_label_encoder.joblib'))
symptom_mlb = joblib.load(os.path.join(MODEL_DIR, 'symptom_binarizer.joblib'))
condition_mlb = joblib.load(os.path.join(MODEL_DIR, 'condition_binarizer.joblib'))

with open(os.path.join(MODEL_DIR, 'feature_metadata.json'), 'r') as f:
    feature_meta = json.load(f)


def classify(
    age: int,
    gender: str,
    symptoms: list[str],
    blood_pressure_systolic: int,
    heart_rate: int,
    temperature_f: float,
    pre_existing_conditions: list[str],
) -> dict:
    """
    Classify a patient's risk level and recommended department.

    Args:
        age: Patient age (1-89)
        gender: 'Male', 'Female', or 'Other'
        symptoms: List of symptoms, e.g. ['Chest Pain', 'Shortness of Breath']
        blood_pressure_systolic: Systolic BP (mmHg)
        heart_rate: Heart rate (bpm)
        temperature_f: Temperature in Fahrenheit
        pre_existing_conditions: List, e.g. ['Diabetes', 'Heart Disease']

    Returns:
        dict with keys: risk_level, risk_probabilities, department, department_probabilities
    """

    # ── Build feature vector ──

    # Numeric
    if age <= 12:
        age_group = 0
    elif age <= 30:
        age_group = 1
    elif age <= 50:
        age_group = 2
    elif age <= 70:
        age_group = 3
    else:
        age_group = 4

    if blood_pressure_systolic <= 90:
        bp_category = 0
    elif blood_pressure_systolic <= 120:
        bp_category = 1
    elif blood_pressure_systolic <= 140:
        bp_category = 2
    else:
        bp_category = 3

    if heart_rate <= 60:
        hr_category = 0
    elif heart_rate <= 80:
        hr_category = 1
    elif heart_rate <= 100:
        hr_category = 2
    else:
        hr_category = 3

    has_fever = 1 if temperature_f > 100.4 else 0
    symptom_count = len(symptoms)
    condition_count = len([c for c in pre_existing_conditions if c.lower() != 'none'])

    numeric_vals = [
        age, blood_pressure_systolic, heart_rate, temperature_f,
        age_group, bp_category, hr_category, has_fever,
        symptom_count, condition_count
    ]

    # Gender one-hot
    gender_vals = [
        1 if gender == 'Female' else 0,
        1 if gender == 'Male' else 0,
        1 if gender == 'Other' else 0,
    ]

    # Symptoms multi-label
    symptom_vector = symptom_mlb.transform([symptoms])[0].tolist()

    # Conditions multi-label
    clean_conditions = [c for c in pre_existing_conditions if c.lower() != 'none']
    condition_vector = condition_mlb.transform([clean_conditions])[0].tolist()

    # Combine
    feature_vector = numeric_vals + gender_vals + symptom_vector + condition_vector
    X = np.array([feature_vector])

    # ── Predict ──
    risk_pred = risk_model.predict(X)[0]
    risk_proba = risk_model.predict_proba(X)[0]

    dept_pred = dept_model.predict(X)[0]
    dept_proba = dept_model.predict_proba(X)[0]

    risk_label = risk_le.inverse_transform([risk_pred])[0]
    dept_label = dept_le.inverse_transform([dept_pred])[0]

    risk_probs = {label: float(prob) for label, prob in zip(risk_le.classes_, risk_proba)}
    dept_probs = {label: float(prob) for label, prob in zip(dept_le.classes_, dept_proba)}

    return {
        'risk_level': risk_label,
        'risk_confidence': float(max(risk_proba)),
        'risk_probabilities': risk_probs,
        'department': dept_label,
        'department_confidence': float(max(dept_proba)),
        'department_probabilities': dept_probs,
    }


# ─────────────────────────────── CLI TEST ───────────────────────────────
if __name__ == '__main__':
    print("\n🧪 Testing ML Inference...\n")

    # Test case 1: High-risk cardiac
    result = classify(
        age=65,
        gender='Male',
        symptoms=['Chest Pain', 'Shortness of Breath'],
        blood_pressure_systolic=165,
        heart_rate=110,
        temperature_f=99.2,
        pre_existing_conditions=['Heart Disease', 'Diabetes'],
    )
    print(f"Test 1 — Cardiac Emergency:")
    print(f"  Risk:       {result['risk_level']} ({result['risk_confidence']*100:.1f}%)")
    print(f"  Department: {result['department']} ({result['department_confidence']*100:.1f}%)")
    print(f"  Risk Probs: {result['risk_probabilities']}")
    print()

    # Test case 2: Low-risk general
    result2 = classify(
        age=28,
        gender='Female',
        symptoms=['Fever', 'Cough'],
        blood_pressure_systolic=110,
        heart_rate=75,
        temperature_f=100.8,
        pre_existing_conditions=['Asthma'],
    )
    print(f"Test 2 — General Medicine:")
    print(f"  Risk:       {result2['risk_level']} ({result2['risk_confidence']*100:.1f}%)")
    print(f"  Department: {result2['department']} ({result2['department_confidence']*100:.1f}%)")
    print()

    # Test case 3: Neurology
    result3 = classify(
        age=45,
        gender='Other',
        symptoms=['Numbness', 'Blurred Vision', 'Dizziness'],
        blood_pressure_systolic=125,
        heart_rate=82,
        temperature_f=98.6,
        pre_existing_conditions=['Hypertension'],
    )
    print(f"Test 3 — Neurology:")
    print(f"  Risk:       {result3['risk_level']} ({result3['risk_confidence']*100:.1f}%)")
    print(f"  Department: {result3['department']} ({result3['department_confidence']*100:.1f}%)")
    print()

    # Test case 4: Pulmonology
    result4 = classify(
        age=55,
        gender='Male',
        symptoms=['Shortness of Breath', 'Cough', 'Fatigue'],
        blood_pressure_systolic=130,
        heart_rate=92,
        temperature_f=101.5,
        pre_existing_conditions=['Asthma', 'Diabetes'],
    )
    print(f"Test 4 — Pulmonology:")
    print(f"  Risk:       {result4['risk_level']} ({result4['risk_confidence']*100:.1f}%)")
    print(f"  Department: {result4['department']} ({result4['department_confidence']*100:.1f}%)")
