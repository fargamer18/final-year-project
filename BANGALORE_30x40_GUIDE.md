# 30x40 Bangalore House - Floor Plan Guide

Based on typical Indian residential architecture, this 30x40 foot house has been recreated in ArchGPT with complete 3D floor plans.

## House Dimensions

- **Width:** 30 feet
- **Depth:** 40 feet
- **Total Height:** about 11 feet
- **Floors:** 3 (ground floor, first floor, second-floor structure)

---

## Ground Floor Layout

### Ground Floor Rooms and Spaces

| Room | Dimensions | Material | Features |
| ------ | ----------- | ---------- | ---------- |
| **Verandah** | 30 x 4 ft | Glazed Tile | Front porch with partial walls |
| **Living Room** | about 12 x 7 ft | Polished Concrete | 2 windows facing front |
| **Kitchen** | about 12 x 7 ft | White Tile | Back area, frosted window for ventilation |
| **Bedroom 1** | about 13 x 10 ft | Oak Wood | 2 large windows, rear access |
| **Bathroom 1** | about 5 x 5 ft | White Ceramic Tile | Small ventilation window |
| **Staircase** | 3 x 3 ft | Concrete | Central location for vertical circulation |

### Ground Floor Key Features

- **Main Entrance:** Mahogany door at front center
- **Garden/Yard:** Back portion available
- **Ventilation:** Windows in all habitable areas
- **Bathroom:** Connected to master bedroom area

---

## First Floor Layout

### First Floor Rooms and Spaces

| Room | Dimensions | Material | Features |
| ------ | ----------- | ---------- | ---------- |
| **Bedroom 2** | about 12 x 9 ft | Walnut | 2 front-facing windows |
| **Master Bedroom** | about 13 x 18 ft | Pine Wood | 2 large windows, premium space |
| **Bathroom 2** | about 12 x 6 ft | Tiled | Rear placement, frosted vent |
| **Circulation Space** | Various | Polished Concrete | Hallways and staircase area |

### First Floor Key Features

- **Master Suite:** Large bedroom with 2 windows
- **Secondary Bedroom:** Guest room or children's room
- **Full Floor Slab:** Polished concrete throughout
- **Window Access:** Multiple windows for cross-ventilation

---

## Second Floor (Terrace/Upper Level)

- **Access:** Via staircase from first floor
- **Space:** Full 30x40 footprint available
- **Roof:** Tiled roof with overhang
- **Usage:** Open terrace space for drying clothes, storage, or additional living area

---

## Materials Used

### Wall Materials

- **Exterior:** White brick (for durability and aesthetics)
- **Interior Dividers:** White brick
- **Paint:** Beige and white paint for bedrooms and living areas

### Floor Finishes

- **Ground Floor:** Polished concrete (living), glazed tile (verandah), white tile (kitchen and bath)
- **First Floor:** Polished concrete (common areas)
- **Bedrooms:** Oak, walnut, and pine wood finishes

### Envelope and Openings

- **Glass:** Clear glass for main windows, frosted glass for bathroom ventilation
- **Doors:** Mahogany for entrance, wood frames for interior
- **Roof:** Red clay tile roofing
- **Foundation:** Gray reinforced concrete base

---

## Window and Door Schedule

### Main Entrance Door

- **Type:** Mahogany wooden door
- **Dimensions:** 1.2 ft wide x 2.2 ft tall
- **Location:** Front center

### Window Schedule

| Location | Type | Dimensions | Material |
| ---------- | ------ | ----------- | ---------- |
| Living Room (Front) | 2x Large | 1.8 x 1.5 ft | Clear Glass |
| Kitchen (Back) | 1x Small | 1.5 x 1.2 ft | Frosted Glass |
| Bedroom 1 (Back) | 2x Large | 1.5 x 1.2 ft | Clear Glass |
| Bathroom 1 | 1x Vent | 0.8 x 0.8 ft | Frosted Glass |
| Bedroom 2 (Front) | 2x Large | 1.5 x 1.2 ft | Clear Glass |
| Master Bedroom (Back) | 2x Large | 1.8 x 1.5 ft | Clear Glass |
| Bathroom 2 (Back) | 1x Vent | 0.8 x 0.8 ft | Frosted Glass |

---

## Construction Details

### Foundation Specifications

- **Depth:** 0.5 ft below ground level
- **Dimensions:** 30.6 x 40.6 ft (with margin)
- **Material:** Concrete
- **Load Capacity:** Supports a 3-story structure

### Wall Construction Specifications

- **Thickness:** 0.2 to 0.3 ft (brick thickness)
- **Height:** 9 ft ground floor, 8 ft upper floors
- **Construction:** Load-bearing brick masonry

### Roof Specifications

- **Type:** Pitched or sloped roof
- **Material:** Red clay tiles
- **Slope:** Triangular profile for drainage
- **Height:** 4 ft peak from first floor

### Floor Structure Specifications

- **Ground Level:** Polished concrete slab
- **First Floor:** Concrete slab with tile or wood finish
- **Structure:** RCC (reinforced cement concrete)

---

## How to View in ArchGPT

### Launch Steps

1. Start the server: npm start
2. Open browser: <http://localhost:8080>
3. The 30x40 house loads automatically

### Navigation Controls

- **Zoom:** Scroll mouse wheel
- **Rotate:** Right-click and drag
- **Pan:** Middle-click and drag
- **Select:** Click on any object

### Interaction Controls

- **Transform:** Use right panel tools to move, rotate, and scale
- **Materials:** Change materials from dropdown
- **Operations:** Duplicate, delete, and mirror objects
- **Physics:** Enable earthquake simulation

---

## Scale Reference

- **1 unit in ArchGPT:** about 1 foot
- **Total Floor Area:** about 1,200 sq ft (30 x 40)
- **Living Area:** about 900 to 1000 sq ft
- **Common Area:** about 200 to 300 sq ft

---

## CAD Tools for Modifications

### Scale the House

```dsl
scale main_roof to 1.2
```

Makes all dimensions 20 percent larger.

### Add More Rooms

```dsl
create Wall {
    width: 10,
    height: 9,
    depth: 0.2,
    position: [-5, 0, 15]
}
applyMaterial { material: "whiteBrick" }
```

### Change Materials

```dsl
applyMaterial { material: "redBrick" }
```

### Transform Objects

```dsl
move living_room_gf to 2, 0, 0
rotate main_roof by 0, 0, 15
```

---

## Typical Build Timeline

- **Foundation and Basement:** 2 to 3 weeks
- **Wall Construction:** 4 to 6 weeks
- **Roof and Finishing:** 4 to 6 weeks
- **Interior:** 6 to 8 weeks
- **Total Duration:** 4 to 5 months

---

## Design Features

- **Ventilation:** Cross-ventilation in all rooms
- **Natural Light:** Windows in every bedroom and living area
- **Circulation:** Efficient hallway layout
- **Privacy:** Separate entry for each bedroom
- **Functionality:** Combined living-kitchen concept
- **Traditional:** Follows Vastu principles
- **Practical:** Optimized for Indian climate

---

## Notes

- The 30x40 dimensions are typical for residential plots in Bangalore suburbs.
- The design accommodates 4 to 6 people comfortably.
- It can be modified using ArchGPT CAD tools.
- Material choices are realistic for visualization.
- Physics simulation is available for earthquake analysis.

---

Enjoy exploring the 30x40 Bangalore house in ArchGPT.
