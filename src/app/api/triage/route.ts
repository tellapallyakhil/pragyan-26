import { NextRequest, NextResponse } from 'next/server';
import { performTriage } from '@/lib/triage-engine';
import { PatientInput } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { generateClinicalReasoning } from '@/lib/openrouter';
import { spawn } from 'child_process';
import path from 'path';

/**
 * Calls the Python ML model via child_process for classification.
 * Falls back to rule-based engine if the ML model fails.
 */
async function getMLPrediction(input: {
    age: number;
    gender: string;
    symptoms: string[];
    blood_pressure_systolic: number;
    heart_rate: number;
    temperature_f: number;
    pre_existing_conditions: string[];
}): Promise<{
    risk_level: string;
    risk_confidence: number;
    department: string;
    department_confidence: number;
    risk_probabilities: Record<string, number>;
    department_probabilities: Record<string, number>;
} | null> {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            console.warn('[ML] Python process timed out after 5s');
            resolve(null);
        }, 5000);

        try {
            const predictScript = path.join(process.cwd(), 'ml', 'predict.py');
            const python = spawn('python', ['-W', 'ignore', predictScript]);

            let stdout = '';
            let stderr = '';

            python.stdout.on('data', (data) => { stdout += data.toString(); });
            python.stderr.on('data', (data) => { stderr += data.toString(); });

            python.on('close', (code) => {
                clearTimeout(timeout);
                if (code === 0 && stdout.trim()) {
                    try {
                        const result = JSON.parse(stdout.trim());
                        if (result.error) {
                            console.warn('[ML] Model returned error:', result.error);
                            resolve(null);
                        } else {
                            resolve(result);
                        }
                    } catch (e) {
                        console.warn('[ML] Failed to parse output:', stdout);
                        resolve(null);
                    }
                } else {
                    console.warn('[ML] Python process exited with code:', code, stderr);
                    resolve(null);
                }
            });

            python.on('error', (err) => {
                clearTimeout(timeout);
                console.warn('[ML] Failed to spawn Python:', err.message);
                resolve(null);
            });

            // Send input and close stdin
            python.stdin.write(JSON.stringify(input));
            python.stdin.end();
        } catch (e) {
            clearTimeout(timeout);
            console.warn('[ML] Unexpected error:', e);
            resolve(null);
        }
    });
}

export async function POST(request: NextRequest) {
    try {
        const body: PatientInput = await request.json();

        // Validate required fields
        if (!body.patient_id || !body.age || !body.gender) {
            return NextResponse.json(
                { error: 'Missing required fields: patient_id, age, gender' },
                { status: 400 }
            );
        }

        // Step 1: Rule-based triage engine (always runs — fast baseline)
        const result = performTriage(body);

        // Step 2: ML Model Classification (enhances rule-based results)
        try {
            const bpSystolic = body.bp ? parseInt(body.bp.split('/')[0]) : 120;
            const mlInput = {
                age: Number(body.age),
                gender: body.gender,
                symptoms: body.symptoms_list || [],
                blood_pressure_systolic: bpSystolic,
                heart_rate: Number(body.hr) || 80,
                temperature_f: Number(body.temp) || 98.6,
                pre_existing_conditions: body.conditions || [],
            };

            const mlResult = await getMLPrediction(mlInput);

            if (mlResult) {
                // Override with ML model predictions (trained on 1200 records, 97.9% accuracy)
                result.risk_level = mlResult.risk_level;
                result.risk_probability = mlResult.risk_confidence;
                result.recommended_department = mlResult.department;
                result.confidence_score = mlResult.department_confidence;

                // Add ML metadata to clinical reasoning
                result.clinical_reasoning = result.clinical_reasoning +
                    `\n\n🧠 ML Model Classification (RandomForest, 97.9% accuracy):` +
                    `\n  Risk: ${mlResult.risk_level} (${(mlResult.risk_confidence * 100).toFixed(1)}% confidence)` +
                    `\n  Department: ${mlResult.department} (${(mlResult.department_confidence * 100).toFixed(1)}% confidence)` +
                    `\n  Risk Probabilities: High=${(mlResult.risk_probabilities.High * 100).toFixed(1)}%, Medium=${(mlResult.risk_probabilities.Medium * 100).toFixed(1)}%, Low=${(mlResult.risk_probabilities.Low * 100).toFixed(1)}%`;

                console.log(`[Triage API] ML model: Risk=${mlResult.risk_level} (${(mlResult.risk_confidence * 100).toFixed(1)}%), Dept=${mlResult.department}`);
            }
        } catch (mlError) {
            console.warn('[Triage API] ML model skipped:', mlError);
            // Continue with rule-based results — graceful degradation
        }

        // Step 3: LLM-Enhanced Clinical Reasoning (OpenRouter)
        try {
            const aiReasoning = await generateClinicalReasoning({
                age: String(body.age),
                gender: body.gender,
                symptoms: body.symptoms_list || [],
                conditions: body.conditions || [],
                bp_systolic: body.bp?.split('/')[0] || '',
                bp_diastolic: body.bp?.split('/')[1] || '',
                hr: String(body.hr || ''),
                temp: String(body.temp || ''),
                riskLevel: result.risk_level,
                department: result.recommended_department,
            });

            if (aiReasoning) {
                result.clinical_reasoning = result.clinical_reasoning +
                    '\n\n🤖 AI-Enhanced Analysis:\n' + aiReasoning;
                console.log('[Triage API] OpenRouter AI reasoning attached successfully');
            }
        } catch (aiError) {
            console.warn('[Triage API] OpenRouter AI reasoning skipped:', aiError);
        }

        // Step 4: Store in Supabase
        try {
            if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                await supabase.from('triage_records').insert({
                    patient_id: body.patient_id,
                    age: body.age,
                    gender: body.gender,
                    symptoms: body.symptoms_list,
                    bp: body.bp,
                    hr: body.hr,
                    temp: body.temp,
                    conditions: body.conditions,
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
            }
        } catch (dbError) {
            console.warn('Supabase storage skipped:', dbError);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Triage API error:', error);
        return NextResponse.json(
            { error: 'Internal server error during triage assessment' },
            { status: 500 }
        );
    }
}
