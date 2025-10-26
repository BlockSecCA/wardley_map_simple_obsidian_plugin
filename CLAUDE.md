# Claude Agent Context

**Purpose:** Quick context reconstruction for AI agents working on this project. This file helps resume work efficiently without re-analyzing the entire codebase.

**Last Updated:** Version 1.0.0 release preparation complete (October 2025)

---

## Project State Summary

### ✅ What's Working

**Core Functionality:**
- ✅ Parser: Handles all syntax from specification
- ✅ Renderer: Generates valid SVG with automatic layout
- ✅ Topological sorting: Value chain positioning works correctly
- ✅ Overlap prevention: Adaptive spreading (12% base) prevents component and label overlaps
- ✅ Color coding: Evolution stages color-coded (Red/Teal/Blue/Green)
- ✅ Error handling: Clear error messages with line numbers

**Testing:**
- ✅ Automated validator: 100% pass rate on Tea Shop example
- ✅ Label overlap detection: No overlaps with current algorithm
- ✅ Test utilities: All 4 tools working (generate-svg, validate-svg, check-labels, analyze-svg)

**Documentation:**
- ✅ README.md: User-focused, comprehensive
- ✅ CONTRIBUTING.md: External developer guide
- ✅ DEV-NOTES.md: Internal developer reference
- ✅ CLAUDE.md: This file (AI agent context)

### 🎯 Current Status

**Last Test Results:**
```
Tea Shop Example (10 components, 8 dependencies, 1 evolution):
- Automated validation: 100% (21/21 checks passed)
- Label overlaps: None detected
- All components visible and correctly positioned
- Evolution alignment: Verified (Kettle and Electric Kettle at Y=324.0)
```

**Current Version:** 1.0.0

**Branch:** `main` (feature branches merged and deleted)

**Built Artifacts:**
- `main.js` - 17KB, committed to repo
- `Tea-Shop.svg` - Generated test output, committed

---

## Critical Context for Resumption

### The Four Critical Rendering Bugs We Fixed

**PROBLEM 1: Component Overlap (FIXED)**
- **Issue:** Components with same evolution stage + same Y-layer rendered at identical coordinates
- **Example:** Cup, Tea, Water all at (0.625, 0.8) → only one visible
- **Fix:** Added `spreadOverlappingComponents()` function
- **Location:** `src/renderer.ts:239`

**PROBLEM 2: Anchor Color Hardcoding (FIXED)**
- **Issue:** Anchors hardcoded to red, ignoring evolution stages
- **Example:** `anchor Public [commodity]` was red instead of green
- **Fix:** Replaced hardcoded colors with `getStageColors(comp.stage)`
- **Location:** `src/renderer.ts:146`

**PROBLEM 3: Label Overlap (FIXED)**
- **Issue:** Component circles spread 18px apart, but labels 30-120px wide
- **Example:** 4 commodity components at bottom had overlapping labels by up to 17px
- **Fix:** Increased spread from 8% to 12%, made it adaptive
- **Location:** `src/renderer.ts:258` - `baseSpread = 0.12`

**PROBLEM 4: Evolved Component Y-Axis Misalignment (FIXED - PR #1)**
- **Issue:** Evolved components positioned independently by topological sort, not aligned with source
- **Example:** Kettle at Y=324, Electric Kettle at Y=412 (should both be Y=324)
- **Root Cause:** Electric Kettle had no dependencies, so topological sort placed it at bottom layer
- **Fix:** After topological sort, evolved components inherit Y-position from source component
- **Location:** `src/renderer.ts:227-237` and `generate-svg.js:295-305`
- **Rationale:** Evolution = X-axis (maturity), NOT Y-axis (value chain)

**Do NOT revert these fixes!** They're tested and working.

---

## Architecture Quick Reference

### Data Flow
```
Wardley Code (markdown)
    ↓ [main.ts]
Parser (parser.ts)
    ↓
AST (Abstract Syntax Tree)
    ↓
Renderer (renderer.ts)
    ↓
SVG String
    ↓
DOM Injection
```

### Key Functions You'll Touch

**Parser (`src/parser.ts`):**
- `parseWardleyMap(source)` - Main entry, returns `{map, errors}`
- `parseDependencyChain()` - Handles `A -> B -> C` syntax
- `isValidStage()` - Validates evolution stages

**Renderer (`src/renderer.ts`):**
- `renderWardleyMap(map, options)` - Main entry, returns SVG string
- `calculatePositions(map)` - Sets X/Y for all components
- `topologicalSort()` - Determines Y-axis positioning
- `spreadOverlappingComponents()` - Prevents overlaps (CRITICAL: keep this working)
- `getStageColors(stage)` - Returns fill/stroke colors

**Types (`src/types.ts`):**
- `Component` - Has name, stage, isAnchor, x?, y?
- `Dependency` - Has from, to, label?
- `WardleyMap` - Full map structure

---

## Critical Implementation Details

### Why 12% Spread?

Tested with Tea Shop example (4 components at same position):
- Labels estimated at 7px per character
- "Electric Kettle" = 105px wide
- Need ~50px gaps minimum for readability
- 12% of 800px canvas = 96px
- For 4 components: 96px / 3 gaps = 32px per gap ✅

**Adaptive multiplier:**
```typescript
spreadMultiplier = Math.max(1, group.length / 3)
```
- 2 components: multiplier = 1.0 → 12% spread
- 3 components: multiplier = 1.0 → 12% spread
- 4 components: multiplier = 1.33 → 16% spread
- 6 components: multiplier = 2.0 → 24% spread

**If labels overlap again:** Increase `baseSpread` to 0.14 or 0.15

### Evolution Stage Colors

```typescript
genesis:   '#FF6B6B' (Red)    - Novel, uncertain
custom:    '#4ECDC4' (Teal)   - Custom built
product:   '#45B7D1' (Blue)   - Standardized
commodity: '#96CEB4' (Green)  - Utility
```

**Why these?**
- Visually distinct
- Follow evolution metaphor (red→green = raw→mature)
- Tested for accessibility
- User documented in README.md

**Don't change without user notice!**

### Topological Sort Direction

**CRITICAL:** Dependencies in our syntax flow TOWARD what's needed:
```wardley
A -> B    # A depends on B
```

In the value chain:
- A is ABOVE B (A is user-facing, B is infrastructure)
- Graph is REVERSED for topological sort
- B is at lower layer, A is at higher layer

**Code:**
```typescript
// Build graph REVERSED: dependencies point upward
graph.get(dep.to)?.push(dep.from);
```

**Don't flip this direction!** It's correct as-is.

---

## Dual Implementation Gotcha

⚠️ **CRITICAL:** Two rendering implementations exist:

1. **`src/renderer.ts`** - TypeScript (used by Obsidian plugin)
2. **`generate-svg.js`** - JavaScript (standalone testing tool)

**They MUST be kept in sync!**

When you modify rendering logic:
1. Change `src/renderer.ts`
2. Change `generate-svg.js` (same algorithm)
3. Build: `npm run build`
4. Test: `node generate-svg.js Tea-Shop.md`
5. Validate: `node validate-svg.js Tea-Shop.md Tea-Shop.svg`

**If only one is updated:** Tests will pass but plugin will be broken (or vice versa)

---

## Testing Workflow (Mandatory Before Committing)

After ANY change to parser or renderer:

```bash
# 1. Build
npm run build

# 2. Generate fresh SVG
node generate-svg.js Tea-Shop.md

# 3. Automated validation
node validate-svg.js Tea-Shop.md Tea-Shop.svg
# MUST show: Score: 100.0% (21/21)

# 4. Label overlap check
node check-labels.js
# MUST show: ✅ No label overlaps detected!

# 5. Component analysis
node analyze-svg.js
# Verify: 10 components, 3 colors, no overlaps

# 6. Visual check (if possible)
# Open Tea-Shop.svg in browser
# Verify all components visible and readable
```

**Don't skip steps 3-4!** They've caught bugs multiple times.

---

## What NOT to Do

### ❌ Don't Remove Debug Logging

These console.log statements are intentional:
```typescript
// In calculatePositions():
console.log(`Component: ${comp.name}, x: ${comp.x}, y: ${comp.y}, stage: ${comp.stage}`);
```

They help debug positioning issues. Leave them in.

### ❌ Don't Change Coordinate Math Without Testing

The coordinate system is:
- X: 0-1 range (0=left, 1=right)
- Y: 0-1 range (0=top, 1=bottom)
- Converted to pixels: `padding + coord * (dimension - 2*padding)`

If you change this, test extensively!

### ❌ Don't Merge Standalone Files Into Plugin

`generate-svg.js`, `validate-svg.js`, etc. are **intentionally separate**

They work without Obsidian for fast iteration. Keep them standalone.

### ❌ Don't Simplify Overlap Algorithm

The adaptive spreading looks complex but it's necessary:
```typescript
const spreadRange = baseSpread * Math.max(1, group.length / 3);
```

This prevents overlaps for 2-10 components at same position. Don't simplify it to a fixed value.

### ❌ Don't Change Evolution Stage Positions

```typescript
genesis:   0.125  (12.5%)
custom:    0.375  (37.5%)
product:   0.625  (62.5%)
commodity: 0.875  (87.5%)
```

These are centered in their respective quarters. Changing them will confuse users who expect Wardley Map conventions.

---

## Known Edge Cases

### Handled ✅

1. **Multiple components at same position** - Spread horizontally
2. **Long component names** - Accounted for in spread calculation
3. **Anchors override Y-position** - Always at top (Y=0)
4. **Background rect in SVG** - Excluded from component count in validators
5. **Circular dependencies** - Parser detects and reports error

### Not Yet Handled ⚠️

1. **50+ components** - May need performance optimization
2. **Very long chains** (20+ dependencies) - May need better Y-distribution
3. **Component names with special chars** - May break SVG
4. **Unicode in component names** - Untested
5. **Maps with no dependencies** - All components at same Y-level (may overlap)

---

## Quick Resumption Checklist

When resuming work on this project:

- [ ] Check current branch: Should be `main` (v1.0.0 released)
- [ ] Read this file (CLAUDE.md) completely
- [ ] Run tests to confirm current state:
  ```bash
  npm run build
  node generate-svg.js Tea-Shop.md
  node validate-svg.js Tea-Shop.md Tea-Shop.svg
  ```
- [ ] Verify test results: 100% validation (21/21), no label overlaps
- [ ] Check if v1.0.0 release has been created on GitHub
- [ ] Review any user feedback/issues since last session
- [ ] Check what task user is requesting

---

## Decision Rationale

### Why SVG Not Canvas?

- ✅ Scalable (sharp at any zoom)
- ✅ Accessible (text is selectable, screen-reader friendly)
- ✅ Simple (no external libraries needed)
- ✅ Inspectable (browser dev tools work)

### Why Topological Sort for Y-axis?

- ✅ Respects value chain semantics (dependencies flow downward)
- ✅ Automatic - user doesn't specify Y-coordinates
- ✅ Works for any DAG (Directed Acyclic Graph)

### Why No Manual Positioning?

- ✅ Simpler syntax (no coordinates to remember)
- ✅ Automatic layout is "good enough" for most cases
- ✅ Matches specification goal: declarative, not imperative

### Why Spread Components Instead of Rejecting?

- ✅ Better UX - show user's map, even if imperfect
- ✅ Common scenario - commodities often cluster
- ✅ User can adjust by changing evolution stages if needed

---

## Files You'll Commonly Edit

### Making syntax changes:
1. `src/parser.ts` - Add parsing logic
2. `src/types.ts` - Add type definitions if needed
3. `Wardley-Inline-Syntax-Specification.md` - Document syntax
4. `test-examples.md` - Add test case
5. `README.md` - Update user documentation

### Making rendering changes:
1. `src/renderer.ts` - TypeScript version
2. `generate-svg.js` - Standalone version (MUST sync!)
3. Test with all 4 tools
4. Visual check SVG output

### Bug fixes:
1. Identify component (parser vs renderer)
2. Add test case to `test-examples.md`
3. Fix the bug
4. Verify with `validate-svg.js`
5. Don't skip the testing workflow!

---

## Common Questions to Ask Yourself

Before making changes:

1. **Does this change affect both renderer implementations?**
   - If yes: Update `src/renderer.ts` AND `generate-svg.js`

2. **Have I tested with Tea Shop example?**
   - Run full testing workflow (build → generate → validate → check-labels)

3. **Will this break existing maps?**
   - Consider backward compatibility

4. **Does this need documentation updates?**
   - Syntax changes: Update specification + README
   - Rendering changes: May need README update if visual appearance changes

5. **Have I run the validators?**
   - `validate-svg.js` must show 100%
   - `check-labels.js` must show no overlaps

---

## Current Capabilities

### What the Plugin CAN Do ✅

- Parse Wardley syntax (components, anchors, dependencies, evolutions)
- Generate SVG with automatic layout
- Position by evolution stage (X-axis)
- Position by value chain via topological sort (Y-axis)
- Prevent component overlaps
- Prevent label overlaps (mostly)
- Color code by evolution stage
- Show dependencies as blue arrows
- Show evolution as purple dashed arrows
- Display grid lines for evolution stages
- Show title, annotations, axes labels
- Handle chains: `A -> B -> C`
- Handle dependency labels: `A -> B; note`
- Error reporting with line numbers

### What the Plugin CANNOT Do Yet ❌

- Manual component positioning (by design)
- Curved arrows
- Component grouping/clusters
- Component sizing by importance
- Inertia indicators
- Movement arrows
- Multiple maps in one block
- Interactive zooming/panning
- Export to PNG/PDF
- Component icons/custom shapes
- User-customizable colors (uses fixed palette)

---

## Success Metrics

**How to know if a change is good:**

1. **Automated validation:** Still 100% (21/21)
2. **No label overlaps:** `check-labels.js` shows gaps > 0px
3. **All components visible:** Count in `analyze-svg.js` matches declared count
4. **Evolution alignment:** Evolved components at same Y as source
5. **Visually reasonable:** Open SVG - does it look good?
6. **No new errors:** Parser doesn't throw unexpected errors
7. **Backward compatible:** Old examples still render correctly

**If any metric regresses, investigate why before committing.**

---

## Last Known Good State

**Version:** 1.0.0 (Released)

**Branch:** `main`

**Commit:** ac0a572 (Merge pull request #3)

**Test Results:**
```
✅ Tea Shop: 10/10 components, 8/8 dependencies, 1/1 evolution
✅ Validation: 100% (21/21 automated checks)
✅ Label overlaps: None
✅ Evolution alignment: Kettle and Electric Kettle both at Y=324.0
✅ Visual inspection: All readable, good spacing
```

**Release Status:**
- Version bumped to 1.0.0 in manifest.json and package.json
- Feature branches merged and deleted
- Ready for GitHub Release creation with artifacts:
  - main.js (17KB)
  - manifest.json
  - styles.css
  - wardley-map-simple-1.0.0.zip (convenience bundle)

**If things break:** You can `git log` and `git diff` to see what changed since this state.

---

## Remember

- This plugin WORKS. Don't break it with "improvements" that aren't tested.
- The testing workflow exists for a reason - use it.
- Two implementations must stay in sync - check both.
- 12% spread works - don't reduce it without testing.
- Color scheme is user-documented - don't change without updating README.
- Visual inspection still matters - automated tests aren't everything.

---

**End of Context File**

When you resume: Read this file, run the tests, verify current state, then proceed with user's request.
