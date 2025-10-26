# Contributing to Wardley Map Simple

Thank you for your interest in contributing! This guide is for developers who want to work on the plugin.

---

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm
- Git
- Obsidian (for testing)

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/BlockSecCA/wardley_map_simple_obsidian_plugin.git
   cd wardley_map_simple_obsidian_plugin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the plugin**
   ```bash
   npm run build
   ```

4. **Set up development vault**
   - Create or use an existing Obsidian vault
   - Create `.obsidian/plugins/wardley-map-simple/` directory
   - Symlink or copy `main.js`, `manifest.json`, and `styles.css` to that directory

5. **Enable the plugin**
   - Open Obsidian
   - Go to Settings → Community Plugins
   - Enable "Wardley Map Simple"

---

## Development Workflow

### Watch Mode

For active development with auto-rebuild:

```bash
npm run dev
```

This watches for file changes in `src/` and rebuilds automatically. Reload Obsidian to see changes.

### Building

Production build:

```bash
npm run build
```

This:
1. Runs TypeScript compiler (`tsc -noEmit -skipLibCheck`)
2. Bundles with esbuild (`esbuild.config.mjs production`)
3. Outputs `main.js` (ready for Obsidian)

---

## Project Structure

```
wardley_map_simple_obsidian_plugin/
├── src/
│   ├── main.ts           # Plugin entry point - registers code block processor
│   ├── parser.ts         # Parses Wardley syntax into AST
│   ├── renderer.ts       # Generates SVG from AST
│   └── types.ts          # TypeScript type definitions
├── manifest.json         # Obsidian plugin manifest
├── package.json          # npm dependencies and scripts
├── tsconfig.json         # TypeScript compiler configuration
├── esbuild.config.mjs    # esbuild bundler configuration
├── styles.css            # Plugin CSS styles
├── versions.json         # Version compatibility mapping
└── README.md             # User-facing documentation
```

### Key Files

**`src/main.ts`**
- Entry point for the plugin
- Registers `wardley` code block processor with Obsidian
- Calls parser and renderer

**`src/parser.ts`**
- Parses Wardley syntax line-by-line
- Validates components, dependencies, evolutions
- Returns AST or error list

**`src/renderer.ts`**
- Takes parsed AST and generates SVG string
- Handles positioning (X by evolution, Y by topological sort)
- Implements overlap prevention via adaptive spreading
- Adds visual elements (circles, arrows, labels, grid)

**`src/types.ts`**
- TypeScript interfaces for components, dependencies, evolutions
- Type definitions for AST and render options

---

## Architecture

### Data Flow

```
User Input (Wardley code)
    ↓
Parser (parser.ts)
    ↓
AST (Abstract Syntax Tree)
    ↓
Renderer (renderer.ts)
    ↓
SVG String
    ↓
DOM (injected by main.ts)
```

### Key Algorithms

**1. Topological Sorting (Y-axis positioning)**
- Uses BFS to assign layers based on dependencies
- Components with no dependencies → bottom (layer 0)
- Components depending on layer N → layer N+1
- Anchors always positioned at top (Y=0)

**2. Overlap Prevention**
- Groups components by (Y-position, evolution stage)
- Spreads overlapping components horizontally
- Adaptive spread: base 12% + multiplier for larger groups
- Prevents both circle and label overlaps

**3. Evolution Stage Mapping (X-axis)**
```typescript
genesis:   12.5%  (0.125)
custom:    37.5%  (0.375)
product:   62.5%  (0.625)
commodity: 87.5%  (0.875)
```

---

## Testing

### Manual Testing

Use the test files in the repository:

```bash
# Generate SVG from markdown
node generate-svg.js Tea-Shop.md

# Validate SVG output
node validate-svg.js Tea-Shop.md Tea-Shop.svg

# Check for label overlaps
node check-labels.js

# Analyze component positions
node analyze-svg.js
```

### Test Cases

- **`Tea-Shop.md`** - Classic Wardley Mapping example (10 components, 8 dependencies, 1 evolution)
- **`test-examples.md`** - Multiple test cases from minimal to complex
- **`Wardley-Inline-Syntax-Specification.md`** - Full syntax specification

### Automated Testing (TODO)

Future work:
- Unit tests for parser
- Unit tests for renderer
- Integration tests for full pipeline
- Visual regression tests for SVG output

---

## Making Changes

### Adding Features

1. **Update types** (`src/types.ts`) if needed
2. **Modify parser** (`src/parser.ts`) for new syntax
3. **Update renderer** (`src/renderer.ts`) for new visuals
4. **Test with examples**
5. **Update specification** (`Wardley-Inline-Syntax-Specification.md`)
6. **Update README** for user-facing changes

### Bug Fixes

1. **Reproduce the issue** - create a test case
2. **Identify the component** - parser, renderer, or main?
3. **Fix and test**
4. **Verify with validation tools**

### Code Style

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use descriptive variable names
- Add comments for complex logic
- Follow existing code patterns

---

## Testing Your Changes

### 1. Test in Obsidian

- Reload the plugin after building
- Test with various Wardley code examples
- Check browser console for errors (Ctrl+Shift+I)

### 2. Use Validation Tools

```bash
# Generate and validate SVG
npm run build
node generate-svg.js test-examples.md
node validate-svg.js test-examples.md test-examples.svg
```

### 3. Visual Inspection

Open generated SVG files in a browser:
- Check component positions
- Verify colors match evolution stages
- Ensure no overlaps
- Test at different zoom levels

---

## Submitting Changes

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
   ```bash
   git commit -m "Add feature: description of what changed"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**
   - Describe what changed and why
   - Reference any related issues
   - Include test results if applicable

### Commit Message Guidelines

Use clear, descriptive commit messages:

```
Good:
- "Fix label overlap for 4+ components at same position"
- "Add support for multi-line component names"
- "Improve color contrast for genesis stage"

Less good:
- "Fix bug"
- "Update code"
- "Changes"
```

---

## Release Process

### Version Numbering

We use Semantic Versioning (semver):
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes

### Creating a Release

1. Update version in `manifest.json` and `package.json`
2. Update `versions.json` with new version
3. Build the plugin: `npm run build`
4. Create git tag: `git tag v0.1.0`
5. Push tag: `git push origin v0.1.0`
6. Create GitHub release with:
   - `main.js`
   - `manifest.json`
   - `styles.css`

---

## Useful Development Commands

```bash
# Watch mode (auto-rebuild)
npm run dev

# Production build
npm run build

# Generate SVG from markdown
node generate-svg.js <input.md> [output.svg]

# Validate SVG against UAT criteria
node validate-svg.js <input.md> <output.svg>

# Check for label overlaps
node check-labels.js

# Analyze SVG component positions
node analyze-svg.js
```

---

## Resources

### Obsidian Plugin Development
- [Official Plugin API](https://github.com/obsidianmd/obsidian-api)
- [Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
- [Plugin Developer Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)

### Wardley Mapping
- [Wardley Maps](https://wardleymaps.com/)
- [Book (free online)](https://medium.com/wardleymaps)
- [Community](https://map-camp.com/)

### Project-Specific
- [Wardley Inline Syntax Specification](./Wardley-Inline-Syntax-Specification.md)
- [UAT Criteria](./Wardley-SVG-UAT-Criteria.md)
- [Manual UAT Checklist](./MANUAL-UAT-CHECKLIST.md)

---

## Questions?

- **Issues**: [GitHub Issues](https://github.com/BlockSecCA/wardley_map_simple_obsidian_plugin/issues)
- **Discussions**: [GitHub Discussions](https://github.com/BlockSecCA/wardley_map_simple_obsidian_plugin/discussions)

---

Thank you for contributing to Wardley Map Simple! 🗺️
