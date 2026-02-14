/**
 * PDF Text Extraction & Clinical Data Mapping
 * Uses pdfjs-dist to extract text from uploaded PDF files in the browser.
 * Then uses regex/NLP to map extracted fields to the triage form.
 */

import { SYMPTOM_OPTIONS, CONDITION_OPTIONS } from './types';

export interface ExtractedEHRData {
    patient_id: string;
    name: string;
    age: string;
    gender: string;
    bp_systolic: string;
    bp_diastolic: string;
    hr: string;
    temp: string;
    spo2: string;
    symptoms: string[];
    conditions: string[];
    doctorNotes: string;
    rawText: string;
}

/**
 * Extract text content from a PDF file using pdfjs-dist
 */
export async function extractTextFromPDF(file: File): Promise<string> {
    const pdfjsLib = await import('pdfjs-dist');

    // Set the worker source — use local copy from public/ folder
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item) => {
                if ('str' in item && typeof (item as Record<string, unknown>).str === 'string') {
                    return (item as Record<string, unknown>).str as string;
                }
                return '';
            })
            .join(' ');
        fullText += pageText + '\n';
    }

    return fullText;
}

/**
 * Parse extracted text to identify clinical data fields
 */
export function parseEHRText(rawText: string): ExtractedEHRData {
    const text = rawText.replace(/\s+/g, ' ');
    const textLower = text.toLowerCase();

    // --- Extract Patient ID ---
    let patient_id = '';
    const idMatch = text.match(/patient\s*id[:\s]*([A-Z0-9\-]+)/i);
    if (idMatch) patient_id = idMatch[1].trim();

    // --- Extract Name ---
    let name = '';
    const nameMatch = text.match(/name[:\s]*([A-Za-z\s]+?)(?=age|gender|date|$)/i);
    if (nameMatch) name = nameMatch[1].trim();

    // --- Extract Age ---
    let age = '';
    const ageMatch = text.match(/age[:\s]*(\d{1,3})/i);
    if (ageMatch) age = ageMatch[1];

    // --- Extract Gender ---
    let gender = '';
    const genderMatch = text.match(/gender[:\s]*(male|female|other)/i);
    if (genderMatch) gender = genderMatch[1].charAt(0).toUpperCase() + genderMatch[1].slice(1).toLowerCase();

    // --- Extract Blood Pressure ---
    let bp_systolic = '';
    let bp_diastolic = '';
    const bpMatch = text.match(/(?:blood\s*pressure|bp)[:\s]*(\d{2,3})\s*[\/\\]\s*(\d{2,3})/i);
    if (bpMatch) {
        bp_systolic = bpMatch[1];
        bp_diastolic = bpMatch[2];
    }

    // --- Extract Heart Rate ---
    let hr = '';
    const hrMatch = text.match(/(?:heart\s*rate|hr|pulse)[:\s]*(\d{2,3})\s*(?:bpm)?/i);
    if (hrMatch) hr = hrMatch[1];

    // --- Extract Temperature ---
    let temp = '';
    const tempMatch = text.match(/(?:temperature|temp)[:\s]*(\d{2,3}(?:\.\d{1,2})?)\s*(?:°?\s*[fF])?/i);
    if (tempMatch) temp = tempMatch[1];

    // --- Extract SpO2 ---
    let spo2 = '';
    const spo2Match = text.match(/(?:oxygen\s*saturation|spo2|sp02|o2\s*sat)[:\s]*(\d{2,3})\s*%?/i);
    if (spo2Match) spo2 = spo2Match[1];

    // --- Extract Symptoms ---
    const symptoms: string[] = [];
    // First try to find a symptoms section
    const symptomsSection = text.match(/symptoms[:\s]*(.*?)(?=pre[- ]existing|conditions|doctor|vitals|notes|$)/i);
    const symptomText = symptomsSection ? symptomsSection[1].toLowerCase() : textLower;

    // Match against known symptom options
    for (const symptom of SYMPTOM_OPTIONS) {
        const symptomLower = symptom.toLowerCase();
        // Check for exact or partial matches
        if (symptomText.includes(symptomLower)) {
            symptoms.push(symptom);
        }
    }
    // Also check common aliases
    if (symptomText.includes('chest pain') && !symptoms.includes('Chest Pain')) symptoms.push('Chest Pain');
    if (symptomText.includes('shortness of breath') && !symptoms.includes('Shortness of Breath')) symptoms.push('Shortness of Breath');
    if (symptomText.includes('breathlessness') && !symptoms.includes('Shortness of Breath')) symptoms.push('Shortness of Breath');

    // --- Extract Pre-existing Conditions ---
    const conditions: string[] = [];
    const condSection = text.match(/(?:pre[- ]?existing\s*conditions|medical\s*history|chronic\s*conditions)[:\s]*(.*?)(?=doctor|notes|symptoms|vitals|$)/i);
    const condText = condSection ? condSection[1].toLowerCase() : '';

    for (const condition of CONDITION_OPTIONS) {
        const condLower = condition.toLowerCase();
        if (condText.includes(condLower)) {
            conditions.push(condition);
        }
    }
    // Common aliases
    if ((condText.includes('type 2 diabetes') || condText.includes('type2 diabetes') || condText.includes('diabetes')) && !conditions.includes('Diabetes')) {
        conditions.push('Diabetes');
    }
    if (condText.includes('hypertension') && !conditions.includes('Hypertension')) {
        conditions.push('Hypertension');
    }

    // --- Extract Doctor Notes ---
    let doctorNotes = '';
    const notesMatch = text.match(/(?:doctor\s*notes|clinical\s*notes|notes)[:\s]*(.*?)$/i);
    if (notesMatch) doctorNotes = notesMatch[1].trim();

    return {
        patient_id,
        name,
        age,
        gender,
        bp_systolic,
        bp_diastolic,
        hr,
        temp,
        spo2,
        symptoms,
        conditions,
        doctorNotes,
        rawText,
    };
}
