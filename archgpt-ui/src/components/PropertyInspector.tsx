"use client";

import { type CadSelection } from "../lib/cadTools";
import { type RoomBlueprint, type RoomCategory } from "../lib/houseBlueprints";

type PropertyInspectorProps = {
  selection: CadSelection | null;
  room: RoomBlueprint | null;
  onPropertyChange: (key: string, value: string | number | boolean) => void;
};

const ROOM_CATEGORIES: RoomCategory[] = [
  "LIVING", "DINING", "KITCHEN", "BEDROOM", "WET AREA",
  "PARKING", "SERVICE", "OPEN TO SKY", "SIT OUT",
  "ENTERTAINMENT", "CIRCULATION", "RETAIL", "OFFICE", "SPACE",
];

export function PropertyInspector({ selection, room, onPropertyChange }: PropertyInspectorProps) {
  if (!selection || !room) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3">
          <span className="text-lg">🏠</span>
        </div>
        <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">No Selection</p>
        <p className="text-[10px] text-gray-600">Click a room or element to inspect its properties.</p>
      </div>
    );
  }

  const area = room.widthFt * room.depthFt;

  return (
    <div className="flex flex-col gap-3 px-3 py-3 overflow-y-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 pb-2 border-b border-white/8">
        <div className="w-2 h-2 rounded-full bg-purple-400" />
        <span className="text-sm font-semibold text-white capitalize">{room.name}</span>
      </div>

      {/* ── Dimensions ── */}
      <SectionLabel>Dimensions</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <PropField label="Width" value={room.widthFt} unit="ft" onChange={(v) => onPropertyChange("widthFt", v)} />
        <PropField label="Depth" value={room.depthFt} unit="ft" onChange={(v) => onPropertyChange("depthFt", v)} />
        <PropField label="Height" value={room.heightFt} unit="ft" onChange={(v) => onPropertyChange("heightFt", v)} />
        <PropReadonly label="Area" value={`${area} sq ft`} />
      </div>

      {/* ── Category ── */}
      <SectionLabel>Type</SectionLabel>
      <select
        value={room.category}
        onChange={(e) => onPropertyChange("category", e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-purple-400/40"
      >
        {ROOM_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      {/* ── Constraints ── */}
      <SectionLabel>Constraints</SectionLabel>
      <div className="flex flex-col gap-1.5">
        <ConstraintToggle
          label="Must face road"
          checked={room.mustFaceRoad ?? false}
          onChange={(v) => onPropertyChange("mustFaceRoad", v)}
        />
        <ConstraintToggle
          label="Requires plumbing"
          checked={room.requiresPlumbing ?? false}
          onChange={(v) => onPropertyChange("requiresPlumbing", v)}
        />
        <ConstraintToggle
          label="Requires ventilation"
          checked={room.requiresVentilation ?? false}
          onChange={(v) => onPropertyChange("requiresVentilation", v)}
        />
      </div>

      {/* ── Adjacency ── */}
      {room.adjacentTo && room.adjacentTo.length > 0 && (
        <>
          <SectionLabel>Adjacent to</SectionLabel>
          <div className="flex flex-wrap gap-1">
            {room.adjacentTo.map((adj) => (
              <span
                key={adj}
                className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-400/15 text-[10px] text-purple-200"
              >
                {adj}
              </span>
            ))}
          </div>
        </>
      )}

      {/* ── Material ── */}
      <SectionLabel>Material</SectionLabel>
      <input
        type="text"
        value={room.materialPreset ?? "default"}
        onChange={(e) => onPropertyChange("materialPreset", e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-purple-400/40"
      />

      {/* ── Min dimensions ── */}
      <SectionLabel>Minimum Dimensions</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <PropReadonly label="Min W" value={`${room.minWidthFt} ft`} />
        <PropReadonly label="Min D" value={`${room.minDepthFt} ft`} />
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-[0.18em] text-gray-500 mt-1">{children}</p>
  );
}

function PropField({ label, value, unit, onChange }: { label: string; value: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[9px] text-gray-500">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-purple-400/40"
        />
        <span className="text-[9px] text-gray-600 shrink-0">{unit}</span>
      </div>
    </div>
  );
}

function PropReadonly({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[9px] text-gray-500">{label}</label>
      <span className="px-2 py-1 text-xs text-gray-300 bg-white/3 rounded border border-white/5">{value}</span>
    </div>
  );
}

function ConstraintToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={`w-4 h-4 rounded border flex items-center justify-center transition ${
          checked
            ? "bg-purple-500/30 border-purple-400/40 text-purple-200"
            : "border-white/15 text-transparent hover:border-white/25"
        }`}
      >
        {checked && <span className="text-[10px]">✓</span>}
      </div>
      <span className="text-[11px] text-gray-400 group-hover:text-gray-200 transition">{label}</span>
    </label>
  );
}
