import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string; allocId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { allocId } = await params;
  const { quantity, notes } = await req.json();
  const allocation = await prisma.allocation.update({
    where: { id: Number(allocId) },
    data: { quantity: Number(quantity), notes },
    include: { part: true },
  });
  return NextResponse.json(allocation);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { allocId } = await params;
  await prisma.allocation.delete({ where: { id: Number(allocId) } });
  return NextResponse.json({ ok: true });
}
