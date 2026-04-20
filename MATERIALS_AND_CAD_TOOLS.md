# ArchGPT - Materials & CAD Tools Guide

## Overview

ArchGPT now includes a comprehensive **Materials Library** with 30+ realistic building materials and **CAD Tools** for full object manipulation with an interactive UI panel.

---

## 📦 Materials Library

### Available Materials (30+ types)

#### **Wood Materials** (Realistic finishes)

- **Oak** - Light natural oak wood
- **Walnut** - Dark rich walnut wood  
- **Pine** - Light pine wood
- **Mahogany** - Red-brown mahogany wood

#### **Brick & Stone** (Varied textures)

- **Red Brick** - Traditional red clay brick
- **White Brick** - White painted brick
- **Brown Brick** - Brown load-bearing brick
- **Marble** - Polished white marble
- **Granite** - Gray polished granite
- **Limestone** - Cream-colored limestone
- **Slate** - Dark gray slate stone

#### **Concrete** (Modern finishes)

- **Concrete** - Standard gray concrete
- **Light Concrete** - Light gray concrete
- **Polished Concrete** - Polished concrete floor

#### **Metal** (Industrial materials)

- **Steel** - Brushed steel
- **Stainless Steel** - Polished stainless steel
- **Copper** - Brushed copper
- **Aluminum** - Anodized aluminum
- **Brass** - Brushed brass

#### **Glass** (Transparency options)

- **Clear Glass** - Clear transparent glass
- **Frosted Glass** - Frosted/translucent glass
- **Tinted Glass** - Blue-tinted glass

#### **Paint & Plaster** (Wall finishes)

- **White Paint** - Matte white paint
- **Gray Paint** - Medium gray paint
- **Beige Paint** - Warm beige paint
- **Black Paint** - Matte black paint
- **Red Paint** - Bright red paint
- **Blue Paint** - Medium blue paint
- **Plaster** - White plaster finish
- **Cement** - Raw cement finish

#### **Ceramic** (Tile options)

- **Ceramic Tile** - Glazed ceramic tile
- **White Tile** - White glazed tile
- **Terracotta** - Natural terracotta

#### **Roofing Materials**

- **Asphalt Shingles** - Dark asphalt roof shingles
- **Metal Roof** - Standing seam metal roof
- **Tile Roof** - Red clay tile roof

### Using Materials in DSL

```dsl
// Create a wall
create Wall {
    width: 5,
    height: 3,
    depth: 0.2,
    position: [0, 0, 0]
}

// Apply material
applyMaterial {
    material: "oak"
}
```

---

## 🛠️ CAD Tools

### Transform Operations

#### **Move** - Translate objects in 3D space

```dsl
move Wall to 2, 0, 0
```

Parameters: objectId, x, y, z coordinates

#### **Rotate** - Rotate objects around axes (in degrees)

```dsl
rotate Wall by 0, 0, 45
```

Parameters: objectId, x, y, z rotation angles

#### **Scale** - Resize objects uniformly or per-axis

```dsl
scale Wall to 1.5
scale Beam to 1, 2, 0.5
```

Parameters: objectId, x [, y, z] scaling factors

#### **Mirror** - Flip objects across an axis

```dsl
mirror Wall x
mirror Beam y
```

Parameters: objectId, axis (x|y|z)

#### **Duplicate** - Create copies of objects

```dsl
duplicate Wall
```

Automatically offsets the duplicate by 1 unit

#### **Delete** - Remove objects from scene

```dsl
delete Wall
```

### Selection & Grouping

#### **Select** - Choose objects for manipulation

UI: Click objects in 3D view to select them

#### **Group** - Organize objects together

```dsl
group [Wall1, Wall2, Wall3] as exterior_walls
```

#### **Ungroup** - Separate grouped objects

```dsl
ungroup exterior_walls
```

### Advanced Operations

#### **Union** - Combine objects

```dsl
union Box1, Box2
```

Creates a new composite object

#### **Subtract** - Boolean subtraction

```dsl
subtract Base, CutOut
```

Subtracts one object from another

#### **Align** - Line objects up

```dsl
align [Column1, Column2, Column3] center
```

Options: left, right, top, bottom, center

### Visibility & Locking

#### **Hide/Show** - Toggle visibility

UI: Right-click object → Hide/Show

#### **Lock** - Prevent accidental editing

UI: Lock icon in properties panel
Prevents move, rotate, scale operations

### History Management

#### **Undo** (Ctrl+Z)

Reverts the last action

#### **Redo** (Ctrl+Y)  

Restores the last undone action

Supports up to 100 actions in history

---

## 🎨 CAD Tools UI Panel

Located on the right side of the 3D viewport:

### Sections

#### **Scene**

- Reset Camera - Returns view to default angle
- Debug Layer - Toggle Babylon.js debug tools

#### **Transform**

- Move inputs (X, Y, Z) with numeric entry
- Rotate inputs (degrees) with numeric entry
- Scale slider (0.1x to 3x)
- Apply buttons for each operation

#### **Materials**

- Dropdown menu with all 30+ materials
- Organized by category (Wood, Stone, Metal, etc.)
- Real-time material preview

#### **Operations**

- Duplicate selected object
- Delete selected object
- Mirror on X, Y, or Z axis

#### **Physics**

- Start/Stop earthquake simulation
- Intensity slider (0.1 to 2.0)

#### **Info Display**

- Real-time feedback on operations
- Selected object name
- Current transformation values

---

## 📝 Examples

### Example 1: Modern House with Materials

```dsl
create house {
    width: 10,
    height: 6,
    depth: 12
}
applyMaterial { material: "oak" }

create Foundation {
    width: 10.6,
    height: 0.5,
    depth: 12.6,
    position: [0, -0.5, 0]
}
applyMaterial { material: "concrete" }

create Window {
    width: 1.5,
    height: 1.2,
    depth: 0.1,
    position: [2, 3, 6]
}
applyMaterial { material: "clearGlass" }
```

### Example 2: Building with Transformations

```dsl
create Wall {
    width: 5,
    height: 3,
    depth: 0.2
}
applyMaterial { material: "redBrick" }

// Move to right side
move Wall to 3, 0, 0

// Create a row of columns
create Column {
    width: 0.4,
    height: 4,
    depth: 0.4,
    position: [0, 0, 0]
}
applyMaterial { material: "steel" }

// Duplicate and arrange
duplicate Column
move Column to 2, 0, 0

duplicate Column
move Column to 4, 0, 0

duplicate Column
move Column to 6, 0, 0
```

### Example 3: Complex Structure with Boolean Operations

```dsl
// Base structure
create Box {
    width: 5,
    height: 3,
    depth: 4
}
applyMaterial { material: "marble" }

// Create hole by subtracting another shape
create Box {
    width: 2,
    height: 2,
    depth: 5,
    position: [1.5, 0.5, 0]
}

subtract Box1, Box2

// Mirror for symmetry
mirror Box1 y
```

---

## ⚙️ Properties Reference

### Material Properties

Each material has these properties:

```typescript
interface MaterialDefinition {
    name: string;
    color: [r, g, b];              // RGB 0-1
    emissiveColor?: [r, g, b];     // Self-illumination
    specularColor?: [r, g, b];     // Shine highlight color
    roughness?: number;             // 0-1 (higher = less glossy)
    metallic?: number;              // 0-1 (metallic effect)
    reflectionIntensity?: number;   // 0-1 (reflection strength)
    transparency?: number;          // 0-1 (0 = opaque)
}
```

### Transform Properties

```typescript
interface Transform {
    position?: [x, y, z];          // World coordinates
    rotation?: [x, y, z];          // Degrees around each axis
    scale?: [x, y, z];             // Scaling factors
}
```

---

## 🎮 Keyboard Shortcuts

| Shortcut | Action |
| ---------- | -------- |
| Click | Select object |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Delete | Delete selected (when input focused) |
| Scroll | Zoom camera |
| Middle-click drag | Pan camera |
| Right-click drag | Rotate camera |

---

## 📊 Object Types Supported

- **Wall** - 3D wall/box primitive
- **Prism** - Triangular prism shape
- **House** - Complete house structure
- **Door** - Door frame object
- **Window** - Window frame object
- **Roof** - Roof structure
- **Foundation** - Building foundation
- **Beam** - Structural beam
- **Column** - Structural column
- **Floor** - Floor slab

---

## 🔧 Advanced Usage

### Creating Custom Material Combinations

```dsl
create Wall { width: 5, height: 3, depth: 0.2 }
applyMaterial { material: "whiteBrick" }

create Trim { width: 5, height: 0.2, depth: 0.2, position: [0, 1.5, 0] }
applyMaterial { material: "brass" }
```

### Procedural Pattern Generation

```dsl
// Create a grid of columns
create Column { width: 0.5, height: 4, depth: 0.5, position: [0, 0, 0] }
applyMaterial { material: "steel" }

// Repeat pattern
duplicate Column
move Column to 2, 0, 0
duplicate Column
move Column to 4, 0, 0
duplicate Column
move Column to 6, 0, 0
duplicate Column
move Column to 8, 0, 0
```

### Physics-Enabled Structures

```dsl
create house { width: 10, height: 6, depth: 12 }

physics {
    mass: 1,
    restitution: 0.2,
    friction: 0.4
}

simulate earthquake {
    duration: 10000,
    amplitude: 0.5,
    frequency: 2
}
```

---

## 📚 File Structure

- **materials.ts** - Material library (30+ definitions)
- **cadTools.ts** - CAD operations (transform, boolean, etc.)
- **parser.ts** - Enhanced DSL parser with command support
- **examples/advanced-materials.dsl** - Materials showcase
- **examples/cad-operations.dsl** - Transform operations showcase
- **index.html** - Interactive CAD UI panel

---

## ✨ Features Summary

✅ 30+ realistic building materials  
✅ Full 3D transformation (move, rotate, scale, mirror)  
✅ Boolean operations (union, subtract)  
✅ Object selection & grouping  
✅ Undo/redo history (100 states)  
✅ Interactive UI panel  
✅ Material preview in real-time  
✅ Physics simulation support  
✅ Complete DSL syntax support  
✅ Professional CAD workflow

---

## 🚀 Getting Started

1. Run `npm start` to start the HTTP server
2. Open <http://localhost:8080> in your browser
3. Click objects in the 3D view to select them
4. Use the CAD Tools panel on the right to manipulate
5. Select materials from the dropdown
6. View your changes in real-time

Enjoy building with ArchGPT! 🏗️
