import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { partId, quantity, notes } = await req.json();

  const part = await prisma.part.findUnique({ where: { id: Number(partId) } });
  if (!part) return NextResponse.json({ error: "Part not found" }, { status: 404 });

  const existing = await prisma.allocation.findUnique({
    where: { partId_projectId: { partId: Number(partId), projectId: Number(id) } },
  });

  if (existing) {
    const updated = await prisma.allocation.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + Number(quantity), notes },
      include: { part: true },
    });
    return NextResponse.json(updated);
  }

  const allocation = await prisma.allocation.create({
    data: {
      partId: Number(partId),
      projectId: Number(id),
      quantity: Number(quantity),
      notes,
    },
    include: { part: true },
  });
  return NextResponse.json(allocation, { status: 201 });
}
