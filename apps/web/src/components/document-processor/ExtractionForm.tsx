"use client";

import React, { useState, useEffect, useRef } from "react";

interface ExtractionFormProps {
  documentId: string;
  onSuccess: () => void;
}

interface Medication {
  name: string;
  dose: string;
  frequency: string;
  prescriber: string;
}

interface Assessment {
  tool_name: string;
  score: string;
  assessment_date: string;
}

interface ExtractionData {
  payer_name: string;
  request_date: string;
  payer_fax: string;
  payer_phone: string;
  member_name: string;
  member_dob: string;
  member_gender: string;
  member_id: string;
  group_number: string;
  member_phone: string;
  member_address: string;
  provider_name: string;
  provider_npi: string;
  provider_facility: string;
  provider_tax_id: string;
  provider_phone: string;
  provider_fax: string;
  provider_address: string;
  referring_provider_name: string;
  referring_provider_npi: string;
  referring_provider_phone: string;
  service_type: string;
  service_setting: string;
  cpt_codes: string[];
  icd10_codes: string[];
  diagnosis_descriptions: string;
  start_date: string;
  end_date: string;
  num_sessions_units: number;
  frequency: string;
  presenting_symptoms: string;
  clinical_history: string;
  treatment_goals: string;
  medical_necessity: string;
  risk_justification: string;
  medications: Medication[];
  assessments: Assessment[];
  attestation_signature_name: string;
  attestation_date: string;
  license_number: string;
  [key: string]:
    | string
    | number
    | string[]
    | Medication[]
    | Assessment[]
    | undefined;
}

export const ExtractionForm: React.FC<ExtractionFormProps> = ({
  documentId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<ExtractionData | null>(null);
  console.log("🚀 ~ ExtractionForm ~ formData:", formData);
  const [initialData, setInitialData] = useState<ExtractionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    const fetchExtraction = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/extract/${documentId}`,
          {
            method: "POST",
          },
        );
        if (!response.ok) throw new Error("Extraction failed");
        const data = (await response.json()) as ExtractionData;

        setFormData(data);
        setInitialData(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExtraction();
  }, [documentId]);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/submit-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            document_id: documentId,
            initial_values: initialData,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Submission failed");

      // Generate PDF preview from Backend's base64 response
      if (data.pdf_base64) {
        // Convert base64 to Blob URL
        const byteCharacters = atob(data.pdf_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const pdfUrl = URL.createObjectURL(blob);
        setPreviewPdfUrl(pdfUrl);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-20 text-zinc-100 space-y-6">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-blue-500/10 animate-pulse"></div>
          </div>
        </div>
        <div className="text-center">
          <p className="font-bold text-xl mb-1 text-zinc-100">
            Processing clinical note
          </p>
          <p className="text-zinc-400">
            Gemini AI is extracting structured data... This may take a few
            seconds.
          </p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="p-12 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl inline-block max-w-md">
          <p className="font-bold mb-2">Extraction Error</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </div>
    );

  const renderField = (
    label: string,
    fieldName: string,
    type: string = "text",
  ) => {
    if (!formData) return null;

    const confidenceField = `${fieldName}_confidence`;
    const confidence = formData[confidenceField] as number | undefined;
    const isLowConfidence = confidence !== undefined && confidence < 0.7;

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">
          {label}{" "}
          {isLowConfidence && (
            <span className="text-amber-500 text-xs font-bold ml-2 inline-flex items-center gap-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Review needed
            </span>
          )}
        </label>
        <input
          type={type}
          className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-zinc-600 ${
            isLowConfidence
              ? "border-amber-500/30 bg-amber-500/5 text-amber-200"
              : "border-zinc-800 bg-black/40 text-white hover:border-zinc-700"
          }`}
          value={(formData[fieldName] as string | number) || ""}
          onChange={(e) => handleChange(fieldName, e.target.value)}
        />
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-2 gap-6">
        {renderField("Payer Name", "payer_name")}
        {renderField("Date of Request", "request_date", "date")}
      </div>

      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-inner">
        <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-[10px]">
            A
          </span>
          Member Information
        </h3>
        <div className="grid grid-cols-2 gap-x-6">
          {renderField("Member Name", "member_name")}
          {renderField("Date of Birth", "member_dob", "date")}
          {renderField("Gender", "member_gender")}
          {renderField("Member ID", "member_id")}
          {renderField("Group Number", "group_number")}
          {renderField("Phone Number", "member_phone")}
          <div className="col-span-2">
            {renderField("Address", "member_address")}
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
        <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-[10px]">
            B
          </span>
          Requesting Provider
        </h3>
        <div className="grid grid-cols-2 gap-x-6">
          {renderField("Provider Name", "provider_name")}
          {renderField("Provider NPI", "provider_npi")}
          {renderField("Facility Name", "provider_facility")}
          {renderField("Tax ID", "provider_tax_id")}
          {renderField("Phone", "provider_phone")}
          {renderField("Fax", "provider_fax")}
          <div className="col-span-2">
            {renderField("Address", "provider_address")}
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
        <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-[10px]">
            D
          </span>
          Service details
        </h3>
        <div className="grid grid-cols-2 gap-x-6">
          {renderField("Service Type", "service_type")}
          {renderField("Service Setting", "service_setting")}
          {renderField("Diagnosis Descriptions", "diagnosis_descriptions")}
          {renderField("Start Date", "start_date", "date")}
          {renderField("End Date", "end_date", "date")}
          {renderField("Sessions/Units", "num_sessions_units", "number")}
        </div>
      </div>

      <div className="sticky bottom-8 py-4 px-8 bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-2xl flex justify-between items-center z-40">
        <div className="flex flex-col">
          <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
            Ready to submit
          </span>
          <span className="text-sm text-zinc-300">
            Review all extracted fields above
          </span>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className={`px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all active:scale-95 flex items-center gap-2 ${
            submitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {submitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </>
          ) : (
            "Generate Final PDF"
          )}
        </button>
      </div>

      {/* PDF Preview Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-start p-4 z-50 backdrop-blur-sm overflow-hidden">
          <div className="bg-zinc-900 w-full max-w-6xl h-full rounded-3xl shadow-2xl border border-zinc-800 flex flex-col overflow-hidden text-white relative">
            <div className="flex justify-between items-center px-8 py-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    PDF successfully generated
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Preview the final service request form before closing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewPdfUrl(null);
                  onSuccess();
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 border border-zinc-700 hover:border-zinc-600 flex items-center gap-2 group"
              >
                Close & Finish
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 w-full bg-zinc-950 p-4">
              <div className="w-full h-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
                <iframe
                  src={previewPdfUrl}
                  className="w-full h-full"
                  title="Generated PDF Preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
