"""
TriageAI — ML API Server
==========================
Flask API that exposes the trained ML models for the Next.js frontend.
Runs on port 5000.

Endpoint:
  POST /api/ml/classify
  Body: { age, gender, symptoms, blood_pressure_systolic, heart_rate, temperature_f, pre_existing_conditions }
  Returns: { risk_level, risk_confidence, department, department_confidence, ... }
"""

import os
import sys
import warnings
warnings.filterwarnings('ignore')

from flask import Flask, request, jsonify
from flask_cors import CORS

# Add parent dir to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from inference import classify, feature_meta

app = Flask(__name__)
CORS(app)  # Allow Next.js frontend to call this API


@app.route('/api/ml/classify', methods=['POST'])
def classify_patient():
    """Classify a patient's risk level and recommended department."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON body provided'}), 400

        # Extract and validate fields
        age = int(data.get('age', 0))
        gender = str(data.get('gender', 'Other'))
        symptoms = data.get('symptoms', [])
        bp = int(data.get('blood_pressure_systolic', 120))
        hr = int(data.get('heart_rate', 80))
        temp = float(data.get('temperature_f', 98.6))
        conditions = data.get('pre_existing_conditions', [])

        # Handle symptoms as string or list
        if isinstance(symptoms, str):
            symptoms = [s.strip() for s in symptoms.split(',')]

        if isinstance(conditions, str):
            conditions = [c.strip() for c in conditions.split(',')]

        result = classify(
            age=age,
            gender=gender,
            symptoms=symptoms,
            blood_pressure_systolic=bp,
            heart_rate=hr,
            temperature_f=temp,
            pre_existing_conditions=conditions,
        )

        return jsonify({
            'success': True,
            **result,
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/ml/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'model_info': {
            'risk_accuracy': feature_meta['model_metrics']['risk_accuracy'],
            'dept_accuracy': feature_meta['model_metrics']['dept_accuracy'],
            'features': feature_meta['feature_count'],
            'training_samples': feature_meta['training_samples'],
            'symptom_classes': feature_meta['symptom_classes'],
            'department_classes': feature_meta['dept_classes'],
            'risk_classes': feature_meta['risk_classes'],
        }
    })


@app.route('/api/ml/metadata', methods=['GET'])
def metadata():
    """Return full model metadata."""
    return jsonify(feature_meta)


if __name__ == '__main__':
    print("=" * 60)
    print("  TriageAI ML API Server")
    print("=" * 60)
    print(f"  Risk Model Accuracy:  {feature_meta['model_metrics']['risk_accuracy']*100:.1f}%")
    print(f"  Dept Model Accuracy:  {feature_meta['model_metrics']['dept_accuracy']*100:.1f}%")
    print(f"  Features:             {feature_meta['feature_count']}")
    print(f"  Endpoints:")
    print(f"    POST /api/ml/classify")
    print(f"    GET  /api/ml/health")
    print(f"    GET  /api/ml/metadata")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=False)
