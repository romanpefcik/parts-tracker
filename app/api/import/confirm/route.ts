import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ImportRow = {
  name: string;
  description: string | null;
  category: string | null;
  value: string | null;
  package: string | null;
  quantity: number;
  supplier: string | null;
  notes: string | null;
};

export async function POST(req: NextRequest) {
  const { parts }: { parts: ImportRow[] } = await req.json();

  if (!Array.isArray(parts) || parts.length === 0) {
    return NextResponse.json({ error: "No parts provided." }, { status: 400 });
  }

  const results = await Promise.all(
    parts.map(async (row) => {
      // Case-insensitive match on name
      const existing = await prisma.part.findFirst({
        where: { name: { equals: row.name } },
      });

      if (existing) {
        const updated = await prisma.part.update({
          where: { id: existing.id },
          data: { quantity: { increment: row.quantity } },
        });
        return { action: "updated" as const, part: updated };
      }

      const created = await prisma.part.create({
        data: {
          name: row.name,
          description: row.description,
          category: row.category,
          value: row.value,
          package: row.package,
          quantity: row.quantity,
          supplier: row.supplier,
          notes: row.notes,
        },
      });
      return { action: "created" as const, part: created };
    })
  );

  const created = results.filter((r) => r.action === "created").length;
  const updated = results.filter((r) => r.action === "updated").length;

  return NextResponse.json({ created, updated, results });
}
