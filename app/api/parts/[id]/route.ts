import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const part = await prisma.part.findUnique({
    where: { id: Number(id) },
    include: { allocations: { include: { project: true } } },
  });
  if (!part) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(part);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const part = await prisma.part.update({
    where: { id: Number(id) },
    data: body,
  });
  return NextResponse.json(part);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const allocCount = await prisma.allocation.count({
    where: { partId: Number(id) },
  });
  if (allocCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete a part that is allocated to projects." },
      { status: 409 }
    );
  }
  await prisma.part.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
