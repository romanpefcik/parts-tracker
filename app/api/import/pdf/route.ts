import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { parseTMEInvoice } from "@/lib/parsers/tme";

export const runtime = "nodejs";
export const maxDuration = 30;

async function extractText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text ?? "";
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file || file.type !== "application/pdf") {
    return NextResponse.json({ error: "A PDF file is required." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let text: string;
  try {
    text = await extractText(buffer);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("PDF parse error:", e);
    return NextResponse.json({ error: `Failed to read PDF: ${msg}` }, { status: 422 });
  }

  if (!text.trim()) {
    return NextResponse.json({ error: "No text could be extracted from this PDF." }, { status: 422 });
  }

  const parts = parseTMEInvoice(text);

  if (parts.length === 0) {
    return NextResponse.json(
      { error: "No parts found. Make sure this is a TME invoice PDF." },
      { status: 422 }
    );
  }

  return NextResponse.json({ parts, filename: file.name });
}
