'use client';

import React, { useState } from 'react';
import { UploadSection } from '@/components/document-processor/UploadSection';
import { ExtractionForm } from '@/components/document-processor/ExtractionForm';
import { AccuracyDashboard } from '@/components/document-processor/AccuracyDashboard';

export default function Home() {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [view, setView] = useState<'upload' | 'review' | 'dashboard'>('upload');

  const handleUploadSuccess = (id: string) => {
    setDocumentId(id);
    setView('review');
  };

  const handleFormSuccess = () => {
    setView('dashboard');
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">
            Solum <span className="text-blue-600">Health</span>
          </h1>
          <nav className="space-x-4">
            <button 
              onClick={() => setView('upload')}
              className={`px-4 py-2 rounded-md ${view === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              New Upload
            </button>
            <button 
              onClick={() => setView('dashboard')}
              className={`px-4 py-2 rounded-md ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              Accuracy Dashboard
            </button>
          </nav>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
          {view === 'upload' && (
            <div className="p-20 flex items-center justify-center h-full">
              <UploadSection onUploadSuccess={handleUploadSuccess} />
            </div>
          )}

          {view === 'review' && documentId && (
            <div className="p-8">
              <ExtractionForm documentId={documentId} onSuccess={handleFormSuccess} />
            </div>
          )}

          {view === 'dashboard' && (
            <div className="p-8">
              <AccuracyDashboard />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
