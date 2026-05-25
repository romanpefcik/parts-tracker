import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string; boxId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { boxId } = await params;
  const body = await req.json();
  const data: { name?: string; description?: string | null; order?: number } = {};
  if (typeof body.name === "string") data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (typeof body.order === "number") data.order = body.order;
  const box = await prisma.projectBox.update({
    where: { id: Number(boxId) },
    data,
  });
  return NextResponse.json(box);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { boxId } = await params;
  await prisma.projectBox.delete({ where: { id: Number(boxId) } });
  return NextResponse.json({ ok: true });
}
