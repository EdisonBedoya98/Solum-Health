"use client";
export const dynamic = "force-dynamic";

import { AccuracyDashboard } from "@/components/document-processor/AccuracyDashboard";

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Accuracy Dashboard
        </h1>
        <p className="text-zinc-400">
          Track and analyze document extraction performance across all your
          clinical notes.
        </p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <AccuracyDashboard />
      </div>
    </div>
  );
}
