"""
TriageAI — ML Prediction Script (called by Node.js)
=====================================================
Takes JSON input via stdin, runs the ML model, outputs JSON to stdout.
This is the bridge between the Next.js API route and the Python ML model.
"""

import sys
import os
import json
import warnings
warnings.filterwarnings('ignore')

# Add ml dir to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
from inference import classify

def main():
    try:
        # Read JSON from stdin
        input_data = json.loads(sys.stdin.read())

        result = classify(
            age=int(input_data.get('age', 0)),
            gender=str(input_data.get('gender', 'Other')),
            symptoms=input_data.get('symptoms', []),
            blood_pressure_systolic=int(input_data.get('blood_pressure_systolic', 120)),
            heart_rate=int(input_data.get('heart_rate', 80)),
            temperature_f=float(input_data.get('temperature_f', 98.6)),
            pre_existing_conditions=input_data.get('pre_existing_conditions', []),
        )

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
