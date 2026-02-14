// =============================================
// Clinical Triage Decision Support System Types
// =============================================

export interface PatientInput {
    patient_id: string;
    age: number;
    gender: string;
    symptoms_list: string[];
    voice_transcript?: string;
    ehr_text?: string;
    bp: string; // e.g., "120/80"
    hr: number; // heart rate bpm
    temp: number; // temperature in °F
    conditions: string[];
    previous_risk?: string;
    trend_data?: HistoricalRecord[];
    language: string;
}

export interface HistoricalRecord {
    date: string;
    risk_level: string;
    risk_probability: number;
    vitals: {
        bp: string;
        hr: number;
        temp: number;
    };
    symptoms: string[];
}

export interface VoiceExtraction {
    symptoms: string[];
    severity_clues: string;
    emergency_flags: string;
}

export interface EHRExtraction {
    symptoms: string[];
    vitals: Record<string, string | number>;
    abnormal_findings: string[];
    chronic_conditions: string[];
}

export interface TriageResult {
    risk_level: 'Low' | 'Medium' | 'High';
    risk_probability: number;
    confidence_score: number;
    recommended_department: string;
    priority_level: number;
    contributing_factors: string[];
    clinical_reasoning: string;
    suggested_followup_tests: string[];
    trend_analysis: string;
    fairness_check_note: string;
    extracted_from_voice: VoiceExtraction;
    extracted_from_ehr: EHRExtraction;
}

export interface PatientRecord {
    id: string;
    patient_id: string;
    patient_name?: string;
    age: number;
    gender: string;
    symptoms: string[];
    bp: string;
    hr: number;
    temp: number;
    conditions: string[];
    risk_level: string;
    risk_probability: number;
    confidence_score: number;
    recommended_department: string;
    priority_level: number;
    contributing_factors: string[];
    clinical_reasoning: string;
    suggested_followup_tests: string[];
    trend_analysis: string;
    fairness_check_note: string;
    voice_extraction: VoiceExtraction | null;
    ehr_extraction: EHRExtraction | null;
    created_at: string;
}

// Supported languages for multilingual output
export type SupportedLanguage =
    | 'en'
    | 'es'
    | 'fr'
    | 'de'
    | 'hi'
    | 'ta'
    | 'te'
    | 'zh'
    | 'ar'
    | 'ja';

export const LANGUAGE_MAP: Record<SupportedLanguage, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    hi: 'हिन्दी',
    ta: 'தமிழ்',
    te: 'తెలుగు',
    zh: '中文',
    ar: 'العربية',
    ja: '日本語',
};

export const DEPARTMENTS = [
    'General Medicine',
    'Cardiology',
    'Emergency',
    'Neurology',
    'Orthopedics',
    'Pulmonology',
    'Gastroenterology',
] as const;

export const SYMPTOM_OPTIONS = [
    'Chest Pain',
    'Shortness of Breath',
    'Headache',
    'Fever',
    'Dizziness',
    'Nausea',
    'Vomiting',
    'Abdominal Pain',
    'Back Pain',
    'Fatigue',
    'Cough',
    'Sore Throat',
    'Joint Pain',
    'Muscle Weakness',
    'Vision Changes',
    'Numbness/Tingling',
    'Palpitations',
    'Swelling',
    'Weight Loss',
    'Loss of Consciousness',
    'Seizure',
    'Confusion',
    'Difficulty Speaking',
    'Difficulty Walking',
    'Bleeding',
] as const;

export const CONDITION_OPTIONS = [
    'Diabetes',
    'Hypertension',
    'Heart Disease',
    'Asthma',
    'COPD',
    'Stroke History',
    'Cancer',
    'Kidney Disease',
    'Liver Disease',
    'Obesity',
    'Thyroid Disorder',
    'Epilepsy',
    'Depression',
    'Anxiety',
    'Arthritis',
] as const;
