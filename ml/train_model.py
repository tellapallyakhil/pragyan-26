"""
TriageAI — ML Classification Model Training
=============================================
Trains two classifiers from the clinical triage dataset:
  1. Risk Level Classifier    (Low / Medium / High)
  2. Department Classifier    (General Medicine / Neurology / Cardiology / Pulmonology)

Features used:
  - Age (numeric)
  - Gender (one-hot)
  - Symptoms (multi-label binarized)
  - Blood_Pressure_Systolic (numeric)
  - Heart_Rate (numeric)
  - Temperature_F (numeric)
  - Pre_Existing_Conditions (multi-label binarized)

This is a CLASSIFICATION task — not prediction.
Given the patient's data, the model classifies the appropriate risk level and department.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
import warnings
warnings.filterwarnings('ignore')

# ─────────────────────────────── PATHS ───────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
CSV_PATH = os.path.join(PROJECT_DIR, 'smart_triage_dataset_1200-1.csv')
MODEL_DIR = os.path.join(BASE_DIR, 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

print("=" * 70)
print("  TriageAI — ML Model Training Pipeline")
print("=" * 70)

# ─────────────────────────────── DATA LOADING ───────────────────────────────
print("\n📂 Loading dataset...")
df = pd.read_csv(CSV_PATH)
print(f"   ✓ Loaded {len(df)} records, {len(df.columns)} columns")
print(f"   Columns: {list(df.columns)}")

# ─────────────────────────────── FEATURE ENGINEERING ───────────────────────────────
print("\n🔧 Feature Engineering...")

# 1. Parse multi-value Symptoms into lists
df['Symptoms_List'] = df['Symptoms'].apply(lambda x: [s.strip() for s in str(x).split(',')])

# 2. Parse multi-value Pre_Existing_Conditions into lists
df['Conditions_List'] = df['Pre_Existing_Conditions'].apply(
    lambda x: [c.strip() for c in str(x).split(',') if c.strip().lower() != 'none']
)

# 3. Multi-label binarize Symptoms
symptom_mlb = MultiLabelBinarizer()
symptom_features = symptom_mlb.fit_transform(df['Symptoms_List'])
symptom_cols = [f'symptom_{s.lower().replace(" ", "_")}' for s in symptom_mlb.classes_]
symptom_df = pd.DataFrame(symptom_features, columns=symptom_cols, index=df.index)
print(f"   ✓ {len(symptom_mlb.classes_)} unique symptoms: {list(symptom_mlb.classes_)}")

# 4. Multi-label binarize Pre_Existing_Conditions
condition_mlb = MultiLabelBinarizer()
condition_features = condition_mlb.fit_transform(df['Conditions_List'])
condition_cols = [f'cond_{c.lower().replace(" ", "_")}' for c in condition_mlb.classes_]
condition_df = pd.DataFrame(condition_features, columns=condition_cols, index=df.index)
print(f"   ✓ {len(condition_mlb.classes_)} unique conditions: {list(condition_mlb.classes_)}")

# 5. One-hot encode Gender
gender_dummies = pd.get_dummies(df['Gender'], prefix='gender').astype(int)
print(f"   ✓ Gender categories: {list(gender_dummies.columns)}")

# 6. Numeric features
numeric_features = df[['Age', 'Blood_Pressure_Systolic', 'Heart_Rate', 'Temperature_F']].copy()

# 7. Derived features for better classification
numeric_features['age_group'] = pd.cut(df['Age'], bins=[0, 12, 30, 50, 70, 100], labels=[0, 1, 2, 3, 4]).astype(int)
numeric_features['bp_category'] = pd.cut(df['Blood_Pressure_Systolic'], bins=[0, 90, 120, 140, 200], labels=[0, 1, 2, 3]).astype(int)
numeric_features['hr_category'] = pd.cut(df['Heart_Rate'], bins=[0, 60, 80, 100, 200], labels=[0, 1, 2, 3]).astype(int)
numeric_features['has_fever'] = (df['Temperature_F'] > 100.4).astype(int)
numeric_features['symptom_count'] = df['Symptoms_List'].apply(len)
numeric_features['condition_count'] = df['Conditions_List'].apply(len)

print(f"   ✓ Numeric features: {list(numeric_features.columns)}")

# 8. Combine all features
X = pd.concat([numeric_features, gender_dummies, symptom_df, condition_df], axis=1)
print(f"\n   📊 Total feature matrix: {X.shape[0]} samples × {X.shape[1]} features")

# ─────────────────────────────── TARGETS ───────────────────────────────
# Target 1: Risk Level
risk_le = LabelEncoder()
y_risk = risk_le.fit_transform(df['Risk_Level'])
print(f"\n🎯 Target 1 — Risk Level: {dict(zip(risk_le.classes_, range(len(risk_le.classes_))))}")
print(f"   Distribution: {dict(zip(*np.unique(y_risk, return_counts=True)))}")

# Target 2: Recommended Department
dept_le = LabelEncoder()
y_dept = dept_le.fit_transform(df['Recommended_Department'])
print(f"\n🎯 Target 2 — Department: {dict(zip(dept_le.classes_, range(len(dept_le.classes_))))}")
print(f"   Distribution: {dict(zip(*np.unique(y_dept, return_counts=True)))}")

# ─────────────────────────────── TRAIN/TEST SPLIT ───────────────────────────────
print("\n" + "─" * 70)
print("  MODEL 1: Risk Level Classifier")
print("─" * 70)

X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(
    X, y_risk, test_size=0.2, random_state=42, stratify=y_risk
)
print(f"   Train: {len(X_train_r)} | Test: {len(X_test_r)}")

# Train Risk Level model — RandomForest with tuned hyperparameters
risk_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    class_weight='balanced',   # Handle imbalanced classes (High=98 vs Low=796)
    random_state=42,
    n_jobs=-1,
)
risk_model.fit(X_train_r, y_train_r)

# Evaluate
y_pred_r = risk_model.predict(X_test_r)
risk_accuracy = accuracy_score(y_test_r, y_pred_r)
print(f"\n   ✅ Accuracy: {risk_accuracy:.4f} ({risk_accuracy * 100:.1f}%)")

# Cross-validation
cv_scores_r = cross_val_score(risk_model, X, y_risk, cv=StratifiedKFold(5, shuffle=True, random_state=42), scoring='accuracy')
print(f"   📈 5-Fold CV Accuracy: {cv_scores_r.mean():.4f} ± {cv_scores_r.std():.4f}")

print(f"\n   Classification Report:")
print(classification_report(y_test_r, y_pred_r, target_names=risk_le.classes_, zero_division=0))

# Feature importance for Risk
feature_importance_risk = pd.Series(risk_model.feature_importances_, index=X.columns).sort_values(ascending=False)
print("   Top 10 Features for Risk Classification:")
for feat, imp in feature_importance_risk.head(10).items():
    print(f"      {feat:35s} → {imp:.4f}")

# ─────────────────────────────── DEPARTMENT MODEL ───────────────────────────────
print("\n" + "─" * 70)
print("  MODEL 2: Department Classifier")
print("─" * 70)

X_train_d, X_test_d, y_train_d, y_test_d = train_test_split(
    X, y_dept, test_size=0.2, random_state=42, stratify=y_dept
)
print(f"   Train: {len(X_train_d)} | Test: {len(X_test_d)}")

# Train Department model
dept_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=20,
    min_samples_split=3,
    min_samples_leaf=2,
    class_weight='balanced',
    random_state=42,
    n_jobs=-1,
)
dept_model.fit(X_train_d, y_train_d)

# Evaluate
y_pred_d = dept_model.predict(X_test_d)
dept_accuracy = accuracy_score(y_test_d, y_pred_d)
print(f"\n   ✅ Accuracy: {dept_accuracy:.4f} ({dept_accuracy * 100:.1f}%)")

cv_scores_d = cross_val_score(dept_model, X, y_dept, cv=StratifiedKFold(5, shuffle=True, random_state=42), scoring='accuracy')
print(f"   📈 5-Fold CV Accuracy: {cv_scores_d.mean():.4f} ± {cv_scores_d.std():.4f}")

print(f"\n   Classification Report:")
print(classification_report(y_test_d, y_pred_d, target_names=dept_le.classes_, zero_division=0))

# Feature importance for Department
feature_importance_dept = pd.Series(dept_model.feature_importances_, index=X.columns).sort_values(ascending=False)
print("   Top 10 Features for Department Classification:")
for feat, imp in feature_importance_dept.head(10).items():
    print(f"      {feat:35s} → {imp:.4f}")

# ─────────────────────────────── SAVE MODELS ───────────────────────────────
print("\n" + "─" * 70)
print("  💾 Saving Models & Artifacts")
print("─" * 70)

# Save models
joblib.dump(risk_model, os.path.join(MODEL_DIR, 'risk_classifier.joblib'))
joblib.dump(dept_model, os.path.join(MODEL_DIR, 'dept_classifier.joblib'))

# Save encoders
joblib.dump(risk_le, os.path.join(MODEL_DIR, 'risk_label_encoder.joblib'))
joblib.dump(dept_le, os.path.join(MODEL_DIR, 'dept_label_encoder.joblib'))
joblib.dump(symptom_mlb, os.path.join(MODEL_DIR, 'symptom_binarizer.joblib'))
joblib.dump(condition_mlb, os.path.join(MODEL_DIR, 'condition_binarizer.joblib'))

# Save feature metadata for inference
feature_meta = {
    'feature_columns': list(X.columns),
    'symptom_classes': list(symptom_mlb.classes_),
    'condition_classes': list(condition_mlb.classes_),
    'gender_categories': list(gender_dummies.columns),
    'risk_classes': list(risk_le.classes_),
    'dept_classes': list(dept_le.classes_),
    'numeric_features': ['Age', 'Blood_Pressure_Systolic', 'Heart_Rate', 'Temperature_F'],
    'model_metrics': {
        'risk_accuracy': float(risk_accuracy),
        'risk_cv_mean': float(cv_scores_r.mean()),
        'risk_cv_std': float(cv_scores_r.std()),
        'dept_accuracy': float(dept_accuracy),
        'dept_cv_mean': float(cv_scores_d.mean()),
        'dept_cv_std': float(cv_scores_d.std()),
    },
    'training_samples': len(df),
    'feature_count': X.shape[1],
}

with open(os.path.join(MODEL_DIR, 'feature_metadata.json'), 'w') as f:
    json.dump(feature_meta, f, indent=2)

print(f"   ✓ risk_classifier.joblib")
print(f"   ✓ dept_classifier.joblib")
print(f"   ✓ risk_label_encoder.joblib")
print(f"   ✓ dept_label_encoder.joblib")
print(f"   ✓ symptom_binarizer.joblib")
print(f"   ✓ condition_binarizer.joblib")
print(f"   ✓ feature_metadata.json")

# ─────────────────────────────── SUMMARY ───────────────────────────────
print("\n" + "=" * 70)
print("  ✅ TRAINING COMPLETE")
print("=" * 70)
print(f"   Risk Level Classifier  → {risk_accuracy * 100:.1f}% accuracy (CV: {cv_scores_r.mean() * 100:.1f}%)")
print(f"   Department Classifier  → {dept_accuracy * 100:.1f}% accuracy (CV: {cv_scores_d.mean() * 100:.1f}%)")
print(f"   Feature dimensions     → {X.shape[1]} features")
print(f"   Models saved to        → {MODEL_DIR}")
print("=" * 70)
