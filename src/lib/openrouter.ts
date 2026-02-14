/**
 * OpenRouter AI Client
 * Uses free models via OpenRouter API for intelligent clinical analysis.
 * 
 * USED IN:
 * 1. /api/triage — Enhanced clinical reasoning after rule-based engine
 * 2. /api/analyze-voice — Smart symptom extraction from voice transcripts
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openrouter/free'; // Auto-routes to best available free model

interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OpenRouterResponse {
    choices?: {
        message: {
            content: string;
        };
    }[];
    error?: {
        message: string;
        code: number;
    };
}

/**
 * Send a chat completion request to OpenRouter
 */
export async function chatCompletion(
    messages: OpenRouterMessage[],
    options?: { maxTokens?: number; temperature?: number }
): Promise<string | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.warn('[OpenRouter] No API key found in OPENROUTER_API_KEY');
        return null;
    }

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://triageai.app',
                'X-Title': 'TriageAI Clinical Decision Support',
            },
            body: JSON.stringify({
                model: MODEL,
                messages,
                max_tokens: options?.maxTokens ?? 500,
                temperature: options?.temperature ?? 0.3,
            }),
        });

        const data: OpenRouterResponse = await response.json();

        if (data.error) {
            console.error('[OpenRouter] API Error:', data.error.message);
            return null;
        }

        return data.choices?.[0]?.message?.content?.trim() || null;
    } catch (error) {
        console.error('[OpenRouter] Request failed:', error);
        return null;
    }
}

/**
 * USE #1: Enhanced Clinical Reasoning
 * Takes rule-based triage output and generates detailed AI clinical analysis.
 */
export async function generateClinicalReasoning(patientData: {
    age: string;
    gender: string;
    symptoms: string[];
    conditions: string[];
    bp_systolic: string;
    bp_diastolic: string;
    hr: string;
    temp: string;
    riskLevel: string;
    department: string;
}): Promise<string | null> {
    const prompt = `You are an expert clinical triage AI assistant. Based on the following patient data, provide a concise but detailed clinical reasoning analysis in 3-4 sentences.

Patient: ${patientData.age}yr ${patientData.gender}
Symptoms: ${patientData.symptoms.join(', ') || 'None reported'}
Pre-existing Conditions: ${patientData.conditions.join(', ') || 'None'}
Vitals: BP ${patientData.bp_systolic}/${patientData.bp_diastolic} mmHg, HR ${patientData.hr} bpm, Temp ${patientData.temp}°F
Rule-based Risk: ${patientData.riskLevel}
Suggested Department: ${patientData.department}

Provide:
1. Clinical reasoning for the risk level (1-2 sentences)
2. Key clinical concern (1 sentence)
3. Immediate priority action (1 sentence)

Be specific, clinical, and concise. Do not use bullet points or headers.`;

    return chatCompletion([
        { role: 'system', content: 'You are a clinical triage decision support AI. Be precise, evidence-based, and concise. Always mention specific clinical indicators.' },
        { role: 'user', content: prompt },
    ], { maxTokens: 300, temperature: 0.3 });
}

/**
 * USE #2: Smart Symptom Extraction from Voice Transcript
 * Parses natural language (any language) and returns structured symptom list.
 */
export async function extractSymptomsFromTranscript(transcript: string, language: string = 'en'): Promise<{
    symptoms: string[];
    conditions: string[];
    urgencyHint: string;
    summary: string;
} | null> {
    const validSymptoms = [
        'Chest Pain', 'Shortness of Breath', 'Headache', 'Fever', 'Dizziness',
        'Nausea', 'Vomiting', 'Abdominal Pain', 'Back Pain', 'Fatigue',
        'Cough', 'Sore Throat', 'Joint Pain', 'Muscle Weakness', 'Vision Changes',
        'Numbness/Tingling', 'Palpitations', 'Swelling', 'Confusion',
        'Difficulty Speaking', 'Loss of Consciousness', 'Seizure', 'Bleeding',
        'Rash', 'Difficulty Swallowing',
    ];

    const validConditions = [
        'Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'COPD',
        'Cancer', 'Kidney Disease', 'Liver Disease', 'Stroke History',
        'Epilepsy', 'HIV/AIDS', 'Thyroid Disorder', 'Arthritis',
        'Depression/Anxiety', 'Pregnancy',
    ];

    const prompt = `You are a clinical NLP assistant. Analyze this patient transcript (may be in ${language}) and extract structured medical data.

TRANSCRIPT: "${transcript}"

From the transcript, identify:
1. SYMPTOMS: Match ONLY from this list: ${validSymptoms.join(', ')}
2. CONDITIONS: Match ONLY from this list: ${validConditions.join(', ')}
3. URGENCY: Rate as "low", "medium", or "high" based on the described symptoms
4. SUMMARY: One sentence clinical summary in English

Respond ONLY in this exact JSON format (no markdown, no explanation):
{"symptoms":["Symptom1","Symptom2"],"conditions":["Condition1"],"urgencyHint":"medium","summary":"Patient reports..."}`;

    const result = await chatCompletion([
        { role: 'system', content: 'You are a medical NLP parser. Always respond with valid JSON only. No markdown, no explanation.' },
        { role: 'user', content: prompt },
    ], { maxTokens: 200, temperature: 0.1 });

    if (!result) return null;

    try {
        // Extract JSON from response (handle cases where model adds extra text)
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            symptoms: (parsed.symptoms || []).filter((s: string) => validSymptoms.includes(s)),
            conditions: (parsed.conditions || []).filter((c: string) => validConditions.includes(c)),
            urgencyHint: parsed.urgencyHint || 'medium',
            summary: parsed.summary || '',
        };
    } catch {
        console.error('[OpenRouter] Failed to parse symptom extraction response');
        return null;
    }
}
