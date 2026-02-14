import { PatientInput, SYMPTOM_OPTIONS, CONDITION_OPTIONS, SupportedLanguage } from './types';
import { performTriage } from './triage-engine';
import { supabase } from './supabase';

/**
 * Synthetic Clinical Data Generator
 * Implements a "Data Vault" style generation strategy with clinical correlations.
 * Used for model validation, analytics testing, and clinical demonstrations.
 */

interface GenerationConfig {
    count: number;
    biasTowardsHighRisk?: boolean;
}

export class ClinicalDataVault {
    private languages: SupportedLanguage[] = ['en', 'es', 'fr', 'de'];
    private genders = ['Male', 'Female', 'Other'];

    /**
     * Generates a single synthetic patient with realistic medical correlations
     */
    private generatePatient(): PatientInput {
        // 1. Demographics
        const age = Math.floor(Math.random() * 85) + 5; // 5 to 90 years old
        const gender = this.genders[Math.floor(Math.random() * this.genders.length)];
        const language = this.languages[Math.floor(Math.random() * this.languages.length)];

        // 2. Base Vitals (Normal ranges)
        let syst = 100 + Math.floor(Math.random() * 40);
        let diast = 60 + Math.floor(Math.random() * 30);
        let hr = 60 + Math.floor(Math.random() * 40);
        let temp = 97.5 + (Math.random() * 2);

        // 3. Clinical Correlations (The "Intelligence" of the generator)
        const symptoms: string[] = [];
        const conditions: string[] = [];

        // Rule: Older patients (Age > 65) are more likely to have Hypertension/Diabetes
        if (age > 65) {
            if (Math.random() > 0.4) conditions.push('Hypertension');
            if (Math.random() > 0.5) conditions.push('Diabetes');
            // Age-related vitals drift
            syst += 15;
            diast += 5;
        }

        // Correlation: If Hypertension exists, higher chance of Chest Pain
        if (conditions.includes('Hypertension') && Math.random() > 0.7) {
            symptoms.push('Chest Pain');
            syst += 30; // Hypertensive urgency simulation
        }

        // Correlation: Obesity/Diabetes -> Heart Disease risk
        if (Math.random() > 0.8) conditions.push('Obesity');
        if (conditions.includes('Obesity') && Math.random() > 0.6) {
            conditions.push('Heart Disease');
        }

        // Random Symptoms
        const randomSymptomCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < randomSymptomCount; i++) {
            const s = SYMPTOM_OPTIONS[Math.floor(Math.random() * SYMPTOM_OPTIONS.length)];
            if (!symptoms.includes(s)) symptoms.push(s);
        }

        // Emergency Scenario Simulation (15% chance)
        if (Math.random() > 0.85) {
            // High Risk Cardiac Event
            symptoms.push('Chest Pain', 'Shortness of Breath', 'Palpitations');
            syst = 190 + Math.floor(Math.random() * 30);
            diast = 110 + Math.floor(Math.random() * 20);
            hr = 110 + Math.floor(Math.random() * 30);
        } else if (Math.random() > 0.9) {
            // High Risk Infection/Sepsis
            symptoms.push('Fever', 'Confusion', 'Dizziness');
            temp = 103 + Math.random() * 2;
            hr = 120 + Math.floor(Math.random() * 20);
        }

        return {
            patient_id: `SYN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            age,
            gender,
            language,
            symptoms_list: symptoms,
            bp: `${syst}/${diast}`,
            hr,
            temp: parseFloat(temp.toFixed(1)),
            conditions,
            previous_risk: Math.random() > 0.7 ? ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] : undefined
        };
    }

    /**
     * Generates a batch of synthetic records and stores them in Supabase
     */
    async generateAndSeed(config: GenerationConfig) {
        console.log(`[ClinicalDataVault] Generating ${config.count} synthetic patients...`);
        const results = [];

        for (let i = 0; i < config.count; i++) {
            const patient = this.generatePatient();
            const triage = performTriage(patient);

            const { error } = await supabase.from('triage_records').insert({
                patient_id: patient.patient_id,
                age: patient.age,
                gender: patient.gender,
                symptoms: patient.symptoms_list,
                bp: patient.bp,
                hr: patient.hr,
                temp: patient.temp,
                conditions: patient.conditions,
                risk_level: triage.risk_level,
                risk_probability: triage.risk_probability,
                confidence_score: triage.confidence_score,
                recommended_department: triage.recommended_department,
                priority_level: triage.priority_level,
                contributing_factors: triage.contributing_factors,
                clinical_reasoning: triage.clinical_reasoning,
                suggested_followup_tests: triage.suggested_followup_tests,
                trend_analysis: triage.trend_analysis,
                fairness_check_note: triage.fairness_check_note,
                voice_extraction: triage.extracted_from_voice,
                ehr_extraction: triage.extracted_from_ehr,
            });

            if (error) {
                console.error(`Failed to insert synthetic record ${i}:`, error.message);
            } else {
                results.push(triage);
            }
        }

        console.log(`[ClinicalDataVault] Successfully generated and seeded ${results.length} records.`);
        return results;
    }
}
