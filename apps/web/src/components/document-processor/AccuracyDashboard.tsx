"use client";

import React, { useState, useEffect } from "react";

interface FieldMetric {
  field: string;
  accuracy: string;
  total: number;
  corrections: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const AccuracyDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<FieldMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallAccuracy, setOverallAccuracy] = useState<string | null>(null);
  const [totalFields, setTotalFields] = useState(0);
  const [totalCorrections, setTotalCorrections] = useState(0);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_URL}/accuracy-logs`);
        if (!res.ok) throw new Error("Failed to fetch accuracy logs");
        const data = await res.json();

        setMetrics(
          data.metrics.map((m: { field: string; accuracy: number; total: number; corrections: number }) => ({
            ...m,
            accuracy: m.accuracy.toFixed(1),
          })),
        );
        setOverallAccuracy(
          data.overall_accuracy !== null ? data.overall_accuracy.toFixed(1) : null,
        );
        setTotalFields(data.total_fields);
        setTotalCorrections(data.total_corrections);
      } catch (err) {
        console.error("Error fetching accuracy metrics:", err);
      }
      setLoading(false);
    };

    fetchMetrics();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p className="text-zinc-500 font-medium">Loading metrics...</p>
      </div>
    );

  return (
    <div className="overflow-hidden">
      {/* ── Overall Accuracy Stats ─────────────────────────────── */}
      <div className="p-6 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Overall Extraction Accuracy
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Overall Accuracy */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              Overall Accuracy
            </span>
            {overallAccuracy !== null ? (
              <>
                <span
                  className={`text-4xl font-bold mt-1 ${
                    parseFloat(overallAccuracy) >= 90
                      ? "text-emerald-400"
                      : parseFloat(overallAccuracy) >= 75
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}
                >
                  {overallAccuracy}%
                </span>
                <span className="text-xs text-zinc-600">
                  {totalFields - totalCorrections} / {totalFields} fields
                  correct
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold mt-1 text-zinc-600">—</span>
            )}
          </div>

          {/* Total Fields Evaluated */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              Fields Evaluated
            </span>
            <span className="text-4xl font-bold mt-1 text-white">
              {totalFields || "—"}
            </span>
            <span className="text-xs text-zinc-600">
              across {metrics.length} unique fields
            </span>
          </div>

          {/* Human Corrections */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              Human Corrections
            </span>
            <span className="text-4xl font-bold mt-1 text-amber-400">
              {totalCorrections}
            </span>
            <span className="text-xs text-zinc-600">
              fields manually corrected
            </span>
          </div>
        </div>
      </div>

      {/* ── Per-Field Breakdown Table ──────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-zinc-800/50 text-zinc-400 border-b border-zinc-800">
              <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider">
                Field Name
              </th>
              <th className="px-6 py-4 text-center font-semibold text-xs uppercase tracking-wider">
                Accuracy %
              </th>
              <th className="px-6 py-4 text-center font-semibold text-xs uppercase tracking-wider">
                Corrections
              </th>
              <th className="px-6 py-4 text-center font-semibold text-xs uppercase tracking-wider">
                Sample Size
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {metrics.map((m) => (
              <tr
                key={m.field}
                className="hover:bg-zinc-800/30 transition-colors group"
              >
                <td className="px-6 py-4 capitalize font-medium text-zinc-300">
                  {m.field.replace(/_/g, " ")}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold shadow-sm ${
                      parseFloat(m.accuracy) < 80
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : "bg-green-500/10 text-emerald-500 border border-emerald-500/20"
                    }`}
                  >
                    {m.accuracy}%
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-zinc-500 font-mono text-sm">
                  {m.corrections}
                </td>
                <td className="px-6 py-4 text-center text-zinc-500 font-mono text-sm">
                  {m.total}
                </td>
              </tr>
            ))}
            {metrics.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-16 text-center text-zinc-500 italic"
                >
                  No extraction logs found. Start by uploading your first
                  document!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
