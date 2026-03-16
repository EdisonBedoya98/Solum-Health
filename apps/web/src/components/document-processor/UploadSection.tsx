"use client";

import React, { useState } from "react";

interface UploadSectionProps {
  onUploadSuccess: (docId: string) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onUploadSuccess,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      onUploadSuccess(data.document_id);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-blue-500/50 transition-all group">
      <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">
        Upload clinical document
      </h2>
      <p className="text-zinc-500 mb-8 max-w-xs text-center">
        Drag and drop your medical file or click to browse. Supports PDF, JPG,
        PNG.
      </p>

      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileUpload}
        disabled={uploading}
        accept=".pdf,.jpg,.jpeg,.png"
      />
      <label
        htmlFor="file-upload"
        className={`px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl cursor-pointer hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all active:scale-95 flex items-center gap-2 ${
          uploading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {uploading ? (
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
            Uploading...
          </>
        ) : (
          "Select File"
        )}
      </label>

      {error && (
        <p className="text-red-400 mt-6 font-medium bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">
          {error}
        </p>
      )}
    </div>
  );
};
