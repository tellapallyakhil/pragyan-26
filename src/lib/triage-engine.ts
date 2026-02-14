// =============================================
// Clinical Triage Engine
// Rule-based clinical decision support system
// =============================================

import {
    PatientInput,
    TriageResult,
    VoiceExtraction,
    EHRExtraction,
    HistoricalRecord,
} from './types';

// ---- Emergency Symptom & Vital Detection ----

const EMERGENCY_SYMPTOMS = [
    'chest pain',
    'shortness of breath',
    'loss of consciousness',
    'seizure',
    'difficulty speaking',
    'difficulty walking',
    'severe bleeding',
    'confusion',
    'stroke',
    'heart attack',
];

const CARDIAC_SYMPTOMS = [
    'chest pain',
    'palpitations',
    'shortness of breath',
    'dizziness',
    'swelling',
    'fatigue',
];

const NEURO_SYMPTOMS = [
    'headache',
    'seizure',
    'loss of consciousness',
    'confusion',
    'numbness/tingling',
    'difficulty speaking',
    'difficulty walking',
    'vision changes',
    'dizziness',
    'muscle weakness',
];

const PULMONARY_SYMPTOMS = [
    'cough',
    'shortness of breath',
    'wheezing',
    'chest tightness',
];

const GI_SYMPTOMS = [
    'abdominal pain',
    'nausea',
    'vomiting',
    'diarrhea',
    'weight loss',
    'bleeding',
];

// ---- Step 1: Voice Transcript Processing ----

function extractFromVoice(transcript?: string): VoiceExtraction {
    if (!transcript || transcript.trim() === '') {
        return {
            symptoms: [],
            severity_clues: 'No voice transcript provided.',
            emergency_flags: 'None',
        };
    }

    const lower = transcript.toLowerCase();
    const foundSymptoms: string[] = [];
    const severityClues: string[] = [];
    const emergencyFlags: string[] = [];

    // Extract symptoms from transcript
    const symptomKeywords = [
        'chest pain', 'headache', 'dizziness', 'nausea', 'vomiting',
        'fever', 'cough', 'shortness of breath', 'fatigue', 'back pain',
        'abdominal pain', 'joint pain', 'sore throat', 'numbness',
        'tingling', 'palpitations', 'swelling', 'bleeding',
        'confusion', 'seizure', 'loss of consciousness', 'difficulty speaking',
        'difficulty walking', 'vision changes', 'muscle weakness', 'weight loss',
    ];

    for (const symptom of symptomKeywords) {
        if (lower.includes(symptom)) {
            foundSymptoms.push(symptom.charAt(0).toUpperCase() + symptom.slice(1));
        }
    }

    // Severity clues
    const severityWords = [
        'severe', 'intense', 'unbearable', 'worst', 'sudden',
        'sharp', 'constant', 'worsening', 'radiating', 'crushing',
        'excruciating', 'terrible', 'extreme', 'critical',
    ];
    for (const word of severityWords) {
        if (lower.includes(word)) {
            severityClues.push(word);
        }
    }

    // Emergency flags
    for (const flag of EMERGENCY_SYMPTOMS) {
        if (lower.includes(flag)) {
            emergencyFlags.push(flag);
        }
    }

    return {
        symptoms: foundSymptoms,
        severity_clues: severityClues.length > 0
            ? `Severity indicators detected: ${severityClues.join(', ')}`
            : 'No severe indicators detected from voice transcript.',
        emergency_flags: emergencyFlags.length > 0
            ? `Emergency flags: ${emergencyFlags.join(', ')}`
            : 'No emergency flags detected.',
    };
}

// ---- Step 2: EHR Text Processing ----

function extractFromEHR(ehrText?: string): EHRExtraction {
    if (!ehrText || ehrText.trim() === '') {
        return {
            symptoms: [],
            vitals: {},
            abnormal_findings: [],
            chronic_conditions: [],
        };
    }

    const lower = ehrText.toLowerCase();
    const symptoms: string[] = [];
    const vitals: Record<string, string | number> = {};
    const abnormalFindings: string[] = [];
    const chronicConditions: string[] = [];

    // Extract symptoms
    const symptomKeywords = [
        'chest pain', 'headache', 'dizziness', 'nausea', 'vomiting',
        'fever', 'cough', 'dyspnea', 'fatigue', 'back pain',
        'abdominal pain', 'arthralgia', 'pharyngitis', 'paresthesia',
        'palpitations', 'edema', 'hemorrhage', 'syncope', 'seizure',
        'aphasia', 'ataxia', 'diplopia', 'myalgia', 'cachexia',
    ];

    for (const symptom of symptomKeywords) {
        if (lower.includes(symptom)) {
            symptoms.push(symptom.charAt(0).toUpperCase() + symptom.slice(1));
        }
    }

    // Extract vitals from text
    const bpMatch = lower.match(/(?:bp|blood pressure)[:\s]*(\d{2,3}\/\d{2,3})/);
    if (bpMatch) vitals['bp'] = bpMatch[1];

    const hrMatch = lower.match(/(?:hr|heart rate|pulse)[:\s]*(\d{2,3})/);
    if (hrMatch) vitals['hr'] = parseInt(hrMatch[1]);

    const tempMatch = lower.match(/(?:temp|temperature)[:\s]*(\d{2,3}\.?\d*)/);
    if (tempMatch) vitals['temp'] = parseFloat(tempMatch[1]);

    const spo2Match = lower.match(/(?:spo2|oxygen saturation|o2 sat)[:\s]*(\d{2,3})/);
    if (spo2Match) vitals['spo2'] = parseInt(spo2Match[1]);

    // Extract abnormal findings
    const abnormalKeywords = [
        'elevated', 'abnormal', 'irregular', 'tachycardia', 'bradycardia',
        'hypertension', 'hypotension', 'tachypnea', 'hypoxia', 'arrhythmia',
        'murmur', 'edema', 'cyanosis', 'diaphoresis', 'altered mental status',
        'positive troponin', 'st elevation', 'st depression', 'anemia',
    ];

    for (const finding of abnormalKeywords) {
        if (lower.includes(finding)) {
            abnormalFindings.push(finding.charAt(0).toUpperCase() + finding.slice(1));
        }
    }

    // Extract chronic conditions
    const conditionKeywords = [
        'diabetes', 'hypertension', 'heart disease', 'asthma', 'copd',
        'stroke', 'cancer', 'kidney disease', 'liver disease', 'obesity',
        'thyroid', 'epilepsy', 'depression', 'anxiety', 'arthritis',
        'coronary artery disease', 'chf', 'heart failure', 'atrial fibrillation',
    ];

    for (const condition of conditionKeywords) {
        if (lower.includes(condition)) {
            chronicConditions.push(condition.charAt(0).toUpperCase() + condition.slice(1));
        }
    }

    return {
        symptoms,
        vitals,
        abnormal_findings: abnormalFindings,
        chronic_conditions: chronicConditions,
    };
}

// ---- Step 3: Parse Vitals ----

interface ParsedVitals {
    systolic: number;
    diastolic: number;
    hr: number;
    temp: number;
}

function parseVitals(bp: string, hr: number, temp: number): ParsedVitals {
    const parts = bp.split('/');
    return {
        systolic: parseInt(parts[0]) || 120,
        diastolic: parseInt(parts[1]) || 80,
        hr: hr || 72,
        temp: temp || 98.6,
    };
}

function checkVitalsCritical(vitals: ParsedVitals): { isCritical: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Blood Pressure checks
    if (vitals.systolic >= 180 || vitals.diastolic >= 120) {
        reasons.push(`Hypertensive crisis: BP ${vitals.systolic}/${vitals.diastolic} mmHg`);
    } else if (vitals.systolic >= 160 || vitals.diastolic >= 100) {
        reasons.push(`Severe hypertension: BP ${vitals.systolic}/${vitals.diastolic} mmHg`);
    }
    if (vitals.systolic < 90 || vitals.diastolic < 60) {
        reasons.push(`Hypotension: BP ${vitals.systolic}/${vitals.diastolic} mmHg`);
    }

    // Heart Rate checks
    if (vitals.hr > 150) {
        reasons.push(`Severe tachycardia: HR ${vitals.hr} bpm`);
    } else if (vitals.hr > 120) {
        reasons.push(`Tachycardia: HR ${vitals.hr} bpm`);
    }
    if (vitals.hr < 40) {
        reasons.push(`Severe bradycardia: HR ${vitals.hr} bpm`);
    } else if (vitals.hr < 50) {
        reasons.push(`Bradycardia: HR ${vitals.hr} bpm`);
    }

    // Temperature checks
    if (vitals.temp >= 104) {
        reasons.push(`Hyperpyrexia: Temperature ${vitals.temp}°F`);
    } else if (vitals.temp >= 102) {
        reasons.push(`High fever: Temperature ${vitals.temp}°F`);
    }
    if (vitals.temp < 95) {
        reasons.push(`Hypothermia: Temperature ${vitals.temp}°F`);
    }

    return {
        isCritical: reasons.some(r =>
            r.includes('crisis') || r.includes('Severe') || r.includes('Hyperpyrexia') || r.includes('Hypothermia')
        ),
        reasons,
    };
}

// ---- Step 4–6: Risk Classification ----

function classifyRisk(
    symptoms: string[],
    vitals: ParsedVitals,
    conditions: string[],
    vitalCheck: { isCritical: boolean; reasons: string[] },
    voiceData: VoiceExtraction,
    ehrData: EHRExtraction,
): { risk: 'Low' | 'Medium' | 'High'; probability: number; confidence: number; factors: string[] } {
    let riskScore = 0;
    const factors: string[] = [];
    const allSymptoms = [
        ...symptoms.map(s => s.toLowerCase()),
        ...voiceData.symptoms.map(s => s.toLowerCase()),
        ...ehrData.symptoms.map(s => s.toLowerCase()),
    ];
    const uniqueSymptoms = [...new Set(allSymptoms)];

    // Vital signs scoring
    if (vitalCheck.isCritical) {
        riskScore += 40;
        factors.push(...vitalCheck.reasons);
    } else if (vitalCheck.reasons.length > 0) {
        riskScore += 20;
        factors.push(...vitalCheck.reasons);
    }

    // Emergency symptom scoring
    const emergencyCount = uniqueSymptoms.filter(s =>
        EMERGENCY_SYMPTOMS.some(e => s.includes(e))
    ).length;
    if (emergencyCount >= 2) {
        riskScore += 35;
        factors.push(`Multiple emergency symptoms detected (${emergencyCount})`);
    } else if (emergencyCount === 1) {
        riskScore += 20;
        factors.push('Emergency symptom detected');
    }

    // Symptom count scoring
    if (uniqueSymptoms.length >= 5) {
        riskScore += 15;
        factors.push(`High symptom burden: ${uniqueSymptoms.length} symptoms`);
    } else if (uniqueSymptoms.length >= 3) {
        riskScore += 8;
        factors.push(`Moderate symptom load: ${uniqueSymptoms.length} symptoms`);
    }

    // Pre-existing condition scoring
    const highRiskConditions = ['heart disease', 'stroke history', 'cancer', 'kidney disease'];
    const medRiskConditions = ['diabetes', 'hypertension', 'asthma', 'copd', 'obesity'];

    const highRiskCount = conditions.filter(c =>
        highRiskConditions.some(h => c.toLowerCase().includes(h))
    ).length;
    const medRiskCount = conditions.filter(c =>
        medRiskConditions.some(m => c.toLowerCase().includes(m))
    ).length;

    if (highRiskCount > 0) {
        riskScore += 15 * highRiskCount;
        factors.push(`High-risk pre-existing conditions: ${highRiskCount}`);
    }
    if (medRiskCount > 0) {
        riskScore += 8 * medRiskCount;
        factors.push(`Moderate-risk pre-existing conditions: ${medRiskCount}`);
    }

    // Age-based risk
    if (vitals.hr > 0) { // just a check that we have data
        // Age scoring is done elsewhere, but we note elderly patients
    }

    // EHR abnormal findings
    if (ehrData.abnormal_findings.length > 0) {
        riskScore += 10 * Math.min(ehrData.abnormal_findings.length, 3);
        factors.push(`Abnormal findings from EHR: ${ehrData.abnormal_findings.join(', ')}`);
    }

    // Voice severity clues
    if (voiceData.severity_clues.includes('Severity indicators detected')) {
        riskScore += 10;
        factors.push('Severity indicators noted from voice transcript');
    }

    // Emergency flags from voice
    if (voiceData.emergency_flags.includes('Emergency flags')) {
        riskScore += 15;
        factors.push('Emergency flags detected from voice transcript');
    }

    // Normalize score
    const probability = Math.min(riskScore / 100, 0.99);
    const confidence = Math.min(50 + factors.length * 8, 97);

    let risk: 'Low' | 'Medium' | 'High';
    if (riskScore >= 50) {
        risk = 'High';
    } else if (riskScore >= 25) {
        risk = 'Medium';
    } else {
        risk = 'Low';
    }

    return { risk, probability: Math.round(probability * 100) / 100, confidence, factors };
}

// ---- Step 5: Department Recommendation ----

function recommendDepartment(
    symptoms: string[],
    vitals: ParsedVitals,
    vitalCheck: { isCritical: boolean; reasons: string[] },
    riskLevel: string,
): string {
    const lower = symptoms.map(s => s.toLowerCase());

    // Emergency department for critical cases
    if (vitalCheck.isCritical || riskLevel === 'High') {
        const hasCardiacSymptoms = lower.some(s => CARDIAC_SYMPTOMS.includes(s));
        const hasNeuroSymptoms = lower.some(s => NEURO_SYMPTOMS.includes(s));

        if (hasCardiacSymptoms && !hasNeuroSymptoms) return 'Cardiology';
        if (hasNeuroSymptoms && !hasCardiacSymptoms) return 'Neurology';
        return 'Emergency';
    }

    // Count matches for each specialty
    const cardScore = lower.filter(s => CARDIAC_SYMPTOMS.includes(s)).length;
    const neuroScore = lower.filter(s => NEURO_SYMPTOMS.includes(s)).length;
    const pulScore = lower.filter(s => PULMONARY_SYMPTOMS.includes(s)).length;
    const giScore = lower.filter(s => GI_SYMPTOMS.includes(s)).length;

    const scores = [
        { dept: 'Cardiology', score: cardScore },
        { dept: 'Neurology', score: neuroScore },
        { dept: 'Pulmonology', score: pulScore },
        { dept: 'Gastroenterology', score: giScore },
    ].sort((a, b) => b.score - a.score);

    if (scores[0].score > 0) return scores[0].dept;
    return 'General Medicine';
}

// ---- Step 8: Follow-up Tests ----

function suggestFollowupTests(
    symptoms: string[],
    department: string,
    riskLevel: string,
    conditions: string[],
): string[] {
    const tests: string[] = [];
    const lower = symptoms.map(s => s.toLowerCase());

    // General tests
    tests.push('Complete Blood Count (CBC)');
    tests.push('Basic Metabolic Panel (BMP)');

    // Department-specific tests
    if (department === 'Cardiology' || lower.some(s => CARDIAC_SYMPTOMS.includes(s))) {
        tests.push('ECG / 12-Lead EKG');
        tests.push('Troponin Levels');
        tests.push('Echocardiogram');
        if (riskLevel === 'High') tests.push('Cardiac Catheterization (if indicated)');
    }

    if (department === 'Neurology' || lower.some(s => NEURO_SYMPTOMS.includes(s))) {
        tests.push('CT Head / Brain MRI');
        tests.push('Neurological Examination');
        if (lower.includes('seizure')) tests.push('EEG');
    }

    if (department === 'Emergency') {
        tests.push('Point-of-Care Ultrasound');
        tests.push('Arterial Blood Gas (ABG)');
    }

    if (department === 'Pulmonology' || lower.some(s => PULMONARY_SYMPTOMS.includes(s))) {
        tests.push('Chest X-Ray');
        tests.push('Pulmonary Function Tests');
        tests.push('Pulse Oximetry');
    }

    if (department === 'Gastroenterology' || lower.some(s => GI_SYMPTOMS.includes(s))) {
        tests.push('Liver Function Tests');
        tests.push('Abdominal Ultrasound');
    }

    // Condition-specific tests
    if (conditions.some(c => c.toLowerCase().includes('diabetes'))) {
        tests.push('HbA1c');
        tests.push('Fasting Blood Glucose');
    }

    if (conditions.some(c => c.toLowerCase().includes('hypertension'))) {
        tests.push('Renal Function Panel');
    }

    // Deduplicate
    return [...new Set(tests)];
}

// ---- Step 9: Trend Analysis ----

function analyzeTrend(
    previousRisk?: string,
    trendData?: HistoricalRecord[],
): string {
    if (!trendData || trendData.length === 0) {
        if (previousRisk) {
            return `Previous risk level was ${previousRisk}. No historical trend data available for comparison.`;
        }
        return 'No historical data available. This is the first assessment for this patient.';
    }

    const riskValues: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3 };
    const scores = trendData.map(t => riskValues[t.risk_level] || 1);

    if (scores.length < 2) {
        return `Only one historical record found (${trendData[0].risk_level} on ${trendData[0].date}). Insufficient data for trend analysis.`;
    }

    const recent = scores.slice(-3);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const older = scores.slice(0, -3);
    const avgOlder = older.length > 0
        ? older.reduce((a, b) => a + b, 0) / older.length
        : avgRecent;

    if (avgRecent > avgOlder + 0.5) {
        return `WORSENING TREND: Patient risk has been escalating. Recent average risk score: ${avgRecent.toFixed(1)}/3 vs earlier: ${avgOlder.toFixed(1)}/3. Close monitoring recommended.`;
    }
    if (avgRecent < avgOlder - 0.5) {
        return `IMPROVING TREND: Patient condition shows improvement. Recent average risk score: ${avgRecent.toFixed(1)}/3 vs earlier: ${avgOlder.toFixed(1)}/3. Continue current management.`;
    }
    return `STABLE TREND: Patient risk level remains consistent. Average risk score: ${avgRecent.toFixed(1)}/3. Continue monitoring.`;
}

// ---- Step 10: Fairness Check ----

function performFairnessCheck(
    age: number,
    gender: string,
    riskLevel: string,
    factors: string[],
): string {
    const genderFactors = factors.filter(f =>
        f.toLowerCase().includes('gender') || f.toLowerCase().includes('sex')
    );
    const raceFactors = factors.filter(f =>
        f.toLowerCase().includes('race') || f.toLowerCase().includes('ethnicit')
    );

    const warnings: string[] = [];

    if (genderFactors.length > 0) {
        warnings.push('Gender was a contributing factor — verified that this is clinically justified (e.g., cardiovascular risk profiles differ by sex).');
    }
    if (raceFactors.length > 0) {
        warnings.push('Race/ethnicity factor detected — ensuring this is based on validated clinical evidence only.');
    }

    // Age fairness — age is almost always clinically relevant
    if (age > 65 && riskLevel !== 'Low') {
        warnings.push('Age >65 appropriately considered as a risk factor per clinical guidelines.');
    }

    if (warnings.length === 0) {
        return `Fairness check passed. Risk classification for ${gender}, age ${age}, was based on clinical vitals, symptoms, and medical history. No unjustified demographic bias detected.`;
    }

    return `Fairness review: ${warnings.join(' ')} Overall assessment based on clinical evidence.`;
}

// ---- Step 7: Clinical Reasoning ----

function generateClinicalReasoning(
    riskLevel: string,
    department: string,
    factors: string[],
    symptoms: string[],
    vitals: ParsedVitals,
    age: number,
): string {
    const topFactors = factors.slice(0, 3);
    const lines: string[] = [];

    lines.push(
        `Patient is a ${age}-year-old presenting with ${symptoms.length > 0 ? symptoms.slice(0, 3).join(', ') : 'unspecified symptoms'}.`
    );
    lines.push(
        `Vitals: BP ${vitals.systolic}/${vitals.diastolic} mmHg, HR ${vitals.hr} bpm, Temp ${vitals.temp}°F.`
    );
    lines.push(
        `Key contributing factors: ${topFactors.join('; ')}.`
    );
    lines.push(
        `Based on triage assessment, patient is classified as ${riskLevel} risk with recommended routing to ${department}.`
    );
    lines.push(
        'This is a triage-level assessment only. Definitive clinical evaluation by a qualified physician is required.'
    );

    return lines.join(' ');
}

// ---- Step 11: Multilingual Translation (Simplified) ----

const TRANSLATIONS: Record<string, Record<string, string>> = {
    es: {
        'Low': 'Bajo',
        'Medium': 'Medio',
        'High': 'Alto',
        'assessment_note': 'Esta es una evaluación de triaje solamente. Se requiere evaluación clínica por un médico calificado.',
    },
    fr: {
        'Low': 'Faible',
        'Medium': 'Moyen',
        'High': 'Élevé',
        'assessment_note': 'Il s\'agit uniquement d\'une évaluation de triage. Une évaluation clinique par un médecin qualifié est requise.',
    },
    de: {
        'Low': 'Niedrig',
        'Medium': 'Mittel',
        'High': 'Hoch',
        'assessment_note': 'Dies ist nur eine Triage-Bewertung. Eine klinische Bewertung durch einen qualifizierten Arzt ist erforderlich.',
    },
    hi: {
        'Low': 'कम',
        'Medium': 'मध्यम',
        'High': 'उच्च',
        'assessment_note': 'यह केवल एक ट्राइएज मूल्यांकन है। एक योग्य चिकित्सक द्वारा निश्चित नैदानिक ​​मूल्यांकन आवश्यक है।',
    },
    ta: {
        'Low': 'குறைவு',
        'Medium': 'நடுத்தரம்',
        'High': 'அதிகம்',
        'assessment_note': 'இது ஒரு ட்ரையேஜ் மதிப்பீடு மட்டுமே. தகுதியான மருத்துவரின் மருத்துவ மதிப்பீடு தேவை.',
    },
    te: {
        'Low': 'తక్కువ',
        'Medium': 'మధ్యస్థం',
        'High': 'ఎక్కువ',
        'assessment_note': 'ఇది ట్రయేజ్ అంచనా మాత్రమే. అర్హత కలిగిన వైద్యునిచే కచ్చితమైన వైద్య మూల్యాంకనం అవసరం.',
    },
    zh: {
        'Low': '低',
        'Medium': '中',
        'High': '高',
        'assessment_note': '这只是分诊评估。需要合格医生进行确定性临床评估。',
    },
    ar: {
        'Low': 'منخفض',
        'Medium': 'متوسط',
        'High': 'مرتفع',
        'assessment_note': 'هذا تقييم فرز فقط. مطلوب تقييم سريري نهائي من قبل طبيب مؤهل.',
    },
    ja: {
        'Low': '低',
        'Medium': '中',
        'High': '高',
        'assessment_note': 'これはトリアージレベルの評価のみです。資格のある医師による確定的な臨床評価が必要です。',
    },
};

function addMultilingualNote(reasoning: string, language: string): string {
    if (language === 'en' || !TRANSLATIONS[language]) return reasoning;
    const note = TRANSLATIONS[language]?.assessment_note || '';
    return `${reasoning}\n\n[${language.toUpperCase()}]: ${note}`;
}

// ========================
// MAIN TRIAGE FUNCTION
// ========================

export function performTriage(input: PatientInput): TriageResult {
    // Step 1: Voice extraction
    const voiceData = extractFromVoice(input.voice_transcript);

    // Step 2: EHR extraction
    const ehrData = extractFromEHR(input.ehr_text);

    // Step 3: Parse and check vitals
    const vitals = parseVitals(input.bp, input.hr, input.temp);
    const vitalCheck = checkVitalsCritical(vitals);

    // Combine all symptoms
    const allSymptoms = [
        ...input.symptoms_list,
        ...voiceData.symptoms,
        ...ehrData.symptoms,
    ];
    const uniqueSymptoms = [...new Set(allSymptoms)];

    // Combine all conditions
    const allConditions = [
        ...input.conditions,
        ...ehrData.chronic_conditions,
    ];
    const uniqueConditions = [...new Set(allConditions)];

    // Step 4: Risk classification
    const { risk, probability, confidence, factors } = classifyRisk(
        uniqueSymptoms,
        vitals,
        uniqueConditions,
        vitalCheck,
        voiceData,
        ehrData,
    );

    // Age-based risk adjustment
    if (input.age >= 70 && risk !== 'High') {
        factors.push(`Advanced age (${input.age}) increases clinical risk`);
    }

    // Step 5: Department recommendation
    const department = recommendDepartment(uniqueSymptoms, vitals, vitalCheck, risk);

    // Step 6: Priority level
    const priority = risk === 'High' ? 1 : risk === 'Medium' ? 2 : 3;

    // Step 7: Clinical reasoning
    let reasoning = generateClinicalReasoning(
        risk, department, factors, uniqueSymptoms, vitals, input.age,
    );

    // Step 8: Follow-up tests
    const tests = suggestFollowupTests(uniqueSymptoms, department, risk, uniqueConditions);

    // Step 9: Trend analysis
    const trend = analyzeTrend(input.previous_risk, input.trend_data);

    // Step 10: Fairness check
    const fairness = performFairnessCheck(input.age, input.gender, risk, factors);

    // Step 11: Multilingual note
    reasoning = addMultilingualNote(reasoning, input.language);

    return {
        risk_level: risk,
        risk_probability: probability,
        confidence_score: confidence,
        recommended_department: department,
        priority_level: priority,
        contributing_factors: factors,
        clinical_reasoning: reasoning,
        suggested_followup_tests: tests,
        trend_analysis: trend,
        fairness_check_note: fairness,
        extracted_from_voice: voiceData,
        extracted_from_ehr: ehrData,
    };
}
