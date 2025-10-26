# Wardley Map Simple - Obsidian Plugin

A simple Obsidian plugin for rendering Wardley Maps from inline code blocks using declarative syntax.

## Overview

This plugin allows you to embed Wardley Maps in your Obsidian notes using code blocks with the `wardley` language identifier, similar to how Mermaid diagrams work. The syntax is declarative and removes the need for manual coordinate positioning - components are automatically laid out based on their evolution stage and dependency relationships.

## Features

- **Declarative Syntax**: No manual positioning required - just declare components, their evolution stages, and dependencies
- **Automatic Layout**: Components are automatically positioned using topological sorting for the value chain (Y-axis) and evolution stages for the X-axis
- **Evolution Stages**: Support for all four evolution stages: Genesis, Custom Built, Product, and Commodity
- **Visual Elements**:
  - Component nodes (anchors displayed differently)
  - Dependency arrows (blue, solid)
  - Evolution arrows (purple, dashed)
  - Grid lines for evolution stages
  - Annotations and notes
- **Error Reporting**: Clear error messages for parsing issues

## Installation

### Manual Installation

1. Download or clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the plugin
4. Copy the following files to your vault's `.obsidian/plugins/wardley-map-simple/` directory:
   - `main.js`
   - `manifest.json`
   - `styles.css`
5. Reload Obsidian
6. Enable "Wardley Map Simple" in Settings → Community Plugins

### Development

To work on the plugin:

```bash
npm install
npm run dev  # Watch mode - rebuilds on file changes
```

## Usage

### Basic Syntax

Create a code block with `wardley` as the language identifier:

````markdown
```wardley
title Your Map Title

component Component Name [evolution-stage]
anchor User Need [evolution-stage]

ComponentA -> ComponentB
ComponentA -> ComponentC -> ComponentD

evolve OldComponent -> NewComponent [product]

annotation 1 Your strategic insight here
```
````

### Evolution Stages

- `genesis` - Novel, uncertain, rapidly changing
- `custom` - Competitive advantage, custom-built
- `product` - Best practices, standardized products
- `commodity` - Utility-like, stable, well-defined

### Examples

#### Minimal Example

````markdown
```wardley
component Business [custom]
component Cup of Tea [product]
component Hot Water [commodity]

Business -> Cup of Tea -> Hot Water
```
````

#### Complete Example

````markdown
```wardley
title Tea Shop Strategy

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
````

More examples can be found in `test-examples.md`.

## Syntax Reference

### Components

```
component Name [stage]
```

Declares a standard component with its evolution stage.

### Anchors (User Needs)

```
anchor Name [stage]
```

Declares an anchor component (user need). Anchors are displayed differently and positioned at the top of the value chain.

### Dependencies

```
ComponentA -> ComponentB
```

Declares that ComponentA depends on ComponentB. Dependencies flow downward in the value chain.

Chain notation is supported:
```
A -> B -> C -> D
```

Optional labels:
```
Kettle -> Power; limited by
```

### Evolution

```
evolve OldComponent -> NewComponent [stage]
```

Shows technological progression from one component to another.

### Annotations

```
annotation 1 Your strategic insight here
```

Adds numbered annotations that appear at the bottom of the map.

### Notes

```
note General observation about the map
```

Adds general notes to the map.

### Title

```
title Your Map Title
```

Sets the map title (optional).

## How It Works

### Automatic Positioning

**X-Axis (Evolution)**: Components are positioned horizontally based on their declared evolution stage:
- Genesis: Left (0-25%)
- Custom: Left-center (25-50%)
- Product: Right-center (50-75%)
- Commodity: Right (75-100%)

**Y-Axis (Value Chain)**: Components are positioned vertically using topological sorting:
- Top: Anchors and components with no outgoing dependencies (user-facing)
- Bottom: Components with no incoming dependencies (infrastructure)
- Middle: Layered based on dependency depth

### Error Handling

The plugin validates:
- Component declarations before references
- No duplicate component names
- Valid evolution stages
- No circular dependencies

Errors are displayed in a red box with line numbers for easy debugging.

## Technical Details

- Built with TypeScript
- Uses esbuild for bundling
- SVG-based rendering
- No external runtime dependencies

## Specification

This plugin implements the [Wardley Inline Syntax Specification](./Wardley-Inline-Syntax-Specification.md).

## Development

### Project Structure

```
.
├── src/
│   ├── main.ts         # Plugin entry point
│   ├── parser.ts       # Syntax parser
│   ├── renderer.ts     # SVG renderer
│   └── types.ts        # Type definitions
├── manifest.json       # Plugin manifest
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── esbuild.config.mjs  # Build config
└── styles.css          # Plugin styles
```

### Building

```bash
npm run build  # Production build
npm run dev    # Development watch mode
```

## License

MIT

## Credits

Wardley Mapping methodology by Simon Wardley - https://wardleymaps.com/

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
