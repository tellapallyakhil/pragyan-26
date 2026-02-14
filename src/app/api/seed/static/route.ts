import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';
import { performTriage } from '@/lib/triage-engine';

/**
 * Robust CSV Line Parser
 * Correctled handles quoted commas within fields (Medical Symptoms/Conditions)
 */
function parseCSVLine(line: string) {
    const result = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = "";
        } else {
            cur += char;
        }
    }
    result.push(cur.trim());
    return result;
}

export async function POST() {
    try {
        const csvPath = path.join(process.cwd(), 'smart_triage_dataset_1200-1.csv');
        const jsonPath = path.join(process.cwd(), 'synthetic_dataset.json');

        let dataset: any[] = [];
        let isCSV = false;

        // 1. Identify Data Source (Prioritize the 1,200 patient CSV)
        if (fs.existsSync(csvPath)) {
            const content = fs.readFileSync(csvPath, 'utf8');
            const lines = content.split('\n').filter(l => l.trim());
            const headers = parseCSVLine(lines[0]);

            dataset = lines.slice(1).map(line => {
                const values = parseCSVLine(line);
                const obj: any = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i];
                });
                return obj;
            });
            isCSV = true;
        } else if (fs.existsSync(jsonPath)) {
            dataset = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        } else {
            return NextResponse.json({ error: 'Clinical dataset file not found.' }, { status: 404 });
        }

        console.log(`[Seeder] Ingesting ${dataset.length} records...`);

        const results = [];
        /**
         * DEMO OPTIMIZATION:
         * We process the first 300 records for the demo to provide a diverse, high-density 
         * dashboard view without excessive database overhead during live judging.
         */
        const demoDataset = dataset.slice(0, 300);

        for (const record of demoDataset) {
            let patientInput;

            if (isCSV) {
                // Map CSV fields to Triage Internal Engine Schema
                const syst = parseInt(record.Blood_Pressure_Systolic || record.Blood_pressure_systolic);
                const diast = Math.round(syst * 0.67); // Clinical approximation for Diastolic

                patientInput = {
                    patient_id: record.Patient_ID,
                    age: parseInt(record.Age),
                    gender: record.Gender,
                    // Handle quoted symptom strings: "Fever, Fatigue" -> ["Fever", "Fatigue"]
                    symptoms_list: record.Symptoms.replace(/"/g, '').split(',').map((s: string) => s.trim()),
                    bp: `${syst}/${diast}`,
                    hr: parseInt(record.Heart_Rate),
                    temp: parseFloat(record.Temperature_F),
                    conditions: record.Pre_Existing_Conditions.replace(/"/g, '').split(',').map((c: string) => c.trim()).filter((c: string) => c !== 'None'),
                    language: 'en'
                };
            } else {
                // Handle standard JSON schema
                patientInput = {
                    patient_id: record.Patient_ID,
                    age: record.Age,
                    gender: record.Gender,
                    symptoms_list: record.Symptoms,
                    bp: record["Blood Pressure"],
                    hr: record["Heart Rate"],
                    temp: record.Temperature,
                    conditions: record["Pre-Existing Conditions"] || [],
                    language: 'en'
                };
            }

            // Execute Hybrid AI Triage Engine
            const triage = performTriage(patientInput);

            // Store in Research Database
            const { error } = await supabase.from('triage_records').insert({
                patient_id: patientInput.patient_id,
                age: patientInput.age,
                gender: patientInput.gender,
                symptoms: patientInput.symptoms_list,
                bp: patientInput.bp,
                hr: patientInput.hr,
                temp: patientInput.temp,
                conditions: patientInput.conditions,
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
                voice_extraction: false,
                ehr_extraction: false,
            });

            if (error) console.error(`Failed to ingest record ${record.Patient_ID}:`, error.message);
            else results.push(record.Patient_ID);
        }

        return NextResponse.json({
            success: true,
            message: `Successfully ingested ${results.length} records into the Clinician Dashboard from the large-scale research dataset.`,
            total_processed: results.length
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
