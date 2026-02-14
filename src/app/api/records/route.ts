import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            // Return mock data for demo
            return NextResponse.json({
                records: getMockRecords(),
                stats: getMockStats(),
            });
        }

        const { data: records, error } = await supabase
            .from('triage_records')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Calculate stats
        const allRecords = records || [];
        const stats = {
            total: allRecords.length,
            high: allRecords.filter(r => r.risk_level === 'High').length,
            medium: allRecords.filter(r => r.risk_level === 'Medium').length,
            low: allRecords.filter(r => r.risk_level === 'Low').length,
            departments: getDepartmentStats(allRecords),
            averageConfidence: allRecords.length > 0
                ? Math.round(allRecords.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / allRecords.length)
                : 0,
        };

        return NextResponse.json({ records: allRecords, stats });
    } catch (error) {
        console.error('Records API error:', error);
        // Return mock data on error
        return NextResponse.json({
            records: getMockRecords(),
            stats: getMockStats(),
        });
    }
}

function getDepartmentStats(records: Record<string, unknown>[]) {
    const deptMap: Record<string, number> = {};
    for (const r of records) {
        const dept = (r.recommended_department as string) || 'Unknown';
        deptMap[dept] = (deptMap[dept] || 0) + 1;
    }
    return Object.entries(deptMap).map(([name, value]) => ({ name, value }));
}

function getMockRecords() {
    return [
        {
            id: '1',
            patient_id: 'PT-001',
            age: 65,
            gender: 'Male',
            symptoms: ['Chest Pain', 'Shortness of Breath'],
            bp: '180/110',
            hr: 110,
            temp: 99.2,
            conditions: ['Hypertension', 'Diabetes'],
            risk_level: 'High',
            risk_probability: 0.85,
            confidence_score: 92,
            recommended_department: 'Cardiology',
            priority_level: 1,
            contributing_factors: ['Hypertensive crisis', 'Chest pain with cardiac history'],
            clinical_reasoning: 'Critical case requiring immediate cardiac evaluation',
            created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
            id: '2',
            patient_id: 'PT-002',
            age: 34,
            gender: 'Female',
            symptoms: ['Headache', 'Fever'],
            bp: '125/82',
            hr: 88,
            temp: 101.5,
            conditions: [],
            risk_level: 'Medium',
            risk_probability: 0.45,
            confidence_score: 78,
            recommended_department: 'General Medicine',
            priority_level: 2,
            contributing_factors: ['Moderate fever', 'Persistent headache'],
            clinical_reasoning: 'Moderate risk, requires evaluation for infection',
            created_at: new Date(Date.now() - 7200000).toISOString(),
        },
        {
            id: '3',
            patient_id: 'PT-003',
            age: 28,
            gender: 'Male',
            symptoms: ['Sore Throat', 'Cough'],
            bp: '118/76',
            hr: 72,
            temp: 99.8,
            conditions: [],
            risk_level: 'Low',
            risk_probability: 0.12,
            confidence_score: 85,
            recommended_department: 'General Medicine',
            priority_level: 3,
            contributing_factors: ['Mild symptoms', 'Normal vitals'],
            clinical_reasoning: 'Low risk upper respiratory symptoms',
            created_at: new Date(Date.now() - 10800000).toISOString(),
        },
        {
            id: '4',
            patient_id: 'PT-004',
            age: 72,
            gender: 'Female',
            symptoms: ['Dizziness', 'Confusion', 'Difficulty Speaking'],
            bp: '190/115',
            hr: 95,
            temp: 98.6,
            conditions: ['Stroke History', 'Hypertension'],
            risk_level: 'High',
            risk_probability: 0.92,
            confidence_score: 95,
            recommended_department: 'Neurology',
            priority_level: 1,
            contributing_factors: ['Stroke indicators', 'Hypertensive crisis', 'Previous stroke history'],
            clinical_reasoning: 'Urgent neurological evaluation required - possible acute cerebrovascular event',
            created_at: new Date(Date.now() - 1800000).toISOString(),
        },
        {
            id: '5',
            patient_id: 'PT-005',
            age: 45,
            gender: 'Male',
            symptoms: ['Abdominal Pain', 'Nausea', 'Vomiting'],
            bp: '135/88',
            hr: 92,
            temp: 100.4,
            conditions: ['Obesity'],
            risk_level: 'Medium',
            risk_probability: 0.55,
            confidence_score: 80,
            recommended_department: 'Gastroenterology',
            priority_level: 2,
            contributing_factors: ['GI symptoms cluster', 'Low-grade fever'],
            clinical_reasoning: 'Moderate risk gastrointestinal presentation requiring evaluation',
            created_at: new Date(Date.now() - 5400000).toISOString(),
        },
    ];
}

function getMockStats() {
    return {
        total: 5,
        high: 2,
        medium: 2,
        low: 1,
        departments: [
            { name: 'Cardiology', value: 1 },
            { name: 'Neurology', value: 1 },
            { name: 'General Medicine', value: 2 },
            { name: 'Gastroenterology', value: 1 },
        ],
        averageConfidence: 86,
    };
}
