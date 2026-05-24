"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Part = { id: number; name: string; quantity: number; category: string | null; value: string | null };
type Allocation = { id: number; quantity: number; notes: string | null; part: Part };
type Project = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  allocations: Allocation[];
};

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [saving, setSaving] = useState(false);

  // Allocate form state
  const [allocPartId, setAllocPartId] = useState("");
  const [allocQty, setAllocQty] = useState(1);
  const [allocNotes, setAllocNotes] = useState("");
  const [allocating, setAllocating] = useState(false);

  // Edit allocation inline
  const [editingAllocId, setEditingAllocId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState(1);
  const [editNotes, setEditNotes] = useState("");

  async function load() {
    const [projRes, partsRes] = await Promise.all([
      fetch(`/api/projects/${id}`),
      fetch("/api/parts"),
    ]);
    if (!projRes.ok) { router.push("/projects"); return; }
    setProject(await projRes.json());
    setAllParts(await partsRes.json());
  }

  useEffect(() => { load(); }, [id]);

  async function saveProject(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    setSaving(true);
    await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: project.name, description: project.description, status: project.status }),
    });
    setSaving(false);
  }

  async function allocate(e: React.FormEvent) {
    e.preventDefault();
    if (!allocPartId) return;
    setAllocating(true);
    await fetch(`/api/projects/${id}/allocations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partId: Number(allocPartId), quantity: allocQty, notes: allocNotes || null }),
    });
    setAllocPartId("");
    setAllocQty(1);
    setAllocNotes("");
    setAllocating(false);
    load();
  }

  async function updateAllocation(allocId: number) {
    await fetch(`/api/projects/${id}/allocations/${allocId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: editQty, notes: editNotes || null }),
    });
    setEditingAllocId(null);
    load();
  }

  async function removeAllocation(allocId: number) {
    if (!confirm("Remove this allocation?")) return;
    await fetch(`/api/projects/${id}/allocations/${allocId}`, { method: "DELETE" });
    load();
  }

  if (!project) return <p className="text-gray-500 text-sm">Loading…</p>;

  const allocatedPartIds = new Set(project.allocations.map((a) => a.part.id));
  const availableParts = allParts.filter((p) => !allocatedPartIds.has(p.id));

  function getAvailable(part: Part) {
    // Available = stock minus all allocations across ALL projects (from part.allocations in allParts)
    // We only have part.quantity here; a more accurate figure requires the full allocations.
    // The list API returns allocations, so we need the full part object
    return part.quantity; // simplified; shows total stock on this view
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-5">
        <Link href="/projects" className="text-gray-400 hover:text-gray-600 text-sm">← Projects</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-800">{project.name}</h1>
        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
          project.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}>{project.status}</span>
      </div>

      {/* Parts list */}
      <div className="bg-white rounded-xl shadow p-5 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">Allocated Parts</h2>
        {project.allocations.length === 0 ? (
          <p className="text-sm text-gray-400">No parts allocated yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-gray-400">
              <tr>
                <th className="text-left pb-2">Part</th>
                <th className="text-right pb-2">Qty</th>
                <th className="text-left pb-2 pl-3">Notes</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {project.allocations.map((a) => (
                <tr key={a.id}>
                  {editingAllocId === a.id ? (
                    <>
                      <td className="py-2 font-medium text-gray-700">
                        <Link href={`/parts/${a.part.id}`} className="hover:text-blue-600">{a.part.name}</Link>
                        {a.part.value && <span className="text-gray-400 ml-1 text-xs">{a.part.value}</span>}
                      </td>
                      <td className="py-2 text-right">
                        <input
                          type="number"
                          min={1}
                          value={editQty}
                          onChange={(e) => setEditQty(Number(e.target.value))}
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-20 text-right"
                        />
                      </td>
                      <td className="py-2 pl-3">
                        <input
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                          placeholder="notes…"
                        />
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => updateAllocation(a.id)} className="text-blue-500 text-xs hover:underline">save</button>
                          <button onClick={() => setEditingAllocId(null)} className="text-gray-400 text-xs hover:underline">cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 font-medium text-gray-700">
                        <Link href={`/parts/${a.part.id}`} className="hover:text-blue-600">{a.part.name}</Link>
                        {a.part.value && <span className="text-gray-400 ml-1 text-xs">{a.part.value}</span>}
                      </td>
                      <td className="py-2 text-right font-mono">{a.quantity}</td>
                      <td className="py-2 pl-3 text-gray-400 text-xs">{a.notes ?? ""}</td>
                      <td className="py-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setEditingAllocId(a.id); setEditQty(a.quantity); setEditNotes(a.notes ?? ""); }}
                            className="text-blue-400 text-xs hover:underline"
                          >edit</button>
                          <button onClick={() => removeAllocation(a.id)} className="text-red-400 text-xs hover:underline">remove</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Allocate form */}
        <form onSubmit={allocate} className="mt-4 flex gap-2 flex-wrap">
          <select
            value={allocPartId}
            onChange={(e) => setAllocPartId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select part to allocate…</option>
            {availableParts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.value ? ` (${p.value})` : ""} — {getAvailable(p)} in stock
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={allocQty}
            onChange={(e) => setAllocQty(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={allocNotes}
            onChange={(e) => setAllocNotes(e.target.value)}
            placeholder="notes (optional)"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!allocPartId || allocating}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            Allocate
          </button>
        </form>
      </div>

      {/* Edit project */}
      <form onSubmit={saveProject} className="bg-white rounded-xl shadow p-5 space-y-3">
        <h2 className="font-semibold text-gray-700 mb-1">Project Details</h2>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
          <input required value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea value={project.description ?? ""} onChange={(e) => setProject({ ...project, description: e.target.value })} rows={2} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select value={project.status} onChange={(e) => setProject({ ...project, status: e.target.value })} className={inputCls}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <button type="submit" disabled={saving} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
