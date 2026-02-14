'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import TriageResultPanel from '@/components/TriageResultPanel';
import {
    UserPlus,
    HeartPulse,
    Thermometer,
    Activity,
    Stethoscope,
    FileText,
    Mic,
    MicOff,
    Globe,
    AlertTriangle,
    Loader2,
    ArrowRight,
    RotateCcw,
    History,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Zap,
    ClipboardCheck,
    Upload,
    Watch,
    Check,
} from 'lucide-react';
import { SYMPTOM_OPTIONS, CONDITION_OPTIONS, LANGUAGE_MAP, SupportedLanguage, TriageResult } from '@/lib/types';
import { extractTextFromPDF, parseEHRText } from '@/lib/pdf-extractor';
import { isSpeechRecognitionSupported, createSpeechRecognizer } from '@/lib/speech-recognition';

export default function TriagePage() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        patient_id: '',
        age: '',
        gender: '',
        symptoms_list: [] as string[],
        voice_transcript: '',
        ehr_text: '',
        bp_systolic: '',
        bp_diastolic: '',
        hr: '',
        temp: '',
        conditions: [] as string[],
        previous_risk: '',
        language: 'en' as SupportedLanguage,
    });

    const [result, setResult] = useState<TriageResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<{ symptoms: string[]; conditions: string[]; urgencyHint: string; summary: string; aiPowered: boolean } | null>(null);

    // Voice recognition state
    const [isRecording, setIsRecording] = useState(false);
    const [interimText, setInterimText] = useState('');
    const [recordingDuration, setRecordingDuration] = useState(0);
    const recognizerRef = useRef<ReturnType<typeof createSpeechRecognizer>>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const speechSupported = typeof window !== 'undefined' ? isSpeechRecognitionSupported() : false;

    // Auto-detect symptoms from transcript text (Multilingual)
    const detectSymptomsFromText = useCallback((text: string) => {
        const lower = text.toLowerCase();
        const detected: string[] = [];
        const symptomKeywords: Record<string, string[]> = {
            'Chest Pain': [
                'chest pain', 'chest hurts', 'pain in my chest', 'chest discomfort',
                'सीने में दर्द', 'छाती में दर्द', 'सीना दर्द',       // Hindi
                'நெஞ்சு வலி', 'மார்பு வலி',                          // Tamil
                'ఛాతీ నొప్పి', 'గుండె నొప్పి',                        // Telugu
                'dolor de pecho', 'dolor en el pecho',                 // Spanish
                'douleur thoracique', 'mal à la poitrine',             // French
                'brustschmerzen',                                      // German
                'ألم في الصدر',                                       // Arabic
                '胸痛', '胸口痛',                                       // Chinese
                '胸の痛み', '胸が痛い',                                  // Japanese
            ],
            'Shortness of Breath': [
                'shortness of breath', 'can\'t breathe', 'difficulty breathing', 'hard to breathe', 'breathless',
                'सांस लेने में तकलीफ', 'सांस फूलना', 'सांस नहीं आ रही',
                'மூச்சு திணறல்', 'மூச்சு விடுவதில் சிரமம்',
                'ఊపిరి ఆడటం లేదు', 'శ్వాస తీసుకోలేకపోతున్నాను',
                'falta de aire', 'dificultad para respirar',
                'essoufflement', 'difficulté à respirer',
                'atemnot', 'kurzatmigkeit',
                'ضيق في التنفس',
                '呼吸困难', '息切れ',
            ],
            'Headache': [
                'headache', 'head hurts', 'head pain', 'migraine',
                'सिरदर्द', 'सिर में दर्द', 'माइग्रेन',
                'தலைவலி', 'தலை வலி',
                'తలనొప్పి', 'తల నొప్పి',
                'dolor de cabeza', 'jaqueca',
                'mal de tête', 'céphalée',
                'kopfschmerzen',
                'صداع',
                '头痛', '头疼',
                '頭痛',
            ],
            'Fever': [
                'fever', 'feeling hot', 'high temperature', 'feverish',
                'बुखार', 'तेज बुखार', 'ज्वर',
                'காய்ச்சல்', 'ஜுரம்',
                'జ్వరం', 'జరం',
                'fiebre', 'calentura',
                'fièvre',
                'fieber',
                'حمى', 'سخونة',
                '发烧', '发热',
                '熱', '発熱',
            ],
            'Dizziness': [
                'dizzy', 'dizziness', 'lightheaded', 'room is spinning', 'vertigo',
                'चक्कर आना', 'चक्कर', 'सिर घूमना',
                'தலைசுற்றல்',
                'తలతిరుగుతోంది', 'కళ్ళు తిరుగుతున్నాయి',
                'mareo', 'vértigo',
                'vertige', 'étourdi',
                'schwindel',
                'دوخة', 'دوار',
                '头晕', '眩晕',
                'めまい',
            ],
            'Nausea': [
                'nausea', 'nauseous', 'feel sick', 'queasy',
                'जी मिचलाना', 'मतली', 'उबकाई',
                'குமட்டல்',
                'వికారం', 'వాంతి వస్తుంది',
                'náuseas',
                'nausée',
                'übelkeit',
                'غثيان',
                '恶心', '想吐',
                '吐き気',
            ],
            'Vomiting': [
                'vomiting', 'throwing up', 'threw up',
                'उल्टी', 'उलटी', 'वमन',
                'வாந்தி',
                'వాంతి',
                'vómito', 'vomitar',
                'vomissement',
                'erbrechen',
                'قيء', 'استفراغ',
                '呕吐',
                '嘔吐',
            ],
            'Abdominal Pain': [
                'stomach pain', 'abdominal pain', 'belly hurts', 'stomach hurts', 'tummy ache',
                'पेट में दर्द', 'पेट दर्द',
                'வயிற்று வலி',
                'కడుపు నొప్పి', 'పొట్ట నొప్పి',
                'dolor de estómago', 'dolor abdominal',
                'mal au ventre', 'douleur abdominale',
                'bauchschmerzen', 'magenschmerzen',
                'ألم في البطن',
                '肚子痛', '腹痛',
                '腹痛', 'お腹が痛い',
            ],
            'Back Pain': [
                'back pain', 'back hurts', 'lower back', 'upper back pain',
                'कमर दर्द', 'पीठ दर्द', 'पीठ में दर्द',
                'முதுகு வலி',
                'వీపు నొప్పి', 'నడుము నొప్పి',
                'dolor de espalda',
                'mal de dos',
                'rückenschmerzen',
                'ألم في الظهر',
                '背痛', '腰痛',
                '腰痛', '背中が痛い',
            ],
            'Fatigue': [
                'fatigue', 'tired', 'exhausted', 'no energy', 'weak', 'fatigued',
                'थकान', 'थकावट', 'कमजोरी',
                'சோர்வு', 'களைப்பு',
                'అలసట', 'బడలిక',
                'cansancio', 'fatiga',
                'fatigue', 'épuisé',
                'müdigkeit', 'erschöpfung',
                'تعب', 'إرهاق',
                '疲劳', '疲倦', '累',
                '疲れ', '疲労',
            ],
            'Cough': [
                'cough', 'coughing', 'dry cough', 'wet cough',
                'खांसी', 'खाँसी', 'सूखी खांसी',
                'இருமல்',
                'దగ్గు',
                'tos',
                'toux',
                'husten',
                'سعال', 'كحة',
                '咳嗽',
                '咳', 'せき',
            ],
            'Sore Throat': [
                'sore throat', 'throat hurts', 'throat pain',
                'गले में दर्द', 'गला दर्द', 'गला खराब',
                'தொண்டை வலி',
                'గొంతు నొప్పి',
                'dolor de garganta',
                'mal de gorge',
                'halsschmerzen',
                'ألم في الحلق', 'التهاب الحلق',
                '嗓子疼', '喉咙痛',
                '喉の痛み',
            ],
            'Joint Pain': [
                'joint pain', 'joints hurt', 'knee pain', 'elbow pain',
                'जोड़ों में दर्द', 'घुटने का दर्द',
                'மூட்டு வலி',
                'కీళ్ల నొప్పి', 'మోకాలు నొప్పి',
                'dolor de articulaciones',
                'douleur articulaire',
                'gelenkschmerzen',
                'ألم المفاصل',
                '关节痛',
                '関節痛',
            ],
            'Muscle Weakness': [
                'muscle weakness', 'weak muscles', 'can\'t lift',
                'मांसपेशियों में कमजोरी', 'ताकत नहीं है',
                'தசை பலவீனம்',
                'కండరాల బలహీనత',
                'debilidad muscular',
                'faiblesse musculaire',
                'muskelschwäche',
                'ضعف العضلات',
                '肌肉无力',
                '筋力低下',
            ],
            'Vision Changes': [
                'vision changes', 'blurry vision', 'can\'t see clearly', 'vision problems',
                'धुंधला दिखना', 'नजर कमजोर', 'आंखों में धुंधलापन',
                'பார்வை மாற்றம்', 'மங்கலான பார்வை',
                'కంటి చూపు మారింది', 'మసకగా కనిపిస్తోంది',
                'visión borrosa', 'cambios en la visión',
                'vision floue',
                'verschwommenes sehen',
                'تغيرات في الرؤية', 'رؤية ضبابية',
                '视力模糊',
                '視力の変化',
            ],
            'Numbness/Tingling': [
                'numbness', 'tingling', 'pins and needles', 'numb',
                'सुन्नपन', 'झनझनाहट', 'सुन्न',
                'மரத்துப்போதல்',
                'తిమ్మిరి', 'చేతులు తిమ్మిరెక్కుతున్నాయి',
                'entumecimiento', 'hormigueo',
                'engourdissement', 'fourmillement',
                'taubheitsgefühl',
                'خدر', 'تنميل',
                '麻木', '发麻',
                'しびれ',
            ],
            'Palpitations': [
                'palpitations', 'heart racing', 'heart pounding', 'heart skipping',
                'दिल की धड़कन तेज', 'धड़कन बढ़ना', 'दिल तेज धड़क रहा',
                'இதய படபடப்பு',
                'గుండె దడ', 'గుండె వేగంగా కొట్టుకుంటోంది',
                'palpitaciones',
                'palpitations',
                'herzklopfen',
                'خفقان القلب',
                '心悸', '心跳加速',
                '動悸',
            ],
            'Swelling': [
                'swelling', 'swollen', 'puffiness',
                'सूजन',
                'வீக்கம்',
                'వాపు',
                'hinchazón',
                'gonflement', 'enflure',
                'schwellung',
                'تورم', 'انتفاخ',
                '肿胀',
                '腫れ',
            ],
            'Confusion': [
                'confusion', 'confused', 'disoriented',
                'भ्रम', 'उलझन', 'समझ नहीं आ रहा',
                'குழப்பம்',
                'గందరగోళం',
                'confusión',
                'confusion', 'désorienté',
                'verwirrung',
                'ارتباك',
                '意识模糊', '糊涂',
                '混乱', '意識がもうろう',
            ],
            'Difficulty Speaking': [
                'difficulty speaking', 'slurred speech', 'can\'t speak properly',
                'बोलने में तकलीफ', 'बोल नहीं पा रहा',
                'பேச சிரமம்',
                'మాట్లాడలేకపోతున్నాను',
                'dificultad para hablar',
                'difficulté à parler',
                'sprachstörung',
                'صعوبة في الكلام',
                '说话困难',
                '話しにくい',
            ],
            'Loss of Consciousness': [
                'fainted', 'passed out', 'lost consciousness', 'blacked out',
                'बेहोश', 'होश खो दिया', 'गिर पड़ा',
                'மயக்கம்',
                'స్పృహ తప్పింది',
                'desmayo', 'pérdida de conocimiento',
                'évanouissement', 'perte de conscience',
                'bewusstlosigkeit', 'ohnmacht',
                'فقدان الوعي', 'إغماء',
                '失去意识', '晕倒',
                '意識喪失', '気を失った',
            ],
            'Seizure': [
                'seizure', 'convulsion', 'fit',
                'दौरा', 'मिर्गी',
                'வலிப்பு',
                'మూర్ఛ',
                'convulsión',
                'convulsion', 'crise',
                'krampfanfall',
                'نوبة', 'تشنج',
                '癫痫', '抽搐',
                '発作', 'けいれん',
            ],
            'Bleeding': [
                'bleeding', 'blood',
                'खून', 'खून बह रहा', 'रक्तस्राव',
                'இரத்தப்போக்கு', 'ரத்தம்',
                'రక్తస్రావం', 'రక్తం',
                'sangrado', 'hemorragia',
                'saignement', 'hémorragie',
                'blutung',
                'نزيف', 'دم',
                '出血', '流血',
                '出血',
            ],
        };

        for (const [symptom, keywords] of Object.entries(symptomKeywords)) {
            if (keywords.some(kw => lower.includes(kw))) {
                detected.push(symptom);
            }
        }
        return detected;
    }, []);

    const startRecording = useCallback(() => {
        setError('');
        const recognizer = createSpeechRecognizer({
            language: formData.language,
            continuous: true,
            onTranscript: (transcript, isFinal) => {
                if (isFinal) {
                    setFormData(prev => ({
                        ...prev,
                        voice_transcript: (prev.voice_transcript ? prev.voice_transcript + ' ' : '') + transcript,
                    }));
                    setInterimText('');

                    // Auto-detect symptoms from what was spoken
                    const detected = detectSymptomsFromText(transcript);
                    if (detected.length > 0) {
                        setFormData(prev => {
                            const newSymptoms = [...new Set([...prev.symptoms_list, ...detected])];
                            return { ...prev, symptoms_list: newSymptoms };
                        });
                    }
                } else {
                    setInterimText(transcript);
                }
            },
            onError: (errMsg) => {
                setError(errMsg);
                setIsRecording(false);
                setRecordingDuration(0);
                if (timerRef.current) clearInterval(timerRef.current);
            },
            onEnd: () => {
                // If continuous mode ends unexpectedly, restart if still recording
            },
        });

        if (!recognizer) {
            setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        recognizerRef.current = recognizer;
        recognizer.start();
        setIsRecording(true);
        setRecordingDuration(0);

        // Timer for duration display
        timerRef.current = setInterval(() => {
            setRecordingDuration(prev => prev + 1);
        }, 1000);
    }, [formData.language, detectSymptomsFromText]);

    const stopRecording = useCallback(() => {
        recognizerRef.current?.stop();
        setIsRecording(false);
        setInterimText('');
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setRecordingDuration(0);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            recognizerRef.current?.abort();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const simulateScenario = (scenario: string) => {
        switch (scenario) {
            case 'stroke':
                setFormData({
                    ...formData,
                    age: '72',
                    gender: 'Female',
                    symptoms_list: ['Dizziness', 'Confusion', 'Difficulty Speaking', 'Muscle Weakness'],
                    bp_systolic: '190',
                    bp_diastolic: '115',
                    hr: '92',
                    temp: '98.6',
                    conditions: ['Stroke History', 'Hypertension'],
                });
                setStep(2);
                break;
            case 'cardiac':
                setFormData({
                    ...formData,
                    age: '65',
                    gender: 'Male',
                    symptoms_list: ['Chest Pain', 'Shortness of Breath', 'Palpitations', 'Nausea'],
                    bp_systolic: '185',
                    bp_diastolic: '110',
                    hr: '108',
                    temp: '99.2',
                    conditions: ['Hypertension', 'Heart Disease', 'Diabetes'],
                });
                setStep(2);
                break;
            case 'infection':
                setFormData({
                    ...formData,
                    age: '28',
                    gender: 'Female',
                    symptoms_list: ['Fever', 'Cough', 'Sore Throat', 'Fatigue'],
                    bp_systolic: '122',
                    bp_diastolic: '78',
                    hr: '85',
                    temp: '102.8',
                    conditions: ['Asthma'],
                });
                setStep(2);
                break;
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        setError('');

        try {
            // Step 1: Extract raw text from PDF using pdfjs-dist
            const rawText = await extractTextFromPDF(file);
            console.log('[PDF Extractor] Raw text:', rawText);

            // Step 2: Parse extracted text into structured clinical data
            const extracted = parseEHRText(rawText);
            console.log('[PDF Extractor] Parsed data:', extracted);

            // Step 3: Map extracted data to form fields
            setFormData(prev => ({
                ...prev,
                patient_id: extracted.patient_id || prev.patient_id,
                age: extracted.age || prev.age,
                gender: extracted.gender || prev.gender,
                symptoms_list: extracted.symptoms.length > 0 ? extracted.symptoms : prev.symptoms_list,
                bp_systolic: extracted.bp_systolic || prev.bp_systolic,
                bp_diastolic: extracted.bp_diastolic || prev.bp_diastolic,
                hr: extracted.hr || prev.hr,
                temp: extracted.temp || prev.temp,
                conditions: extracted.conditions.length > 0 ? extracted.conditions : prev.conditions,
                ehr_text: extracted.doctorNotes
                    ? `[Extracted from ${file.name}]\n${extracted.doctorNotes}`
                    : `Data extracted from ${file.name}. ${extracted.rawText.substring(0, 300)}...`,
            }));

            setStep(2); // Jump to vitals to show the mapped data
        } catch (err) {
            console.error('[PDF Extractor] Error:', err);
            setError('Failed to extract data from PDF. Please try pasting the text manually in Step 3.');
        } finally {
            setIsScanning(false);
            // Reset file input so same file can be re-uploaded
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleWearableSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setFormData(prev => ({
                ...prev,
                hr: (70 + Math.floor(Math.random() * 10)).toString(),
            }));
            setIsSyncing(false);
        }, 2000);
    };

    function toggleSymptom(symptom: string) {
        setFormData(prev => ({
            ...prev,
            symptoms_list: prev.symptoms_list.includes(symptom)
                ? prev.symptoms_list.filter(s => s !== symptom)
                : [...prev.symptoms_list, symptom],
        }));
    }

    function toggleCondition(condition: string) {
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions.includes(condition)
                ? prev.conditions.filter(c => c !== condition)
                : [...prev.conditions, condition],
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const payload = {
                patient_id: formData.patient_id || `PT-${Date.now().toString().slice(-6)}`,
                age: parseInt(formData.age) || 30,
                gender: formData.gender || 'Unknown',
                symptoms_list: formData.symptoms_list,
                voice_transcript: formData.voice_transcript || undefined,
                ehr_text: formData.ehr_text || undefined,
                bp: `${formData.bp_systolic || '120'}/${formData.bp_diastolic || '80'}`,
                hr: parseInt(formData.hr) || 72,
                temp: parseFloat(formData.temp) || 98.6,
                conditions: formData.conditions,
                previous_risk: formData.previous_risk || undefined,
                trend_data: undefined,
                language: formData.language,
            };

            const res = await fetch('/api/triage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Triage assessment failed');
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Assessment failed');
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleReset() {
        setFormData({
            patient_id: '',
            age: '',
            gender: '',
            symptoms_list: [],
            voice_transcript: '',
            ehr_text: '',
            bp_systolic: '',
            bp_diastolic: '',
            hr: '',
            temp: '',
            conditions: [],
            previous_risk: '',
            language: 'en',
        });
        setResult(null);
        setError('');
        setStep(1);
    }

    const canProceed = () => {
        if (step === 1) return formData.age && formData.gender;
        if (step === 2) return true; // Symptoms are optional
        if (step === 3) return true; // Additional data is optional
        return true;
    };

    return (
        <AppShell>
            {/* Top Bar */}
            <div className="top-bar">
                <div>
                    <h2>New Triage Assessment</h2>
                    <p className="top-bar-subtitle">AI-powered clinical decision support</p>
                </div>
                <div className="top-bar-actions">
                    {result ? (
                        <button className="btn btn-secondary" onClick={handleReset}>
                            <RotateCcw size={16} />
                            New Assessment
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => simulateScenario('stroke')}
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--risk-high)', fontSize: '12px' }}
                            >
                                <Zap size={14} /> Stroke
                            </button>
                            <button
                                type="button"
                                onClick={() => simulateScenario('cardiac')}
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--accent-amber)', fontSize: '12px' }}
                            >
                                <Activity size={14} /> Cardiac
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".pdf"
                                onChange={handleFileUpload}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="btn btn-secondary btn-sm"
                                style={{ borderColor: 'var(--accent-violet)', color: 'var(--accent-violet)', fontSize: '12px' }}
                                disabled={isScanning}
                            >
                                {isScanning ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                {isScanning ? 'Extracting EMR...' : 'Upload PDF/EMR'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Step Indicator */}
            {!result && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '28px',
                    overflowX: 'auto',
                    paddingBottom: '4px',
                }}>
                    {[
                        { num: 1, label: 'Patient Info', icon: UserPlus },
                        { num: 2, label: 'Symptoms & Vitals', icon: HeartPulse },
                        { num: 3, label: 'Additional Data', icon: FileText },
                    ].map((s, idx) => {
                        const Icon = s.icon;
                        return (
                            <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    onClick={() => setStep(s.num)}
                                    type="button"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 20px',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid',
                                        borderColor: step === s.num ? 'var(--accent-primary)' : 'var(--border-primary)',
                                        background: step === s.num ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)',
                                        color: step === s.num ? 'var(--accent-primary-light)' : step > s.num ? 'var(--risk-low)' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-fast)',
                                        fontSize: '14px',
                                        fontWeight: step === s.num ? 600 : 500,
                                        fontFamily: 'inherit',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <Icon size={16} />
                                    <span>{s.label}</span>
                                </button>
                                {idx < 2 && (
                                    <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Show result or form */}
            {result ? (
                <TriageResultPanel result={result} />
            ) : (
                <form onSubmit={handleSubmit}>
                    {/* Scanning Overlay */}
                    {isScanning && (
                        <div style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(10, 14, 26, 0.8)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 100,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '20px',
                        }}>
                            <div className="loader-spinner" style={{ width: '60px', height: '60px', borderTopColor: 'var(--accent-violet)' }}></div>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>AI EMR Extraction in Progress</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>Identifying symptoms, vitals, and chronic conditions...</p>
                            </div>
                            <div style={{ width: '300px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div className="progress-fill" style={{ width: '70%', background: 'var(--accent-violet)', animation: 'progress 3s ease-out infinite' }}></div>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Patient Info */}
                    {step === 1 && (
                        <div className="card animate-fade-in" style={{ padding: '32px' }}>
                            <div className="card-header" style={{ marginBottom: '24px' }}>
                                <div>
                                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <UserPlus size={18} style={{ color: 'var(--accent-primary-light)' }} />
                                        Patient Information
                                    </h3>
                                    <p className="card-subtitle">Enter basic patient demographics</p>
                                </div>
                            </div>

                            <div className="two-col-grid">
                                <div className="form-group">
                                    <label className="form-label">Patient ID</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., PT-001 (auto-generated if empty)"
                                        value={formData.patient_id}
                                        onChange={e => setFormData(prev => ({ ...prev, patient_id: e.target.value }))}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Age *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Enter age"
                                        min="0"
                                        max="120"
                                        value={formData.age}
                                        onChange={e => setFormData(prev => ({ ...prev, age: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Gender *</label>
                                    <select
                                        className="form-select"
                                        value={formData.gender}
                                        onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                                        required
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Globe size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                        Preferred Language
                                    </label>
                                    <select
                                        className="form-select"
                                        value={formData.language}
                                        onChange={e => setFormData(prev => ({ ...prev, language: e.target.value as SupportedLanguage }))}
                                    >
                                        {Object.entries(LANGUAGE_MAP).map(([code, name]) => (
                                            <option key={code} value={code}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <History size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                        Previous Risk Level
                                    </label>
                                    <select
                                        className="form-select"
                                        value={formData.previous_risk}
                                        onChange={e => setFormData(prev => ({ ...prev, previous_risk: e.target.value }))}
                                    >
                                        <option value="">None / First Visit</option>
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => setStep(2)}
                                    disabled={!canProceed()}
                                >
                                    Continue <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Symptoms & Vitals */}
                    {step === 2 && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Symptoms */}
                            <div className="card" style={{ padding: '24px' }}>
                                <div className="card-header" style={{ marginBottom: '20px' }}>
                                    <div>
                                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Stethoscope size={18} style={{ color: 'var(--accent-primary-light)' }} />
                                            Symptoms
                                        </h3>
                                        <p className="card-subtitle">Select all presenting symptoms</p>
                                    </div>
                                    {formData.symptoms_list.length > 0 && (
                                        <span style={{
                                            background: 'rgba(99, 102, 241, 0.12)',
                                            color: 'var(--accent-primary-light)',
                                            padding: '4px 12px',
                                            borderRadius: '50px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                        }}>
                                            {formData.symptoms_list.length} selected
                                        </span>
                                    )}
                                </div>
                                <div className="tag-grid">
                                    {SYMPTOM_OPTIONS.map(symptom => (
                                        <button
                                            key={symptom}
                                            type="button"
                                            className={`tag-item ${formData.symptoms_list.includes(symptom) ? 'selected' : ''}`}
                                            onClick={() => toggleSymptom(symptom)}
                                        >
                                            {symptom}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Vitals */}
                            <div className="card" style={{ padding: '24px' }}>
                                <div className="card-header" style={{ marginBottom: '20px' }}>
                                    <div>
                                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Activity size={18} style={{ color: 'var(--accent-secondary)' }} />
                                            Vital Signs
                                        </h3>
                                        <p className="card-subtitle">Enter current vital measurements</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleWearableSync}
                                        disabled={isSyncing}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '6px 14px',
                                            borderRadius: '50px',
                                            background: isSyncing ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.1)',
                                            border: '1px solid rgba(16, 185, 129, 0.2)',
                                            color: 'var(--accent-emerald)',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Watch size={14} />}
                                        {isSyncing ? 'Syncing Wearable...' : 'Sync Smartwatch Data'}
                                    </button>
                                </div>
                                <div className="three-col-grid">
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">
                                            <HeartPulse size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle', color: 'var(--risk-high)' }} />
                                            Blood Pressure (mmHg)
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input
                                                type="number"
                                                className="form-input"
                                                placeholder="Sys"
                                                value={formData.bp_systolic}
                                                onChange={e => setFormData(prev => ({ ...prev, bp_systolic: e.target.value }))}
                                            />
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>/</span>
                                            <input
                                                type="number"
                                                className="form-input"
                                                placeholder="Dia"
                                                value={formData.bp_diastolic}
                                                onChange={e => setFormData(prev => ({ ...prev, bp_diastolic: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">
                                            <Activity size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle', color: 'var(--accent-secondary)' }} />
                                            Heart Rate (bpm)
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="number"
                                                className="form-input"
                                                placeholder="e.g., 72"
                                                value={formData.hr}
                                                onChange={e => setFormData(prev => ({ ...prev, hr: e.target.value }))}
                                                style={{ paddingRight: '40px' }}
                                            />
                                            {formData.hr && !isSyncing && (
                                                <Check size={14} style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--accent-emerald)' }} />
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">
                                            <Thermometer size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle', color: 'var(--risk-medium)' }} />
                                            Temperature (°F)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="form-input"
                                            placeholder="e.g., 98.6"
                                            value={formData.temp}
                                            onChange={e => setFormData(prev => ({ ...prev, temp: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pre-existing Conditions */}
                            <div className="card" style={{ padding: '24px' }}>
                                <div className="card-header" style={{ marginBottom: '20px' }}>
                                    <div>
                                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <AlertTriangle size={18} style={{ color: 'var(--risk-medium)' }} />
                                            Pre-existing Conditions
                                        </h3>
                                        <p className="card-subtitle">Select all relevant medical history</p>
                                    </div>
                                    {formData.conditions.length > 0 && (
                                        <span style={{
                                            background: 'var(--risk-medium-bg)',
                                            color: 'var(--risk-medium)',
                                            padding: '4px 12px',
                                            borderRadius: '50px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                        }}>
                                            {formData.conditions.length} selected
                                        </span>
                                    )}
                                </div>
                                <div className="tag-grid">
                                    {CONDITION_OPTIONS.map(condition => (
                                        <button
                                            key={condition}
                                            type="button"
                                            className={`tag-item ${formData.conditions.includes(condition) ? 'selected' : ''}`}
                                            onClick={() => toggleCondition(condition)}
                                        >
                                            {condition}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setStep(1)}
                                >
                                    <ChevronLeft size={16} /> Back
                                </button>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setStep(3)}
                                    >
                                        <FileText size={16} /> Add Voice/EHR Data
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSubmitting}
                                        style={{ paddingRight: '24px', paddingLeft: '24px' }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={18} />
                                                Run Triage Assessment
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Additional Data */}
                    {step === 3 && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="card" style={{ padding: '24px' }}>
                                <div className="card-header" style={{ marginBottom: '20px' }}>
                                    <div>
                                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Mic size={18} style={{ color: 'var(--accent-emerald)' }} />
                                            Voice Symptom Input
                                        </h3>
                                        <p className="card-subtitle">Speak your symptoms — AI will transcribe and auto-detect conditions</p>
                                    </div>
                                    {speechSupported && (
                                        <button
                                            type="button"
                                            onClick={isRecording ? stopRecording : startRecording}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px 18px',
                                                borderRadius: '50px',
                                                background: isRecording ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                                                border: `2px solid ${isRecording ? 'var(--risk-high)' : 'rgba(16, 185, 129, 0.3)'}`,
                                                color: isRecording ? 'var(--risk-high)' : 'var(--accent-emerald)',
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                animation: isRecording ? 'pulse 1.5s ease-in-out infinite' : 'none',
                                            }}
                                        >
                                            {isRecording ? (
                                                <>
                                                    <MicOff size={16} />
                                                    Stop Recording ({formatDuration(recordingDuration)})
                                                </>
                                            ) : (
                                                <>
                                                    <Mic size={16} />
                                                    Start Recording
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Recording Indicator */}
                                {isRecording && (
                                    <div style={{
                                        padding: '16px 20px',
                                        background: 'rgba(244, 63, 94, 0.06)',
                                        border: '1px solid rgba(244, 63, 94, 0.15)',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                    }}>
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: 'var(--risk-high)',
                                            animation: 'pulse 1s ease-in-out infinite',
                                            flexShrink: 0,
                                        }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--risk-high)', marginBottom: '4px' }}>
                                                🎤 Listening... Speak your symptoms clearly
                                            </div>
                                            {interimText && (
                                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                    &quot;{interimText}&quot;
                                                </div>
                                            )}
                                        </div>
                                        {/* Visual waveform */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '24px' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} style={{
                                                    width: '3px',
                                                    borderRadius: '2px',
                                                    background: 'var(--risk-high)',
                                                    animation: `waveform 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                                                }} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!speechSupported && (
                                    <div style={{
                                        padding: '12px 16px',
                                        background: 'var(--risk-medium-bg)',
                                        border: '1px solid rgba(245, 158, 11, 0.2)',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: '16px',
                                        fontSize: '13px',
                                        color: 'var(--risk-medium)',
                                    }}>
                                        ⚠️ Voice input requires Chrome or Edge browser. You can still type symptoms manually below.
                                    </div>
                                )}

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label" style={{ fontSize: '12px' }}>Transcript {formData.voice_transcript && `(${formData.voice_transcript.split(' ').length} words)`}</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder={isRecording ? 'Listening... your words will appear here in real-time' : 'Click "Start Recording" above, or type/paste symptoms manually...'}
                                        rows={5}
                                        value={formData.voice_transcript + (interimText ? (formData.voice_transcript ? ' ' : '') + interimText : '')}
                                        onChange={e => setFormData(prev => ({ ...prev, voice_transcript: e.target.value }))}
                                        style={{
                                            borderColor: isRecording ? 'var(--risk-high)' : undefined,
                                            boxShadow: isRecording ? '0 0 0 2px rgba(244, 63, 94, 0.1)' : undefined,
                                        }}
                                    />
                                </div>

                                {/* AI Analyze Button */}
                                {formData.voice_transcript && formData.voice_transcript.length > 10 && (
                                    <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setIsAnalyzingAI(true);
                                                setError('');
                                                try {
                                                    const res = await fetch('/api/analyze-voice', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ transcript: formData.voice_transcript, language: formData.language }),
                                                    });
                                                    const data = await res.json();
                                                    setAiAnalysis(data);
                                                    // Auto-merge AI detected symptoms
                                                    if (data.symptoms?.length > 0) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            symptoms_list: [...new Set([...prev.symptoms_list, ...data.symptoms])],
                                                        }));
                                                    }
                                                    if (data.conditions?.length > 0) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            conditions: [...new Set([...prev.conditions, ...data.conditions])],
                                                        }));
                                                    }
                                                } catch {
                                                    setError('AI analysis failed. Keyword-based detection is still active.');
                                                } finally {
                                                    setIsAnalyzingAI(false);
                                                }
                                            }}
                                            disabled={isAnalyzingAI}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px 20px',
                                                borderRadius: '50px',
                                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))',
                                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                                color: 'var(--accent-primary-light)',
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                cursor: isAnalyzingAI ? 'wait' : 'pointer',
                                                transition: 'all 0.3s ease',
                                            }}
                                        >
                                            {isAnalyzingAI ? (
                                                <><Loader2 size={14} className="animate-spin" /> AI Analyzing...</>
                                            ) : (
                                                <><Sparkles size={14} /> AI Deep Analysis</>
                                            )}
                                        </button>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Uses OpenRouter LLM for advanced NLP extraction</span>
                                    </div>
                                )}

                                {/* AI Analysis Results */}
                                {aiAnalysis && aiAnalysis.aiPowered && (
                                    <div style={{
                                        marginTop: '16px',
                                        padding: '16px 20px',
                                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(139, 92, 246, 0.06))',
                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                        borderRadius: 'var(--radius-md)',
                                    }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary-light)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                                            🤖 AI-Powered Analysis (OpenRouter)
                                        </div>
                                        {aiAnalysis.summary && (
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.6' }}>
                                                {aiAnalysis.summary}
                                            </p>
                                        )}
                                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                            {aiAnalysis.symptoms.length > 0 && (
                                                <div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Symptoms</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                        {aiAnalysis.symptoms.map(s => (
                                                            <span key={s} style={{ padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 600, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary-light)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {aiAnalysis.conditions.length > 0 && (
                                                <div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Conditions</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                        {aiAnalysis.conditions.map(c => (
                                                            <span key={c} style={{ padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 600, background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>{c}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Urgency</div>
                                                <span style={{
                                                    padding: '3px 10px',
                                                    borderRadius: '50px',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    background: aiAnalysis.urgencyHint === 'high' ? 'var(--risk-high-bg)' : aiAnalysis.urgencyHint === 'medium' ? 'var(--risk-medium-bg)' : 'var(--risk-low-bg)',
                                                    color: aiAnalysis.urgencyHint === 'high' ? 'var(--risk-high)' : aiAnalysis.urgencyHint === 'medium' ? 'var(--risk-medium)' : 'var(--risk-low)',
                                                    border: `1px solid ${aiAnalysis.urgencyHint === 'high' ? 'rgba(244,63,94,0.2)' : aiAnalysis.urgencyHint === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
                                                }}>{aiAnalysis.urgencyHint.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Detected Symptoms Badge Row */}
                                {formData.voice_transcript && (() => {
                                    const detected = detectSymptomsFromText(formData.voice_transcript);
                                    if (detected.length === 0) return null;
                                    return (
                                        <div style={{ marginTop: '12px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                                                ✅ Auto-detected from speech ({detected.length} symptoms)
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {detected.map(s => (
                                                    <span key={s} style={{
                                                        padding: '4px 12px',
                                                        borderRadius: '50px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                        color: 'var(--accent-emerald)',
                                                        border: '1px solid rgba(16, 185, 129, 0.25)',
                                                    }}>{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="card" style={{ padding: '24px' }}>
                                <div className="card-header" style={{ marginBottom: '20px' }}>
                                    <div>
                                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FileText size={18} style={{ color: 'var(--accent-violet)' }} />
                                            EHR / EMR Text
                                        </h3>
                                        <p className="card-subtitle">Paste electronic health record text if available</p>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <textarea
                                        className="form-textarea"
                                        placeholder='e.g., "Patient has history of hypertension. BP: 180/110. HR: 105. Previous episode of atrial fibrillation. Currently on metoprolol 50mg. Elevated troponin 0.15. ECG shows ST depression in leads V3-V6..."'
                                        rows={5}
                                        value={formData.ehr_text}
                                        onChange={e => setFormData(prev => ({ ...prev, ehr_text: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setStep(2)}
                                >
                                    <ChevronLeft size={16} /> Back
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSubmitting}
                                    style={{ paddingRight: '24px', paddingLeft: '24px' }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} />
                                            Run Triage Assessment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={{
                            marginTop: '20px',
                            padding: '16px 20px',
                            background: 'var(--risk-high-bg)',
                            border: '1px solid rgba(244, 63, 94, 0.2)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--risk-high)',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                        }}>
                            <AlertTriangle size={20} />
                            {error}
                        </div>
                    )}
                </form>
            )}
        </AppShell>
    );
}
