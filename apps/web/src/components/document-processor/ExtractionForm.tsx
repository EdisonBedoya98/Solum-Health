"use client";

import React, { useState, useEffect, useRef } from "react";

interface ExtractionFormProps {
  documentId: string;
  onSuccess: () => void;
}

export const ExtractionForm: React.FC<ExtractionFormProps> = ({
  documentId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<any>(null);
  const [initialData, setInitialData] = useState<any>(null);
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
          `http://localhost:8000/extract/${documentId}`,
          {
            method: "POST",
          },
        );
        if (!response.ok) throw new Error("Extraction failed");
        const data = await response.json();

        setFormData(data);
        setInitialData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExtraction();
  }, [documentId]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("http://localhost:8000/submit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          document_id: documentId,
          initial_values: initialData,
        }),
      });

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-10 text-black space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="font-medium">
          AI is analyzing your document... This may take a few seconds.
        </p>
      </div>
    );
  if (error)
    return <div className="text-red-500 p-10 text-center">{error}</div>;

  const renderField = (
    label: string,
    fieldName: string,
    type: string = "text",
  ) => {
    const confidenceField = `${fieldName}_confidence`;
    const confidence = formData[confidenceField];
    const isLowConfidence = confidence !== undefined && confidence < 0.7;

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}{" "}
          {isLowConfidence && (
            <span className="text-amber-500 font-bold ml-1">
              ⚠️ Low Confidence
            </span>
          )}
        </label>
        <input
          type={type}
          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition text-black ${
            isLowConfidence
              ? "border-amber-400 bg-amber-50"
              : "border-gray-300 bg-white"
          }`}
          value={formData[fieldName] || ""}
          onChange={(e) => handleChange(fieldName, e.target.value)}
        />
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-xl"
    >
      <h1 className="text-2xl font-bold mb-6 text-center border-b pb-4">
        REQUEST FOR APPROVAL OF SERVICES
      </h1>

      <div className="grid grid-cols-2 gap-4">
        {renderField("Payer Name", "payer_name")}
        {renderField("Date of Request", "request_date", "date")}
      </div>

      <div className="bg-gray-100 p-4 rounded-md mb-6">
        <h3 className="font-bold mb-3">SECTION A: MEMBER INFORMATION</h3>
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

      <div className="bg-gray-100 p-4 rounded-md mb-6">
        <h3 className="font-bold mb-3">
          SECTION B: REQUESTING PROVIDER INFORMATION
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

      <div className="bg-gray-100 p-4 rounded-md mb-6">
        <h3 className="font-bold mb-3">SECTION D: SERVICE INFORMATION</h3>
        <div className="grid grid-cols-2 gap-x-6">
          {renderField("Service Type", "service_type")}
          {renderField("Service Setting", "service_setting")}
          {renderField("Diagnosis Descriptions", "diagnosis_descriptions")}
          {renderField("Start Date", "start_date", "date")}
          {renderField("End Date", "end_date", "date")}
          {renderField("Sessions/Units", "num_sessions_units", "number")}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="submit"
          disabled={submitting}
          className={`px-10 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition ${
            submitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {submitting ? "Submitting..." : "Approve & Create PDF"}
        </button>
      </div>

      {/* PDF Preview Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-lg shadow-xl flex flex-col overflow-hidden text-black">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">
                Generated Service Request Form
              </h2>
              <button
                type="button"
                onClick={() => {
                  setPreviewPdfUrl(null);
                  onSuccess(); // Complete the flow when the modal is closed
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-bold"
              >
                Close & Complete
              </button>
            </div>
            <div className="flex-1 w-full bg-gray-200">
              <iframe
                src={previewPdfUrl}
                className="w-full h-full"
                title="Generated PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
