import React from "react";

export type PinSide = "left" | "right" | "top" | "bottom";

export type Pin = {
  id: string;
  x: number;
  y: number;
  side: PinSide;
};

export type SymbolDef = {
  type: string;
  label: string;
  category: string;
  refPrefix: string;
  width: number;
  height: number;
  pins: Pin[];
  defaultValue?: string;
  showValue?: boolean;
  Glyph: React.FC;
};

export const CATEGORIES = [
  "Wiring",
  "Passives",
  "Diodes",
  "Transistors",
  "Switches",
  "Power",
  "Connectors",
  "ICs",
] as const;

export type Rotation = 0 | 90 | 180 | 270;

const SIDE_ORDER: PinSide[] = ["left", "top", "right", "bottom"];

function rotateSide(side: PinSide, rotation: Rotation): PinSide {
  const idx = SIDE_ORDER.indexOf(side);
  return SIDE_ORDER[(idx + rotation / 90) % 4];
}

export function rotatePin(
  pin: Pin,
  rotation: Rotation,
  width: number,
  height: number
): { x: number; y: number; side: PinSide } {
  switch (rotation) {
    case 0: return { x: pin.x, y: pin.y, side: pin.side };
    case 90: return { x: height - pin.y, y: pin.x, side: rotateSide(pin.side, 90) };
    case 180: return { x: width - pin.x, y: height - pin.y, side: rotateSide(pin.side, 180) };
    case 270: return { x: pin.y, y: width - pin.x, side: rotateSide(pin.side, 270) };
  }
}

export function rotatedDims(width: number, height: number, rotation: Rotation) {
  return rotation === 90 || rotation === 270
    ? { w: height, h: width }
    : { w: width, h: height };
}

export function svgRotateTransform(
  rotation: Rotation,
  width: number,
  height: number
): string | undefined {
  switch (rotation) {
    case 0: return undefined;
    case 90: return `translate(${height} 0) rotate(90)`;
    case 180: return `translate(${width} ${height}) rotate(180)`;
    case 270: return `translate(0 ${width}) rotate(-90)`;
  }
}

const stroke = "#1f2937";
const strokeWidth = 1.5;

const Resistor: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1={0} y1={20} x2={15} y2={20} />
    <polyline points="15,20 20,10 30,30 40,10 50,30 60,10 65,20" />
    <line x1={65} y1={20} x2={80} y2={20} />
  </g>
);

const Capacitor: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round">
    <line x1={0} y1={20} x2={26} y2={20} />
    <line x1={26} y1={6} x2={26} y2={34} />
    <line x1={34} y1={6} x2={34} y2={34} />
    <line x1={34} y1={20} x2={60} y2={20} />
  </g>
);

const Inductor: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round">
    <line x1={0} y1={20} x2={10} y2={20} />
    <path d="M10 20 A 8 8 0 0 1 26 20 A 8 8 0 0 1 42 20 A 8 8 0 0 1 58 20 A 8 8 0 0 1 70 20" />
    <line x1={70} y1={20} x2={80} y2={20} />
  </g>
);

const Diode: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1={0} y1={20} x2={22} y2={20} />
    <polygon points="22,8 22,32 40,20" fill={stroke} />
    <line x1={40} y1={8} x2={40} y2={32} />
    <line x1={40} y1={20} x2={60} y2={20} />
  </g>
);

const Ground: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round">
    <line x1={20} y1={0} x2={20} y2={16} />
    <line x1={6} y1={16} x2={34} y2={16} />
    <line x1={11} y1={22} x2={29} y2={22} />
    <line x1={16} y1={28} x2={24} y2={28} />
  </g>
);

const Vcc: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round">
    <line x1={20} y1={40} x2={20} y2={20} />
    <polyline points="10,20 20,8 30,20" />
  </g>
);

const NPN: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1={0} y1={30} x2={22} y2={30} />
    <line x1={22} y1={20} x2={22} y2={40} />
    <line x1={22} y1={20} x2={45} y2={10} />
    <line x1={45} y1={10} x2={60} y2={10} />
    <line x1={22} y1={40} x2={45} y2={50} />
    <line x1={45} y1={50} x2={60} y2={50} />
    <polygon points="44,50 36,48 39,43" fill={stroke} />
  </g>
);

const PNP: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1={0} y1={30} x2={22} y2={30} />
    <line x1={22} y1={20} x2={22} y2={40} />
    <line x1={22} y1={20} x2={45} y2={10} />
    <line x1={45} y1={10} x2={60} y2={10} />
    <line x1={22} y1={40} x2={45} y2={50} />
    <line x1={45} y1={50} x2={60} y2={50} />
    <polygon points="24,41 32,43 31,48" fill={stroke} />
  </g>
);

const NMOS: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1={0} y1={30} x2={18} y2={30} />
    <line x1={18} y1={18} x2={18} y2={42} />
    <line x1={24} y1={16} x2={24} y2={24} />
    <line x1={24} y1={26} x2={24} y2={34} />
    <line x1={24} y1={36} x2={24} y2={44} />
    <line x1={24} y1={20} x2={50} y2={20} />
    <line x1={50} y1={0} x2={50} y2={20} />
    <line x1={24} y1={40} x2={50} y2={40} />
    <line x1={50} y1={40} x2={50} y2={60} />
    <polygon points="24,40 31,36 31,44" fill={stroke} />
  </g>
);

const Junction: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round">
    <circle cx={10} cy={10} r={5} fill={stroke} stroke="none" />
  </g>
);

const LED: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1={0} y1={20} x2={22} y2={20} />
    <polygon points="22,8 22,32 40,20" fill={stroke} />
    <line x1={40} y1={8} x2={40} y2={32} />
    <line x1={40} y1={20} x2={60} y2={20} />
    <line x1={26} y1={12} x2={34} y2={4} />
    <polygon points="34,4 30,5 33,8" fill={stroke} />
    <line x1={32} y1={14} x2={40} y2={6} />
    <polygon points="40,6 36,7 39,10" fill={stroke} />
  </g>
);

const PolarCap: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round">
    <line x1={0} y1={20} x2={26} y2={20} />
    <line x1={26} y1={6} x2={26} y2={34} />
    <path d="M 38 6 Q 32 20 38 34" />
    <line x1={38} y1={20} x2={60} y2={20} />
    <line x1={14} y1={8} x2={20} y2={8} />
    <line x1={17} y1={5} x2={17} y2={11} />
  </g>
);

const Crystal: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1={0} y1={20} x2={18} y2={20} />
    <line x1={18} y1={10} x2={18} y2={30} />
    <rect x={22} y={14} width={16} height={12} fill="#fff" />
    <line x1={42} y1={10} x2={42} y2={30} />
    <line x1={42} y1={20} x2={60} y2={20} />
  </g>
);

const Battery: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round">
    <line x1={20} y1={0} x2={20} y2={14} />
    <line x1={4} y1={14} x2={36} y2={14} />
    <line x1={12} y1={26} x2={28} y2={26} />
    <line x1={20} y1={26} x2={20} y2={40} />
    <line x1={28} y1={8} x2={36} y2={8} />
    <line x1={32} y1={4} x2={32} y2={12} />
  </g>
);

const OpAmp: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1={0} y1={20} x2={10} y2={20} />
    <line x1={0} y1={40} x2={10} y2={40} />
    <line x1={55} y1={30} x2={60} y2={30} />
    <line x1={30} y1={0} x2={30} y2={16} />
    <line x1={30} y1={60} x2={30} y2={44} />
    <polygon points="10,8 10,52 55,30" fill="#fff" />
    <line x1={14} y1={20} x2={20} y2={20} />
    <line x1={14} y1={40} x2={20} y2={40} />
    <line x1={17} y1={37} x2={17} y2={43} />
  </g>
);

const VoltReg: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
    <line x1={0} y1={20} x2={10} y2={20} />
    <line x1={50} y1={20} x2={60} y2={20} />
    <line x1={30} y1={32} x2={30} y2={40} />
    <rect x={10} y={8} width={40} height={24} fill="#fff" />
  </g>
);

const PushButton: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1={0} y1={20} x2={18} y2={20} />
    <circle cx={20} cy={20} r={2} fill={stroke} />
    <circle cx={40} cy={20} r={2} fill={stroke} />
    <line x1={42} y1={20} x2={60} y2={20} />
    <line x1={15} y1={12} x2={45} y2={12} />
    <line x1={30} y1={12} x2={30} y2={4} />
    <line x1={26} y1={4} x2={34} y2={4} />
  </g>
);

const SPDT: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1={0} y1={30} x2={15} y2={30} />
    <circle cx={15} cy={30} r={2.5} fill={stroke} />
    <line x1={15} y1={30} x2={43} y2={12} />
    <circle cx={45} cy={10} r={2.5} fill={stroke} />
    <line x1={45} y1={10} x2={60} y2={10} />
    <circle cx={45} cy={50} r={2.5} fill={stroke} />
    <line x1={45} y1={50} x2={60} y2={50} />
  </g>
);

const DPDT: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1={0} y1={20} x2={15} y2={20} />
    <circle cx={15} cy={20} r={2} fill={stroke} />
    <line x1={15} y1={20} x2={43} y2={12} />
    <circle cx={45} cy={10} r={2} fill={stroke} />
    <line x1={45} y1={10} x2={60} y2={10} />
    <circle cx={45} cy={30} r={2} fill={stroke} />
    <line x1={45} y1={30} x2={60} y2={30} />
    <line x1={0} y1={60} x2={15} y2={60} />
    <circle cx={15} cy={60} r={2} fill={stroke} />
    <line x1={15} y1={60} x2={43} y2={52} />
    <circle cx={45} cy={50} r={2} fill={stroke} />
    <line x1={45} y1={50} x2={60} y2={50} />
    <circle cx={45} cy={70} r={2} fill={stroke} />
    <line x1={45} y1={70} x2={60} y2={70} />
    <line x1={29} y1={16} x2={29} y2={56} strokeDasharray="2 2" />
  </g>
);

const Relay: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1={0} y1={20} x2={15} y2={20} />
    <line x1={0} y1={60} x2={15} y2={60} />
    <rect x={15} y={15} width={20} height={50} fill="#fff" />
    <line x1={15} y1={25} x2={35} y2={45} />
    <line x1={15} y1={35} x2={35} y2={55} />
    <line x1={15} y1={45} x2={35} y2={65} />
    <line x1={40} y1={80} x2={40} y2={50} />
    <circle cx={40} cy={50} r={2.5} fill={stroke} />
    <line x1={40} y1={50} x2={62} y2={25} />
    <circle cx={65} cy={20} r={2.5} fill={stroke} />
    <line x1={65} y1={20} x2={80} y2={20} />
    <circle cx={65} cy={60} r={2.5} fill={stroke} />
    <line x1={65} y1={60} x2={80} y2={60} />
    <line x1={35} y1={40} x2={50} y2={40} strokeDasharray="2 2" />
  </g>
);

const Switch: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1={0} y1={20} x2={15} y2={20} />
    <circle cx={15} cy={20} r={2.5} fill={stroke} />
    <line x1={15} y1={20} x2={43} y2={8} />
    <circle cx={45} cy={20} r={2.5} fill={stroke} />
    <line x1={45} y1={20} x2={60} y2={20} />
  </g>
);

const Pot: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1={0} y1={40} x2={15} y2={40} />
    <polyline points="15,40 20,30 30,50 40,30 50,50 60,30 65,40" />
    <line x1={65} y1={40} x2={80} y2={40} />
    <line x1={40} y1={0} x2={40} y2={20} />
    <polygon points="40,26 34,16 46,16" fill={stroke} />
  </g>
);

const Conn2: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
    <rect x={5} y={5} width={20} height={30} fill="#fff" />
    <circle cx={15} cy={10} r={3} />
    <circle cx={15} cy={30} r={3} />
    <line x1={25} y1={10} x2={40} y2={10} />
    <line x1={25} y1={30} x2={40} y2={30} />
  </g>
);

const Conn3: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
    <rect x={5} y={5} width={20} height={50} fill="#fff" />
    <circle cx={15} cy={10} r={3} />
    <circle cx={15} cy={30} r={3} />
    <circle cx={15} cy={50} r={3} />
    <line x1={25} y1={10} x2={40} y2={10} />
    <line x1={25} y1={30} x2={40} y2={30} />
    <line x1={25} y1={50} x2={40} y2={50} />
  </g>
);

const Conn4: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
    <rect x={5} y={5} width={20} height={70} fill="#fff" />
    <circle cx={15} cy={10} r={3} />
    <circle cx={15} cy={30} r={3} />
    <circle cx={15} cy={50} r={3} />
    <circle cx={15} cy={70} r={3} />
    <line x1={25} y1={10} x2={40} y2={10} />
    <line x1={25} y1={30} x2={40} y2={30} />
    <line x1={25} y1={50} x2={40} y2={50} />
    <line x1={25} y1={70} x2={40} y2={70} />
  </g>
);

const IC8: React.FC = () => (
  <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
    <rect x={20} y={10} width={60} height={80} fill="#fff" rx={2} />
    {[0, 1, 2, 3].map((i) => (
      <React.Fragment key={`l${i}`}>
        <line x1={0} y1={20 + i * 20} x2={20} y2={20 + i * 20} />
        <line x1={80} y1={20 + i * 20} x2={100} y2={20 + i * 20} />
      </React.Fragment>
    ))}
  </g>
);

export const SYMBOLS: Record<string, SymbolDef> = {
  junction: {
    type: "junction",
    label: "Junction",
    category: "Wiring",
    refPrefix: "",
    width: 20,
    height: 20,
    pins: [
      { id: "T", x: 10, y: 0, side: "top" },
      { id: "R", x: 20, y: 10, side: "right" },
      { id: "B", x: 10, y: 20, side: "bottom" },
      { id: "L", x: 0, y: 10, side: "left" },
    ],
    Glyph: Junction,
  },
  resistor: {
    type: "resistor",
    label: "Resistor",
    category: "Passives",
    refPrefix: "R",
    width: 80,
    height: 40,
    pins: [
      { id: "1", x: 0, y: 20, side: "left" },
      { id: "2", x: 80, y: 20, side: "right" },
    ],
    defaultValue: "10k",
    showValue: true,
    Glyph: Resistor,
  },
  capacitor: {
    type: "capacitor",
    label: "Capacitor",
    category: "Passives",
    refPrefix: "C",
    width: 60,
    height: 40,
    pins: [
      { id: "1", x: 0, y: 20, side: "left" },
      { id: "2", x: 60, y: 20, side: "right" },
    ],
    defaultValue: "100n",
    showValue: true,
    Glyph: Capacitor,
  },
  polar_cap: {
    type: "polar_cap",
    label: "Cap (polarized)",
    category: "Passives",
    refPrefix: "C",
    width: 60,
    height: 40,
    pins: [
      { id: "+", x: 0, y: 20, side: "left" },
      { id: "-", x: 60, y: 20, side: "right" },
    ],
    defaultValue: "10u",
    showValue: true,
    Glyph: PolarCap,
  },
  crystal: {
    type: "crystal",
    label: "Crystal",
    category: "Passives",
    refPrefix: "Y",
    width: 60,
    height: 40,
    pins: [
      { id: "1", x: 0, y: 20, side: "left" },
      { id: "2", x: 60, y: 20, side: "right" },
    ],
    defaultValue: "16MHz",
    showValue: true,
    Glyph: Crystal,
  },
  inductor: {
    type: "inductor",
    label: "Inductor",
    category: "Passives",
    refPrefix: "L",
    width: 80,
    height: 40,
    pins: [
      { id: "1", x: 0, y: 20, side: "left" },
      { id: "2", x: 80, y: 20, side: "right" },
    ],
    defaultValue: "10u",
    showValue: true,
    Glyph: Inductor,
  },
  diode: {
    type: "diode",
    label: "Diode",
    category: "Diodes",
    refPrefix: "D",
    width: 60,
    height: 40,
    pins: [
      { id: "A", x: 0, y: 20, side: "left" },
      { id: "K", x: 60, y: 20, side: "right" },
    ],
    showValue: true,
    Glyph: Diode,
  },
  led: {
    type: "led",
    label: "LED",
    category: "Diodes",
    refPrefix: "D",
    width: 60,
    height: 40,
    pins: [
      { id: "A", x: 0, y: 20, side: "left" },
      { id: "K", x: 60, y: 20, side: "right" },
    ],
    showValue: true,
    Glyph: LED,
  },
  gnd: {
    type: "gnd",
    label: "GND",
    category: "Power",
    refPrefix: "",
    width: 40,
    height: 32,
    pins: [{ id: "1", x: 20, y: 0, side: "top" }],
    Glyph: Ground,
  },
  vcc: {
    type: "vcc",
    label: "VCC",
    category: "Power",
    refPrefix: "",
    width: 40,
    height: 40,
    pins: [{ id: "1", x: 20, y: 40, side: "bottom" }],
    defaultValue: "+5V",
    showValue: true,
    Glyph: Vcc,
  },
  battery: {
    type: "battery",
    label: "Battery",
    category: "Power",
    refPrefix: "BT",
    width: 40,
    height: 40,
    pins: [
      { id: "+", x: 20, y: 0, side: "top" },
      { id: "-", x: 20, y: 40, side: "bottom" },
    ],
    defaultValue: "9V",
    showValue: true,
    Glyph: Battery,
  },
  ic8: {
    type: "ic8",
    label: "IC (8-pin)",
    category: "ICs",
    refPrefix: "U",
    width: 100,
    height: 100,
    pins: [
      { id: "1", x: 0, y: 20, side: "left" },
      { id: "2", x: 0, y: 40, side: "left" },
      { id: "3", x: 0, y: 60, side: "left" },
      { id: "4", x: 0, y: 80, side: "left" },
      { id: "8", x: 100, y: 20, side: "right" },
      { id: "7", x: 100, y: 40, side: "right" },
      { id: "6", x: 100, y: 60, side: "right" },
      { id: "5", x: 100, y: 80, side: "right" },
    ],
    Glyph: IC8,
  },
  op_amp: {
    type: "op_amp",
    label: "Op-amp",
    category: "ICs",
    refPrefix: "U",
    width: 60,
    height: 60,
    pins: [
      { id: "-", x: 0, y: 20, side: "left" },
      { id: "+", x: 0, y: 40, side: "left" },
      { id: "OUT", x: 60, y: 30, side: "right" },
      { id: "V+", x: 30, y: 0, side: "top" },
      { id: "V-", x: 30, y: 60, side: "bottom" },
    ],
    showValue: true,
    Glyph: OpAmp,
  },
  vreg: {
    type: "vreg",
    label: "Voltage regulator",
    category: "ICs",
    refPrefix: "U",
    width: 60,
    height: 40,
    pins: [
      { id: "IN", x: 0, y: 20, side: "left" },
      { id: "OUT", x: 60, y: 20, side: "right" },
      { id: "GND", x: 30, y: 40, side: "bottom" },
    ],
    defaultValue: "7805",
    showValue: true,
    Glyph: VoltReg,
  },
  npn: {
    type: "npn",
    label: "NPN BJT",
    category: "Transistors",
    refPrefix: "Q",
    width: 60,
    height: 60,
    pins: [
      { id: "B", x: 0, y: 30, side: "left" },
      { id: "C", x: 60, y: 10, side: "right" },
      { id: "E", x: 60, y: 50, side: "right" },
    ],
    showValue: true,
    Glyph: NPN,
  },
  pnp: {
    type: "pnp",
    label: "PNP BJT",
    category: "Transistors",
    refPrefix: "Q",
    width: 60,
    height: 60,
    pins: [
      { id: "B", x: 0, y: 30, side: "left" },
      { id: "C", x: 60, y: 10, side: "right" },
      { id: "E", x: 60, y: 50, side: "right" },
    ],
    showValue: true,
    Glyph: PNP,
  },
  nmos: {
    type: "nmos",
    label: "N-MOSFET",
    category: "Transistors",
    refPrefix: "Q",
    width: 50,
    height: 60,
    pins: [
      { id: "G", x: 0, y: 30, side: "left" },
      { id: "D", x: 50, y: 0, side: "top" },
      { id: "S", x: 50, y: 60, side: "bottom" },
    ],
    showValue: true,
    Glyph: NMOS,
  },
  switch_spst: {
    type: "switch_spst",
    label: "SPST Switch",
    category: "Switches",
    refPrefix: "SW",
    width: 60,
    height: 40,
    pins: [
      { id: "1", x: 0, y: 20, side: "left" },
      { id: "2", x: 60, y: 20, side: "right" },
    ],
    Glyph: Switch,
  },
  push_button: {
    type: "push_button",
    label: "Push Button",
    category: "Switches",
    refPrefix: "SW",
    width: 60,
    height: 40,
    pins: [
      { id: "1", x: 0, y: 20, side: "left" },
      { id: "2", x: 60, y: 20, side: "right" },
    ],
    Glyph: PushButton,
  },
  spdt: {
    type: "spdt",
    label: "SPDT Switch",
    category: "Switches",
    refPrefix: "SW",
    width: 60,
    height: 60,
    pins: [
      { id: "C", x: 0, y: 30, side: "left" },
      { id: "1", x: 60, y: 10, side: "right" },
      { id: "2", x: 60, y: 50, side: "right" },
    ],
    Glyph: SPDT,
  },
  dpdt: {
    type: "dpdt",
    label: "DPDT Switch",
    category: "Switches",
    refPrefix: "SW",
    width: 60,
    height: 80,
    pins: [
      { id: "C1", x: 0, y: 20, side: "left" },
      { id: "1A", x: 60, y: 10, side: "right" },
      { id: "1B", x: 60, y: 30, side: "right" },
      { id: "C2", x: 0, y: 60, side: "left" },
      { id: "2A", x: 60, y: 50, side: "right" },
      { id: "2B", x: 60, y: 70, side: "right" },
    ],
    Glyph: DPDT,
  },
  relay: {
    type: "relay",
    label: "Relay (SPDT)",
    category: "Switches",
    refPrefix: "K",
    width: 80,
    height: 80,
    pins: [
      { id: "A", x: 0, y: 20, side: "left" },
      { id: "B", x: 0, y: 60, side: "left" },
      { id: "C", x: 40, y: 80, side: "bottom" },
      { id: "NO", x: 80, y: 20, side: "right" },
      { id: "NC", x: 80, y: 60, side: "right" },
    ],
    Glyph: Relay,
  },
  pot: {
    type: "pot",
    label: "Potentiometer",
    category: "Passives",
    refPrefix: "RV",
    width: 80,
    height: 50,
    pins: [
      { id: "1", x: 0, y: 40, side: "left" },
      { id: "W", x: 40, y: 0, side: "top" },
      { id: "3", x: 80, y: 40, side: "right" },
    ],
    defaultValue: "10k",
    showValue: true,
    Glyph: Pot,
  },
  conn2: {
    type: "conn2",
    label: "Conn 2-pin",
    category: "Connectors",
    refPrefix: "J",
    width: 40,
    height: 40,
    pins: [
      { id: "1", x: 40, y: 10, side: "right" },
      { id: "2", x: 40, y: 30, side: "right" },
    ],
    Glyph: Conn2,
  },
  conn3: {
    type: "conn3",
    label: "Conn 3-pin",
    category: "Connectors",
    refPrefix: "J",
    width: 40,
    height: 60,
    pins: [
      { id: "1", x: 40, y: 10, side: "right" },
      { id: "2", x: 40, y: 30, side: "right" },
      { id: "3", x: 40, y: 50, side: "right" },
    ],
    Glyph: Conn3,
  },
  conn4: {
    type: "conn4",
    label: "Conn 4-pin",
    category: "Connectors",
    refPrefix: "J",
    width: 40,
    height: 80,
    pins: [
      { id: "1", x: 40, y: 10, side: "right" },
      { id: "2", x: 40, y: 30, side: "right" },
      { id: "3", x: 40, y: 50, side: "right" },
      { id: "4", x: 40, y: 70, side: "right" },
    ],
    Glyph: Conn4,
  },
};

export const SYMBOL_LIST = Object.values(SYMBOLS);
