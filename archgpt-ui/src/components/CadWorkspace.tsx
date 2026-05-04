"use client";

import { useCallback, useMemo, useState } from "react";
import { CadToolbar, HistoryTimeline } from "./CadToolbar";
import { FloorPlanCanvas, type CanvasRoom } from "./FloorPlanCanvas";
import { PropertyInspector } from "./PropertyInspector";
import {
  DEFAULT_CAD_STATE,
  type CadToolId,
  type CadToolMode,
  type CadToolState,
  type CadSelection,
  type CadHistoryEntry,
} from "../lib/cadTools";
import {
  type RoomBlueprint,
  type ArchetypeBlueprint,
  getBlueprint,
  hasBlueprint,
  applyModifiers,
  fitToPlot,
} from "../lib/houseBlueprints";
import { initBlueprints } from "../lib/blueprints";
import type { HouseArchetype, HouseModifier } from "../lib/houseTaxonomy";

// ── Props ────────────────────────────────────────────────────────
type CadWorkspaceProps = {
  archetype: HouseArchetype;
  modifiers: HouseModifier[];
  plotWidthFt?: number;
  plotDepthFt?: number;
  floorIndex: number;
  onFloorChange: (index: number) => void;
};

// ── Layout rooms from blueprint floor ────────────────────────────
function layoutRooms(blueprint: ArchetypeBlueprint, floorIndex: number): CanvasRoom[] {
  const floor = blueprint.floors[floorIndex];
  if (!floor) return [];

  const rooms = floor.rooms;
  const result: CanvasRoom[] = [];
  const cols = rooms.length > 6 ? 3 : rooms.length > 3 ? 2 : 1;
  const gap = 1; // 1ft gap

  let cx = 0;
  let cy = 0;
  let rowMaxH = 0;
  let col = 0;

  for (let i = 0; i < rooms.length; i++) {
    const r = rooms[i];
    result.push({
      id: `${floorIndex}-${i}`,
      name: r.name,
      category: r.category,
      x: cx,
      y: cy,
      width: r.widthFt,
      height: r.depthFt,
      floorIndex,
      blueprint: r,
    });

    cx += r.widthFt + gap;
    rowMaxH = Math.max(rowMaxH, r.depthFt);
    col++;

    if (col >= cols) {
      cx = 0;
      cy += rowMaxH + gap;
      rowMaxH = 0;
      col = 0;
    }
  }

  return result;
}

// ── Component ────────────────────────────────────────────────────
export function CadWorkspace({
  archetype,
  modifiers,
  plotWidthFt,
  plotDepthFt,
  floorIndex,
  onFloorChange,
}: CadWorkspaceProps) {
  initBlueprints();

  const [toolState, setToolState] = useState<CadToolState>({ ...DEFAULT_CAD_STATE });
  const [selection, setSelection] = useState<CadSelection | null>(null);
  const [history, setHistory] = useState<CadHistoryEntry[]>([
    { id: 0, label: "Initial", timestamp: Date.now(), snapshot: "" },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Get and prepare blueprint
  const blueprint = useMemo(() => {
    let bp = getBlueprint(archetype);
    if (!bp) return null;
    bp = applyModifiers(bp, modifiers);
    if (plotWidthFt && plotDepthFt) {
      bp = fitToPlot(bp, plotWidthFt, plotDepthFt);
    }
    return bp;
  }, [archetype, modifiers, plotWidthFt, plotDepthFt]);

  // Layout rooms for current floor
  const [rooms, setRooms] = useState<CanvasRoom[]>(() =>
    blueprint ? layoutRooms(blueprint, floorIndex) : [],
  );

  // Re-layout when floor changes
  const handleFloorChange = useCallback(
    (idx: number) => {
      onFloorChange(idx);
      if (blueprint) {
        setRooms(layoutRooms(blueprint, idx));
        setSelection(null);
      }
    },
    [blueprint, onFloorChange],
  );

  // Selected room's blueprint data
  const selectedRoom = useMemo(() => {
    if (!selection) return null;
    return rooms.find((r) => r.id === selection.id)?.blueprint ?? null;
  }, [selection, rooms]);

  // ── Tool handlers ──────────────────────────────────────────
  const handleToolChange = (toolId: CadToolId) => {
    setToolState((prev) => ({ ...prev, activeTool: toolId, toolPhase: "idle" }));
  };

  const handleModeChange = (mode: CadToolMode) => {
    setToolState((prev) => ({ ...prev, mode, activeTool: "select", toolPhase: "idle" }));
  };

  const pushHistory = (label: string) => {
    const entry: CadHistoryEntry = {
      id: history.length,
      label,
      timestamp: Date.now(),
      snapshot: JSON.stringify(rooms),
    };
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), entry]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handleRoomMove = (roomId: string, x: number, y: number) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, x, y } : r)));
  };

  const handleRoomResize = (roomId: string, width: number, height: number) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, width, height, blueprint: { ...r.blueprint, widthFt: width, depthFt: height } }
          : r,
      ),
    );
  };

  const handlePropertyChange = (key: string, value: string | number | boolean) => {
    if (!selection) return;
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== selection.id) return r;
        const updated = { ...r, blueprint: { ...r.blueprint, [key]: value } };
        if (key === "widthFt") updated.width = value as number;
        if (key === "depthFt") updated.height = value as number;
        if (key === "category") updated.category = value as string;
        if (key === "name") updated.name = value as string;
        return updated;
      }),
    );
    pushHistory(`Edit ${key}`);
  };

  const handleHistoryJump = (index: number) => {
    const entry = history[index];
    if (entry?.snapshot) {
      try {
        setRooms(JSON.parse(entry.snapshot));
      } catch { /* ignore */ }
    }
    setHistoryIndex(index);
  };

  if (!blueprint) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        No blueprint available for <span className="text-purple-300 ml-1">{archetype}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#080a11] rounded-2xl border border-purple-400/10 overflow-hidden">
      {/* ── Toolbar ── */}
      <CadToolbar
        toolState={toolState}
        onToolChange={handleToolChange}
        onModeChange={handleModeChange}
        onSnapToggle={() => setToolState((p) => ({ ...p, snapEnabled: !p.snapEnabled }))}
        onGridToggle={() => setToolState((p) => ({ ...p, gridVisible: !p.gridVisible }))}
        onConstraintsToggle={() => setToolState((p) => ({ ...p, constraintsVisible: !p.constraintsVisible }))}
        onDimensionsToggle={() => setToolState((p) => ({ ...p, dimensionsVisible: !p.dimensionsVisible }))}
      />

      {/* ── Floor tabs ── */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/5">
        {blueprint.floors.map((floor, i) => (
          <button
            key={floor.level}
            onClick={() => handleFloorChange(i)}
            className={`px-3 py-1 rounded text-[10px] font-medium uppercase tracking-wider transition border ${
              i === floorIndex
                ? "bg-purple-500/20 text-purple-200 border-purple-400/25"
                : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            {floor.level}
          </button>
        ))}
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas */}
        <div className="flex-1 overflow-auto">
          <FloorPlanCanvas
            rooms={rooms}
            toolState={toolState}
            selection={selection}
            onSelectRoom={setSelection}
            onRoomMove={handleRoomMove}
            onRoomResize={handleRoomResize}
            plotWidthFt={plotWidthFt}
            plotDepthFt={plotDepthFt}
          />
        </div>

        {/* Property Inspector */}
        <div className="w-56 border-l border-white/5 bg-[#0a0b10]/80 shrink-0">
          <PropertyInspector
            selection={selection}
            room={selectedRoom}
            onPropertyChange={handlePropertyChange}
          />
        </div>
      </div>

      {/* ── Timeline ── */}
      <HistoryTimeline
        entries={history}
        currentIndex={historyIndex}
        onJumpTo={handleHistoryJump}
      />
    </div>
  );
}
