"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Project = { id: number; name: string };
type Allocation = { id: number; quantity: number; notes: string | null; project: Project };
type Part = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  value: string | null;
  package: string | null;
  supplier: string | null;
  datasheet: string | null;
  quantity: number;
  notes: string | null;
  allocations: Allocation[];
};

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

export default function PartDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [part, setPart] = useState<Part | null>(null);
  const [saving, setSaving] = useState(false);
  const [adjustDelta, setAdjustDelta] = useState(1);

  async function load() {
    const res = await fetch(`/api/parts/${id}`);
    if (!res.ok) { router.push("/parts"); return; }
    setPart(await res.json());
  }

  useEffect(() => { load(); }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!part) return;
    setSaving(true);
    await fetch(`/api/parts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: part.name,
        description: part.description,
        category: part.category,
        value: part.value,
        package: part.package,
        supplier: part.supplier,
        datasheet: part.datasheet,
        notes: part.notes,
      }),
    });
    setSaving(false);
    router.push("/parts");
  }

  async function adjust(delta: number) {
    await fetch(`/api/parts/${id}/adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta }),
    });
    load();
  }

  async function removeAllocation(allocId: number) {
    if (!part) return;
    if (!confirm("Remove this allocation?")) return;
    await fetch(`/api/projects/${part.allocations.find(a => a.id === allocId)?.project.id}/allocations/${allocId}`, {
      method: "DELETE",
    });
    load();
  }

  if (!part) return <p className="text-gray-500 text-sm">Loading…</p>;

  const allocated = part.allocations.reduce((s, a) => s + a.quantity, 0);
  const avail = part.quantity - allocated;

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-5">
        <Link href="/parts" className="text-gray-400 hover:text-gray-600 text-sm">← Inventory</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-800">{part.name}</h1>
      </div>

      {/* Stock card */}
      <div className="bg-white rounded-xl shadow p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase font-medium">In Stock</p>
          <p className="text-3xl font-bold text-gray-800">{part.quantity}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase font-medium">Available</p>
          <p className={`text-3xl font-bold ${avail <= 0 ? "text-red-500" : "text-green-600"}`}>{avail}</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={adjustDelta}
              onChange={(e) => setAdjustDelta(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-16 text-center"
            />
            <button onClick={() => adjust(adjustDelta)} className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-200">+ Add</button>
            <button onClick={() => adjust(-adjustDelta)} disabled={part.quantity < adjustDelta} className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-40">− Remove</button>
          </div>
        </div>
      </div>

      {/* Allocations */}
      {part.allocations.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4 mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Allocated to Projects</p>
          <ul className="space-y-1">
            {part.allocations.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <Link href={`/projects/${a.project.id}`} className="text-blue-600 hover:underline">{a.project.name}</Link>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-gray-700">{a.quantity} pcs</span>
                  {a.notes && <span className="text-gray-400 text-xs">{a.notes}</span>}
                  <button onClick={() => removeAllocation(a.id)} className="text-red-400 hover:text-red-600 text-xs">remove</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Edit form */}
      <form onSubmit={save} className="bg-white rounded-xl shadow p-6 space-y-4">
        <Field label="Name *">
          <input required value={part.name} onChange={(e) => setPart({ ...part, name: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Description">
          <textarea value={part.description ?? ""} onChange={(e) => setPart({ ...part, description: e.target.value })} rows={2} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <input value={part.category ?? ""} onChange={(e) => setPart({ ...part, category: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Value">
            <input value={part.value ?? ""} onChange={(e) => setPart({ ...part, value: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Package">
            <input value={part.package ?? ""} onChange={(e) => setPart({ ...part, package: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Supplier">
            <input value={part.supplier ?? ""} onChange={(e) => setPart({ ...part, supplier: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <Field label="Datasheet URL">
          <input type="url" value={part.datasheet ?? ""} onChange={(e) => setPart({ ...part, datasheet: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Notes">
          <textarea value={part.notes ?? ""} onChange={(e) => setPart({ ...part, notes: e.target.value })} rows={2} className={inputCls} />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <Link href="/parts" className="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
