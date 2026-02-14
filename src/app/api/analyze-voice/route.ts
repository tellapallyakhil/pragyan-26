import { NextRequest, NextResponse } from 'next/server';
import { extractSymptomsFromTranscript } from '@/lib/openrouter';

/**
 * POST /api/analyze-voice
 * 
 * OpenRouter USE #2: Smart NLP Symptom Extraction
 * Takes a voice transcript in any language, uses LLM to extract
 * structured symptoms, conditions, and urgency assessment.
 */
export async function POST(request: NextRequest) {
    try {
        const { transcript, language } = await request.json();

        if (!transcript || transcript.trim().length < 3) {
            return NextResponse.json(
                { error: 'Transcript is too short or empty' },
                { status: 400 }
            );
        }

        console.log(`[Voice Analysis API] Processing transcript (${language}): "${transcript.substring(0, 100)}..."`);

        const result = await extractSymptomsFromTranscript(transcript, language || 'en');

        if (!result) {
            return NextResponse.json({
                symptoms: [],
                conditions: [],
                urgencyHint: 'unknown',
                summary: 'AI analysis unavailable. Please select symptoms manually.',
                aiPowered: false,
            });
        }

        console.log(`[Voice Analysis API] Extracted ${result.symptoms.length} symptoms, ${result.conditions.length} conditions`);

        return NextResponse.json({
            ...result,
            aiPowered: true,
        });
    } catch (error) {
        console.error('[Voice Analysis API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze voice transcript' },
            { status: 500 }
        );
    }
}
