"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ServiceRequest {
  id: string;
  created_at: string;
  member_name: string | null;
  payer_name: string | null;
  request_date: string | null;
  provider_name: string | null;
  diagnosis_descriptions: string | null;
  start_date: string | null;
  end_date: string | null;
  service_type: string | null;
  document_id: string | null;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("http://localhost:8000/requests");
        const data = await res.json();
        setRequests(data.requests || []);
      } catch (err) {
        console.error("Failed to fetch requests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleViewPdf = async (requestId: string) => {
    setSelectedId(requestId);
    setPdfLoading(true);
    setPdfUrl(null);
    try {
      const res = await fetch(
        `http://localhost:8000/requests/${requestId}/pdf`,
      );
      const data = await res.json();
      if (data.pdf_base64) {
        const byteCharacters = atob(data.pdf_base64);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: "application/pdf" });
        setPdfUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.error("Failed to load PDF:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleClose = () => {
    setPdfUrl(null);
    setSelectedId(null);
  };

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Service Requests
          </h1>
          <p className="text-zinc-400">
            Browse and preview all submitted AI-extracted service request forms.
          </p>
        </div>
        <Link
          href="/upload"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.25)] flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          New Upload
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-zinc-400">Loading submissions...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-zinc-400 font-medium">No service requests yet</p>
          <p className="text-zinc-600 text-sm">
            Upload a clinical note to get started
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-zinc-800/50 border-b border-zinc-800">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Member
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Payer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Provider
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Service Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Submitted
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-zinc-800/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-white">
                      {req.member_name || "—"}
                    </p>
                    {req.request_date && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Req. {formatDate(req.request_date)}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {req.payer_name || "—"}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {req.provider_name || "—"}
                  </td>
                  <td className="px-6 py-4">
                    {req.service_type ? (
                      <span className="inline-flex px-2.5 py-1 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-lg text-xs font-medium capitalize">
                        {req.service_type}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {formatDate(req.created_at)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleViewPdf(req.id)}
                      disabled={selectedId === req.id && pdfLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-white font-medium rounded-xl transition-all text-sm disabled:opacity-50 group-hover:border-zinc-600"
                    >
                      {selectedId === req.id && pdfLoading ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4"
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
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-zinc-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          View PDF
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PDF Preview Modal */}
      {pdfUrl && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-start p-4 z-50 backdrop-blur-sm overflow-hidden">
          <div className="bg-zinc-900 w-full max-w-6xl h-full rounded-3xl shadow-2xl border border-zinc-800 flex flex-col overflow-hidden text-white">
            <div className="flex justify-between items-center px-8 py-5 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-600/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold">Service Request Form</h2>
                  <p className="text-sm text-zinc-500">
                    AI-Generated PDF — Read Only
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2 rounded-xl font-bold transition-all border border-zinc-700 hover:border-zinc-600"
              >
                Close
              </button>
            </div>
            <div className="flex-1 bg-zinc-950 p-4">
              <div className="w-full h-full rounded-2xl overflow-hidden border border-zinc-800">
                <iframe
                  src={pdfUrl}
                  className="w-full h-full"
                  title="Service Request PDF"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
