import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { delta } = await req.json(); // positive = add, negative = remove
  const part = await prisma.part.update({
    where: { id: Number(id) },
    data: { quantity: { increment: delta } },
  });
  return NextResponse.json(part);
}
