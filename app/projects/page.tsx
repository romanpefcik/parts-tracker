"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Allocation = { quantity: number };
type Project = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  allocations: Allocation[];
  createdAt: string;
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/projects");
    setProjects(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function deleteProject(id: number) {
    if (!confirm("Delete this project and all its allocations?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
        <Link
          href="/projects/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Project
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="text-gray-500 text-sm">No projects yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const totalParts = project.allocations.reduce((s, a) => s + a.quantity, 0);
            return (
              <div key={project.id} className="bg-white rounded-xl shadow p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <button
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="font-semibold text-gray-800 hover:text-blue-600 text-left"
                  >
                    {project.name}
                  </button>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    project.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {project.status}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>
                )}
                <p className="text-xs text-gray-400">
                  {project.allocations.length} part type{project.allocations.length !== 1 ? "s" : ""} · {totalParts} pcs total
                </p>
                <div className="flex gap-3 mt-3">
                  <Link href={`/projects/${project.id}`} className="text-blue-500 hover:underline text-xs">View</Link>
                  <button onClick={() => deleteProject(project.id)} className="text-red-400 hover:underline text-xs">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
