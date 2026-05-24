"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import SchematicEditor from "./SchematicEditor";

type SchematicRow = {
  id: number;
  name: string;
  data: string;
};

export default function SchematicPage() {
  const { id } = useParams<{ id: string }>();
  const [schematic, setSchematic] = useState<SchematicRow | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/schematics/${id}`);
      if (!res.ok) {
        if (!cancelled) setNotFound(true);
        return;
      }
      const row = await res.json();
      if (!cancelled) setSchematic(row);
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (notFound) return <p className="text-gray-500 text-sm">Schematic not found.</p>;
  if (!schematic) return <p className="text-gray-500 text-sm">Loading…</p>;

  return (
    <ReactFlowProvider>
      <SchematicEditor schematic={schematic} />
    </ReactFlowProvider>
  );
}
