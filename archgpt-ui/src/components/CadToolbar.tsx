"use client";

import { useState } from "react";
import {
  getToolGroups,
  getToolDef,
  DEFAULT_CAD_STATE,
  type CadToolId,
  type CadToolMode,
  type CadToolState,
  type CadToolDef,
  type CadHistoryEntry,
} from "../lib/cadTools";

// ── Props ────────────────────────────────────────────────────────
type CadToolbarProps = {
  toolState: CadToolState;
  onToolChange: (toolId: CadToolId) => void;
  onModeChange: (mode: CadToolMode) => void;
  onSnapToggle: () => void;
  onGridToggle: () => void;
  onConstraintsToggle: () => void;
  onDimensionsToggle: () => void;
};

// ── Component ────────────────────────────────────────────────────
export function CadToolbar({
  toolState,
  onToolChange,
  onModeChange,
  onSnapToggle,
  onGridToggle,
  onConstraintsToggle,
  onDimensionsToggle,
}: CadToolbarProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const groups = getToolGroups(toolState.mode);

  return (
    <div className="flex flex-col border-b border-purple-400/15 bg-[#0a0b10]/95 backdrop-blur-sm">
      {/* ── Mode switcher + global toggles ── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onModeChange("2d")}
            className={`px-3 py-1 rounded text-[11px] font-semibold uppercase tracking-wider transition ${
              toolState.mode === "2d"
                ? "bg-purple-500/25 text-purple-200 border border-purple-400/30"
                : "text-gray-400 hover:text-gray-200 border border-transparent"
            }`}
          >
            2D · DWG
          </button>
          <button
            onClick={() => onModeChange("3d")}
            className={`px-3 py-1 rounded text-[11px] font-semibold uppercase tracking-wider transition ${
              toolState.mode === "3d"
                ? "bg-purple-500/25 text-purple-200 border border-purple-400/30"
                : "text-gray-400 hover:text-gray-200 border border-transparent"
            }`}
          >
            3D · Model
          </button>
        </div>

        <div className="flex items-center gap-2">
          <TogglePill label="Snap" active={toolState.snapEnabled} onClick={onSnapToggle} />
          <TogglePill label="Grid" active={toolState.gridVisible} onClick={onGridToggle} />
          <TogglePill label="Dims" active={toolState.dimensionsVisible} onClick={onDimensionsToggle} />
          <TogglePill label="Constr" active={toolState.constraintsVisible} onClick={onConstraintsToggle} />
        </div>
      </div>

      {/* ── Tool ribbon ── */}
      <div className="flex items-stretch gap-0.5 px-2 py-1 overflow-x-auto scrollbar-none">
        {groups.map((group) => (
          <div key={group.id} className="flex flex-col items-center">
            <span className="text-[8px] uppercase tracking-[0.15em] text-gray-500 mb-0.5 px-1">
              {group.label}
            </span>
            <div className="flex items-center gap-0.5">
              {group.tools.map((tool) => (
                <ToolButton
                  key={tool.id}
                  tool={tool}
                  active={toolState.activeTool === tool.id}
                  onClick={() => onToolChange(tool.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tool button ──────────────────────────────────────────────────
function ToolButton({ tool, active, onClick }: { tool: CadToolDef; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ""}`}
      className={`group relative flex items-center justify-center w-8 h-8 rounded transition-all ${
        active
          ? "bg-purple-500/30 text-purple-100 ring-1 ring-purple-400/40 shadow-[0_0_8px_rgba(168,85,247,0.25)]"
          : "text-gray-400 hover:text-white hover:bg-white/8"
      }`}
    >
      <span className="text-sm">{getToolEmoji(tool.icon)}</span>

      {/* Tooltip */}
      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 text-[10px] text-gray-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {tool.label}
        {tool.shortcut && <span className="ml-1 text-gray-500">({tool.shortcut})</span>}
      </span>
    </button>
  );
}

// ── Toggle pill ──────────────────────────────────────────────────
function TogglePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider transition border ${
        active
          ? "bg-purple-500/20 text-purple-200 border-purple-400/25"
          : "text-gray-500 border-white/8 hover:text-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

// ── Icon fallback ────────────────────────────────────────────────
function getToolEmoji(iconName: string): string {
  const map: Record<string, string> = {
    MousePointer: "🖱",
    Minus: "━",
    Square: "▢",
    Circle: "○",
    RotateCcw: "↺",
    Spline: "〰",
    CopyPlus: "⊕",
    Scissors: "✂",
    ArrowRight: "→",
    CornerDownRight: "⌐",
    FlipHorizontal: "⇋",
    Move: "✥",
    RotateCw: "↻",
    Maximize: "⤢",
    AlignCenter: "☰",
    LayoutGrid: "⊞",
    Split: "⫽",
    PlusSquare: "⊞",
    Maximize2: "⤡",
    Merge: "⊎",
    SplitSquare: "⊟",
    Tag: "🏷",
    Columns3: "⫼",
    RectangleHorizontal: "▬",
    DoorOpen: "🚪",
    AppWindow: "⊡",
    Ruler: "📏",
    TriangleRight: "◺",
    Target: "◎",
    Type: "T",
    CornerRightDown: "↳",
    Scan: "⊡",
    Pin: "📌",
    ArrowRightLeft: "↔",
    ArrowUpDown: "↕",
    CornerUpRight: "⌐",
    Equal: "═",
    ChevronsLeftRight: "⟺",
    Symmetry: "⟡",
    ScanSearch: "🔍",
    Hand: "✋",
    Orbit: "🌐",
    ScissorsLineDashed: "✂",
    Unfold: "⊞",
    Box: "◻",
    Cylinder: "⬭",
    Globe: "●",
    Triangle: "△",
    ArrowUp: "⬆",
    RefreshCw: "⟳",
    BoxSelect: "▣",
    Combine: "⊕",
    MinusSquare: "⊖",
    Intersection: "∩",
  };
  return map[iconName] ?? "•";
}

// ── History Timeline ─────────────────────────────────────────────
type HistoryTimelineProps = {
  entries: CadHistoryEntry[];
  currentIndex: number;
  onJumpTo: (index: number) => void;
};

export function HistoryTimeline({ entries, currentIndex, onJumpTo }: HistoryTimelineProps) {
  if (entries.length === 0) return null;

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-t border-white/5 bg-[#0a0b10]/90 overflow-x-auto scrollbar-none">
      <span className="text-[9px] uppercase tracking-wider text-gray-600 mr-2 shrink-0">Timeline</span>
      {entries.map((entry, i) => (
        <button
          key={entry.id}
          onClick={() => onJumpTo(i)}
          className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[10px] transition border ${
            i === currentIndex
              ? "bg-purple-500/25 text-purple-200 border-purple-400/30"
              : i < currentIndex
              ? "text-gray-400 border-white/5 hover:bg-white/5"
              : "text-gray-600 border-white/5 opacity-50"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${i === currentIndex ? "bg-purple-400" : i < currentIndex ? "bg-gray-500" : "bg-gray-700"}`} />
          {entry.label}
        </button>
      ))}
    </div>
  );
}

export { DEFAULT_CAD_STATE };
