"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CadToolState, CadSelection } from "../lib/cadTools";
import type { RoomBlueprint } from "../lib/houseBlueprints";

// ── Types ────────────────────────────────────────────────────────
export type CanvasRoom = {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floorIndex: number;
  blueprint: RoomBlueprint;
};

type DragState = {
  roomId: string;
  offsetX: number;
  offsetY: number;
  mode: "move" | "resize-se" | "resize-e" | "resize-s";
};

type FloorPlanCanvasProps = {
  rooms: CanvasRoom[];
  toolState: CadToolState;
  selection: CadSelection | null;
  onSelectRoom: (sel: CadSelection | null) => void;
  onRoomMove: (roomId: string, x: number, y: number) => void;
  onRoomResize: (roomId: string, width: number, height: number) => void;
  plotWidthFt?: number;
  plotDepthFt?: number;
};

// ── Constants ────────────────────────────────────────────────────
const SCALE = 8;                    // 1 ft = 8 px
const PAD = 40;                     // canvas padding
const HANDLE_SIZE = 7;              // resize handle size
const GRID_COLOR = "rgba(168,85,247,0.07)";
const GRID_COLOR_MAJOR = "rgba(168,85,247,0.14)";
const ROOM_FILL = "rgba(109,40,217,0.12)";
const ROOM_FILL_HOVER = "rgba(109,40,217,0.22)";
const ROOM_FILL_SELECTED = "rgba(168,85,247,0.28)";
const ROOM_STROKE = "rgba(168,85,247,0.45)";
const ROOM_STROKE_SELECTED = "rgba(168,85,247,0.85)";
const DIM_COLOR = "rgba(248,235,255,0.75)";
const SNAP_COLOR = "rgba(168,85,247,0.6)";
const BG_COLOR = "#080a11";

// ── Category colors ──────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  LIVING: "rgba(109,40,217,0.18)",
  DINING: "rgba(168,85,247,0.15)",
  KITCHEN: "rgba(236,72,153,0.15)",
  BEDROOM: "rgba(59,130,246,0.15)",
  "WET AREA": "rgba(34,211,238,0.15)",
  PARKING: "rgba(100,100,100,0.15)",
  SERVICE: "rgba(156,163,175,0.12)",
  "OPEN TO SKY": "rgba(74,222,128,0.12)",
  "SIT OUT": "rgba(251,191,36,0.12)",
  ENTERTAINMENT: "rgba(244,114,182,0.15)",
  CIRCULATION: "rgba(148,163,184,0.10)",
};

// ── Helpers ──────────────────────────────────────────────────────
function snapToGrid(val: number, gridSize: number): number {
  return Math.round(val / gridSize) * gridSize;
}

function isInsideRoom(mx: number, my: number, r: CanvasRoom): boolean {
  const rx = PAD + r.x * SCALE;
  const ry = PAD + r.y * SCALE;
  const rw = r.width * SCALE;
  const rh = r.height * SCALE;
  return mx >= rx && mx <= rx + rw && my >= ry && my <= ry + rh;
}

function isOnResizeHandle(mx: number, my: number, r: CanvasRoom): "resize-se" | "resize-e" | "resize-s" | null {
  const rx = PAD + r.x * SCALE;
  const ry = PAD + r.y * SCALE;
  const rw = r.width * SCALE;
  const rh = r.height * SCALE;
  const hs = HANDLE_SIZE;

  // SE corner
  if (mx >= rx + rw - hs && mx <= rx + rw + hs && my >= ry + rh - hs && my <= ry + rh + hs) return "resize-se";
  // E edge center
  if (mx >= rx + rw - hs && mx <= rx + rw + hs && my >= ry + rh / 2 - hs && my <= ry + rh / 2 + hs) return "resize-e";
  // S edge center
  if (mx >= rx + rw / 2 - hs && mx <= rx + rw / 2 + hs && my >= ry + rh - hs && my <= ry + rh + hs) return "resize-s";

  return null;
}

// ── Component ────────────────────────────────────────────────────
export function FloorPlanCanvas({
  rooms,
  toolState,
  selection,
  onSelectRoom,
  onRoomMove,
  onRoomResize,
  plotWidthFt,
  plotDepthFt,
}: FloorPlanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const roomsRef = useRef(rooms);
  roomsRef.current = rooms;

  // Compute canvas size
  const maxX = Math.max(plotWidthFt ?? 60, ...rooms.map((r) => r.x + r.width)) + 4;
  const maxY = Math.max(plotDepthFt ?? 40, ...rooms.map((r) => r.y + r.height)) + 4;
  const canvasW = maxX * SCALE + PAD * 2;
  const canvasH = maxY * SCALE + PAD * 2;

  // ── Drawing ──────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Grid
    if (toolState.gridVisible) {
      const gridFt = toolState.snapGridSizeFt;
      for (let gx = 0; gx <= maxX; gx += gridFt) {
        const px = PAD + gx * SCALE;
        ctx.strokeStyle = gx % 5 === 0 ? GRID_COLOR_MAJOR : GRID_COLOR;
        ctx.lineWidth = gx % 5 === 0 ? 0.8 : 0.4;
        ctx.beginPath();
        ctx.moveTo(px, PAD);
        ctx.lineTo(px, PAD + maxY * SCALE);
        ctx.stroke();
      }
      for (let gy = 0; gy <= maxY; gy += gridFt) {
        const py = PAD + gy * SCALE;
        ctx.strokeStyle = gy % 5 === 0 ? GRID_COLOR_MAJOR : GRID_COLOR;
        ctx.lineWidth = gy % 5 === 0 ? 0.8 : 0.4;
        ctx.beginPath();
        ctx.moveTo(PAD, py);
        ctx.lineTo(PAD + maxX * SCALE, py);
        ctx.stroke();
      }
    }

    // Plot boundary
    if (plotWidthFt && plotDepthFt) {
      ctx.strokeStyle = "rgba(168,85,247,0.3)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(PAD, PAD, plotWidthFt * SCALE, plotDepthFt * SCALE);
      ctx.setLineDash([]);
      // Plot label
      ctx.fillStyle = "rgba(168,85,247,0.4)";
      ctx.font = "10px sans-serif";
      ctx.fillText(`${plotWidthFt}' × ${plotDepthFt}' plot`, PAD + 4, PAD - 6);
    }

    // Rooms
    const currentRooms = roomsRef.current;
    for (const room of currentRooms) {
      const rx = PAD + room.x * SCALE;
      const ry = PAD + room.y * SCALE;
      const rw = room.width * SCALE;
      const rh = room.height * SCALE;
      const isSelected = selection?.id === room.id;
      const isHovered = hoveredRoom === room.id;

      // Fill
      ctx.fillStyle = isSelected ? ROOM_FILL_SELECTED : isHovered ? ROOM_FILL_HOVER : (CATEGORY_COLORS[room.category] || ROOM_FILL);
      ctx.fillRect(rx, ry, rw, rh);

      // Stroke
      ctx.strokeStyle = isSelected ? ROOM_STROKE_SELECTED : ROOM_STROKE;
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(rx, ry, rw, rh);

      // Room name
      ctx.fillStyle = isSelected ? "rgba(248,235,255,0.95)" : "rgba(248,235,255,0.65)";
      ctx.font = `${isSelected ? "600" : "400"} 11px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = room.name.length > 18 ? room.name.slice(0, 16) + "…" : room.name;
      ctx.fillText(label, rx + rw / 2, ry + rh / 2 - 7);

      // Area label
      const area = room.blueprint.widthFt * room.blueprint.depthFt;
      ctx.fillStyle = "rgba(168,85,247,0.45)";
      ctx.font = "9px sans-serif";
      ctx.fillText(`${area} sq ft`, rx + rw / 2, ry + rh / 2 + 7);

      // Category tag
      ctx.fillStyle = "rgba(156,163,175,0.35)";
      ctx.font = "8px sans-serif";
      ctx.fillText(room.category, rx + rw / 2, ry + rh / 2 + 19);

      // Resize handles (when selected)
      if (isSelected) {
        const drawHandle = (hx: number, hy: number) => {
          ctx.fillStyle = "rgba(168,85,247,0.9)";
          ctx.fillRect(hx - HANDLE_SIZE / 2, hy - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1;
          ctx.strokeRect(hx - HANDLE_SIZE / 2, hy - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
        };
        drawHandle(rx + rw, ry + rh);           // SE
        drawHandle(rx + rw, ry + rh / 2);       // E
        drawHandle(rx + rw / 2, ry + rh);       // S
      }

      // Dimension labels (when selected or hovered)
      if (toolState.dimensionsVisible && (isSelected || isHovered)) {
        ctx.fillStyle = DIM_COLOR;
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        // Width (top)
        ctx.fillText(`${room.blueprint.widthFt}'`, rx + rw / 2, ry - 6);
        // Depth (right)
        ctx.save();
        ctx.translate(rx + rw + 12, ry + rh / 2);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(`${room.blueprint.depthFt}'`, 0, 0);
        ctx.restore();
      }
    }

    // Snap guides during drag
    if (dragState && mousePos && toolState.snapEnabled) {
      const dragged = currentRooms.find((r) => r.id === dragState.roomId);
      if (dragged) {
        ctx.strokeStyle = SNAP_COLOR;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 3]);
        for (const other of currentRooms) {
          if (other.id === dragged.id) continue;
          // Horizontal alignment
          if (Math.abs(dragged.y - other.y) < 1) {
            const ly = PAD + dragged.y * SCALE;
            ctx.beginPath(); ctx.moveTo(PAD, ly); ctx.lineTo(PAD + maxX * SCALE, ly); ctx.stroke();
          }
          if (Math.abs(dragged.y + dragged.height - (other.y + other.height)) < 1) {
            const ly = PAD + (dragged.y + dragged.height) * SCALE;
            ctx.beginPath(); ctx.moveTo(PAD, ly); ctx.lineTo(PAD + maxX * SCALE, ly); ctx.stroke();
          }
          // Vertical alignment
          if (Math.abs(dragged.x - other.x) < 1) {
            const lx = PAD + dragged.x * SCALE;
            ctx.beginPath(); ctx.moveTo(lx, PAD); ctx.lineTo(lx, PAD + maxY * SCALE); ctx.stroke();
          }
          if (Math.abs(dragged.x + dragged.width - (other.x + other.width)) < 1) {
            const lx = PAD + (dragged.x + dragged.width) * SCALE;
            ctx.beginPath(); ctx.moveTo(lx, PAD); ctx.lineTo(lx, PAD + maxY * SCALE); ctx.stroke();
          }
        }
        ctx.setLineDash([]);
      }
    }

    // Crosshair cursor position
    if (mousePos && toolState.activeTool !== "select") {
      ctx.strokeStyle = "rgba(168,85,247,0.25)";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(mousePos.x, PAD); ctx.lineTo(mousePos.x, PAD + maxY * SCALE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PAD, mousePos.y); ctx.lineTo(PAD + maxX * SCALE, mousePos.y); ctx.stroke();
      ctx.setLineDash([]);

      // Coordinate readout
      const ftX = ((mousePos.x - PAD) / SCALE).toFixed(1);
      const ftY = ((mousePos.y - PAD) / SCALE).toFixed(1);
      ctx.fillStyle = "rgba(168,85,247,0.5)";
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${ftX}', ${ftY}'`, mousePos.x + 10, mousePos.y - 6);
    }

    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }, [rooms, toolState, selection, hoveredRoom, dragState, mousePos, canvasW, canvasH, maxX, maxY, plotWidthFt, plotDepthFt]);

  // Redraw on state change
  useEffect(() => {
    draw();
  }, [draw]);

  // ── Mouse handlers ───────────────────────────────────────────
  const getCanvasPos = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);

    // Check resize handles first (only if something is selected)
    if (selection) {
      const selRoom = rooms.find((r) => r.id === selection.id);
      if (selRoom) {
        const handleType = isOnResizeHandle(pos.x, pos.y, selRoom);
        if (handleType) {
          setDragState({ roomId: selRoom.id, offsetX: pos.x, offsetY: pos.y, mode: handleType });
          return;
        }
      }
    }

    // Check room click
    for (let i = rooms.length - 1; i >= 0; i--) {
      const room = rooms[i];
      if (isInsideRoom(pos.x, pos.y, room)) {
        onSelectRoom({ type: "room", id: room.id, floorIndex: room.floorIndex });
        if (toolState.activeTool === "select" || toolState.activeTool === "move") {
          const rx = PAD + room.x * SCALE;
          const ry = PAD + room.y * SCALE;
          setDragState({ roomId: room.id, offsetX: pos.x - rx, offsetY: pos.y - ry, mode: "move" });
        }
        return;
      }
    }

    onSelectRoom(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    setMousePos(pos);

    if (dragState) {
      const room = rooms.find((r) => r.id === dragState.roomId);
      if (!room) return;

      if (dragState.mode === "move") {
        let newX = (pos.x - dragState.offsetX - PAD) / SCALE;
        let newY = (pos.y - dragState.offsetY - PAD) / SCALE;
        if (toolState.snapEnabled) {
          newX = snapToGrid(newX, toolState.snapGridSizeFt);
          newY = snapToGrid(newY, toolState.snapGridSizeFt);
        }
        onRoomMove(room.id, Math.max(0, newX), Math.max(0, newY));
      } else {
        const rx = PAD + room.x * SCALE;
        const ry = PAD + room.y * SCALE;
        let newW = room.width;
        let newH = room.height;

        if (dragState.mode === "resize-se" || dragState.mode === "resize-e") {
          newW = Math.max(room.blueprint.minWidthFt, (pos.x - rx) / SCALE);
        }
        if (dragState.mode === "resize-se" || dragState.mode === "resize-s") {
          newH = Math.max(room.blueprint.minDepthFt, (pos.y - ry) / SCALE);
        }

        if (toolState.snapEnabled) {
          newW = snapToGrid(newW, toolState.snapGridSizeFt);
          newH = snapToGrid(newH, toolState.snapGridSizeFt);
        }
        onRoomResize(room.id, Math.max(room.blueprint.minWidthFt, newW), Math.max(room.blueprint.minDepthFt, newH));
      }
      return;
    }

    // Hover detection
    let found = false;
    for (let i = rooms.length - 1; i >= 0; i--) {
      if (isInsideRoom(pos.x, pos.y, rooms[i])) {
        setHoveredRoom(rooms[i].id);
        found = true;
        break;
      }
    }
    if (!found) setHoveredRoom(null);
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoveredRoom(null);
    setDragState(null);
  };

  // Cursor style
  let cursor = "default";
  if (dragState) {
    cursor = dragState.mode === "move" ? "grabbing" : dragState.mode === "resize-se" ? "nwse-resize" : dragState.mode === "resize-e" ? "ew-resize" : "ns-resize";
  } else if (hoveredRoom && selection?.id === hoveredRoom) {
    const canvas = canvasRef.current;
    if (canvas && mousePos) {
      const room = rooms.find((r) => r.id === hoveredRoom);
      if (room) {
        const handle = isOnResizeHandle(mousePos.x, mousePos.y, room);
        if (handle === "resize-se") cursor = "nwse-resize";
        else if (handle === "resize-e") cursor = "ew-resize";
        else if (handle === "resize-s") cursor = "ns-resize";
        else cursor = "grab";
      }
    }
  } else if (hoveredRoom) {
    cursor = "pointer";
  } else if (toolState.activeTool !== "select") {
    cursor = "crosshair";
  }

  return (
    <div ref={containerRef} className="relative overflow-auto bg-[#080a11] rounded-xl border border-purple-400/10">
      <canvas
        ref={canvasRef}
        style={{ cursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
