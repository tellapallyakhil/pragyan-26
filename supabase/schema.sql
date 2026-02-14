-- =============================================
-- Clinical Triage Decision Support System
-- Supabase PostgreSQL Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Main Triage Records Table
-- =============================================
CREATE TABLE IF NOT EXISTS triage_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  patient_name TEXT,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  symptoms TEXT[] DEFAULT '{}',
  bp TEXT,
  hr INTEGER,
  temp NUMERIC(5,2),
  conditions TEXT[] DEFAULT '{}',
  
  -- Triage Results
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High')),
  risk_probability NUMERIC(5,4) NOT NULL DEFAULT 0,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  recommended_department TEXT NOT NULL,
  priority_level INTEGER NOT NULL CHECK (priority_level IN (1, 2, 3)),
  contributing_factors TEXT[] DEFAULT '{}',
  clinical_reasoning TEXT,
  suggested_followup_tests TEXT[] DEFAULT '{}',
  trend_analysis TEXT,
  fairness_check_note TEXT,
  
  -- Extraction Data (stored as JSONB)
  voice_extraction JSONB DEFAULT '{"symptoms": [], "severity_clues": "", "emergency_flags": ""}',
  ehr_extraction JSONB DEFAULT '{"symptoms": [], "vitals": {}, "abnormal_findings": [], "chronic_conditions": []}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Patient Historical Records Table
-- =============================================
CREATE TABLE IF NOT EXISTS patient_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  triage_record_id UUID REFERENCES triage_records(id) ON DELETE CASCADE,
  risk_level TEXT NOT NULL,
  risk_probability NUMERIC(5,4),
  vitals JSONB DEFAULT '{}',
  symptoms TEXT[] DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Indexes for Performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_triage_patient_id ON triage_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_triage_risk_level ON triage_records(risk_level);
CREATE INDEX IF NOT EXISTS idx_triage_created_at ON triage_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_triage_department ON triage_records(recommended_department);
CREATE INDEX IF NOT EXISTS idx_triage_priority ON triage_records(priority_level);
CREATE INDEX IF NOT EXISTS idx_history_patient_id ON patient_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_history_recorded_at ON patient_history(recorded_at DESC);

-- =============================================
-- Updated At Trigger
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_triage_records_updated_at
  BEFORE UPDATE ON triage_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE triage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_history ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated and anon users (for demo purposes)
-- In production, restrict this based on user roles
CREATE POLICY "Allow all operations on triage_records"
  ON triage_records
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on patient_history"
  ON patient_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- Helper Views
-- =============================================
CREATE OR REPLACE VIEW triage_stats AS
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE risk_level = 'High') as high_risk_count,
  COUNT(*) FILTER (WHERE risk_level = 'Medium') as medium_risk_count,
  COUNT(*) FILTER (WHERE risk_level = 'Low') as low_risk_count,
  ROUND(AVG(confidence_score), 0) as avg_confidence,
  ROUND(AVG(risk_probability), 4) as avg_risk_probability
FROM triage_records;

CREATE OR REPLACE VIEW department_distribution AS
SELECT
  recommended_department as department,
  COUNT(*) as patient_count,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM triage_records), 0), 1) as percentage
FROM triage_records
GROUP BY recommended_department
ORDER BY patient_count DESC;
