"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const AccuracyDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      // Query accuracy logs from Supabase
      const { data, error } = await supabase
        .from("extraction_accuracy_logs")
        .select("*");

      if (data) {
        // Group by field name
        const grouped = data.reduce((acc: any, log: any) => {
          if (!acc[log.field_name])
            acc[log.field_name] = { total: 0, corrections: 0 };
          acc[log.field_name].total += 1;
          if (log.was_corrected) acc[log.field_name].corrections += 1;
          return acc;
        }, {});

        const formatted = Object.keys(grouped)
          .map((field) => ({
            field,
            accuracy: (
              ((grouped[field].total - grouped[field].corrections) /
                grouped[field].total) *
              100
            ).toFixed(1),
            total: grouped[field].total,
          }))
          .sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));

        setMetrics(formatted);
      }
      setLoading(false);
    };

    fetchMetrics();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md text-black">
      <h2 className="text-xl font-bold mb-6">Extraction Accuracy Dashboard</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100 text-black">
              <th className="px-4 py-2 text-left">Field Name</th>
              <th className="px-4 py-2 text-center">Accuracy %</th>
              <th className="px-4 py-2 text-center">Sample Size</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.field} className="border-b">
                <td className="px-4 py-2 capitalize">
                  {m.field.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={`font-bold ${parseFloat(m.accuracy) < 80 ? "text-red-500" : "text-green-500"}`}
                  >
                    {m.accuracy}%
                  </span>
                </td>
                <td className="px-4 py-2 text-center">{m.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
