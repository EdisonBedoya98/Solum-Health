'use client';

import React, { useState } from 'react';

interface UploadSectionProps {
  onUploadSuccess: (docId: string) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      onUploadSuccess(data.document_id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
      <h2 className="text-xl font-semibold mb-4">Upload Clinical Document</h2>
      <p className="text-gray-500 mb-6">PDF, JPG, or PNG</p>
      
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
        className={`px-6 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition ${
          uploading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {uploading ? 'Uploading...' : 'Select File'}
      </label>

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};
