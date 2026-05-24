import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const schematic = await prisma.schematic.findUnique({
    where: { id: Number(id) },
  });
  if (!schematic)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(schematic);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const data: { name?: string; data?: string } = {};
  if (typeof body.name === "string") data.name = body.name;
  if (body.data !== undefined) {
    data.data = typeof body.data === "string" ? body.data : JSON.stringify(body.data);
  }
  const schematic = await prisma.schematic.update({
    where: { id: Number(id) },
    data,
  });
  return NextResponse.json(schematic);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.schematic.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
