"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

interface FieldMetric {
  field: string;
  accuracy: string;
  total: number;
  corrections: number;
}

export const AccuracyDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<FieldMetric[]>([]);
  const [loading, setLoading] = useState(true);

  // Overall computed stats
  const totalFields = metrics.reduce((s, m) => s + (Number(m.total) || 0), 0);
  const totalCorrections = metrics.reduce(
    (s, m) => s + (Number(m.corrections) || 0),
    0,
  );
  const overallAccuracyNum =
    totalFields > 0
      ? ((totalFields - totalCorrections) / totalFields) * 100
      : null;
  const overallAccuracy =
    overallAccuracyNum !== null && !isNaN(overallAccuracyNum)
      ? overallAccuracyNum.toFixed(1)
      : null;

  useEffect(() => {
    const fetchMetrics = async () => {
      const { data } = await supabase
        .from("extraction_accuracy_logs")
        .select("*");

      if (data) {
        const grouped = data.reduce(
          (
            acc: Record<string, { total: number; corrections: number }>,
            log,
          ) => {
            if (!acc[log.field_name])
              acc[log.field_name] = { total: 0, corrections: 0 };
            acc[log.field_name].total += 1;
            if (log.was_corrected) acc[log.field_name].corrections += 1;
            return acc;
          },
          {},
        );

        const formatted: FieldMetric[] = Object.keys(grouped)
          .map((field) => {
            const total = Number(grouped[field].total) || 0;
            const corrections = Number(grouped[field].corrections) || 0;
            const pct = total > 0 ? ((total - corrections) / total) * 100 : 0;
            return {
              field,
              accuracy: isNaN(pct) ? "0.0" : pct.toFixed(1),
              total,
              corrections,
            };
          })
          .sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));

        setMetrics(formatted);
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
