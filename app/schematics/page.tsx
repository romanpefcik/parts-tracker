"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Schematic = { id: number; name: string; updatedAt: string };

export default function SchematicsPage() {
  const [schematics, setSchematics] = useState<Schematic[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/schematics");
    setSchematics(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/schematics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "Untitled schematic" }),
    });
    const s = await res.json();
    setCreating(false);
    router.push(`/schematics/${s.id}`);
  }

  async function remove(id: number) {
    if (!confirm("Delete this schematic?")) return;
    await fetch(`/api/schematics/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-5">Schematics</h1>

      <form onSubmit={create} className="bg-white rounded-xl shadow p-4 mb-5 flex gap-2 items-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New schematic name…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={creating}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? "Creating…" : "New schematic"}
        </button>
      </form>

      <div className="bg-white rounded-xl shadow p-4">
        {schematics.length === 0 ? (
          <p className="text-sm text-gray-400">No schematics yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {schematics.map((s) => (
              <li key={s.id} className="py-2 flex items-center justify-between">
                <Link href={`/schematics/${s.id}`} className="font-medium text-gray-700 hover:text-blue-600">
                  {s.name}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {new Date(s.updatedAt).toLocaleString()}
                  </span>
                  <button onClick={() => remove(s.id)} className="text-xs text-red-400 hover:underline">
                    delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
