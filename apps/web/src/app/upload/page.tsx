"use client";

import { useRouter } from "next/navigation";
import { UploadSection } from "@/components/document-processor/UploadSection";

export default function UploadPage() {
  const router = useRouter();

  const handleUploadSuccess = (id: string) => {
    router.push(`/extract/${id}`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-[calc(100vh-65px)] flex flex-col justify-center">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Analyze Medical Document
        </h1>
        <p className="text-zinc-400 text-lg">
          Upload a clinical note to extract structured data with high accuracy.
        </p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 shadow-2xl backdrop-blur-sm">
        <UploadSection onUploadSuccess={handleUploadSuccess} />
      </div>
    </div>
  );
}
