"use client";

import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  ConnectionMode,
  ViewportPortal,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useUpdateNodeInternals,
  useNodeConnections,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SYMBOLS,
  SYMBOL_LIST,
  CATEGORIES,
  rotatePin,
  rotatedDims,
  svgRotateTransform,
  type PinSide,
  type Rotation,
} from "@/lib/schematic/symbols";

type SymbolNodeData = {
  type: string;
  refdes?: string;
  value?: string;
  rotation?: Rotation;
  labelOffset?: { dx: number; dy: number };
};

type SymbolNode = Node<SymbolNodeData, "symbol">;

type NoteData = {
  text?: string;
  width?: number;
  height?: number;
};

type NoteNode = Node<NoteData, "note">;

type LabelData = {
  ref?: string;
  value?: string;
};

type LabelNode = Node<LabelData, "label">;

type EditorNode = SymbolNode | NoteNode | LabelNode;

type SchematicRow = { id: number; name: string; data: string };

const HANDLE_SIZE = 10;

function sideToPosition(side: PinSide): Position {
  switch (side) {
    case "left": return Position.Left;
    case "right": return Position.Right;
    case "top": return Position.Top;
    case "bottom": return Position.Bottom;
  }
}

function handleOffsetStyle(side: PinSide, x: number, y: number): { left: number; top: number } {
  const s = HANDLE_SIZE;
  switch (side) {
    case "right": return { left: x - s, top: y - s / 2 };
    case "left": return { left: x, top: y - s / 2 };
    case "top": return { left: x - s / 2, top: y };
    case "bottom": return { left: x - s / 2, top: y - s };
  }
}

function SymbolNodeView({ id, data, selected }: NodeProps<SymbolNode>) {
  const { setNodes, getZoom } = useReactFlow();
  const def = SYMBOLS[data.type];
  const dragRef = useRef<{ startX: number; startY: number; startOffset: { dx: number; dy: number } } | null>(null);

  const connections = useNodeConnections({ id });
  const connectedPinIds = useMemo(() => {
    const s = new Set<string>();
    for (const c of connections) {
      if (c.source === id && c.sourceHandle) s.add(c.sourceHandle);
      if (c.target === id && c.targetHandle) s.add(c.targetHandle);
    }
    return s;
  }, [connections, id]);

  const onLabelMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffset: data.labelOffset ?? { dx: 0, dy: 0 },
    };
    const zoom = getZoom();
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = (ev.clientX - dragRef.current.startX) / zoom;
      const dy = (ev.clientY - dragRef.current.startY) / zoom;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...n.data,
                  labelOffset: {
                    dx: dragRef.current!.startOffset.dx + dx,
                    dy: dragRef.current!.startOffset.dy + dy,
                  },
                },
              }
            : n
        )
      );
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  if (!def) {
    return (
      <div className="border border-red-400 bg-red-50 text-red-600 text-xs px-2 py-1 rounded">
        unknown: {data.type}
      </div>
    );
  }
  const Glyph = def.Glyph;
  const rotation: Rotation = data.rotation ?? 0;
  const { w: rotW, h: rotH } = rotatedDims(def.width, def.height, rotation);
  const transform = svgRotateTransform(rotation, def.width, def.height);
  const labelDx = data.labelOffset?.dx ?? 0;
  const labelDy = data.labelOffset?.dy ?? 0;
  return (
    <div
      style={{ width: rotW, height: rotH }}
      className={`relative ${selected ? "outline-2 outline-blue-400 outline-offset-2 rounded-sm" : ""}`}
    >
      <svg
        width={rotW}
        height={rotH}
        viewBox={`0 0 ${rotW} ${rotH}`}
        style={{ display: "block", overflow: "visible" }}
      >
        <g transform={transform || undefined}>
          <Glyph />
          {def.type === "junction" && (
            <g fill="none" stroke="#1f2937" strokeWidth={1.5} strokeLinecap="round">
              {connectedPinIds.has("T") && <line x1={10} y1={0} x2={10} y2={10} />}
              {connectedPinIds.has("R") && <line x1={20} y1={10} x2={10} y2={10} />}
              {connectedPinIds.has("B") && <line x1={10} y1={20} x2={10} y2={10} />}
              {connectedPinIds.has("L") && <line x1={0} y1={10} x2={10} y2={10} />}
            </g>
          )}
        </g>
      </svg>
      {def.pins.map((pin) => {
        const rp = rotatePin(pin, rotation, def.width, def.height);
        return (
          <Handle
            key={pin.id}
            id={pin.id}
            type="source"
            position={sideToPosition(rp.side)}
            className="schematic-pin"
            style={handleOffsetStyle(rp.side, rp.x, rp.y)}
          />
        );
      })}
      {def.pins.map((pin) => {
        const rp = rotatePin(pin, rotation, def.width, def.height);
        return (
          <div
            key={`dot-${pin.id}`}
            className="schematic-pin-dot"
            style={{ left: rp.x - 4, top: rp.y - 4 }}
          />
        );
      })}
      {(data.refdes || data.value) && (
        <div
          className="nodrag absolute text-[10px] font-mono text-gray-600 whitespace-nowrap select-none"
          style={{ left: rotW + 6 + labelDx, top: -2 + labelDy, cursor: "move" }}
          onMouseDown={onLabelMouseDown}
          title="Drag to reposition"
        >
          {data.refdes && <div className="font-semibold">{data.refdes}</div>}
          {def.showValue !== false && data.value && <div>{data.value}</div>}
        </div>
      )}
    </div>
  );
}

function NoteNodeView({ data, selected }: NodeProps<NoteNode>) {
  const width = data.width ?? 160;
  const height = data.height ?? 60;
  return (
    <div
      style={{ width, height }}
      className={`bg-yellow-50 border border-yellow-300 rounded-md p-2 text-xs text-gray-800 whitespace-pre-wrap break-words shadow-sm overflow-hidden ${
        selected ? "outline-2 outline-blue-400 outline-offset-2" : ""
      }`}
    >
      {data.text || "Note"}
    </div>
  );
}

function LabelNodeView({ data, selected }: NodeProps<LabelNode>) {
  return (
    <div
      className={`text-[10px] font-mono text-gray-600 whitespace-nowrap select-none px-1 ${
        selected ? "outline-2 outline-blue-400 outline-offset-2 rounded-sm" : ""
      }`}
    >
      {data.ref && <div className="font-semibold">{data.ref}</div>}
      {data.value && <div>{data.value}</div>}
      {!data.ref && !data.value && <div className="text-gray-400">Label</div>}
    </div>
  );
}

const nodeTypes = { symbol: SymbolNodeView, note: NoteNodeView, label: LabelNodeView };

export default function SchematicEditor({ schematic }: { schematic: SchematicRow }) {
  const initial = useMemo(() => {
    try {
      const parsed = JSON.parse(schematic.data || "{}");
      const nodes: EditorNode[] = Array.isArray(parsed.nodes) ? parsed.nodes : [];
      const edges: Edge[] = Array.isArray(parsed.edges) ? parsed.edges : [];
      return { nodes, edges };
    } catch {
      return { nodes: [], edges: [] };
    }
  }, [schematic.data]);

  const [nodes, setNodes, onNodesChange] = useNodesState<EditorNode>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges);
  const [name, setName] = useState(schematic.name);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { screenToFlowPosition } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const counterRef = useRef(0);

  // Re-measure handles for all nodes once on mount (so saved rotated schematics
  // get their handle positions recalculated after the initial render).
  useEffect(() => {
    for (const n of initial.nodes) updateNodeInternals(n.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const toggleCat = useCallback((cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }, []);

  const junctions = useMemo(() => {
    const counts = new Map<string, { x: number; y: number; count: number }>();
    for (const edge of edges) {
      for (const ep of [
        { nid: edge.source, hid: edge.sourceHandle },
        { nid: edge.target, hid: edge.targetHandle },
      ]) {
        if (!ep.hid) continue;
        const node = nodes.find((n) => n.id === ep.nid);
        if (!node || node.type !== "symbol") continue;
        const sd = node.data as SymbolNodeData;
        const def = SYMBOLS[sd.type];
        if (!def) continue;
        const pin = def.pins.find((p) => p.id === ep.hid);
        if (!pin) continue;
        const rotation = (sd.rotation ?? 0) as Rotation;
        const rp = rotatePin(pin, rotation, def.width, def.height);
        const x = node.position.x + rp.x;
        const y = node.position.y + rp.y;
        const key = `${x},${y}`;
        const existing = counts.get(key);
        if (existing) existing.count++;
        else counts.set(key, { x, y, count: 1 });
      }
    }
    return Array.from(counts.values()).filter((e) => e.count >= 2);
  }, [nodes, edges]);

  const symbolsByCategory = useMemo(() => {
    const map = new Map<string, typeof SYMBOL_LIST>();
    for (const def of SYMBOL_LIST) {
      const arr = map.get(def.category) ?? [];
      arr.push(def);
      map.set(def.category, arr);
    }
    return map;
  }, []);

  const nextNodeId = useCallback(() => {
    counterRef.current += 1;
    return `n${Date.now().toString(36)}${counterRef.current}`;
  }, []);

  const nextRefdes = useCallback(
    (prefix: string): string => {
      if (!prefix) return "";
      let max = 0;
      for (const n of nodes) {
        if (n.type !== "symbol") continue;
        const ref = (n.data as SymbolNodeData).refdes;
        if (ref && ref.startsWith(prefix)) {
          const num = Number(ref.slice(prefix.length));
          if (Number.isFinite(num) && num > max) max = num;
        }
      }
      return `${prefix}${max + 1}`;
    },
    [nodes]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source === params.target && params.sourceHandle === params.targetHandle) return;
      setEdges((eds) => addEdge({ ...params, type: "step" }, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const symbolType = event.dataTransfer.getData("application/symbol");
      const isNote = event.dataTransfer.getData("application/note") === "note";
      const isLabel = event.dataTransfer.getData("application/label") === "label";
      const cursor = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      if (symbolType && SYMBOLS[symbolType]) {
        const def = SYMBOLS[symbolType];
        const centeredX = cursor.x - def.width / 2;
        const centeredY = cursor.y - def.height / 2;
        const newNode: SymbolNode = {
          id: nextNodeId(),
          type: "symbol",
          position: {
            x: Math.round(centeredX / 10) * 10,
            y: Math.round(centeredY / 10) * 10,
          },
          data: {
            type: symbolType,
            refdes: nextRefdes(def.refPrefix),
            value: def.defaultValue,
          },
          selected: true,
        };
        setNodes((nds) =>
          nds.map((n) => (n.selected ? { ...n, selected: false } : n)).concat(newNode)
        );
        setSelectedNodeId(newNode.id);
        setSelectedEdgeIds([]);
      } else if (isNote) {
        const w = 160;
        const h = 60;
        const centeredX = cursor.x - w / 2;
        const centeredY = cursor.y - h / 2;
        const newNode: NoteNode = {
          id: nextNodeId(),
          type: "note",
          position: {
            x: Math.round(centeredX / 10) * 10,
            y: Math.round(centeredY / 10) * 10,
          },
          data: { text: "Note", width: w, height: h },
          selected: true,
        };
        setNodes((nds) =>
          nds.map((n) => (n.selected ? { ...n, selected: false } : n)).concat(newNode)
        );
        setSelectedNodeId(newNode.id);
        setSelectedEdgeIds([]);
      } else if (isLabel) {
        const newNode: LabelNode = {
          id: nextNodeId(),
          type: "label",
          position: {
            x: Math.round(cursor.x / 10) * 10,
            y: Math.round(cursor.y / 10) * 10,
          },
          data: { ref: "Label", value: "" },
          selected: true,
        };
        setNodes((nds) =>
          nds.map((n) => (n.selected ? { ...n, selected: false } : n)).concat(newNode)
        );
        setSelectedNodeId(newNode.id);
        setSelectedEdgeIds([]);
      }
    },
    [screenToFlowPosition, nextNodeId, nextRefdes, setNodes]
  );

  const onSelectionChange = useCallback(
    ({ nodes: sel, edges: selE }: { nodes: Node[]; edges: Edge[] }) => {
      setSelectedNodeId(sel.length === 1 ? sel[0].id : null);
      setSelectedEdgeIds(selE.map((e) => e.id));
    },
    []
  );

  const deleteSelectedEdges = useCallback(() => {
    if (selectedEdgeIds.length === 0) return;
    setEdges((eds) => eds.filter((e) => !selectedEdgeIds.includes(e.id)));
    setSelectedEdgeIds([]);
  }, [selectedEdgeIds, setEdges]);

  const selected = nodes.find((n) => n.id === selectedNodeId) ?? null;

  const updateSelected = useCallback(
    (patch: Partial<SymbolNodeData>) => {
      if (!selectedNodeId) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNodeId && n.type === "symbol"
            ? { ...n, data: { ...(n.data as SymbolNodeData), ...patch } }
            : n
        )
      );
    },
    [selectedNodeId, setNodes]
  );

  const updateNoteText = useCallback(
    (text: string) => {
      if (!selectedNodeId) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNodeId && n.type === "note"
            ? { ...n, data: { ...(n.data as NoteData), text } }
            : n
        )
      );
    },
    [selectedNodeId, setNodes]
  );

  const updateLabel = useCallback(
    (patch: Partial<LabelData>) => {
      if (!selectedNodeId) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNodeId && n.type === "label"
            ? { ...n, data: { ...(n.data as LabelData), ...patch } }
            : n
        )
      );
    },
    [selectedNodeId, setNodes]
  );

  const rotateSelected = useCallback(
    (delta: 90 | -90) => {
      if (!selectedNodeId) return;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== selectedNodeId) return n;
          if (n.type !== "symbol") return n;
          const sd = n.data as SymbolNodeData;
          const cur = (sd.rotation ?? 0) as Rotation;
          const next = (((cur + delta) % 360 + 360) % 360) as Rotation;
          return { ...n, data: { ...sd, rotation: next } };
        })
      );
      updateNodeInternals(selectedNodeId);
    },
    [selectedNodeId, setNodes, updateNodeInternals]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId)
    );
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges]);

  async function save() {
    setSaveState("saving");
    const slimNodes = nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data,
    }));
    const slimEdges = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: e.type,
    }));
    try {
      const res = await fetch(`/api/schematics/${schematic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          data: JSON.stringify({ nodes: slimNodes, edges: slimEdges }),
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    } catch {
      setSaveState("error");
    }
  }

  return (
    <div className="fixed left-0 right-0 bottom-0 top-[3.25rem] flex flex-col px-4 py-3 bg-gray-50 z-10">
      <div className="flex items-center gap-3 mb-3">
        <Link href="/schematics" className="text-gray-400 hover:text-gray-600 text-sm">← Schematics</Link>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="font-semibold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none px-1"
        />
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {saveState === "saving" && "Saving…"}
            {saveState === "saved" && "Saved"}
            {saveState === "error" && "Save failed"}
          </span>
          <button
            onClick={save}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        <aside className="w-44 shrink-0 bg-white rounded-xl shadow p-3 overflow-y-auto">
          <h2 className="text-xs uppercase text-gray-400 mb-2 font-semibold">Symbols</h2>
          <div className="space-y-1">
            {(() => {
              const cat = "Annotations";
              const expanded = expandedCats.has(cat);
              return (
                <div key={cat}>
                  <button
                    type="button"
                    onClick={() => toggleCat(cat)}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-100 text-left"
                  >
                    <span className="text-gray-400 text-xs w-3 inline-block">
                      {expanded ? "▾" : "▸"}
                    </span>
                    <span className="text-xs font-medium text-gray-700 flex-1">{cat}</span>
                    <span className="text-[10px] text-gray-400">1</span>
                  </button>
                  {expanded && (
                    <ul className="mt-1 mb-2 pl-3 space-y-2">
                      <li
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/note", "note");
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className="border border-gray-200 hover:border-blue-400 rounded-lg p-2 cursor-grab active:cursor-grabbing flex flex-col items-center gap-1 bg-yellow-50"
                        title="Drag to canvas: Note"
                      >
                        <div className="w-full text-center text-[10px] text-gray-700 bg-yellow-100 border border-yellow-200 rounded px-1 py-2">
                          Note
                        </div>
                        <span className="text-[11px] text-gray-600">Note</span>
                      </li>
                      <li
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/label", "label");
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className="border border-gray-200 hover:border-blue-400 rounded-lg p-2 cursor-grab active:cursor-grabbing flex flex-col items-center gap-1 bg-gray-50"
                        title="Drag to canvas: Label (ref/value style)"
                      >
                        <div className="text-[10px] font-mono text-gray-600 leading-tight text-center py-1">
                          <div className="font-semibold">R1</div>
                          <div>10k</div>
                        </div>
                        <span className="text-[11px] text-gray-600">Label</span>
                      </li>
                    </ul>
                  )}
                </div>
              );
            })()}
            {CATEGORIES.map((cat) => {
              const defs = symbolsByCategory.get(cat);
              if (!defs || defs.length === 0) return null;
              const expanded = expandedCats.has(cat);
              return (
                <div key={cat}>
                  <button
                    type="button"
                    onClick={() => toggleCat(cat)}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-100 text-left"
                  >
                    <span className="text-gray-400 text-xs w-3 inline-block">
                      {expanded ? "▾" : "▸"}
                    </span>
                    <span className="text-xs font-medium text-gray-700 flex-1">{cat}</span>
                    <span className="text-[10px] text-gray-400">{defs.length}</span>
                  </button>
                  {expanded && (
                    <ul className="mt-1 mb-2 pl-3 space-y-2">
                      {defs.map((def) => {
                        const Glyph = def.Glyph;
                        return (
                          <li
                            key={def.type}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("application/symbol", def.type);
                              e.dataTransfer.effectAllowed = "move";
                              const svg = (e.currentTarget as HTMLElement).querySelector("svg");
                              if (svg) {
                                e.dataTransfer.setDragImage(svg, def.width / 2, def.height / 2);
                              }
                            }}
                            className="border border-gray-200 hover:border-blue-400 rounded-lg p-2 cursor-grab active:cursor-grabbing flex flex-col items-center gap-1 bg-gray-50"
                            title={`Drag to canvas: ${def.label}`}
                          >
                            <svg
                              width={def.width}
                              height={def.height}
                              viewBox={`0 0 ${def.width} ${def.height}`}
                              style={{ maxWidth: "100%", maxHeight: 48 }}
                            >
                              <Glyph />
                            </svg>
                            <span className="text-[11px] text-gray-600">{def.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <div
          ref={wrapperRef}
          className="flex-1 bg-white rounded-xl shadow overflow-hidden"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            onNodesDelete={(deleted) => {
              const ids = new Set(deleted.map((n) => n.id));
              setEdges((eds) => eds.filter((e) => !ids.has(e.source) && !ids.has(e.target)));
            }}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            defaultEdgeOptions={{ type: "step", style: { stroke: "#1f2937", strokeWidth: 1.5 } }}
            snapToGrid
            snapGrid={[10, 10]}
            deleteKeyCode={["Delete", "Backspace"]}
            fitView
          >
            <Background gap={20} size={1} color="#d1d5db" />
            <Controls showInteractive={false} />
            <ViewportPortal>
              {junctions.map((j) => (
                <div
                  key={`${j.x},${j.y}`}
                  style={{
                    position: "absolute",
                    left: j.x,
                    top: j.y,
                    width: 12,
                    height: 12,
                    background: "#1f2937",
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                  }}
                />
              ))}
            </ViewportPortal>
          </ReactFlow>
        </div>

        <aside className="w-60 shrink-0 bg-white rounded-xl shadow p-3 overflow-y-auto">
          <h2 className="text-xs uppercase text-gray-400 mb-2 font-semibold">Selection</h2>
          {!selected && selectedEdgeIds.length === 0 && (
            <p className="text-xs text-gray-400">
              Click a symbol to edit its ref/value. Click a wire to select it.
              Press <kbd className="px-1 py-0.5 text-[10px] bg-gray-100 rounded border border-gray-200">Delete</kbd> to remove anything selected.
            </p>
          )}
          {!selected && selectedEdgeIds.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-gray-700">
                {selectedEdgeIds.length} wire{selectedEdgeIds.length !== 1 ? "s" : ""} selected
              </div>
              <button
                onClick={deleteSelectedEdges}
                className="w-full text-xs text-red-500 border border-red-200 rounded py-1 hover:bg-red-50"
              >
                Delete wire{selectedEdgeIds.length !== 1 ? "s" : ""}
              </button>
            </div>
          )}
          {selected && selected.type === "symbol" && (() => {
            const sd = selected.data as SymbolNodeData;
            return (
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] uppercase text-gray-400">Symbol</div>
                  <div className="text-sm text-gray-700">{SYMBOLS[sd.type]?.label ?? sd.type}</div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase text-gray-400 mb-1">Reference</label>
                  <input
                    value={sd.refdes ?? ""}
                    onChange={(e) => updateSelected({ refdes: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase text-gray-400 mb-1">Value</label>
                  <input
                    value={sd.value ?? ""}
                    onChange={(e) => updateSelected({ value: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase text-gray-400 mb-1">
                    Rotation ({sd.rotation ?? 0}°)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => rotateSelected(-90)}
                      className="flex-1 text-xs border border-gray-200 rounded py-1 hover:bg-gray-50"
                      title="Rotate counter-clockwise"
                    >
                      ↺ -90°
                    </button>
                    <button
                      onClick={() => rotateSelected(90)}
                      className="flex-1 text-xs border border-gray-200 rounded py-1 hover:bg-gray-50"
                      title="Rotate clockwise"
                    >
                      ↻ +90°
                    </button>
                  </div>
                </div>
                <button
                  onClick={deleteSelected}
                  className="w-full text-xs text-red-500 border border-red-200 rounded py-1 hover:bg-red-50"
                >
                  Delete symbol
                </button>
              </div>
            );
          })()}
          {selected && selected.type === "note" && (() => {
            const nd = selected.data as NoteData;
            return (
              <div className="space-y-3">
                <div className="text-[11px] uppercase text-gray-400">Note</div>
                <textarea
                  value={nd.text ?? ""}
                  onChange={(e) => updateNoteText(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm font-sans"
                  rows={5}
                  placeholder="Note text…"
                />
                <button
                  onClick={deleteSelected}
                  className="w-full text-xs text-red-500 border border-red-200 rounded py-1 hover:bg-red-50"
                >
                  Delete note
                </button>
              </div>
            );
          })()}
          {selected && selected.type === "label" && (() => {
            const ld = selected.data as LabelData;
            return (
              <div className="space-y-3">
                <div className="text-[11px] uppercase text-gray-400">Label</div>
                <div>
                  <label className="block text-[11px] uppercase text-gray-400 mb-1">Top line (bold)</label>
                  <input
                    value={ld.ref ?? ""}
                    onChange={(e) => updateLabel({ ref: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase text-gray-400 mb-1">Bottom line</label>
                  <input
                    value={ld.value ?? ""}
                    onChange={(e) => updateLabel({ value: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm font-mono"
                  />
                </div>
                <button
                  onClick={deleteSelected}
                  className="w-full text-xs text-red-500 border border-red-200 rounded py-1 hover:bg-red-50"
                >
                  Delete label
                </button>
              </div>
            );
          })()}
        </aside>
      </div>
    </div>
  );
}
