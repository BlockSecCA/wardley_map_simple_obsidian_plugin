# Wardley Map Inline Syntax Specification

## Overview

This specification defines a declarative syntax for embedding Wardley Maps in Obsidian notes using code blocks, similar to how Mermaid diagrams work. The syntax is based on OnlineWardleyMaps format but removes coordinate positioning, relying instead on automatic layout based on evolution stages and dependency relationships.

## Basic Structure

```wardley
title <Map Title>

# Component declarations
component <Name> [<evolution-stage>]
anchor <Name> [<evolution-stage>]

# Relationships
<ComponentA> -> <ComponentB>

# Evolution
evolve <ComponentA> -> <ComponentB> [<evolution-stage>]
evolve <ComponentA> [<evolution-stage>]

# Annotations (optional)
annotation <id> <text>
note <text>
```

## Core Elements

### 1. Title (Optional)

```
title <Map Title>
```

**Example:**
```
title Tea Shop Strategy
```

**Behavior:**
- Optional - maps can be untitled
- Must appear before component declarations
- Single line only

---

### 2. Components

Components are the building blocks of the map. Two types exist:

#### Standard Component
```
component <Name> [<evolution-stage>]
```

#### Anchor (User Need)
```
anchor <Name> [<evolution-stage>]
```

**Evolution Stages:**
- `genesis` - Novel, uncertain, rapidly changing
- `custom` - Competitive advantage, custom-built
- `product` - Best practices, standardized products
- `commodity` - Utility-like, stable, well-defined

**Examples:**
```
component Kettle [custom]
component Power [commodity]
anchor Business [product]
```

**Behavior:**
- Component names can include spaces (no quotes needed)
- Evolution stage is required for positioning
- `anchor` components represent user needs and appear at the top of the value chain
- Duplicate component names are not allowed within a single map

---

### 3. Dependencies

Dependencies define the value chain relationships between components.

```
<ComponentA> -> <ComponentB>
```

**Examples:**
```
Business -> Cup of Tea
Cup of Tea -> Hot Water
Hot Water -> Kettle
```

**Optional Annotations:**
```
<ComponentA> -> <ComponentB>; <note>
```

**Example:**
```
Kettle -> Power; limited by
```

**Chaining:**
```
Business -> Cup of Tea -> Hot Water -> Kettle
```

**Behavior:**
- Dependencies flow **downward** in the value chain (from user need toward infrastructure)
- The component on the **left** depends on the component on the **right**
- Components must be declared before being referenced in dependencies
- Semicolon annotations are optional contextual notes displayed near the relationship line

---

### 4. Evolution Relationships

Evolution shows how components transform or progress over time.

#### Component Evolution (A becomes B)
```
evolve <ComponentA> -> <ComponentB> [<evolution-stage>]
```

**Example:**
```
evolve Kettle -> Electric Kettle [product]
```

**Behavior:**
- Shows technological progression
- Target component (Electric Kettle) must be declared with its evolution stage
- Creates a directional arrow showing evolution path
- The target component's stage should be more evolved than the source

#### Stage Evolution (Component moving stages)
```
evolve <ComponentA> [<evolution-stage>]
```

**Example:**
```
evolve Power [commodity]
```

**Behavior:**
- Indicates a component is in transition to a new stage
- Can be used to show planned evolution
- Creates a visual indicator of movement

---

### 5. Annotations (Optional)

Annotations add contextual information to the map.

```
annotation <id> <text>
note <text>
```

**Examples:**
```
annotation 1 Standardising power allows Kettles to evolve faster
annotation 2 Hot water is obvious and well known
note A generic note about the overall strategy
```

**Behavior:**
- Annotations are numbered and appear in a legend or as callouts
- Notes are general observations about the map
- Exact placement determined by rendering engine
- These are optional and can be omitted entirely

---

## Positioning Logic

Unlike OnlineWardleyMaps which requires explicit coordinates, this syntax uses **automatic positioning**:

### X-Axis (Evolution)
Components are positioned horizontally based on their declared evolution stage:
- `genesis` - Left side (0-25%)
- `custom` - Left-center (25-50%)
- `product` - Right-center (50-75%)
- `commodity` - Right side (75-100%)

### Y-Axis (Value Chain)
Components are positioned vertically using **topological sorting** of the dependency graph:
- **Top:** Anchors and components with no outgoing dependencies (user-facing)
- **Bottom:** Components with no incoming dependencies (infrastructure)
- **Middle:** Layered based on dependency depth

**Rules:**
- If A → B, then A is positioned **above** B
- Multiple valid layouts may exist; renderer chooses optimal spacing
- Aim to minimize edge crossings

---

## Complete Example

```wardley
title Tea Shop

anchor Business [product]
anchor Public [commodity]

component Cup of Tea [product]
component Cup [commodity]
component Tea [commodity]
component Hot Water [commodity]
component Water [commodity]
component Kettle [custom]
component Electric Kettle [product]
component Power [commodity]

Business -> Cup of Tea
Public -> Cup of Tea
Cup of Tea -> Cup
Cup of Tea -> Tea
Cup of Tea -> Hot Water
Hot Water -> Water
Hot Water -> Kettle
Kettle -> Power

evolve Kettle -> Electric Kettle [product]

annotation 1 Standardising power allows Kettles to evolve faster
annotation 2 Hot water is obvious and well known
```

**This produces a map showing:**
- User needs (Business, Public) at the top
- Product delivery (Cup of Tea) in the middle
- Components and infrastructure flowing downward
- Evolution from Kettle to Electric Kettle
- Horizontal positioning by evolution stage
- Annotations providing strategic context

---

## Simplified Example (Minimal)

For quick illustrations, the minimal syntax is:

```wardley
component Business [custom]
component Cup of Tea [product]
component Hot Water [commodity]

Business -> Cup of Tea -> Hot Water
```

**This is sufficient for:**
- Simple value chain illustrations
- Concept explanations
- Quick strategic sketches

---

## Component Name Rules

### Spaces in Names
Component names **can include spaces without quotes**:

```
component Cup of Tea [product]
component Hot Water [commodity]
```

### Special Characters
Avoid special characters that might conflict with syntax:
- Avoid: `->`, `[`, `]`, `;` in component names
- Use: Letters, numbers, spaces, hyphens, underscores

### Case Sensitivity
Component names are **case-sensitive**:
```
component Kettle [custom]
component kettle [commodity]  # Different component!
```

---

## Relationship Rules

### 1. Multiple Dependencies

**Chain notation (preferred for linear chains):**
```
A -> B -> C -> D
```

**Individual declarations (preferred for complex graphs):**
```
A -> B
A -> C
B -> D
C -> D
```

### 2. Many-to-One
```
ComponentA -> SharedComponent
ComponentB -> SharedComponent
ComponentC -> SharedComponent
```

### 3. One-to-Many
```
SharedComponent -> ComponentA
SharedComponent -> ComponentB
SharedComponent -> ComponentC
```

---

## Evolution Rules

### 1. Evolution Must Progress Forward
```
evolve Kettle [custom] -> Electric Kettle [product]  # ✅ Correct
evolve Power [commodity] -> Manual Labor [genesis]   # ❌ Backwards
```

### 2. Target Component Must Exist
```
component Kettle [custom]
component Electric Kettle [product]
evolve Kettle -> Electric Kettle [product]  # ✅ Target declared
```

### 3. Multiple Evolution Paths
```
component Manual Kettle [genesis]
component Stovetop Kettle [custom]
component Electric Kettle [product]

evolve Manual Kettle -> Stovetop Kettle [custom]
evolve Stovetop Kettle -> Electric Kettle [product]
```

---

## Error Handling

### Undefined Component Reference
```
Business -> Cup of Tea  # ❌ Cup of Tea not declared
```
**Error:** "Component 'Cup of Tea' referenced but not declared"

### Duplicate Component
```
component Kettle [custom]
component Kettle [product]  # ❌ Duplicate
```
**Error:** "Component 'Kettle' declared multiple times"

### Invalid Evolution Stage
```
component Kettle [intermediate]  # ❌ Invalid stage
```
**Error:** "Invalid evolution stage 'intermediate'. Must be: genesis, custom, product, commodity"

### Circular Dependency
```
A -> B
B -> C
C -> A  # ❌ Circular
```
**Error:** "Circular dependency detected: A -> B -> C -> A"

---

## Rendering Guidelines

### Visual Elements

**Components:**
- Rendered as circles or rounded rectangles
- Size can vary by importance (if specified)
- Color-coded by evolution stage

**Dependencies:**
- Solid lines with arrows
- Arrow points toward the component being depended upon
- Optional labels near the line (from semicolon annotations)

**Evolution:**
- Dashed or dotted lines
- Directional arrows showing progression
- Different color to distinguish from dependencies (e.g., purple)

**Anchors:**
- Visually distinct from regular components (e.g., different shape)
- Always positioned at or near the top of the value chain

### Layout Algorithm Recommendations

1. **Parse** the syntax into a graph structure
2. **Validate** no circular dependencies, all references exist
3. **Topological sort** for Y-axis positioning (value chain layers)
4. **Evolution stage mapping** for X-axis positioning
5. **Optimize layout** to minimize edge crossings
6. **Render** with clear visual hierarchy

---

## Extension Points (Future)

The syntax is designed to be extensible for future features:

### Strategic Metadata (Optional)
```
component Kettle [custom] {importance: critical, confidence: high}
```

### Visibility Levels
```
component Internal API [product] {visibility: internal}
```

### Movement Annotations
```
component Legacy System [product] {inertia: high}
evolve Legacy System [commodity] {planned: 2026-Q2}
```

### Multiple Maps in One Block
```
wardley map1
...
---
wardley map2
...
```

---

## Comparison with OnlineWardleyMaps Syntax

| Feature | OnlineWardleyMaps | This Specification |
|---------|-------------------|-------------------|
| Coordinates | Required `[x, y]` | Not used - auto-positioned |
| Component syntax | `component Name [x, y]` | `component Name [stage]` |
| Dependencies | `A->B` | `A -> B` (spaces optional) |
| Evolution stage | Inferred from X coordinate | Explicitly declared |
| Anchors | `anchor Name [x, y]` | `anchor Name [stage]` |
| Labels | `label [x, y]` | Not needed - auto-positioned |
| Annotations | Position specified | Auto-positioned |
| Style | `style wardley` | Implicit |

---

## Design Philosophy

This syntax prioritizes:

1. **Declarative over imperative** - Describe what, not where
2. **Minimal over complete** - Essential features first, extensions later
3. **Readable over compact** - Clarity over brevity
4. **Familiar over novel** - Borrows from Mermaid and OnlineWardleyMaps
5. **Forgiving over strict** - Reasonable defaults, optional features

The goal is to make Wardley Maps as easy to embed in notes as Mermaid diagrams, while respecting the strategic thinking principles of Wardley Mapping.

---

## Reference Implementation

**File format:** Markdown code blocks with `wardley` language identifier

```markdown
Here's the strategic landscape:

```wardley
title Strategic Overview

component User Need [genesis]
component Our Solution [custom]
component Cloud Platform [commodity]

User Need -> Our Solution -> Cloud Platform
```

This shows we're building custom solutions on commodity infrastructure.
```

**Rendering:** Plugin intercepts `wardley` code blocks and generates SVG inline visualizations.

---

## Version

**Specification Version:** 1.0
**Date:** 2025-01-08
**Status:** Draft

---

*This specification is designed to be implemented as an Obsidian plugin that renders Wardley Maps from inline code blocks, providing a lightweight alternative to coordinate-based diagramming tools.*
