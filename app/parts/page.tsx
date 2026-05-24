"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Allocation = { quantity: number };
type Part = {
  id: number;
  name: string;
  category: string | null;
  value: string | null;
  package: string | null;
  quantity: number;
  allocations: Allocation[];
};

function available(part: Part) {
  const allocated = part.allocations.reduce((s, a) => s + a.quantity, 0);
  return part.quantity - allocated;
}

export default function PartsPage() {
  const router = useRouter();
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/parts`);
    setAllParts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchParts(); }, [fetchParts]);

  // Categories derived from ALL parts so the dropdown stays stable when filtering
  const categories = useMemo(
    () => Array.from(new Set(allParts.map((p) => p.category).filter(Boolean) as string[])).sort(),
    [allParts]
  );

  // Client-side filtering
  const parts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allParts.filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.value?.toLowerCase().includes(q) ?? false) ||
        (p.category?.toLowerCase().includes(q) ?? false) ||
        (p.package?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [allParts, search, category]);

  async function deletePart(id: number) {
    if (!confirm("Delete this part?")) return;
    const res = await fetch(`/api/parts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
      return;
    }
    fetchParts();
  }

  async function adjust(id: number, delta: number) {
    await fetch(`/api/parts/${id}/adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta }),
    });
    fetchParts();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
        <Link
          href="/parts/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Add Part
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search parts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : parts.length === 0 ? (
        <p className="text-gray-500 text-sm">No parts found.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Value / Package</th>
                <th className="text-right px-4 py-3">In Stock</th>
                <th className="text-right px-4 py-3">Available</th>
                <th className="text-right px-4 py-3">Adjust</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parts.map((part) => {
                const avail = available(part);
                return (
                  <tr key={part.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      <button
                        onClick={() => router.push(`/parts/${part.id}`)}
                        className="hover:text-blue-600 text-left"
                      >
                        {part.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{part.category ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {[part.value, part.package].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{part.quantity}</td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${avail <= 0 ? "text-red-500" : "text-green-600"}`}>
                      {avail}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => adjust(part.id, -1)}
                          disabled={part.quantity <= 0}
                          className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-30 font-bold text-gray-700 transition-colors"
                        >−</button>
                        <button
                          onClick={() => adjust(part.id, 1)}
                          className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 font-bold text-gray-700 transition-colors"
                        >+</button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/parts/${part.id}`} className="text-blue-500 hover:underline text-xs">Edit</Link>
                        <button onClick={() => deletePart(part.id)} className="text-red-400 hover:underline text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
