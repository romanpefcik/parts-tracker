"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", status: "active" });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } else {
      alert("Failed to create project.");
      setSaving(false);
    }
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-5">
        <Link href="/projects" className="text-gray-400 hover:text-gray-600 text-sm">← Projects</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-800">New Project</h1>
      </div>

      <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Project Name *</label>
          <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="e.g. RGB LED Clock" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? "Creating…" : "Create Project"}
          </button>
          <Link href="/projects" className="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
