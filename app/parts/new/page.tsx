"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewPartPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    value: "",
    package: "",
    supplier: "",
    datasheet: "",
    quantity: 0,
    notes: "",
  });

  function set(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quantity: Number(form.quantity) }),
    });
    if (res.ok) {
      router.push("/parts");
    } else {
      alert("Failed to save part.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-5">
        <Link href="/parts" className="text-gray-400 hover:text-gray-600 text-sm">← Inventory</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-800">New Part</h1>
      </div>

      <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <Field label="Name *">
          <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <input value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls} placeholder="e.g. Resistor" />
          </Field>
          <Field label="Initial Quantity">
            <input type="number" min={0} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Value">
            <input value={form.value} onChange={(e) => set("value", e.target.value)} className={inputCls} placeholder="e.g. 10kΩ" />
          </Field>
          <Field label="Package">
            <input value={form.package} onChange={(e) => set("package", e.target.value)} className={inputCls} placeholder="e.g. 0402" />
          </Field>
        </div>
        <Field label="Supplier">
          <input value={form.supplier} onChange={(e) => set("supplier", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Datasheet URL">
          <input type="url" value={form.datasheet} onChange={(e) => set("datasheet", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Notes">
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className={inputCls} />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? "Saving…" : "Save Part"}
          </button>
          <Link href="/parts" className="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
