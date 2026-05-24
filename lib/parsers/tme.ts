export type ParsedPart = {
  name: string;
  description: string | null;
  category: string | null;
  value: string | null;
  package: string | null;
  quantity: number;
  supplier: string;
  notes: string | null;
};

// ── Section boundary ──────────────────────────────────────────────────────────
// The TME PDF repeats all items twice. Stop before the second copy.
const SECTION_END_RE = /Faktúra - záloha|Hodnota objednaného tovaru/;

// ── Category map from Slovak description prefix ───────────────────────────────
const CATEGORY_MAP: [RegExp, string][] = [
  [/^Rezistor/i,       "Resistor"],
  [/^Kondenz/i,        "Capacitor"],   // Kondenzátor (á may be stripped)
  [/^Tranzistor/i,     "Transistor"],
  [/^Di.*?da/i,        "Diode"],       // Dióda (ó may be stripped)
  [/^IC:/,             "IC"],
  [/^Poistka/i,        "Fuse"],
  [/^Potenciometer/i,  "Potentiometer"],
  [/^Konektor/i,       "Connector"],
  [/^Plo.*?spoj/i,     "PCB"],         // Plošný spoj
];

// ── Package patterns ──────────────────────────────────────────────────────────
const PACKAGE_RE = /\b(TO-?92|TO-?220|TO-?126|SOT-?\d+[A-Z]?|DIP-?\d+|DO-?\d+|CASE\d+|SMA|SMB|SMC|0\d{3})\b/i;

// ── Internal item shape after parsing raw text ────────────────────────────────
type RawItem = {
  tmeCode: string;
  quantity: number;
  descRaw: string;   // full joined description (semicolons intact)
  mfgCode: string | null;
  manufacturer: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main exported function
// ─────────────────────────────────────────────────────────────────────────────
export function parseTMEInvoice(text: string): ParsedPart[] {
  const cutAt = text.search(SECTION_END_RE);
  const body = cutAt > 0 ? text.slice(0, cutAt) : text;

  const rawItems = extractRawItems(body);
  return rawItems
    .filter((r) => !/^doprava$/i.test(r.tmeCode))
    .map(buildPart);
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Extract raw item blocks from text
// ─────────────────────────────────────────────────────────────────────────────
function extractRawItems(text: string): RawItem[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const items: RawItem[] = [];

  // Full item header: "{number}  {CODE}  {qty} KS ..."
  const HEADER_RE = /^(\d+)\s+(\S+)\s+(\d+)\s+KS\b/;
  // Split-code header: "{number}  {CODE_PART1}" — code continues on next line(s)
  const SPLIT_CODE_RE = /^(\d+)\s+([A-Z][A-Z0-9\-\/\.]{3,})\s*$/;
  // Short uppercase suffix joining a split code (e.g. "00")
  const CODE_SUFFIX_RE = /^[A-Z0-9]{1,6}$/;
  // Quantity-only line that follows a split code
  const QTY_ONLY_RE = /^(\d+)\s+KS\b/;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    let code: string;
    let qty: number;
    let j = i + 1;

    const m = line.match(HEADER_RE);
    if (m) {
      code = m[2];
      qty = parseInt(m[3]);
      // Peek for a split-code suffix on the next non-empty line
      while (j < lines.length && lines[j] === "") j++;
      if (j < lines.length && CODE_SUFFIX_RE.test(lines[j])) {
        code += lines[j];
        j++;
      }
    } else {
      // Try split-code pattern: "{num} {CODE_PART1}" then suffix then "{qty} KS"
      const sm = line.match(SPLIT_CODE_RE);
      if (!sm) { i++; continue; }
      code = sm[2];
      // Skip suffix lines
      while (j < lines.length && CODE_SUFFIX_RE.test(lines[j].trim())) {
        code += lines[j].trim();
        j++;
      }
      // Next should be the quantity line
      while (j < lines.length && lines[j] === "") j++;
      const qm = j < lines.length ? lines[j].match(QTY_ONLY_RE) : null;
      if (!qm) { i++; continue; }
      qty = parseInt(qm[1]);
      j++;
    }

    // Collect description lines until next item or noise
    const descLines: string[] = [];
    let mfgLine = "";
    while (j < lines.length) {
      const l = lines[j];
      if (HEADER_RE.test(l)) break;
      if (isNoiseLine(l)) { j++; continue; }
      if (l.startsWith("Výrobca:") || l.startsWith("Vyrobca:")) {
        mfgLine += " " + l;
      } else if (mfgLine && !l.includes(":")) {
        // Continuation of manufacturer line (RoHS suffix split to next line)
        mfgLine += " " + l;
      } else if (l) {
        descLines.push(l);
      }
      j++;
    }

    const descRaw = joinDescription(descLines);
    const { manufacturer, mfgCode } = parseMfgLine(mfgLine);

    items.push({ tmeCode: code, quantity: qty, descRaw, mfgCode, manufacturer });
    i = j;
  }

  return items;
}

function isNoiseLine(l: string): boolean {
  return (
    /^(Prevod|Saldo) zostatku/.test(l) ||
    /^TME Slovakia/.test(l) ||
    /Strana:\s*\d+/.test(l) ||
    /^História zálohy/.test(l) ||
    /^Faktúra k/.test(l) ||
    /^íslo faktúry/.test(l) ||
    /^Dátum/.test(l) ||
    /^íslo klienta/.test(l) ||
    /^Spôsob/.test(l) ||
    /^Objedn/.test(l) ||
    /^Incoterms/.test(l) ||
    /^\. Položka/.test(l) ||
    /^Hollého/.test(l) ||
    /^I O:|^DI :/.test(l) ||
    /^OR OS/.test(l) ||
    /^Registra/.test(l) ||
    /^tel\./.test(l) ||
    /^www\./.test(l) ||
    l === "RoHS" ||
    l === "Kompatibilita s RoHS" ||
    /^Kompatibilita s/.test(l) ||
    /^\d{2}\.\d{2}\.\d{4}$/.test(l)
  );
}

// Join multi-line description fragments (PDF wraps long lines)
function joinDescription(lines: string[]): string {
  if (!lines.length) return "";
  let result = lines[0];
  for (let i = 1; i < lines.length; i++) {
    const prev = result;
    const cur = lines[i];
    // If prev ends mid-word (no punctuation) and cur continues it, join without space
    if (/[a-zA-Z0-9]$/.test(prev) && /^[a-zA-Z0-9]/.test(cur)) {
      result += cur;
    } else {
      result += " " + cur;
    }
  }
  return result.trim();
}

function parseMfgLine(line: string): { manufacturer: string | null; mfgCode: string | null } {
  const mfgMatch = line.match(/Výrobca:\s*([^;]+)/i) ?? line.match(/Vyrobca:\s*([^;]+)/i);
  const codeMatch = line.match(/Symbol výrobcu:\s*([^;]+)/i) ?? line.match(/Symbol vyrobcu:\s*([^;]+)/i);
  return {
    manufacturer: mfgMatch ? mfgMatch[1].trim() : null,
    mfgCode: codeMatch ? codeMatch[1].trim() : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Build a ParsedPart from a RawItem
// ─────────────────────────────────────────────────────────────────────────────
function buildPart(item: RawItem): ParsedPart {
  const desc = item.descRaw;
  const category = detectCategory(desc);
  const params = splitParams(desc);

  const value = extractValue(category, params);
  const pkg = extractPackage(category, desc, params);
  const name = buildName(category, item.tmeCode, desc, params, value, pkg);

  const notesParts = [item.tmeCode];
  if (item.mfgCode && item.mfgCode !== item.tmeCode) notesParts.push(item.mfgCode);

  return {
    name,
    description: desc || null,
    category,
    value,
    package: pkg,
    quantity: item.quantity,
    supplier: "TME",
    notes: notesParts.join(" | "),
  };
}

function detectCategory(desc: string): string | null {
  for (const [re, cat] of CATEGORY_MAP) {
    if (re.test(desc)) return cat;
  }
  return "Other";
}

// Split "Type:subtype;p1;p2;..." into [subtype, p1, p2, ...]
function splitParams(desc: string): string[] {
  const colonIdx = desc.indexOf(":");
  if (colonIdx < 0) return [desc];
  return desc
    .slice(colonIdx + 1)
    .split(";")
    .map((p) => p.trim());
}

// ── Value extraction per category ─────────────────────────────────────────────
function extractValue(category: string | null, params: string[]): string | null {
  switch (category) {
    case "Resistor":     return extractResistorValue(params);
    case "Capacitor":    return extractCapacitorValue(params);
    case "Transistor":   return extractTransistorValue(params);
    case "Diode":        return extractDiodeValue(params);
    case "Fuse":         return extractFuseValue(params);
    case "Potentiometer":return extractPotValue(params);
    default:             return null;
  }
}

function extractResistorValue(params: string[]): string | null {
  // Format: metal film;THT;VALUE;POWER;...
  // VALUE may include Ω (real PDF) or have it stripped (depending on extractor)
  const thtIdx = params.findIndex((p) => /^THT$/i.test(p));
  const startIdx = thtIdx >= 0 ? thtIdx + 1 : 1;
  const raw = params[startIdx] ?? "";
  const trimmed = raw.trim();
  if (!trimmed || !/^\d/.test(trimmed)) return null;
  if (/Ω$/.test(trimmed)) return trimmed;
  return trimmed + "Ω";
}

function extractCapacitorValue(params: string[]): string | null {
  for (const p of params) {
    const m = p.match(/^(\d+(?:[,\.]\d+)?\s*(?:p|n|u|µ)F)/i);
    if (m) return m[1].replace(",", ".");
  }
  return null;
}

function extractTransistorValue(params: string[]): string | null {
  // e.g. params: [NPN, bipolárny, 45V, 0,1A, 0,5W, TO92]
  // Return Vce
  for (const p of params) {
    if (/^\d+V$/.test(p.trim())) return p.trim();
  }
  return null;
}

function extractDiodeValue(params: string[]): string | null {
  for (const p of params) {
    if (/^\d+V$/.test(p.trim())) return p.trim();
  }
  return null;
}

function extractFuseValue(params: string[]): string | null {
  for (const p of params) {
    if (/^\d+(?:[,\.]\d+)?A$/.test(p.trim())) return p.trim();
  }
  return null;
}

function extractPotValue(params: string[]): string | null {
  // Look for resistance value: "1kΩ", "100kΩ", "500kΩ", "1k ", "100k ", etc.
  for (const p of params) {
    const trimmed = p.trim();
    // Match with Ω
    if (/^\d+(?:[,\.]\d+)?[kKmMgG]?Ω$/.test(trimmed)) return trimmed;
    // Match without Ω (PDF stripped it) — followed by space or end
    if (/^\d+(?:[,\.]\d+)?[kKmMgG]?$/.test(trimmed)) return trimmed + "Ω";
  }
  return null;
}

// ── Package extraction ────────────────────────────────────────────────────────
function extractPackage(category: string | null, desc: string, params: string[]): string | null {
  const m = desc.match(PACKAGE_RE);
  if (m) return m[1].toUpperCase().replace(/-/, "");

  if (
    category === "Resistor" ||
    category === "Capacitor" ||
    category === "Fuse" ||
    category === "Potentiometer"
  ) {
    if (desc.includes("THT")) return "THT";
  }
  return null;
}

// ── Human-readable name ───────────────────────────────────────────────────────
function buildName(
  category: string | null,
  tmeCode: string,
  descRaw: string,
  params: string[],
  value: string | null,
  pkg: string | null
): string {
  switch (category) {
    case "Resistor": {
      const power = params.find((p) => /^\d+(?:[,\.]\d+)?W$/i.test(p.trim()));
      const tol = params.find((p) => /^±/.test(p.trim()));
      const parts = ["Resistor", value, power, tol].filter(Boolean);
      return parts.join(" ");
    }
    case "Capacitor": {
      const voltage = params.find((p) => /Uprac/.test(p))?.replace("Uprac:", "").trim()
        ?? params.find((p) => /^\d+VDC/i.test(p.trim()));
      const subtype = params[0]?.trim();
      const typeLabel = subtype?.includes("elektrolyt") ? "Electrolytic"
        : subtype?.includes("polyester") ? "Polyester"
        : "";
      const parts = ["Capacitor", value, voltage, typeLabel].filter(Boolean);
      return parts.join(" ");
    }
    case "Transistor": {
      const polarity = params.find((p) => /^(NPN|PNP)$/i.test(p.trim()));
      const darlington = desc_includes(params, "Darlington") ? "Darlington" : null;
      // Clean code: strip trailing suffix like -FAI, -CDI, D74Z, CTFR, CTA, BTF, ABU
      const code = tmeCode.replace(/[-_][A-Z0-9]+$/, "");
      return [code, polarity, darlington, "Transistor", pkg].filter(Boolean).join(" ");
    }
    case "Diode": {
      const typeLabel = params.find((p) => /sp.*nacia|rektifik|usmer/i.test(p))
        ? "Switching" : params.find((p) => /usmer/i.test(p)) ? "Rectifier" : "";
      const code = tmeCode.replace(/[-_][A-Z0-9]+$/, "");
      return [code, typeLabel, "Diode"].filter(Boolean).join(" ");
    }
    case "IC": {
      return `${tmeCode} IC`;
    }
    case "Fuse": {
      return [`Fuse`, value, pkg ?? "Glass"].filter(Boolean).join(" ");
    }
    case "Connector": {
      const size = params.find((p) => /mm/.test(p))?.trim();
      return ["Connector", tmeCode, size].filter(Boolean).join(" ");
    }
    case "PCB": {
      return `PCB ${tmeCode}`;
    }
    case "Potentiometer": {
      return ["Potentiometer", value].filter(Boolean).join(" ");
    }
    default:
      return tmeCode;
  }
}

function desc_includes(params: string[], word: string): boolean {
  return params.some((p) => p.toLowerCase().includes(word.toLowerCase()));
}
