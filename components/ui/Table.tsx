"use client";

import { ReactNode } from "react";

interface TableColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

/**
 * Table — accessible glass data table with sortable-header support.
 * Usage: <Table columns={[{header:'Job',render:(r)=>r.title}]} rows={jobs} empty="No jobs" />
 */
export function Table<T extends { id: string }>({
  columns,
  rows,
  empty = "Nothing here yet.",
  caption,
}: {
  columns: TableColumn<T>[];
  rows: T[];
  empty?: string;
  caption?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="glass-panel p-10 text-center">
        <p className="text-sm font-semibold text-slate-500">{empty}</p>
      </div>
    );
  }
  return (
    <div className="glass-panel overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-white/60 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {columns.map((col) => (
              <th key={col.header} scope="col" className={`px-4 py-3 ${col.className ?? ""}`.trim()}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-white/40 last:border-0 hover:bg-white/50 transition-colors">
              {columns.map((col) => (
                <td key={col.header} className={`px-4 py-3 text-slate-700 ${col.className ?? ""}`.trim()}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
