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

type QueueItem = {
  partId: number;
  partName: string;
  partValue: string | null;
  quantity: number;
  notes: string;
};

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [saving, setSaving] = useState(false);

  // Queue + picker state
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [committing, setCommitting] = useState(false);

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

  function addPartToQueue(partId: number) {
    const part = allParts.find((p) => p.id === partId);
    if (!part) return;
    setQueue((prev) => {
      if (prev.some((q) => q.partId === part.id)) return prev;
      return [...prev, { partId: part.id, partName: part.name, partValue: part.value, quantity: 1, notes: "" }];
    });
  }

  function updateQueueItem(partId: number, patch: Partial<QueueItem>) {
    setQueue((prev) => prev.map((q) => (q.partId === partId ? { ...q, ...patch } : q)));
  }

  function removeFromQueue(partId: number) {
    setQueue((prev) => prev.filter((q) => q.partId !== partId));
  }

  async function commitQueue() {
    if (queue.length === 0) return;
    setCommitting(true);
    await Promise.all(
      queue.map((q) =>
        fetch(`/api/projects/${id}/allocations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partId: q.partId, quantity: q.quantity, notes: q.notes || null }),
        })
      )
    );
    setQueue([]);
    setCommitting(false);
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

  // Parts available to pick = not already allocated to this project AND not already in the queue
  const allocatedPartIds = new Set(project.allocations.map((a) => a.part.id));
  const queuedPartIds = new Set(queue.map((q) => q.partId));
  const pickableParts = allParts.filter((p) => !allocatedPartIds.has(p.id) && !queuedPartIds.has(p.id));

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

      {/* Allocated parts */}
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
      </div>

      {/* Queue + picker */}
      <div className="bg-white rounded-xl shadow p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700">Pending Allocations</h2>
          {queue.length > 0 && (
            <span className="text-xs text-gray-400">{queue.length} part{queue.length !== 1 ? "s" : ""} queued</span>
          )}
        </div>

        {queue.length === 0 ? (
          <p className="text-sm text-gray-400 mb-3">Pick parts below to queue them, then allocate all at once.</p>
        ) : (
          <table className="w-full text-sm mb-4">
            <thead className="text-xs uppercase text-gray-400">
              <tr>
                <th className="text-left pb-2">Part</th>
                <th className="text-right pb-2">Qty</th>
                <th className="text-left pb-2 pl-3">Notes</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {queue.map((q) => (
                <tr key={q.partId} className="bg-blue-50/40">
                  <td className="py-2 font-medium text-gray-700">
                    {q.partName}
                    {q.partValue && <span className="text-gray-400 ml-1 text-xs">{q.partValue}</span>}
                  </td>
                  <td className="py-2 text-right">
                    <input
                      type="number"
                      min={1}
                      value={q.quantity}
                      onChange={(e) => updateQueueItem(q.partId, { quantity: Number(e.target.value) })}
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-20 text-right"
                    />
                  </td>
                  <td className="py-2 pl-3">
                    <input
                      value={q.notes}
                      onChange={(e) => updateQueueItem(q.partId, { notes: e.target.value })}
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                      placeholder="notes…"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => removeFromQueue(q.partId)} className="text-red-400 text-xs hover:underline">remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Picker — selecting a part adds it to the queue immediately */}
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) addPartToQueue(Number(e.target.value));
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Pick a part to add to the queue…</option>
          {pickableParts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.value ? ` (${p.value})` : ""} — {p.quantity} in stock
            </option>
          ))}
        </select>

        {queue.length > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={commitQueue}
              disabled={committing}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {committing ? "Allocating…" : `Allocate ${queue.length} part${queue.length !== 1 ? "s" : ""}`}
            </button>
            <button
              onClick={() => setQueue([])}
              disabled={committing}
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
            >
              Clear queue
            </button>
          </div>
        )}
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
