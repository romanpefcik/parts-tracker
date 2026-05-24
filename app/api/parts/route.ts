import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";

  const parts = await prisma.part.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search } },
                { description: { contains: search } },
                { value: { contains: search } },
              ],
            }
          : {},
        category ? { category } : {},
      ],
    },
    include: { allocations: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(parts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const part = await prisma.part.create({ data: body });
  return NextResponse.json(part, { status: 201 });
}
