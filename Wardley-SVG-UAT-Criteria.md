# Wardley Map SVG Acceptance Criteria

## Purpose
This document defines the complete acceptance criteria for a valid Wardley Map SVG output. Use this to validate that the renderer produces correct, complete, and well-formed visualizations.

---

## 1. Document Structure

### 1.1 Valid SVG Document
- ✅ Root `<svg>` element exists
- ✅ Valid `xmlns="http://www.w3.org/2000/svg"` namespace
- ✅ `viewBox` attribute defines coordinate system
- ✅ `width` and `height` attributes present
- ✅ Document is well-formed XML (parseable)

### 1.2 Container Groups
- ✅ Optional `<g>` groups for organization (grid, components, edges, labels, etc.)
- ✅ Proper nesting hierarchy
- ✅ No overlapping or conflicting IDs

**Validation:**
```javascript
const svg = parseSVG(content);
assert(svg.tagName === 'svg');
assert(svg.getAttribute('xmlns') === 'http://www.w3.org/2000/svg');
assert(svg.getAttribute('viewBox'));
```

---

## 2. Components (Nodes)

### 2.1 Component Count
- ✅ One visual node per declared component
- ✅ Includes both regular components AND anchors
- ✅ No duplicate nodes for the same component
- ✅ No missing nodes

**Validation:**
```javascript
// If wardley code declares 10 components
const circles = svg.querySelectorAll('circle, rect, ellipse');
assert(circles.length === 10, `Expected 10 nodes, found ${circles.length}`);
```

### 2.2 Node Types
Nodes can be rendered as:
- `<circle>` - Most common
- `<rect>` with rounded corners
- `<ellipse>` 
- Custom shapes

**Acceptance:** Any of these is valid, as long as:
- ✅ Consistent within the same map (all circles, or all rects, etc.)
- ✅ Distinguishable from edges/arrows/labels

### 2.3 Node Attributes

Each node MUST have:
- ✅ **Position**: `cx`/`cy` (for circles) or `x`/`y` (for rects)
- ✅ **Size**: `r` (for circles) or `width`/`height` (for rects)
- ✅ **Fill color**: `fill` attribute or CSS style
- ✅ **Optional stroke**: `stroke` and `stroke-width` for borders
- ✅ **Optional ID**: `id` attribute for referencing (recommended)

**Example valid circle:**
```xml
<circle 
  id="component-kettle" 
  cx="200" 
  cy="300" 
  r="20" 
  fill="#ff9933" 
  stroke="#333" 
  stroke-width="2"
/>
```

**Example valid rect:**
```xml
<rect 
  id="component-kettle" 
  x="180" 
  y="280" 
  width="40" 
  height="40" 
  rx="20" 
  fill="#ff9933" 
  stroke="#333" 
  stroke-width="2"
/>
```

### 2.4 Node Positioning

**X-Axis (Evolution Stage):**
- ✅ Genesis components: 0-25% of map width
- ✅ Custom components: 25-50% of map width
- ✅ Product components: 50-75% of map width
- ✅ Commodity components: 75-100% of map width

**Y-Axis (Value Chain):**
- ✅ Anchors/user needs: Top 10-20% of map height
- ✅ Infrastructure components: Bottom 10-20% of map height
- ✅ Components ordered by topological sort of dependencies
- ✅ If A depends on B, then A is positioned ABOVE B (higher Y or lower cy)

**Validation:**
```javascript
// For a component declared as [custom]
const node = svg.querySelector('#component-kettle');
const cx = parseFloat(node.getAttribute('cx'));
const mapWidth = parseFloat(svg.getAttribute('width'));
const xPercent = (cx / mapWidth) * 100;
assert(xPercent >= 25 && xPercent <= 50, 
  `Custom component at ${xPercent}%, expected 25-50%`);
```

### 2.5 Node Colors (Evolution Stage Coding)

Standard color scheme:
- ✅ **Genesis**: Red (#ff4444 or similar)
- ✅ **Custom**: Orange (#ff9933 or similar)
- ✅ **Product**: Blue (#3399ff or similar)
- ✅ **Commodity**: Green (#44ff44 or similar)

**Acceptance:**
- Colors can vary in shade but must be distinguishable
- Same evolution stage = same color family
- Anchors follow same color rules as regular components

**Validation:**
```javascript
const customComponents = getComponentsByStage(svg, 'custom');
const colors = customComponents.map(c => c.getAttribute('fill'));
const uniqueColors = new Set(colors);
assert(uniqueColors.size === 1, 
  'All custom components should have the same color');
```

### 2.6 Anchor Components (User Needs)

**Visual Distinction:**
Anchors should be visually different from regular components:
- ✅ Different shape (e.g., rectangles vs circles), OR
- ✅ Different size (e.g., larger), OR
- ✅ Different border style (e.g., thicker stroke), OR
- ✅ Different fill pattern (e.g., gradient or pattern)

**Acceptance:** At least ONE visual difference to distinguish anchors from components.

---

## 3. Component Labels (Text)

### 3.1 Label Count
- ✅ One `<text>` element per component
- ✅ Every component node has a corresponding label
- ✅ No orphan labels (labels without nodes)
- ✅ No duplicate labels for the same component

**Validation:**
```javascript
const nodes = svg.querySelectorAll('circle, rect');
const labels = svg.querySelectorAll('text.component-label'); // or however labels are marked
assert(nodes.length === labels.length,
  `Mismatch: ${nodes.length} nodes but ${labels.length} labels`);
```

### 3.2 Label Content
- ✅ Text content matches declared component name
- ✅ Handles spaces correctly (e.g., "Cup of Tea")
- ✅ Handles special characters if present
- ✅ Readable font size (not too small)

**Validation:**
```javascript
const label = svg.querySelector('text[data-component="Cup of Tea"]');
assert(label.textContent === 'Cup of Tea',
  `Expected "Cup of Tea", got "${label.textContent}"`);
```

### 3.3 Label Position
- ✅ **Near the component node**: Within reasonable distance (e.g., 5-30px)
- ✅ **Readable**: Not overlapping other labels or nodes (where possible)
- ✅ **Consistent placement**: All labels use same positioning logic (e.g., below nodes, or centered)

**Common patterns:**
- Labels centered on node
- Labels below node
- Labels to the right of node
- Labels with offset declared in syntax (if supported)

**Validation:**
```javascript
const node = svg.querySelector('#component-kettle');
const label = svg.querySelector('text[data-component="Kettle"]');
const nodeCx = parseFloat(node.getAttribute('cx'));
const nodeCy = parseFloat(node.getAttribute('cy'));
const labelX = parseFloat(label.getAttribute('x'));
const labelY = parseFloat(label.getAttribute('y'));
const distance = Math.sqrt(
  Math.pow(nodeCx - labelX, 2) + Math.pow(nodeCy - labelY, 2)
);
assert(distance < 50, `Label too far from node: ${distance}px`);
```

### 3.4 Label Styling
- ✅ **Font size**: Readable (e.g., 12-16px)
- ✅ **Font family**: Clean, sans-serif (e.g., Arial, Helvetica)
- ✅ **Fill color**: Contrasts with background (usually black or dark gray)
- ✅ **Text anchor**: Properly aligned (start, middle, end)
- ✅ **Optional**: Stroke or background for readability

**Example valid label:**
```xml
<text 
  x="200" 
  y="330" 
  font-size="14" 
  font-family="Arial, sans-serif" 
  fill="#333" 
  text-anchor="middle"
  data-component="Kettle"
>Kettle</text>
```

---

## 4. Dependencies (Edges)

### 4.1 Edge Count
- ✅ One edge per declared dependency relationship
- ✅ If `A -> B` declared, one edge from A to B exists
- ✅ No missing edges
- ✅ No duplicate edges for the same relationship

**Validation:**
```javascript
// If wardley code has 8 dependency arrows
const edges = svg.querySelectorAll('line.dependency, path.dependency');
assert(edges.length === 8, `Expected 8 edges, found ${edges.length}`);
```

### 4.2 Edge Elements
Edges can be rendered as:
- `<line>` - Simple straight line
- `<path>` - Curved or angled line
- `<polyline>` - Multi-segment line

**Acceptance:** Any rendering is valid as long as:
- ✅ Connects source to target node
- ✅ Has directional indicator (arrow) showing flow

### 4.3 Edge Attributes

Each edge MUST have:
- ✅ **Start point**: `x1`/`y1` (for line) or `d` attribute (for path) starting at source node
- ✅ **End point**: `x2`/`y2` (for line) or `d` attribute (for path) ending at target node
- ✅ **Stroke color**: `stroke` attribute (usually solid color like blue #3366ff)
- ✅ **Stroke width**: `stroke-width` (typically 2-3px)
- ✅ **Arrow marker**: `marker-end` attribute pointing to arrow definition

**Example valid line edge:**
```xml
<line 
  x1="200" 
  y1="300" 
  x2="250" 
  y2="400" 
  stroke="#3366ff" 
  stroke-width="2"
  marker-end="url(#arrowhead)"
  class="dependency"
/>
```

**Example valid path edge:**
```xml
<path 
  d="M 200,300 Q 225,350 250,400" 
  stroke="#3366ff" 
  stroke-width="2" 
  fill="none"
  marker-end="url(#arrowhead)"
  class="dependency"
/>
```

### 4.4 Arrow Markers
- ✅ `<defs>` section contains arrow marker definition
- ✅ `<marker>` element with `id` (e.g., "arrowhead")
- ✅ Arrow path or polygon inside marker
- ✅ Marker referenced by edges via `marker-end="url(#arrowhead)"`

**Example arrow marker:**
```xml
<defs>
  <marker 
    id="arrowhead" 
    markerWidth="10" 
    markerHeight="10" 
    refX="9" 
    refY="3" 
    orient="auto"
  >
    <polygon points="0 0, 10 3, 0 6" fill="#3366ff"/>
  </marker>
</defs>
```

### 4.5 Edge Direction
- ✅ Arrow points FROM dependency TO depended-upon (downward in value chain)
- ✅ If `Business -> Cup of Tea`, arrow points from Business node to Cup of Tea node
- ✅ Edge connects node centers or node boundaries (not random points)

**Validation:**
```javascript
// For dependency "Business -> Cup of Tea"
const businessNode = svg.querySelector('#component-business');
const teaNode = svg.querySelector('#component-cup-of-tea');
const edge = svg.querySelector('line[data-from="Business"][data-to="Cup of Tea"]');

const businessY = parseFloat(businessNode.getAttribute('cy'));
const teaY = parseFloat(teaNode.getAttribute('cy'));
const edgeY1 = parseFloat(edge.getAttribute('y1'));
const edgeY2 = parseFloat(edge.getAttribute('y2'));

// Business should be ABOVE Cup of Tea (higher Y or lower cy depending on coordinate system)
// Edge should connect them
assert(Math.abs(edgeY1 - businessY) < 30, 'Edge should start near Business node');
assert(Math.abs(edgeY2 - teaY) < 30, 'Edge should end near Cup of Tea node');
```

### 4.6 Edge Annotations (Optional)
If the syntax includes semicolon annotations (e.g., `Kettle -> Power; limited by`):
- ✅ Annotation text appears near the edge
- ✅ Rendered as `<text>` element
- ✅ Positioned along or near the edge line
- ✅ Readable font size and color

**Example:**
```xml
<text x="225" y="345" font-size="10" fill="#666" class="edge-annotation">
  limited by
</text>
```

---

## 5. Evolution Arrows

### 5.1 Evolution Arrow Count
- ✅ One evolution arrow per `evolve` statement
- ✅ If `evolve Kettle -> Electric Kettle [product]`, one arrow from Kettle to Electric Kettle
- ✅ No missing evolution arrows
- ✅ No duplicate arrows

**Validation:**
```javascript
// If wardley code has 1 evolve statement
const evolutionArrows = svg.querySelectorAll('line.evolution, path.evolution');
assert(evolutionArrows.length === 1, 
  `Expected 1 evolution arrow, found ${evolutionArrows.length}`);
```

### 5.2 Evolution Arrow Visual Style
Evolution arrows MUST be visually distinct from dependency edges:
- ✅ **Dashed or dotted line**: `stroke-dasharray` attribute (e.g., "5,5")
- ✅ **Different color**: Often purple (#9966ff) or a distinct color
- ✅ **Directional arrow**: `marker-end` showing evolution direction
- ✅ **Horizontal or angled**: Shows movement across evolution stages

**Example evolution arrow:**
```xml
<line 
  x1="200" 
  y1="300" 
  x2="350" 
  y2="300" 
  stroke="#9966ff" 
  stroke-width="2"
  stroke-dasharray="5,5"
  marker-end="url(#evolution-arrowhead)"
  class="evolution"
/>
```

### 5.3 Evolution Arrow Direction
- ✅ Points from LESS evolved to MORE evolved component
- ✅ Generally moves rightward (toward commodity) or horizontally
- ✅ Connects source and target node centers or boundaries

**Validation:**
```javascript
// For "evolve Kettle [custom] -> Electric Kettle [product]"
const kettleNode = svg.querySelector('#component-kettle');
const electricNode = svg.querySelector('#component-electric-kettle');
const arrow = svg.querySelector('line.evolution[data-from="Kettle"]');

const kettleX = parseFloat(kettleNode.getAttribute('cx'));
const electricX = parseFloat(electricNode.getAttribute('cx'));
const arrowX2 = parseFloat(arrow.getAttribute('x2'));

// Electric Kettle should be to the RIGHT of Kettle (more evolved)
assert(electricX > kettleX, 'Evolution should move rightward');
assert(Math.abs(arrowX2 - electricX) < 30, 'Arrow should point to Electric Kettle');
```

---

## 6. Map Axes and Grid

### 6.1 Evolution Axis (X-Axis)
- ✅ Horizontal line or axis at bottom of map
- ✅ Four stage labels: "Genesis", "Custom Built", "Product", "Commodity"
- ✅ Labels positioned at appropriate X coordinates (roughly 12.5%, 37.5%, 62.5%, 87.5%)
- ✅ Optional: Grid lines or background shading for each stage

**Example axis:**
```xml
<line x1="0" y1="550" x2="800" y2="550" stroke="#ccc" stroke-width="1"/>
<text x="100" y="570" font-size="12" fill="#666" text-anchor="middle">Genesis</text>
<text x="300" y="570" font-size="12" fill="#666" text-anchor="middle">Custom Built</text>
<text x="500" y="570" font-size="12" fill="#666" text-anchor="middle">Product</text>
<text x="700" y="570" font-size="12" fill="#666" text-anchor="middle">Commodity</text>
```

### 6.2 Value Chain Axis (Y-Axis)
- ✅ Vertical line or axis on left side of map
- ✅ Label "Value Chain" or "Visibility" (vertical text)
- ✅ Optional: Tick marks or scale indicators

**Example axis:**
```xml
<line x1="50" y1="50" x2="50" y2="550" stroke="#ccc" stroke-width="1"/>
<text x="30" y="300" font-size="12" fill="#666" text-anchor="middle" transform="rotate(-90 30,300)">
  Value Chain
</text>
```

### 6.3 Grid Lines (Optional)
- ✅ Vertical lines separating evolution stages (at 25%, 50%, 75%)
- ✅ Light color (e.g., #eee or #ddd)
- ✅ Behind components (lower z-index or earlier in DOM)
- ✅ Optional: Horizontal grid lines for value chain layers

**Example grid:**
```xml
<g class="grid">
  <line x1="200" y1="50" x2="200" y2="550" stroke="#eee" stroke-width="1"/>
  <line x1="400" y1="50" x2="400" y2="550" stroke="#eee" stroke-width="1"/>
  <line x1="600" y1="50" x2="600" y2="550" stroke="#eee" stroke-width="1"/>
</g>
```

---

## 7. Annotations and Notes

### 7.1 Annotations (If Syntax Supports)
For `annotation <id> <text>` declarations:
- ✅ Text appears on map (as `<text>` element or legend)
- ✅ Numbered or identified by ID
- ✅ Positioned logically (near relevant components or in legend area)
- ✅ Readable font and color

### 7.2 Notes (If Syntax Supports)
For `note <text>` declarations:
- ✅ Text appears on map or in separate notes area
- ✅ Distinct from component labels and annotations
- ✅ Readable and accessible

**Example annotation:**
```xml
<text x="400" y="480" font-size="11" fill="#555" class="annotation">
  [1] Standardising power allows Kettles to evolve faster
</text>
```

---

## 8. Title and Metadata

### 8.1 Map Title
If `title <text>` declared:
- ✅ Title text appears at top of map
- ✅ Larger font than labels (e.g., 18-24px)
- ✅ Centered or left-aligned
- ✅ Bold or emphasized

**Example title:**
```xml
<text x="400" y="30" font-size="20" font-weight="bold" fill="#333" text-anchor="middle">
  Tea Shop
</text>
```

### 8.2 Optional Metadata
- ✅ Optional: Date/timestamp of generation
- ✅ Optional: "Generated by Wardley Map Renderer" watermark
- ✅ Must not obscure map content

---

## 9. Accessibility and Quality

### 9.1 Readability
- ✅ All text is legible (minimum 10px font size)
- ✅ Sufficient contrast between text and background
- ✅ No overlapping labels that obscure each other (where possible)
- ✅ No overlapping components that hide each other

### 9.2 Proper Spacing
- ✅ Components have minimum spacing (e.g., 40px between centers)
- ✅ Edges don't overlap components unnecessarily
- ✅ Labels don't overlap nodes or edges
- ✅ Map uses available space efficiently (not too cramped, not too sparse)

### 9.3 Performance
- ✅ SVG file size is reasonable (< 500KB for typical maps)
- ✅ Renders quickly in browsers
- ✅ No excessive DOM elements

---

## 10. Validation Checklist

Use this checklist to validate a generated SVG:

### Structure
- [ ] Valid SVG document with proper namespace
- [ ] Well-formed XML (parseable)
- [ ] ViewBox and dimensions defined

### Components
- [ ] Correct number of component nodes (matches declarations)
- [ ] All nodes have position (cx/cy or x/y)
- [ ] All nodes have size (r or width/height)
- [ ] All nodes have fill color
- [ ] Node colors match evolution stages
- [ ] Nodes positioned correctly on X-axis (by evolution stage)
- [ ] Nodes positioned correctly on Y-axis (by value chain)
- [ ] Anchors visually distinct from regular components

### Labels
- [ ] Correct number of labels (one per component)
- [ ] All labels have correct text content
- [ ] All labels positioned near their nodes
- [ ] Labels are readable (font size, color, spacing)

### Dependencies
- [ ] Correct number of dependency edges (matches relationships)
- [ ] All edges connect source to target nodes
- [ ] All edges have arrow markers showing direction
- [ ] Arrow direction is correct (points toward dependency)
- [ ] Edges are visually distinct (color, stroke width)
- [ ] Optional: Edge annotations present if declared

### Evolution
- [ ] Correct number of evolution arrows (matches evolve statements)
- [ ] Evolution arrows visually distinct (dashed, different color)
- [ ] Evolution arrows point from less to more evolved
- [ ] Evolution arrows connect correct components

### Axes and Grid
- [ ] X-axis (evolution) present with stage labels
- [ ] Y-axis (value chain) present with label
- [ ] Optional: Grid lines present and styled appropriately

### Annotations
- [ ] Optional: Annotations present if declared
- [ ] Optional: Notes present if declared

### Title
- [ ] Optional: Title present if declared
- [ ] Title properly styled and positioned

### Quality
- [ ] All text is legible
- [ ] No critical overlaps obscuring content
- [ ] Map uses space efficiently
- [ ] File size is reasonable

---

## 11. Test Cases

### Minimal Test Case
```wardley
component A [genesis]
component B [commodity]
A -> B
```

**Expected SVG:**
- 2 nodes (A at left ~12%, B at right ~87%)
- 2 labels (A, B)
- 1 edge with arrow (A → B)
- Axes with stage labels
- Title (if declared)

### Tea Shop Test Case
```wardley
title Tea Shop
anchor Business [custom]
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
```

**Expected SVG:**
- 10 nodes (2 anchors + 8 components)
- 10 labels
- 8 dependency edges
- 1 evolution arrow
- Axes and grid
- Title "Tea Shop"
- All components visible and correctly positioned

---

## 12. Common Failure Modes

### Missing Components
**Symptom:** Declared components don't appear in SVG
**Check:** 
- Layout algorithm skipping certain nodes?
- Nodes positioned outside viewBox?
- Nodes with zero size (r=0)?

### Overlapping Components
**Symptom:** Multiple components at exact same position
**Check:**
- Collision detection in layout algorithm?
- Jitter or spacing for same-stage components?
- Y-axis positioning logic handles fan-out/fan-in?

### Missing Labels
**Symptom:** Nodes present but labels absent
**Check:**
- Label generation step running?
- Labels positioned outside viewBox?
- Labels with display:none or opacity:0?

### Wrong Colors
**Symptom:** Components have incorrect stage colors
**Check:**
- Color mapping function?
- Evolution stage being read correctly?
- Anchors using different color logic?

### Missing Edges
**Symptom:** Dependency arrows don't appear
**Check:**
- Edge generation step running?
- Marker definitions present in <defs>?
- Edges positioned outside viewBox?

### Wrong Edge Direction
**Symptom:** Arrows point wrong way
**Check:**
- Source/target node order in edge logic?
- Marker orientation (marker-start vs marker-end)?
- Dependency interpretation (A->B means A depends on B)?

---

## 13. Automated Validation Tool

Implement a validation function that:

```javascript
function validateWardleyMapSVG(svgString, wardleyCode) {
  const svg = parseSVG(svgString);
  const ast = parseWardley(wardleyCode);
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  // Check component count
  const declaredComponents = ast.components.length;
  const renderedNodes = svg.querySelectorAll('circle, rect').length;
  if (declaredComponents === renderedNodes) {
    results.passed.push('Component count matches');
  } else {
    results.failed.push(
      `Component count mismatch: declared ${declaredComponents}, rendered ${renderedNodes}`
    );
  }
  
  // Check label count
  const renderedLabels = svg.querySelectorAll('text.component-label').length;
  if (declaredComponents === renderedLabels) {
    results.passed.push('Label count matches');
  } else {
    results.failed.push(
      `Label count mismatch: expected ${declaredComponents}, found ${renderedLabels}`
    );
  }
  
  // Check edge count
  const declaredEdges = ast.dependencies.length;
  const renderedEdges = svg.querySelectorAll('line.dependency, path.dependency').length;
  if (declaredEdges === renderedEdges) {
    results.passed.push('Edge count matches');
  } else {
    results.failed.push(
      `Edge count mismatch: declared ${declaredEdges}, rendered ${renderedEdges}`
    );
  }
  
  // Check evolution arrow count
  const declaredEvolutions = ast.evolutions.length;
  const renderedEvolutions = svg.querySelectorAll('line.evolution, path.evolution').length;
  if (declaredEvolutions === renderedEvolutions) {
    results.passed.push('Evolution arrow count matches');
  } else {
    results.failed.push(
      `Evolution arrow count mismatch: declared ${declaredEvolutions}, rendered ${renderedEvolutions}`
    );
  }
  
  // Check for missing specific components
  ast.components.forEach(comp => {
    const node = svg.querySelector(`[data-component="${comp.name}"]`);
    const label = svg.querySelector(`text[data-component="${comp.name}"]`);
    if (!node) {
      results.failed.push(`Missing node for component: ${comp.name}`);
    }
    if (!label) {
      results.failed.push(`Missing label for component: ${comp.name}`);
    }
  });
  
  return results;
}
```

---

## Summary

A valid Wardley Map SVG must include:
1. ✅ All declared components as nodes
2. ✅ All component labels
3. ✅ All dependency edges with arrows
4. ✅ All evolution arrows (if declared)
5. ✅ Correct positioning (X by stage, Y by value chain)
6. ✅ Correct colors (by evolution stage)
7. ✅ Axes with stage labels
8. ✅ Readable text and proper spacing
9. ✅ Title (if declared)
10. ✅ Annotations (if declared)

Use this document as a comprehensive checklist when validating SVG output from the Wardley Map renderer.
