import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const schematics = await prisma.schematic.findMany({
    where: { projectId: null, boxId: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(schematics);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const schematic = await prisma.schematic.create({
    data: { name: body.name ?? "Untitled schematic" },
  });
  return NextResponse.json(schematic, { status: 201 });
}
