-- SQL Schema for Solum Health Clinical Document Processing

-- 1. Documents Table: Tracks uploaded files and their processing status
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in Supabase Storage
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'extracted', 'completed', 'failed'
    raw_ocr_text TEXT, -- Stored for debugging/audit
    raw_ai_extraction JSONB -- The initial JSON returned by the LLM
);

-- 2. Service Requests Table: Stores the final approved form data
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Metadata
    payer_name TEXT,
    request_date DATE,
    payer_fax TEXT,
    payer_phone TEXT,

    -- SECTION A: MEMBER INFORMATION
    member_name TEXT,
    member_dob DATE,
    member_gender TEXT,
    member_id TEXT,
    group_number TEXT,
    member_phone TEXT,
    member_address TEXT,

    -- SECTION B: REQUESTING PROVIDER INFORMATION
    provider_name TEXT,
    provider_npi TEXT,
    provider_facility TEXT,
    provider_tax_id TEXT,
    provider_phone TEXT,
    provider_fax TEXT,
    provider_address TEXT,

    -- SECTION C: REFERRING PROVIDER
    referring_provider_name TEXT,
    referring_provider_npi TEXT,
    referring_provider_phone TEXT,

    -- SECTION D: SERVICE INFORMATION
    service_type TEXT, -- Outpatient, Inpatient, etc.
    service_setting TEXT,
    cpt_codes TEXT[], -- Array of CPT codes
    icd10_codes TEXT[], -- Array of ICD-10 codes
    diagnosis_descriptions TEXT,
    start_date DATE,
    end_date DATE,
    num_sessions_units INTEGER,
    frequency TEXT,

    -- SECTION E: CLINICAL INFORMATION
    presenting_symptoms TEXT,
    clinical_history TEXT,
    treatment_goals TEXT,

    -- SECTION F: CLINICAL JUSTIFICATION
    medical_necessity TEXT,
    risk_justification TEXT,

    -- SECTION G: ATTESTATION
    attestation_signature_name TEXT,
    attestation_date DATE,
    license_number TEXT,

    -- Payer use only
    auth_number TEXT,
    decision TEXT, -- 'approved', 'denied', 'pend'
    reviewer_name TEXT,
    decision_date DATE
);

-- 3. Medications: Sub-table for Section E
CREATE TABLE IF NOT EXISTS service_request_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dose TEXT,
    frequency TEXT,
    prescriber TEXT
);

-- 4. Assessments: Sub-table for Section E
CREATE TABLE IF NOT EXISTS service_request_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    score TEXT,
    assessment_date DATE
);

-- 5. Field Accuracy Logs: Tracks how often users correct specific fields
CREATE TABLE IF NOT EXISTS extraction_accuracy_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    initial_value TEXT,
    final_value TEXT,
    was_corrected BOOLEAN DEFAULT FALSE,
    confidence_score FLOAT -- Confidence score from the LLM if provided
);

-- RLS (Row Level Security) - Basic setup
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_request_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_request_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_accuracy_logs ENABLE ROW LEVEL SECURITY;

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_requests_updated_at
    BEFORE UPDATE ON service_requests
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
