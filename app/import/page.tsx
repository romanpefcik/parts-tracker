"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";

type ParsedPart = {
  name: string;
  description: string | null;
  category: string | null;
  value: string | null;
  package: string | null;
  quantity: number;
  supplier: string | null;
  notes: string | null;
  selected: boolean;
};

type ImportResult = { created: number; updated: number };

type Step = "upload" | "review" | "done";

const CATEGORIES = [
  "Resistor","Capacitor","Inductor","Diode","Transistor","IC",
  "Potentiometer","Connector","LED","Module","Crystal","Relay","Fuse","Switch",
  "Cable","PCB","Other",
];

const inputCls = "border border-gray-200 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400";

export default function ImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parts, setParts] = useState<ParsedPart[]>([]);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setError("");
    setParsing(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/import/pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Parse failed."); return; }
      setParts(data.parts.map((p: Omit<ParsedPart, "selected">) => ({ ...p, selected: true })));
      setFilename(data.filename);
      setStep("review");
    } catch {
      setError("Network error, please try again.");
    } finally {
      setParsing(false);
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  function updatePart(idx: number, field: keyof ParsedPart, value: string | number | boolean | null) {
    setParts((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  function toggleAll(checked: boolean) {
    setParts((prev) => prev.map((p) => ({ ...p, selected: checked })));
  }

  async function confirmImport() {
    const selected = parts.filter((p) => p.selected);
    if (selected.length === 0) return;
    setImporting(true);
    const res = await fetch("/api/import/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parts: selected }),
    });
    const data = await res.json();
    setResult(data);
    setStep("done");
    setImporting(false);
  }

  if (step === "done" && result) {
    return (
      <div className="max-w-lg">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Import complete</h2>
          <p className="text-gray-500 text-sm mb-1">{result.created} part{result.created !== 1 ? "s" : ""} created</p>
          <p className="text-gray-500 text-sm mb-6">{result.updated} part{result.updated !== 1 ? "s" : ""} had stock incremented</p>
          <div className="flex justify-center gap-3">
            <Link href="/parts" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              View Inventory
            </Link>
            <button
              onClick={() => { setStep("upload"); setParts([]); setResult(null); setFilename(""); }}
              className="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Import Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "review") {
    const selectedCount = parts.filter((p) => p.selected).length;
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setStep("upload")} className="text-gray-400 hover:text-gray-600 text-sm">← Upload</button>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-800">Review Import</h1>
          <span className="text-sm text-gray-400 ml-1">from {filename}</span>
        </div>

        <p className="text-sm text-gray-500 mb-3">
          Review and edit the extracted parts. Parts with a matching name in inventory will have their stock incremented instead of creating a new row.
        </p>

        <div className="bg-white rounded-xl shadow overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-3 py-3 text-center w-8">
                  <input
                    type="checkbox"
                    checked={parts.every((p) => p.selected)}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="rounded"
                  />
                </th>
                <th className="px-3 py-3 text-left">Name</th>
                <th className="px-3 py-3 text-left">Description</th>
                <th className="px-3 py-3 text-left">Category</th>
                <th className="px-3 py-3 text-left">Value</th>
                <th className="px-3 py-3 text-left">Package</th>
                <th className="px-3 py-3 text-right">Qty</th>
                <th className="px-3 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {parts.map((part, i) => (
                <tr key={i} className={`transition-colors ${part.selected ? "hover:bg-gray-50" : "bg-gray-50 opacity-50"}`}>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={part.selected}
                      onChange={(e) => updatePart(i, "selected", e.target.checked)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-2 min-w-48">
                    <input value={part.name} onChange={(e) => updatePart(i, "name", e.target.value)} className={inputCls} />
                  </td>
                  <td className="px-3 py-2 min-w-64">
                    <input value={part.description ?? ""} onChange={(e) => updatePart(i, "description", e.target.value || null)} className={inputCls} />
                  </td>
                  <td className="px-3 py-2 min-w-32">
                    <select value={part.category ?? "Other"} onChange={(e) => updatePart(i, "category", e.target.value)} className={inputCls}>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 min-w-24">
                    <input value={part.value ?? ""} onChange={(e) => updatePart(i, "value", e.target.value || null)} className={inputCls} />
                  </td>
                  <td className="px-3 py-2 min-w-24">
                    <input value={part.package ?? ""} onChange={(e) => updatePart(i, "package", e.target.value || null)} className={inputCls} />
                  </td>
                  <td className="px-3 py-2 min-w-16">
                    <input
                      type="number"
                      min={1}
                      value={part.quantity}
                      onChange={(e) => updatePart(i, "quantity", Number(e.target.value))}
                      className={`${inputCls} text-right`}
                    />
                  </td>
                  <td className="px-3 py-2 min-w-36">
                    <input value={part.notes ?? ""} onChange={(e) => updatePart(i, "notes", e.target.value || null)} className={inputCls} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={confirmImport}
            disabled={selectedCount === 0 || importing}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {importing ? "Importing…" : `Import ${selectedCount} part${selectedCount !== 1 ? "s" : ""}`}
          </button>
          <Link href="/parts" className="text-sm text-gray-500 hover:underline">Cancel</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-5">
        <Link href="/parts" className="text-gray-400 hover:text-gray-600 text-sm">← Inventory</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-800">Import from PDF</h1>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          dragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-white"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {parsing ? (
          <div>
            <div className="text-4xl mb-3 animate-pulse">📄</div>
            <p className="text-gray-600 font-medium">Parsing invoice with AI…</p>
            <p className="text-gray-400 text-sm mt-1">This takes a few seconds</p>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-3">📄</div>
            <p className="text-gray-700 font-medium">Drop a PDF invoice here</p>
            <p className="text-gray-400 text-sm mt-1">or click to browse</p>
            <p className="text-gray-400 text-xs mt-3">Works with TME.eu, Mouser, Farnell, and other supplier invoices</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
      )}
    </div>
  );
}
