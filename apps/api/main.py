from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
import os
import uuid
import json
import google.generativeai as genai
import base64
from pydantic import BaseModel
from typing import List, Optional
from pdf_service import generate_pdf_from_html

load_dotenv()

app = FastAPI(title="Solum Health API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase
supabase_url: str = os.getenv("SUPABASE_URL", "")
supabase_key: str = os.getenv("SUPABASE_KEY", "")
supabase: Client = create_client(supabase_url, supabase_key)

# Initialize Gemini
google_api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=google_api_key)
model = genai.GenerativeModel('gemini-2.5-flash')

# Pydantic Models for Form Submission
class Medication(BaseModel):
    name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    prescriber: Optional[str] = None

class Assessment(BaseModel):
    tool_name: str
    score: Optional[str] = None
    assessment_date: Optional[str] = None

class ServiceRequestSubmission(BaseModel):
    document_id: str
    payer_name: Optional[str] = None
    request_date: Optional[str] = None
    payer_fax: Optional[str] = None
    payer_phone: Optional[str] = None
    
    member_name: Optional[str] = None
    member_dob: Optional[str] = None
    member_gender: Optional[str] = None
    member_id: Optional[str] = None
    group_number: Optional[str] = None
    member_phone: Optional[str] = None
    member_address: Optional[str] = None
    
    provider_name: Optional[str] = None
    provider_npi: Optional[str] = None
    provider_facility: Optional[str] = None
    provider_tax_id: Optional[str] = None
    provider_phone: Optional[str] = None
    provider_fax: Optional[str] = None
    provider_address: Optional[str] = None
    
    referring_provider_name: Optional[str] = None
    referring_provider_npi: Optional[str] = None
    referring_provider_phone: Optional[str] = None
    
    service_type: Optional[str] = None
    service_setting: Optional[str] = None
    cpt_codes: List[str] = []
    icd10_codes: List[str] = []
    diagnosis_descriptions: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    num_sessions_units: Optional[int] = None
    frequency: Optional[str] = None
    
    presenting_symptoms: Optional[str] = None
    clinical_history: Optional[str] = None
    treatment_goals: Optional[str] = None
    medical_necessity: Optional[str] = None
    risk_justification: Optional[str] = None
    
    medications: List[Medication] = []
    assessments: List[Assessment] = []
    
    attestation_signature_name: Optional[str] = None
    attestation_date: Optional[str] = None
    license_number: Optional[str] = None
    
    # Correction Tracking
    initial_values: dict = {}

@app.get("/")
def read_root():
    return {"message": "Welcome to Solum Health API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    # 1. Generate unique ID and path
    doc_id = str(uuid.uuid4())
    file_ext = file.filename.split(".")[-1]
    file_path = f"documents/{doc_id}.{file_ext}"
    
    # 2. Upload to Supabase Storage
    try:
        content = await file.read()
        supabase.storage.from_("medical-documents").upload(
            path=file_path,
            file=content,
            file_options={"content-type": file.content_type}
        )
        
        # 3. Create record in DB
        res = supabase.table("documents").insert({
            "id": doc_id,
            "file_name": file.filename,
            "file_path": file_path,
            "status": "pending"
        }).execute()
        
        return {"document_id": doc_id, "file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract/{document_id}")
async def extract_data(document_id: str):
    # 1. Fetch document info
    doc_res = supabase.table("documents").select("*").eq("id", document_id).single().execute()
    if not doc_res.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = doc_res.data["file_path"]
    
    # 2. Download from Storage
    try:
        file_content = supabase.storage.from_("medical-documents").download(file_path)
        
        # 3. Process with Gemini
        # Prepare the prompt
        prompt = """
        Extract all possible information from this medical document into a structured JSON format.
        The JSON should follow this template:
        {
            "payer_name": "", "request_date": "", "payer_fax": "", "payer_phone": "",
            "member_name": "", "member_dob": "", "member_gender": "", "member_id": "", "group_number": "", "member_phone": "", "member_address": "",
            "provider_name": "", "provider_npi": "", "provider_facility": "", "provider_tax_id": "", "provider_phone": "", "provider_fax": "", "provider_address": "",
            "referring_provider_name": "", "referring_provider_npi": "", "referring_provider_phone": "",
            "service_type": "", "service_setting": "", "cpt_codes": [], "icd10_codes": [], "diagnosis_descriptions": "", "start_date": "", "end_date": "", "num_sessions_units": 0, "frequency": "",
            "presenting_symptoms": "", "clinical_history": "", "treatment_goals": "", "medical_necessity": "", "risk_justification": "",
            "medications": [{"name": "", "dose": "", "frequency": "", "prescriber": ""}],
            "assessments": [{"tool_name": "", "score": "", "assessment_date": ""}],
            "attestation_signature_name": "", "attestation_date": "", "license_number": ""
        }
        For fields where you are uncertain, please flag them by adding a suffix "_confidence" with a value between 0 and 1.
        Return ONLY the JSON.
        """
        
        # Use multimodal capabilities
        # Determine mime type
        mime_type = "application/pdf" if file_path.endswith(".pdf") else "image/jpeg"
        
        response = model.generate_content([
            prompt,
            {"mime_type": mime_type, "data": file_content}
        ])
        
        # Clean up the JSON response
        raw_text = response.text
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        
        extraction = json.loads(raw_text)
        
        # 4. Update DB
        supabase.table("documents").update({
            "status": "extracted",
            "raw_ai_extraction": extraction
        }).eq("id", document_id).execute()
        
        return extraction
    except Exception as e:
        supabase.table("documents").update({"status": "failed"}).eq("id", document_id).execute()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/submit-request")
async def submit_request(data: ServiceRequestSubmission):
    try:
        # 1. Save to service_requests
        req_data = data.model_dump()
        meds = req_data.pop("medications", [])
        assessments = req_data.pop("assessments", [])
        initial_values = req_data.pop("initial_values", {})
        
        # Sanitize empty strings to None for DB insertion and remove _confidence suffix
        def sanitize_val(v):
            if v == "":
                return None
            if isinstance(v, str) and v.endswith("_confidence"):
                return v.replace("_confidence", "").strip()
            return v
            
        req_data = {k: sanitize_val(v) for k, v in req_data.items()}
        
        res = supabase.table("service_requests").insert(req_data).execute()
        request_id = res.data[0]["id"]
        
        # 2. Save Medications
        if meds:
            for m in meds:
                m["request_id"] = request_id
            supabase.table("service_request_medications").insert(meds).execute()
            
        # 3. Save Assessments
        if assessments:
            for a in assessments:
                a["request_id"] = request_id
            supabase.table("service_request_assessments").insert(assessments).execute()
            
        # 4. Track Accuracy (Compare with initial_values)
        # Only track meaningful form fields — skip confidence scores, metadata, and nested objects
        SKIP_FIELDS = {
            "document_id", "request_id", "medications", "assessments",
            "initial_values", "created_at", "updated_at", "status",
            "auth_number", "decision", "reviewer_name", "decision_date",
        }
        
        accuracy_logs = []

        def normalize(v) -> str:
            """Normalize a value for comparison: None, 'None', and '' all become ''."""
            if v is None:
                return ""
            s = str(v).strip()
            return "" if s.lower() in ("none", "null") else s

        for field in initial_values:
            # Skip confidence score suffixes
            if field.endswith("_confidence"):
                continue
            # Skip metadata / nested fields
            if field in SKIP_FIELDS:
                continue
            final_val = req_data.get(field)
            # Skip lists and dicts
            if isinstance(final_val, (list, dict)) or isinstance(initial_values[field], (list, dict)):
                continue

            str_initial = normalize(initial_values[field])
            str_final = normalize(final_val)
            was_corrected = str_initial != str_final

            accuracy_logs.append({
                "document_id": data.document_id,
                "field_name": field,
                "initial_value": str_initial,
                "final_value": str_final,
                "was_corrected": was_corrected
            })
        
        if accuracy_logs:
            supabase.table("extraction_accuracy_logs").insert(accuracy_logs).execute()
            
        # 5. Mark document as completed
        supabase.table("documents").update({"status": "completed"}).eq("id", data.document_id).execute()
        
        # 6. Generate the filled PDF using the backend Playwright service
        pdf_bytes = await generate_pdf_from_html(req_data)
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        return {
            "status": "success", 
            "request_id": request_id,
            "pdf_base64": pdf_base64
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/requests")
async def list_requests():
    """List all submitted service requests with summary info."""
    try:
        res = supabase.table("service_requests")\
            .select("id, created_at, member_name, payer_name, request_date, provider_name, diagnosis_descriptions, start_date, end_date, service_type, document_id")\
            .order("created_at", desc=True)\
            .execute()
        return {"requests": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/requests/{request_id}/pdf")
async def get_request_pdf(request_id: str):
    """Regenerate the PDF for a specific service request."""
    try:
        res = supabase.table("service_requests").select("*").eq("id", request_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Request not found")

        # Also fetch medications and assessments
        meds_res = supabase.table("service_request_medications").select("*").eq("request_id", request_id).execute()
        asm_res = supabase.table("service_request_assessments").select("*").eq("request_id", request_id).execute()

        req_data = res.data
        req_data["medications"] = meds_res.data or []
        req_data["assessments"] = asm_res.data or []

        pdf_bytes = await generate_pdf_from_html(req_data)
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        return {"pdf_base64": pdf_base64}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
