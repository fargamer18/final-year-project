// ── Tool definitions for Fusion 360–style CAD workspace ──────────

export type CadToolMode = "2d" | "3d";

export type CadToolId =
  // Sketch (2D)
  | "line" | "rectangle" | "circle" | "arc" | "spline" | "offset" | "trim" | "extend" | "fillet" | "mirror"
  // Modify
  | "move" | "rotate" | "scale" | "align" | "array" | "split"
  // Room
  | "addRoom" | "resizeRoom" | "mergeRooms" | "splitRoom" | "changeRoomType"
  // Structure
  | "addColumn" | "addBeam" | "addWall" | "addDoor" | "addWindow"
  // Annotate
  | "dimLinear" | "dimAngular" | "dimRadial" | "text" | "leader" | "areaLabel"
  // Constraints
  | "fix" | "horizontal" | "vertical" | "perpendicular" | "parallel" | "equal" | "symmetric"
  // View
  | "zoomFit" | "pan" | "orbit" | "sectionCut" | "explodedView" | "wireframeSolid"
  // 3D Create
  | "box" | "cylinder" | "sphere" | "cone" | "extrude" | "revolve"
  // 3D Modify
  | "shell" | "union" | "subtract" | "intersect"
  // Select
  | "select";

export type CadToolPhase = "idle" | "picking" | "dragging" | "confirming";
export type CadCursor = "default" | "crosshair" | "move" | "grab" | "pointer" | "cell" | "not-allowed";

export type CadToolDef = {
  id: CadToolId;
  label: string;
  icon: string;         // Lucide icon name or emoji fallback
  shortcut?: string;    // e.g. "L" for line, "R" for rectangle
  mode: CadToolMode;    // "2d" or "3d"
  cursor: CadCursor;
  group: string;
};

export type CadToolGroup = {
  id: string;
  label: string;
  mode: CadToolMode;
  tools: CadToolDef[];
};

export type CadToolState = {
  activeTool: CadToolId | null;
  toolPhase: CadToolPhase;
  cursor: CadCursor;
  snapEnabled: boolean;
  gridVisible: boolean;
  snapGridSizeFt: number;
  constraintsVisible: boolean;
  dimensionsVisible: boolean;
  mode: CadToolMode;
};

export type CadSelection = {
  type: "room" | "wall" | "column" | "beam" | "door" | "window" | "annotation";
  id: string;
  floorIndex: number;
};

export type CadHistoryEntry = {
  id: number;
  label: string;
  timestamp: number;
  snapshot: string; // JSON-serialized state
};

// ── Default state ────────────────────────────────────────────────
export const DEFAULT_CAD_STATE: CadToolState = {
  activeTool: "select",
  toolPhase: "idle",
  cursor: "default",
  snapEnabled: true,
  gridVisible: true,
  snapGridSizeFt: 1,
  constraintsVisible: true,
  dimensionsVisible: true,
  mode: "2d",
};

// ── Tool registry ────────────────────────────────────────────────
function t(id: CadToolId, label: string, icon: string, mode: CadToolMode, cursor: CadCursor, group: string, shortcut?: string): CadToolDef {
  return { id, label, icon, mode, cursor, group, shortcut };
}

export const CAD_TOOL_REGISTRY: CadToolDef[] = [
  // Select
  t("select", "Select", "MousePointer", "2d", "pointer", "select", "V"),

  // Sketch (2D)
  t("line", "Line", "Minus", "2d", "crosshair", "sketch", "L"),
  t("rectangle", "Rectangle", "Square", "2d", "crosshair", "sketch", "R"),
  t("circle", "Circle", "Circle", "2d", "crosshair", "sketch", "C"),
  t("arc", "Arc", "RotateCcw", "2d", "crosshair", "sketch"),
  t("spline", "Spline", "Spline", "2d", "crosshair", "sketch"),
  t("offset", "Offset", "CopyPlus", "2d", "crosshair", "sketch", "O"),
  t("trim", "Trim", "Scissors", "2d", "crosshair", "sketch", "T"),
  t("extend", "Extend", "ArrowRight", "2d", "crosshair", "sketch"),
  t("fillet", "Fillet", "CornerDownRight", "2d", "crosshair", "sketch"),
  t("mirror", "Mirror", "FlipHorizontal", "2d", "crosshair", "sketch"),

  // Modify
  t("move", "Move", "Move", "2d", "move", "modify", "M"),
  t("rotate", "Rotate", "RotateCw", "2d", "grab", "modify"),
  t("scale", "Scale", "Maximize", "2d", "grab", "modify", "S"),
  t("align", "Align", "AlignCenter", "2d", "pointer", "modify"),
  t("array", "Array", "LayoutGrid", "2d", "crosshair", "modify"),
  t("split", "Split", "Split", "2d", "crosshair", "modify"),

  // Room
  t("addRoom", "Add Room", "PlusSquare", "2d", "cell", "room"),
  t("resizeRoom", "Resize Room", "Maximize2", "2d", "grab", "room"),
  t("mergeRooms", "Merge Rooms", "Merge", "2d", "pointer", "room"),
  t("splitRoom", "Split Room", "SplitSquare", "2d", "crosshair", "room"),
  t("changeRoomType", "Change Type", "Tag", "2d", "pointer", "room"),

  // Structure
  t("addColumn", "Column", "Columns3", "2d", "crosshair", "structure"),
  t("addBeam", "Beam", "Minus", "2d", "crosshair", "structure"),
  t("addWall", "Wall", "RectangleHorizontal", "2d", "crosshair", "structure", "W"),
  t("addDoor", "Door", "DoorOpen", "2d", "crosshair", "structure", "D"),
  t("addWindow", "Window", "AppWindow", "2d", "crosshair", "structure"),

  // Annotate
  t("dimLinear", "Linear Dim", "Ruler", "2d", "crosshair", "annotate"),
  t("dimAngular", "Angular Dim", "TriangleRight", "2d", "crosshair", "annotate"),
  t("dimRadial", "Radial Dim", "Target", "2d", "crosshair", "annotate"),
  t("text", "Text", "Type", "2d", "crosshair", "annotate"),
  t("leader", "Leader", "CornerRightDown", "2d", "crosshair", "annotate"),
  t("areaLabel", "Area Label", "Scan", "2d", "crosshair", "annotate"),

  // Constraints
  t("fix", "Fix", "Pin", "2d", "pointer", "constraints"),
  t("horizontal", "Horizontal", "ArrowRightLeft", "2d", "pointer", "constraints"),
  t("vertical", "Vertical", "ArrowUpDown", "2d", "pointer", "constraints"),
  t("perpendicular", "Perpendicular", "CornerUpRight", "2d", "pointer", "constraints"),
  t("parallel", "Parallel", "Equal", "2d", "pointer", "constraints"),
  t("equal", "Equal", "ChevronsLeftRight", "2d", "pointer", "constraints"),
  t("symmetric", "Symmetric", "Symmetry", "2d", "pointer", "constraints"),

  // View
  t("zoomFit", "Zoom Fit", "ScanSearch", "2d", "default", "view", "F"),
  t("pan", "Pan", "Hand", "2d", "grab", "view"),
  t("orbit", "Orbit", "Orbit", "3d", "grab", "view"),
  t("sectionCut", "Section Cut", "ScissorsLineDashed", "3d", "crosshair", "view"),
  t("explodedView", "Exploded", "Unfold", "3d", "pointer", "view"),
  t("wireframeSolid", "Wireframe", "Box", "3d", "pointer", "view"),

  // 3D Create
  t("box", "Box", "Box", "3d", "crosshair", "3d-create"),
  t("cylinder", "Cylinder", "Cylinder", "3d", "crosshair", "3d-create"),
  t("sphere", "Sphere", "Globe", "3d", "crosshair", "3d-create"),
  t("cone", "Cone", "Triangle", "3d", "crosshair", "3d-create"),
  t("extrude", "Extrude", "ArrowUp", "3d", "crosshair", "3d-create"),
  t("revolve", "Revolve", "RefreshCw", "3d", "crosshair", "3d-create"),

  // 3D Modify
  t("shell", "Shell", "BoxSelect", "3d", "pointer", "3d-modify"),
  t("union", "Union", "Combine", "3d", "pointer", "3d-modify"),
  t("subtract", "Subtract", "MinusSquare", "3d", "pointer", "3d-modify"),
  t("intersect", "Intersect", "Intersection", "3d", "pointer", "3d-modify"),
];

// ── Group tools by tab ───────────────────────────────────────────
export function getToolGroups(mode: CadToolMode): CadToolGroup[] {
  const groupMap = new Map<string, CadToolGroup>();
  const labels: Record<string, string> = {
    select: "Select",
    sketch: "Sketch",
    modify: "Modify",
    room: "Room",
    structure: "Structure",
    annotate: "Annotate",
    constraints: "Constraints",
    view: "View",
    "3d-create": "3D Create",
    "3d-modify": "3D Modify",
  };

  for (const tool of CAD_TOOL_REGISTRY) {
    if (tool.mode !== mode && tool.group !== "view") continue;
    let group = groupMap.get(tool.group);
    if (!group) {
      group = { id: tool.group, label: labels[tool.group] ?? tool.group, mode, tools: [] };
      groupMap.set(tool.group, group);
    }
    group.tools.push(tool);
  }

  return Array.from(groupMap.values());
}

export function getToolDef(id: CadToolId): CadToolDef | undefined {
  return CAD_TOOL_REGISTRY.find((t) => t.id === id);
}
