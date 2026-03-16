"use client";

import { useRouter, useParams } from "next/navigation";
import { ExtractionForm } from "@/components/document-processor/ExtractionForm";

export default function ExtractPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const handleSuccess = () => {
    router.push("/");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Review Extraction
          </h1>
          <p className="text-zinc-400">
            Verify and correct the information extracted from the clinical note.
          </p>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm">
        <ExtractionForm documentId={id} onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
