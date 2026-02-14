import { supabase } from './supabase';
import { performTriage } from './triage-engine';
import { PatientInput } from './types';

export async function seedTestData() {
    const testPatients: PatientInput[] = [
        {
            patient_id: 'PT-010',
            age: 78,
            gender: 'Male',
            language: 'en',
            symptoms_list: ['Chest Pain', 'Shortness of Breath', 'Palpitations'],
            bp: '195/125',
            hr: 118,
            temp: 99.1,
            conditions: ['Hypertension', 'Heart Disease'],
            previous_risk: 'High',
        },
        {
            patient_id: 'PT-011',
            age: 24,
            gender: 'Female',
            language: 'en',
            symptoms_list: ['Headache', 'Fever', 'Sore Throat'],
            bp: '118/72',
            hr: 82,
            temp: 102.4,
            conditions: [],
            previous_risk: 'Low',
        },
        {
            patient_id: 'PT-012',
            age: 52,
            gender: 'Female',
            language: 'en',
            symptoms_list: ['Abdominal Pain', 'Nausea', 'Vomiting'],
            bp: '142/92',
            hr: 94,
            temp: 100.8,
            conditions: ['Obesity', 'Diabetes'],
            previous_risk: 'Medium',
        },
        {
            patient_id: 'PT-013',
            age: 68,
            gender: 'Male',
            language: 'en',
            symptoms_list: ['Dizziness', 'Confusion', 'Difficulty Speaking'],
            bp: '178/108',
            hr: 88,
            temp: 98.4,
            conditions: ['Stroke History', 'Hypertension'],
            previous_risk: 'Medium',
        },
        {
            patient_id: 'PT-014',
            age: 19,
            gender: 'Male',
            language: 'en',
            symptoms_list: ['Cough', 'Sore Throat'],
            bp: '115/70',
            hr: 68,
            temp: 99.2,
            conditions: ['Asthma'],
            previous_risk: 'Low',
        }
    ];

    console.log('Seeding test data...');

    for (const patient of testPatients) {
        const result = performTriage(patient);

        const { error } = await supabase.from('triage_records').insert({
            patient_id: patient.patient_id,
            age: patient.age,
            gender: patient.gender,
            symptoms: patient.symptoms_list,
            bp: patient.bp,
            hr: patient.hr,
            temp: patient.temp,
            conditions: patient.conditions,
            risk_level: result.risk_level,
            risk_probability: result.risk_probability,
            confidence_score: result.confidence_score,
            recommended_department: result.recommended_department,
            priority_level: result.priority_level,
            contributing_factors: result.contributing_factors,
            clinical_reasoning: result.clinical_reasoning,
            suggested_followup_tests: result.suggested_followup_tests,
            trend_analysis: result.trend_analysis,
            fairness_check_note: result.fairness_check_note,
            voice_extraction: result.extracted_from_voice,
            ehr_extraction: result.extracted_from_ehr,
        });

        if (error) {
            console.error(`Error seeding ${patient.patient_id}:`, error.message);
        } else {
            console.log(`Successfully seeded ${patient.patient_id}`);
        }
    }

    console.log('Seeding complete.');
}
