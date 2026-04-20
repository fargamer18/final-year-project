# ArchGPT DSL Documentation

Complete technical documentation for the ArchGPT Domain Specific Language (DSL) for 3D architectural modeling.

---

## Table of Contents

1. [Overview](#overview)
2. [DSL Syntax Reference](#dsl-syntax-reference)
3. [Primitives & Shapes Reference](#primitives--shapes-reference)
4. [Physics System](#physics-system)
5. [Rendering Pipeline](#rendering-pipeline-technical)
6. [Comments](#comments)
7. [Known Limitations & Current State](#known-limitations--current-state)
8. [Examples](#examples)
9. [Glossary](#glossary)

---

## Overview

### What is ArchGPT?

ArchGPT is a Domain Specific Language (DSL) designed for describing and simulating 3D architectural models. It provides a simple, human-readable syntax for defining architectural structures including walls, buildings, and custom shapes, with optional physics simulation and visual rendering.

### What Problem Does It Solve?

Traditional 3D modeling requires complex graphical interfaces or verbose programming code. ArchGPT abstracts away this complexity by providing a lightweight, declarative language that focuses on architectural semantics. You write simple text descriptions of your buildings, and ArchGPT automatically:

- **Parses** your DSL code into an Abstract Syntax Tree (AST)
- **Interprets** the AST into actionable commands
- **Renders** the results as a 3D scene using either BabylonJS or Three.js
- **Simulates** physics, including earthquake scenarios

### The Rendering Pipeline

ArchGPT follows a classic compiler pipeline:

```
DSL Code (.dsl file)
    ↓
Parser (parser.ts)
    ↓
Abstract Syntax Tree (AST)
    ↓
Interpreter (interpreter.ts)
    ↓
Renderer (babylonRenderer.ts or threeRenderer.ts)
    ↓
3D Scene (in browser via BabylonJS or Three.js)
```

**Example journey:**

```dsl
create house {
  width: 8,
  height: 6,
  depth: 10
}
```

1. **Parser** reads this text and extracts `type: "house"` and `properties: {width: 8, height: 6, depth: 10}`
2. **Interpreter** receives the AST node and logs the command for execution
3. **Renderer** creates BabylonJS meshes: 4 walls, a foundation, and a triangular roof
4. **Result**: A 3D house appears in the browser, complete with lighting and optional physics

---

## DSL Syntax Reference

ArchGPT supports two syntax styles for defining shapes: **block syntax** and **command syntax**. Both are valid; they are simply different ways to express the same concepts.

### 2a. Block Syntax (No `create` Keyword)

The block syntax uses simple object-like declarations, suitable for configuration-heavy definitions.

**Pattern:**

```dsl
ShapeName {
  property: value,
  property: value
}
```

**Example:**

```dsl
Wall {
    height: 10,
    width: 5,
    x: 0,
    y: 0
}

Prism {
    height: 15,
    width: 10,
    x: 5,
    y: 5
}
```

**Properties Table for Block Syntax:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `height` | number | Yes (Wall, Prism) | Vertical dimension |
| `width` | number | Yes (Wall, Prism) | Horizontal dimension |
| `depth` | number | No (Prism) | Depth dimension; defaults to 1 |
| `x` | number | Yes (Wall, Prism) | X coordinate in space |
| `y` | number | Yes (Wall, Prism) | Y coordinate in space |
| `z` | number | No (Prism) | Z coordinate in space; defaults to 0 |
| `wallThickness` | number | No (House) | Thickness of walls; defaults to 0.3 |
| `material` | object | No (House) | Material definitions with `walls`, `roof`, `foundation` color strings |

**Complete House Block Example:**

```dsl
House {
    width: 6,
    height: 4,
    depth: 8,
    wallThickness: 0.2,
    material: {
        walls: "white",
        roof: "red",
        foundation: "gray"
    }
}
```

### 2b. Command Syntax (With `create` Keyword)

The command syntax uses the `create` keyword, providing a more imperative feel.

**Pattern:**

```dsl
create ShapeName { property: value, property: value }
```

**Example:**

```dsl
create Wall { height: 10, width: 5 }

create Prism { height: 15, width: 10 }

create house {
    width: 8,
    height: 6,
    depth: 10,
    wallThickness: 0.3,
    position: [0, 0, 0]
}
```

**Properties Table for Command Syntax:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `height` | number | Yes (Wall, Prism) | Vertical dimension |
| `width` | number | Yes (Wall, Prism) | Horizontal dimension |
| `depth` | number | No (Prism) | Depth dimension; defaults to 1 |
| `position` | array `[x, y, z]` | No | Position in 3D space |

**Note:** The command syntax parser currently accepts `Wall` and `Prism` in a strict format. For `house`, the DSL uses a more flexible parser (see [Known Limitations](#known-limitations--current-state)).

### 2c. Physics Block

Define physics properties for objects with mass, restitution (bounce), and friction.

**Pattern:**

```dsl
physics {
    mass: number,
    restitution: number,
    friction: number
}
```

**Properties Table:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `mass` | number | Yes | Object mass in kg. Use 0 for static objects (e.g., ground). |
| `restitution` | number | Yes | Bounciness; 0 = no bounce, 1 = perfectly elastic |
| `friction` | number | Yes | Surface friction; higher = more grip |

**Example:**

```dsl
physics {
    mass: 1,
    restitution: 0.2,
    friction: 0.4
}
```

### 2d. Simulate Block

Enable earthquake simulation with specified parameters.

**Pattern:**

```dsl
simulate earthquake {
    duration: milliseconds,
    amplitude: number,
    frequency: number
}
```

**Properties Table:**

| Property | Type | Required | Range | Description |
|----------|------|----------|-------|-------------|
| `duration` | number | Yes | > 0 | How long the earthquake lasts (milliseconds) |
| `amplitude` | number | Yes | 0–2 | Shake strength; clamped internally to [0, 2] |
| `frequency` | number | Yes | 0.1–5 Hz | Shake speed; clamped internally to [0.1, 5] |

**Example:**

```dsl
simulate earthquake {
    duration: 10000,
    amplitude: 0.5,
    frequency: 2
}
```

---

## Primitives & Shapes Reference

ArchGPT provides several primitive shapes that you can compose to build architectural structures.

### Wall

A rectangular solid representing a structural wall.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `height` | number | Yes | Vertical dimension of the wall |
| `width` | number | Yes | Horizontal (X-axis) dimension |
| `x` | number | Yes | X position in space (block syntax) |
| `y` | number | Yes | Y position in space (block syntax) |
| `depth` | number | No | Depth (Z-axis); auto-calculated by renderer |

**Rendering:** Internally rendered as a rectangular box (BoxGeometry in Three.js, Box in BabylonJS).

**Example (Block Syntax):**

```dsl
Wall {
    height: 10,
    width: 5,
    x: 0,
    y: 0
}
```

**Example (Command Syntax):**

```dsl
create Wall { height: 10, width: 5 }
```

---

### Prism

A 3D rectangular prism (cuboid) with independent length, width, and depth.

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `height` | number | Yes | — | Vertical dimension |
| `width` | number | Yes | — | X-axis dimension |
| `depth` | number | No | 1 | Z-axis dimension |
| `x` | number | Yes | — | X position in space |
| `y` | number | Yes | — | Y position in space |
| `z` | number | No | 0 | Z position in space |

**Rendering:** Rendered as a box with the specified dimensions.

**Example (Block Syntax):**

```dsl
Prism {
    height: 15,
    width: 10,
    depth: 5,
    x: 5,
    y: 5,
    z: 2
}
```

**Example (Command Syntax):**

```dsl
create Prism { height: 15, width: 10, depth: 5, x: 5, y: 5, z: 2 }
```

---

### House

A composite structure consisting of a foundation, four walls, and a triangular prism roof.

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `width` | number | Yes | — | Horizontal (X-axis) size |
| `height` | number | Yes | — | Wall height (roof height is height/2) |
| `depth` | number | Yes | — | Z-axis size |
| `wallThickness` | number | No | 0.3 | Thickness of each wall |
| `material` | object | No | — | Material colors (see below) |
| `position` | array | No | [0, 0, 0] | Position as [x, y, z] |

**Material Object:**

```dsl
material: {
    walls: "color_name",    // e.g., "white", "#ffffff", or hex
    roof: "color_name",     // e.g., "red"
    foundation: "color_name" // e.g., "gray"
}
```

**What Gets Created:**

When you define a House, ArchGPT automatically generates:

1. **Foundation** — A base slab beneath the structure
2. **Front Wall** — Facing positive Z
3. **Back Wall** — Facing negative Z
4. **Left Wall** — Facing negative X
5. **Right Wall** — Facing positive X
6. **Roof** — A triangular prism above the four walls (height = house height/2)

All components are grouped under a single `house` transform node and positioned at Y = 0.25 (above ground).

**Example (Block Syntax):**

```dsl
House {
    width: 6,
    height: 4,
    depth: 8,
    wallThickness: 0.2,
    material: {
        walls: "white",
        roof: "red",
        foundation: "gray"
    }
}
```

**Example (Command Syntax):**

```dsl
create house {
    width: 8,
    height: 6,
    depth: 10,
    wallThickness: 0.3,
    position: [0, 0, 0]
}
```

---

### Roof (Auto-Generated)

When a House is created, a Roof is automatically generated as part of the structure.

**Shape:** A triangular prism (wedge shape) positioned on top of the house walls.

**Properties (Set by House definition):**

| Aspect | Value |
|--------|-------|
| Base width | House width + (2 × wall thickness) |
| Height | House height / 2 |
| Depth | House depth + (2 × wall thickness) |
| Position | Centered above the house at Y = house height + house height/4 |
| Color | Derived from `material.roof` property (default: red) |

**Rendering Details:**

- Constructed using custom vertices and indices (not a simple box)
- Forms a proper triangular cross-section
- Supports physics impostor (mass = 1, restitution = 0.2, friction = 0.4)

---

## Physics System

### Overview

ArchGPT integrates the Cannon.js physics engine via BabylonJS. Physics simulation allows objects to respond to gravity, collide with each other, and respond to external forces like earthquakes.

### Enabling Physics

Physics is automatically initialized when:

1. You include a `physics {}` block in your DSL
2. You include a `simulate earthquake {}` block
3. The Cannon.js library is loaded in the browser

The physics engine runs at 60 FPS with a time step of 1/60 second.

### Physics Block Properties

**Pattern:**

```dsl
physics {
    mass: number,
    restitution: number,
    friction: number
}
```

**Detailed Property Reference:**

| Property | Type | Range | Description |
|----------|------|-------|-------------|
| `mass` | number | ≥ 0 | Object mass in kilograms. Set to 0 for static (immovable) objects. Static objects act as anchors and don't fall due to gravity. |
| `restitution` | number | 0–1 | Elasticity of collisions. 0 = object stops dead on impact; 1 = object bounces with original velocity; >1 = gains energy (unstable). |
| `friction` | number | 0–∞ | Surface friction. 0 = frictionless (ice); 0.5 = moderate; 1+ = high friction. Higher values slow sliding motion. |

**BabylonJS Physics Impostor:**

Internal implementation creates a `BABYLON.PhysicsImpostor` with type `BoxImpostor` for each mesh. The impostor is the bridge between the visual mesh and the physics engine.

**Example:**

```dsl
physics {
    mass: 1,
    restitution: 0.2,
    friction: 0.4
}
```

This defines an object that:

- Has a mass of 1 kg
- Loses 80% of its bounce energy on impact (retains 20%)
- Has moderate friction (typical materials)

---

### Earthquake Simulation

Earthquake simulation adds realistic ground motion and applies forces to all physics-enabled objects.

**Pattern:**

```dsl
simulate earthquake {
    duration: milliseconds,
    amplitude: number,
    frequency: number
}
```

**Detailed Property Reference:**

| Property | Type | Range | Behavior |
|----------|------|-------|----------|
| `duration` | number | > 0 | Time the earthquake lasts, in milliseconds. E.g., 10000 = 10 seconds. |
| `amplitude` | number | 0–2 (clamped) | Maximum shake displacement. 0 = no motion; 0.5 = moderate shaking; 2 = extreme shaking. Values >2 are clipped to 2. |
| `frequency` | number | 0.1–5 Hz (clamped) | Shake oscillation speed in Hertz. 0.1 Hz = slow, rolling motion; 2 Hz = typical earthquake frequency; 5 Hz = very rapid shaking. Values <0.1 or >5 are clipped. |

**How It Works:**

1. **Ground Motion:** The ground mesh (if created) oscillates using sinusoidal functions:
   - Offset X = `amplitude × sin(frequency × time)`
   - Offset Z = `amplitude × cos(frequency × time)`

2. **Force Application:** Each physics-enabled object receives forces based on:
   - Horizontal forces derived from the shake offsets
   - Vertical forces with randomness (simulating complex ground motion)
   - Forces scale with offset magnitude

3. **Duration:** After the specified duration, the earthquake stops and all motion ceases.

**Example:**

```dsl
simulate earthquake {
    duration: 10000,
    amplitude: 0.5,
    frequency: 2
}
```

This creates a 10-second earthquake with moderate shaking at a typical seismic frequency (2 Hz). Objects will sway and potentially topple depending on their mass, friction, and height.

---

### Physics Impostor Types

In the current implementation:

- **Wall, Prism, House meshes:** Use `BABYLON.PhysicsImpostor.BoxImpostor` (rectangular collision shape)
- **Roof:** Also uses `BoxImpostor` for simplicity (approximate collision)
- **Ground:** Uses `BoxImpostor` with mass = 0 (static)

Future versions may support more complex impostor types (sphere, cylinder, convex hull) for better accuracy.

---

## Rendering Pipeline (Technical)

ArchGPT provides two independent rendering paths: one for BabylonJS and one for Three.js. They handle different sets of primitives and are not interchangeable in the current implementation.

### BabylonJS Path

**File:** `src/engine/babylonRenderer.ts`

**Class:** `BabylonRenderer`

**Supported Shapes:** Wall, Roof, House

#### Initialization

```typescript
const renderer = new BabylonRenderer(scene);
```

**Environment Setup:**

The renderer automatically sets up a professional lighting environment:

1. **Hemispheric Light** (intensity 0.7)
   - Soft overall illumination
   - Direction: upward (0, 1, 0)
   - Simulates ambient sky light

2. **Directional Light** (intensity 0.5)
   - Sharp shadows
   - Direction: (-1, -2, -1)
   - Simulates sunlight

3. **Ambient Light** (intensity 0.3)
   - Fill light to prevent harsh shadows
   - Reduces contrast in shaded areas

#### Rendering Method

```typescript
renderer.render(model: Model): BABYLON.Mesh[]
```

**Input:** A model object with:

```typescript
interface Model {
    type: string;  // "wall", "roof", "house"
    properties: Record<string, any>;
    children?: Model[];
}
```

**Output:** An array of BabylonJS meshes that have been:

- Created with appropriate geometry
- Positioned in space
- Configured for shadow receiving
- Set up with physics impostors (if physics is enabled)

#### Material System

**PBR Material:** Uses Physically Based Rendering (PBR) for realistic shading.

Properties applied:

- `metallic: 0.1` — Slight metallic appearance
- `roughness: 0.6` — Slightly rough (non-shiny) surface
- `albedoColor` — Base color (varies by component)

**Color Mapping for House:**

- Foundation: Dark gray (0.4, 0.4, 0.4)
- Walls: Light gray (0.8, 0.8, 0.8)
- Roof: Red (0.7, 0.2, 0.2)

#### Mesh Creation Details

**Wall Creation:**

```typescript
createWall(width, height, depth, position?)
```

- Creates a box with `width`, `height`, `depth`
- Positions it at the specified 3D coordinates
- Applies PBR material
- Attaches physics impostor if physics is enabled

**Roof Creation:**

```typescript
createRoof(width, height, depth, position?)
```

- Creates custom vertex geometry forming a triangular prism
- Positions form: Front face (triangle) → Back face (triangle) → 4 side faces
- Manually computes normals for proper lighting
- Applies red PBR material
- Attaches physics impostor if physics is enabled

**House Creation:**

```typescript
createHouse(properties)
```

- Creates 4 walls, 1 foundation, 1 roof
- All meshes are grouped under a `TransformNode` called "house"
- Applies materials and physics to each component
- Returns array of all 6 meshes

#### Physics Integration

When physics is enabled:

1. Each mesh gets a `BABYLON.PhysicsImpostor`
2. Impostor type: `BoxImpostor` (rectangular collision shape)
3. On the ground: `mass = 0` (static, doesn't fall)
4. On other objects: `mass = 1` (affected by gravity)

---

### Three.js Path

**File:** `src/engine/threeRenderer.ts`

**Class:** `ThreeRenderer`

**Supported Shapes:** Box, Sphere, Cylinder

**Note:** Three.js does not currently support the Wall, Prism, or House primitives. It is a separate rendering pipeline designed for simpler geometric shapes.

#### Initialization

```typescript
const renderer = new ThreeRenderer(container: HTMLElement);
```

Creates:

- A Three.js Scene
- A PerspectiveCamera (75° FOV, positioned at z = 5)
- A WebGLRenderer outputting to the provided HTML container

#### Rendering Method

```typescript
renderer.render(model: DSLModel): void
```

**Input Model Structure:**

```typescript
interface DSLModel {
    shapes: DSLShape[];
    transforms?: {
        rotation?: {x, y, z};
        scale?: {x, y, z};
    };
}

interface DSLShape {
    type: string;  // "box", "sphere", "cylinder"
    dimensions: {
        width?, height?, depth?, radius?
    };
    position: {x, y, z};
    material?: {
        color: string;
    };
}
```

#### Supported Geometries

**Box:**

```typescript
new THREE.BoxGeometry(
    shape.dimensions.width || 1,
    shape.dimensions.height || 1,
    shape.dimensions.depth || 1
)
```

**Sphere:**

```typescript
new THREE.SphereGeometry(
    shape.dimensions.radius || 1
)
```

**Cylinder:**

```typescript
new THREE.CylinderGeometry(
    shape.dimensions.radius || 1,  // Top radius
    shape.dimensions.radius || 1,  // Bottom radius
    shape.dimensions.height || 1   // Height
)
```

#### Material System

All shapes use **MeshStandardMaterial:**

```typescript
const material = new THREE.MeshStandardMaterial({
    color: shape.material?.color || '#ffffff'
});
```

This material supports:

- Basic colors (by name, hex, or THREE.Color)
- PBR properties (if extended)
- Standard shading model

#### Lighting

The renderer adds two light sources:

1. **Ambient Light** (0x404040, intensity 1)
   - Provides base illumination
   - No shadows

2. **Directional Light** (0xffffff, intensity 1)
   - Positioned at (1, 1, 1)
   - Simulates sunlight
   - Can cast shadows (if enabled)

#### Animation Loop

```typescript
renderer.animate(): void
```

Starts a continuous render loop using `requestAnimationFrame`, calling `WebGLRenderer.render(scene, camera)` each frame.

---

### Comparison: BabylonJS vs. Three.js

| Aspect | BabylonJS | Three.js |
|--------|-----------|----------|
| **Supported Shapes** | Wall, Roof, House | Box, Sphere, Cylinder |
| **Physics Enabled** | Yes (Cannon.js integration) | No |
| **Material System** | PBR (Physically Based Rendering) | Standard Material |
| **Lighting** | Hemispheric + Directional + Ambient | Ambient + Directional |
| **Use Case** | Architectural simulations | Simple geometric rendering |

---

## Comments

ArchGPT supports single-line comments using the `//` syntax.

**Syntax:**

```dsl
// This is a comment
shape_definition { ... } // Comment at end of line
```

**Example:**

```dsl
// Define a simple wall structure
Wall {
    height: 10,     // Meters
    width: 5,       // Meters
    x: 0,           // Origin X
    y: 0            // Origin Y
}

// Add a prism on top
Prism {
    height: 15,
    width: 10,
    x: 5,
    y: 5
}
```

**Behavior:**

- Comments are stripped during parsing (regex: `/\/\/.*$/gm`)
- Everything after `//` until the end of the line is ignored
- Multi-line comments (`/* */`) are NOT currently supported

---

## Known Limitations & Current State

### Parser Limitations

1. **Two Syntax Styles, Two Parsers**

   - **Block syntax** (Wall, House, Prism without `create`) is parsed flexibly by `parseDSL()` in `dsl.ts`
   - **Command syntax** (with `create` keyword) is parsed strictly by `DSLParser` in `parser.ts`
   - This inconsistency means some valid block syntax may not work with the command syntax parser and vice versa

2. **Strict Command Parser**

   - The `DSLParser` only accepts `create Wall { ... }` and `create Prism { ... }` in strict format
   - Unknown types throw an error: "Unknown shape type"
   - The `House` type must use the `parseDSL()` function, not the command syntax parser

3. **Limited Property Parsing**

   - Nested objects (like `material: { walls: "white" }`) are parsed manually with string manipulation
   - Arrays (like `position: [0, 0, 0]`) are minimally parsed
   - Complex expressions are not supported

### Interpreter Limitations

1. **Minimal Executor**

   - `DSLInterpreter.execute()` currently just logs commands
   - It does not fully interpret or execute the AST
   - No state tracking or variable management
   - This is a stub awaiting full implementation

### Renderer Limitations

1. **No Shape Interoperability**

   - BabylonJS handles: Wall, Roof, House
   - Three.js handles: Box, Sphere, Cylinder
   - You cannot mix shapes across renderers
   - Roof is auto-generated only for House in BabylonJS; no standalone Roof creation in Three.js

2. **Physics Impostor Approximation**

   - All meshes use `BoxImpostor` (rectangular collision shape)
   - Roof (triangular prism) is approximated as a box for collision detection
   - This can cause unrealistic physics behavior (e.g., roof can get stuck in corners)

3. **Material Parsing in House**

   - Material colors are parsed from string values in `material: { walls: "color" }`
   - No validation of color format (could accept invalid colors)
   - Color mapping is hardcoded in the renderer

### DSL Language Limitations

1. **No Variables or Functions**

   - Cannot define reusable components or parametric designs
   - Repetitive code cannot be factored out

2. **No Arithmetic or Expressions**

   - All property values must be literals (no `width: height / 2`)
   - Cannot compute derived dimensions

3. **No Loops or Conditionals**

   - Cannot generate multiple repetitive structures (e.g., a row of houses)
   - Cannot implement branching logic

4. **No Comments in Nested Objects**

   - Comments inside `material: { ... }` blocks may break parsing

### Infrastructure Limitations

1. **No Error Recovery**

   - Parser throws immediately on syntax errors
   - No line/column error reporting
   - Users get cryptic "Invalid DSL string" messages

2. **No Type System**

   - No schema validation for shape properties
   - Required vs. optional properties are not enforced at parse time
   - Type mismatches (e.g., string instead of number) are caught late

3. **No Optimization**

   - No shader optimization
   - No mesh merging
   - Large scenes may become slow

---

## Examples

### Example 1: `basic.dsl`

A minimal example defining two simple primitives.

```dsl
// This is a basic example of a DSL script for generating a simple CAD model.

// Define a wall
Wall {
    height: 10,
    width: 5,
    x: 0,
    y: 0
}

// Define a prism
Prism {
    height: 15,
    width: 10,
    x: 5,
    y: 5
}
```

**What This Does:**

1. Creates a Wall at position (0, 0) with dimensions 10 units tall × 5 units wide
2. Creates a Prism at position (5, 5) with dimensions 15 tall × 10 wide × 1 deep (default)
3. Both are rendered side-by-side in the 3D scene
4. No physics simulation

**Expected Output:** Two rectangular boxes in 3D space.

---

### Example 2: `simple-house.dsl`

Demonstrates the House primitive with material customization.

```dsl
// Simple house example using our CAD DSL

House {
    // Basic house dimensions
    width: 6,
    height: 4,
    depth: 8,
    
    // Wall properties
    wallThickness: 0.2,

    // Optional properties for materials
    material: {
        walls: "white",
        roof: "red",
        foundation: "gray"
    }
}
```

**What This Does:**

1. Creates a complete House structure:
   - Foundation slab (6×8 with custom thickness)
   - 4 walls of height 4 units, thickness 0.2 units
   - A triangular roof with height 2 units (4/2)
2. Applies colors: white walls, red roof, gray foundation
3. All components are automatically generated and positioned

**Expected Output:** A complete house in 3D with custom material colors.

---

### Example 3: `house.dsl`

Full-featured example with physics and earthquake simulation.

```dsl
// Simple house with 4 walls and a prism roof
create house {
    width: 8,
    height: 6,
    depth: 10,
    wallThickness: 0.3,
    position: [0, 0, 0]
}

// Add physics properties
physics {
    mass: 1,
    restitution: 0.2,
    friction: 0.4
}

// Enable earthquake simulation
simulate earthquake {
    duration: 10000,
    amplitude: 0.5,
    frequency: 2
}
```

**What This Does:**

1. **Creates a house:**
   - Dimensions: 8 units wide × 6 units tall × 10 units deep
   - Wall thickness: 0.3 units
   - Position: origin (0, 0, 0)

2. **Enables physics:**
   - Each object has mass 1 kg (affected by gravity)
   - Restitution 0.2: objects retain 20% of bounce energy
   - Friction 0.4: moderate grip when sliding

3. **Starts earthquake simulation:**
   - Duration: 10 seconds (10000 milliseconds)
   - Amplitude: 0.5 (moderate shaking up to ±0.5 units)
   - Frequency: 2 Hz (typical seismic frequency)
   - Ground and all house components will shake and potentially topple

**Expected Output:** A house structure that shakes realistically for 10 seconds, with walls and roof moving naturally as if in an earthquake.

---

## Glossary

### Core Concepts

**DSL (Domain Specific Language)**
A programming language designed for a specific problem domain. ArchGPT's DSL is specialized for describing 3D architectural structures, with syntax tailored to that domain rather than general-purpose programming.

**AST (Abstract Syntax Tree)**
A tree representation of the structure of source code, stripping away syntactic sugar. After parsing DSL code, ArchGPT represents it internally as an AST, where each node is a command (e.g., "create wall" with properties).

**Parser**
The component that reads DSL text and converts it into an AST. ArchGPT's parser (`parser.ts`) uses regular expressions to extract shape types and properties from the input string.

**Interpreter**
The component that executes the AST. Given a tree of commands, the interpreter decides what actions to take. In ArchGPT, it translates AST nodes into renderer calls.

**Renderer**
The component that produces visual output. ArchGPT has two renderers: BabylonJS (for architectural shapes) and Three.js (for simple geometries). The renderer creates 3D meshes and displays them in the browser.

### Graphics & Physics Terms

**Mesh**
A 3D geometric object composed of vertices, edges, and faces. In ArchGPT, each Wall, Prism, or House component is rendered as one or more meshes.

**Physics Impostor**
A simplified collision shape attached to a mesh. Instead of computing collisions against the exact mesh geometry (expensive), the physics engine uses the impostor (e.g., a box, sphere, or capsule). ArchGPT uses `BoxImpostor` for all shapes, approximating them as rectangular boxes.

**PBR Material (Physically Based Rendering)**
A shading model that simulates real-world material properties using parameters like:

- **Metallic:** How metal-like the surface is (0 = non-metal, 1 = pure metal)
- **Roughness:** How rough or shiny the surface is (0 = mirror-like, 1 = rough)
- **Albedo Color:** The base color of the material

BabylonJS's PBR materials produce realistic, physically accurate rendering.

### Simulation Terms

**Restitution**
A physics property controlling bounce. Formally, the ratio of relative speeds after and before a collision. Values:

- 0 = no bounce (ball stops dead)
- 0.5 = ball retains 50% of energy
- 1.0 = perfectly elastic (ball bounces to original height)
- >1.0 = energy gains (unstable; ball bounces higher)

**Friction**
A physics property controlling surface resistance to sliding. Values:

- 0 = frictionless (ice)
- 0.5 = moderate (concrete)
- 1.0+ = high friction (rubber)

**Impostor Mass**
In physics, mass determines how much an object is affected by forces:

- mass = 0 → static object (immovable, like ground or a wall anchored to bedrock)
- mass > 0 → dynamic object (affected by gravity, forces, collisions)

**Amplitude (Earthquake)**
The maximum displacement from equilibrium. In earthquake simulation, amplitude controls the maximum distance the ground moves:

- Low amplitude (0.1) = gentle vibration
- High amplitude (1.0) = strong shaking

**Frequency (Earthquake)**
The rate of oscillation, measured in Hertz (Hz). Represents how many complete cycles occur per second:

- 0.1 Hz = slow rolling motion (one cycle per 10 seconds)
- 2 Hz = typical seismic frequency (two cycles per second)
- 5 Hz = very rapid shaking (five cycles per second)

---

## Further Reading

For deeper technical details, see the source code:

- **Parsing:** [src/core/parser.ts](src/core/parser.ts) and [src/core/dsl.ts](src/core/dsl.ts)
- **Interpretation:** [src/core/interpreter.ts](src/core/interpreter.ts)
- **BabylonJS Rendering:** [src/engine/babylonRenderer.ts](src/engine/babylonRenderer.ts)
- **Three.js Rendering:** [src/engine/threeRenderer.ts](src/engine/threeRenderer.ts)
- **Physics Simulation:** [src/engine/physics.ts](src/engine/physics.ts)
- **Primitives:** [src/models/primitives.ts](src/models/primitives.ts)

---

**Last Updated:** April 3, 2026  
**Status:** Documentation reflects current implementation  
**Contribution:** For improvements, please refer to the project's contribution guidelines.
