# Developer Notes

Internal documentation for working on this plugin. Quick reference for common tasks, debugging, and testing workflows.

---

## Quick Start for Development

```bash
# First time setup
npm install
npm run build

# Development workflow
npm run dev          # Watch mode - auto rebuilds on file changes

# Testing
node generate-svg.js Tea-Shop.md
node validate-svg.js Tea-Shop.md Tea-Shop.svg
node check-labels.js
node analyze-svg.js
```

---

## Testing Workflow

### The Testing Toolkit

We have 4 standalone JavaScript tools for testing without Obsidian:

1. **`generate-svg.js`** - Generates SVG from Wardley markdown
   ```bash
   node generate-svg.js <input.md> [output.svg]
   ```
   - Standalone implementation (no Obsidian dependency)
   - Uses same parser/renderer logic as plugin
   - Perfect for quick iteration

2. **`validate-svg.js`** - Automated UAT validator
   ```bash
   node validate-svg.js <input.md> <output.svg>
   ```
   - Checks 20 objective criteria
   - Reports pass/fail with score
   - Based on `Wardley-SVG-UAT-Criteria.md`

3. **`check-labels.js`** - Label overlap detection
   ```bash
   node check-labels.js
   ```
   - Analyzes `Tea-Shop.svg` by default
   - Shows component positions and gaps
   - Warns about overlaps

4. **`analyze-svg.js`** - Component analysis
   ```bash
   node analyze-svg.js
   ```
   - Shows all components with positions and colors
   - Detects overlaps
   - Color distribution summary

### Standard Testing Flow

After making changes to renderer/parser:

```bash
# 1. Rebuild plugin
npm run build

# 2. Generate fresh SVG
node generate-svg.js Tea-Shop.md

# 3. Run automated validation
node validate-svg.js Tea-Shop.md Tea-Shop.svg
# Should show: Score: 100.0% (20/20)

# 4. Check for label overlaps
node check-labels.js
# Should show: ✅ No label overlaps detected!

# 5. Inspect component details
node analyze-svg.js
# Shows positions, colors, overlap status

# 6. Visual inspection
# Open Tea-Shop.svg in browser
# Check with MANUAL-UAT-CHECKLIST.md
```

---

## File Organization

### Source Code
```
src/
├── main.ts       - Plugin entry, registers code block processor
├── parser.ts     - Wardley syntax → AST
├── renderer.ts   - AST → SVG string
└── types.ts      - TypeScript interfaces
```

### Testing & Validation
```
generate-svg.js              - Standalone SVG generator
validate-svg.js              - Automated UAT validator
check-labels.js              - Label overlap checker
analyze-svg.js               - Component analysis
test-examples.md             - Multiple test cases
Tea-Shop.md                  - Primary test example
Wardley-SVG-UAT-Criteria.md  - Complete UAT spec
MANUAL-UAT-CHECKLIST.md      - Manual review checklist
```

### Documentation
```
README.md                           - User documentation
CONTRIBUTING.md                     - Developer guide (external)
DEV-NOTES.md                        - Internal dev notes (this file)
Wardley-Inline-Syntax-Specification.md - Syntax specification
```

---

## Common Tasks

### Testing a Change

**Scenario:** Modified overlap prevention algorithm in `renderer.ts`

```bash
# 1. Update both implementations
vim src/renderer.ts           # TypeScript version
vim generate-svg.js           # Standalone version (keep in sync!)

# 2. Build and test
npm run build
node generate-svg.js Tea-Shop.md
node check-labels.js

# 3. Compare before/after
# Look at gap sizes between labels
# Verify all components still visible

# 4. Full validation
node validate-svg.js Tea-Shop.md Tea-Shop.svg

# 5. Visual check
open Tea-Shop.svg  # or drag to browser
```

### Adding a New Feature

**Example:** Adding support for component notes

```bash
# 1. Update type definitions
vim src/types.ts
# Add: componentNotes?: string to Component interface

# 2. Update parser
vim src/parser.ts
# Add parsing logic for: component Foo [stage]; note text

# 3. Update renderer
vim src/renderer.ts
# Add rendering logic to display notes

# 4. Update specification
vim Wardley-Inline-Syntax-Specification.md
# Document the new syntax

# 5. Add test case
vim test-examples.md
# Add example using component notes

# 6. Test
npm run build
node generate-svg.js test-examples.md test-examples.svg
node validate-svg.js test-examples.md test-examples.svg

# 7. Update README
vim README.md
# Add user-facing documentation for new feature
```

### Debugging Parser Issues

```bash
# Quick test without Obsidian
node generate-svg.js problem-map.md

# Parser errors show line numbers:
# ❌ Line 5: Component 'Foo' not declared

# Add debug logging in parser.ts:
console.log('Parsing line:', line);
console.log('Component map:', Array.from(componentMap.keys()));

# Rebuild and test
npm run build
node generate-svg.js problem-map.md
```

### Debugging Renderer Issues

```bash
# Generate SVG
node generate-svg.js Tea-Shop.md

# Check component positions
node analyze-svg.js
# Shows: Component Name, X Position, Y Position, Color

# Check for overlaps
node check-labels.js

# Visual debugging
open Tea-Shop.svg
# Use browser dev tools to inspect SVG elements
# Check circle cx/cy, text positions, etc.

# Add console.log in renderer:
console.log(`Component: ${comp.name}, x: ${comp.x}, y: ${comp.y}`);
```

---

## Key Algorithms

### Topological Sort (Value Chain Y-positioning)

Located in: `src/renderer.ts` → `topologicalSort()`

**Purpose:** Determine vertical positioning based on dependencies

**Algorithm:**
1. Build dependency graph (reversed: dependencies point upward)
2. Calculate in-degree for each component
3. BFS starting from components with in-degree = 0 (bottom of chain)
4. Assign layer numbers (higher layer = higher on Y-axis)
5. Anchors override to Y=0 (always at top)

**Key insight:** If A depends on B, then A is ABOVE B in the value chain

**Debugging:**
```javascript
// In calculatePositions():
console.log(`Component: ${comp.name}, layer: ${layer}, y: ${comp.y}`);
```

### Overlap Prevention (Adaptive Spreading)

Located in: `src/renderer.ts` → `spreadOverlappingComponents()`

**Purpose:** Prevent components and labels from overlapping

**Algorithm:**
1. Group components by `(y-position, evolution-stage)` key
2. For groups with 2+ components:
   - Calculate adaptive spread: `baseSpread * (groupSize / 3)`
   - Base spread = 12% of canvas width
   - Spread components horizontally around center position
3. Maintains evolution stage positioning while adding horizontal offset

**Parameters:**
```typescript
const baseSpread = 0.12;  // 12% of canvas width
const spreadMultiplier = Math.max(1, group.length / 3);
const spreadRange = baseSpread * spreadMultiplier;
```

**Why 12%?**
- Tested with Tea Shop (4 components at same position)
- Labels are ~30-120px wide
- 12% provides ~1-50px gaps between labels
- Scales with group size

**Tuning:** Increase `baseSpread` if labels still overlap

---

## Gotchas & Quirks

### 1. Two Implementations to Keep in Sync

⚠️ **CRITICAL:** `src/renderer.ts` and `generate-svg.js` have duplicate rendering logic

When updating rendering:
1. Update `src/renderer.ts` (TypeScript)
2. Update `generate-svg.js` (JavaScript)
3. Keep algorithms identical

**Why?** `generate-svg.js` is standalone for testing without Obsidian

### 2. Background Rect in SVG

The renderer adds a background rect:
```xml
<rect width="800" height="600" fill="white"/>
```

**Gotcha:** Validators must exclude this when counting components

Fixed in `validate-svg.js`:
```javascript
const rects = allRects.filter(rect =>
  !(rect.getAttribute('width') === '800' &&
    rect.getAttribute('height') === '600')
);
```

### 3. SVG Marker Definitions

Arrow markers MUST be defined in `<defs>` at the START of SVG:
```xml
<svg>
  <defs>
    <marker id="arrowhead">...</marker>
  </defs>
  <!-- rest of SVG -->
</svg>
```

**Why?** Markers referenced by `marker-end="url(#arrowhead)"` must be defined before use

### 4. Label Positioning

Labels are positioned ABOVE circles:
```javascript
const y = padding + comp.y * (height - 2 * padding - 40);
// Label Y = circle Y - radius - 5px offset
const labelY = y - nodeRadius - 5;
```

**Gotcha:** If you change circle Y calculation, update label Y too

### 5. Evolution Stage Colors

Colors are hardcoded in `STAGE_COLORS`:
```typescript
genesis:   { fill: '#FF6B6B', stroke: '#C92A2A' },  // Red
custom:    { fill: '#4ECDC4', stroke: '#0B7285' },  // Teal
product:   { fill: '#45B7D1', stroke: '#1971C2' },  // Blue
commodity: { fill: '#96CEB4', stroke: '#2F9E44' },  // Green
```

**Why these colors?**
- Visually distinct
- Accessible (good contrast)
- Follow evolution metaphor (red=early, green=mature)

### 6. Console Logging for Debugging

Both implementations have debug logging:
```javascript
// src/renderer.ts
console.log(`Component: ${comp.name}, x: ${comp.x}, y: ${comp.y}, stage: ${comp.stage}`);

// generate-svg.js - already enabled
```

**Where to see it:**
- Obsidian: Open Dev Tools (Ctrl+Shift+I)
- Standalone: Terminal output from `node generate-svg.js`

---

## Testing Edge Cases

### Multiple Components at Same Position

**Test case:**
```wardley
component A [commodity]
component B [commodity]
component C [commodity]
component D [commodity]

# All at same Y-level, same evolution stage
Power -> A
Power -> B
Power -> C
Power -> D
```

**Expected:** Components spread horizontally with adequate gaps

**Validate:**
```bash
node generate-svg.js edge-case.md
node check-labels.js
# Should show gaps between all labels
```

### Very Long Component Names

**Test case:**
```wardley
component This Is A Very Long Component Name That Might Cause Issues [product]
component Another Extremely Long Name Here [product]
```

**Expected:** Labels don't overflow or overlap severely

**Validate:** Visual inspection of SVG

### Circular Dependencies

**Test case:**
```wardley
component A [genesis]
component B [custom]
component C [product]

A -> B
B -> C
C -> A  # Circular!
```

**Expected:** Parser error with clear message

**Validate:**
```bash
node generate-svg.js circular.md
# Should show: ❌ Parse errors
```

### Empty Map

**Test case:**
```wardley
title Empty Map
```

**Expected:** Map with title, axes, but no components

**Validate:** Should not crash, display error, or hang

---

## UAT Validation Reference

### Automated Checks (validate-svg.js)

✅ **Always passing (if code is working):**
1. Document structure (SVG, xmlns, viewBox)
2. Component count matches declarations
3. Label count matches components
4. Dependency count matches
5. Evolution arrow count matches
6. All nodes have position/size/fill
7. All edges have arrow markers
8. Evolution arrows are dashed
9. All 4 stage labels present
10. Axes labels present
11. Title present (if declared)
12. Multiple colors used
13. Components use different colors

✅ **Target score:** 100% (20/20)

### Manual Checks (MANUAL-UAT-CHECKLIST.md)

👁️ **Requires human eyes:**
- Readability (font sizes comfortable)
- Visual distinction (anchors vs components)
- Layout quality (spacing, balance)
- Overlap severity (acceptable level)
- Aesthetics (colors, overall appearance)
- Zoom behavior
- Strategic comprehension

### When to Run Full UAT

- Before each release
- After major rendering changes
- After parser changes affecting output
- When adding new visual features

---

## Performance Notes

### Parser Performance

Current implementation is O(n) where n = number of lines:
- Single pass through input
- Simple regex matching
- Map lookups for validation

**Bottlenecks:** None identified. Handles 100+ components easily.

### Renderer Performance

**Complexity:**
- Topological sort: O(V + E) where V=components, E=dependencies
- Overlap detection: O(n²) worst case (n=components)
- SVG generation: O(n) (single pass)

**Overall:** O(n²) worst case, but n is typically small (< 100 components)

**Bottlenecks:** Overlap prevention for 50+ components at same position (rare)

### SVG File Size

Typical sizes:
- Tea Shop (10 components): ~15KB
- Complex map (50 components): ~50-100KB

**Not a concern** for Obsidian use case.

---

## Future Improvements (TODO)

### Testing
- [ ] Add unit tests for parser
- [ ] Add unit tests for renderer
- [ ] Visual regression testing
- [ ] Automated test suite

### Features
- [ ] Component grouping/clusters
- [ ] Component sizing by importance
- [ ] Inertia indicators
- [ ] Movement arrows
- [ ] Multiple maps in one block
- [ ] Export to PNG/PDF

### Rendering
- [ ] Better label positioning (intelligent placement)
- [ ] Curved dependency arrows (reduce visual clutter)
- [ ] Component icons/shapes
- [ ] Customizable colors via settings
- [ ] Zoom/pan controls

### Developer Experience
- [ ] Hot reload in Obsidian dev mode
- [ ] Better error messages with suggestions
- [ ] Schema validation for syntax

---

## Useful Debugging Commands

```bash
# Quick validation after change
npm run build && node validate-svg.js Tea-Shop.md Tea-Shop.svg

# Test all examples
for file in test-examples/*.md; do
  node generate-svg.js "$file"
  node validate-svg.js "$file" "${file%.md}.svg"
done

# Find all wardley code blocks in vault
grep -r "^\`\`\`wardley" /path/to/vault

# Compare SVG before/after change
diff Tea-Shop.svg.backup Tea-Shop.svg

# Profile rendering (add to renderer.ts)
console.time('render');
const svg = renderWardleyMap(map);
console.timeEnd('render');
```

---

## Quick Reference

### Build & Test
```bash
npm run build                                    # Production build
npm run dev                                      # Watch mode
node generate-svg.js Tea-Shop.md                # Generate SVG
node validate-svg.js Tea-Shop.md Tea-Shop.svg   # Validate
node check-labels.js                            # Check overlaps
node analyze-svg.js                             # Analyze components
```

### File Locations
- Source: `src/*.ts`
- Built plugin: `main.js`
- Tests: `Tea-Shop.md`, `test-examples.md`
- Validation: `validate-svg.js`, `check-labels.js`, `analyze-svg.js`
- Specs: `Wardley-Inline-Syntax-Specification.md`, `Wardley-SVG-UAT-Criteria.md`

### Key Functions
- `parseWardleyMap()` - src/parser.ts:13
- `renderWardleyMap()` - src/renderer.ts:44
- `calculatePositions()` - src/renderer.ts:204
- `topologicalSort()` - src/renderer.ts:270
- `spreadOverlappingComponents()` - src/renderer.ts:239

---

## Notes to Self

- Always run full validation before committing rendering changes
- Keep both renderer implementations in sync (TypeScript + standalone)
- Test with Tea Shop - it has good coverage of features
- Check browser console in Obsidian for runtime errors
- Label overlap is the most common issue - test with check-labels.js
- Visual inspection still important - open SVG in browser
- 12% spread works for current test cases, may need adjustment for edge cases

---

**Last updated:** After fixing label overlap with 12% adaptive spread
**Current test results:** Tea Shop validates at 100% (20/20 automated checks)
