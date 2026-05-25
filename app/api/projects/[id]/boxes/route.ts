import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const boxes = await prisma.projectBox.findMany({
    where: { projectId: Number(id) },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    include: { schematic: { select: { id: true } } },
  });
  return NextResponse.json(boxes);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const projectId = Number(id);
  const body = await req.json();
  const last = await prisma.projectBox.findFirst({
    where: { projectId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const box = await prisma.projectBox.create({
    data: {
      projectId,
      name: body.name,
      description: body.description ?? null,
      order: (last?.order ?? -1) + 1,
    },
  });
  return NextResponse.json(box, { status: 201 });
}
