# wardley-map-simple

> PUBLIC REPO. No secrets, no PII, no internal references.

Obsidian plugin that renders Wardley Maps from declarative `wardley` code blocks. v2.0.0.

## Architecture

```
Wardley code block -> Parser (parser.ts) -> AST (types.ts) -> Renderer (renderer.ts) -> SVG -> DOM
```

**Entry point**: `src/main.ts` registers `wardley` code block processor with Obsidian.

**Build**: `npm run build` (tsc + esbuild) -> `main.js` (deployed to Obsidian plugins folder alongside `manifest.json` and `styles.css`).

**Tests**: `npm test` runs `test.mts` via Node's built-in test runner. 65 tests covering parser, layout, renderer, and backward compatibility.

## Key Design Decision

No coordinates. X-axis from evolution stage band, Y-axis from dependency depth (longest path from root). This is deliberate: Wardley maps are oriented graphs, not coordinate spaces.

## Source Files

- `src/types.ts` -- All interfaces: Component, Dependency, Evolution, EvolveTo, Flow, Pipeline, Annotation
- `src/parser.ts` -- Line-by-line regex parser. Stateful only during pipeline blocks (indentation tracking). Returns `{map, errors}`.
- `src/renderer.ts` -- SVG string builder. Layout in `calculatePositions()`, rendering as SVG elements with CSS classes.
- `src/main.ts` -- Obsidian plugin registration (thin wrapper).

## Layout Algorithm

`longestPathFromRoot()` in renderer.ts:
- Roots: anchors + nodes with no incoming dependencies
- BFS from roots, depth = longest path from any root
- Anchors forced to Y=0, evolved components inherit source Y
- Pipeline sub-components inherit parent Y, keep their stage X
- Disconnected components: Y estimated from stage (genesis=shallow, commodity=deep)
- X spreading: components at same (Y, stage) sorted by average neighbor X to reduce crossings

## Supported Syntax

```
title Text
component Name [genesis|custom|product|commodity]
component Name [stage] (build|buy|outsource|market)
anchor Name [stage]
A -> B                    # dependency
A -> B -> C               # chain
A -> B; label             # labeled dependency
evolve A -> B [stage]     # component-to-component evolution
evolve A [stage]          # evolve to position
inertia ComponentName     # resistance to change marker
A +> B                    # forward flow (orange)
A +< B                    # backward flow
A +<> B                   # bidirectional flow
pipeline Parent           # pipeline block start
  component Sub [stage]   # indented sub-components
annotation N text         # numbered annotation
note text                 # general note
# comment                 # ignored
```

## Testing

```bash
npm test                                              # 65 tests
node tools/generate-svg.mjs examples/Tea-Shop.md      # standalone SVG generation
```

## Repo Structure

```
src/                 Source (TypeScript)
examples/            Sample maps (.md) and reference SVG
tools/               Standalone SVG generator and validators
test.mts             Test suite
main.js              Built plugin artifact (committed)
manifest.json        Obsidian plugin manifest
styles.css           Plugin styles with CSS custom properties
```
