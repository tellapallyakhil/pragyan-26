import { NextRequest, NextResponse } from 'next/server';
import { performTriage } from '@/lib/triage-engine';
import { PatientInput } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { generateClinicalReasoning } from '@/lib/openrouter';

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

        // Step 1: Rule-based triage engine
        const result = performTriage(body);

        // Step 2: LLM-Enhanced Clinical Reasoning (OpenRouter - USE #1)
        // This enriches the rule-based output with AI-generated analysis
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
                // Append AI reasoning to the existing clinical reasoning
                result.clinical_reasoning = result.clinical_reasoning +
                    '\n\n🤖 AI-Enhanced Analysis:\n' + aiReasoning;
                console.log('[Triage API] OpenRouter AI reasoning attached successfully');
            }
        } catch (aiError) {
            console.warn('[Triage API] OpenRouter AI reasoning skipped:', aiError);
            // Continue with rule-based reasoning only — graceful degradation
        }

        // Step 3: Store in Supabase (if configured)
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
