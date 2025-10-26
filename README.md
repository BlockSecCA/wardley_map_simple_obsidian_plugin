# Wardley Map Simple - Obsidian Plugin

Create strategic Wardley Maps directly in your Obsidian notes using simple, declarative syntax. No manual positioning, no coordinates - just describe your components and dependencies, and let the plugin handle the layout.

## What is Wardley Mapping?

[Wardley Mapping](https://wardleymaps.com/) is a strategic planning technique that helps you visualize the evolution of components in your business, technology, or knowledge domain. Maps show:
- **Value chain** (what depends on what)
- **Evolution stages** (genesis → custom → product → commodity)
- **Strategic positioning** and opportunities

This plugin makes it easy to create Wardley Maps in Obsidian using code blocks, similar to Mermaid diagrams.

---

## Quick Start

Create a code block with `wardley` and start mapping:

````markdown
```wardley
title My First Map

anchor User Need [genesis]
component Our Solution [custom]
component Cloud Platform [commodity]

User Need -> Our Solution -> Cloud Platform
```
````

**That's it!** The plugin will automatically position components based on their evolution stage and value chain relationships.

---

## Installation

### Option 1: Manual Installation (Current)

1. Download the latest release from GitHub
2. Extract the ZIP file
3. Copy the `wardley-map-simple` folder to your vault's `.obsidian/plugins/` directory
4. In Obsidian, go to Settings → Community Plugins
5. Click "Reload plugins" (if needed)
6. Enable "Wardley Map Simple"

### Option 2: Community Plugins (Coming Soon)

Search for "Wardley Map Simple" in Obsidian's Community Plugins browser.

---

## Basic Usage

### 1. Create Components

Components are the building blocks of your map:

```wardley
component Cup of Tea [product]
component Hot Water [commodity]
component Kettle [custom]
component Power [commodity]
```

**Evolution stages** (left to right on the map):
- `genesis` - Novel, uncertain, rapidly changing (Red)
- `custom` - Competitive advantage, custom-built (Teal)
- `product` - Best practices, standardized (Blue)
- `commodity` - Utility-like, stable, well-defined (Green)

### 2. Add User Needs (Anchors)

Anchors represent user needs and appear at the top of the value chain:

```wardley
anchor Business [custom]
anchor Public [commodity]
```

### 3. Define Dependencies

Show what depends on what using arrows:

```wardley
Business -> Cup of Tea
Cup of Tea -> Hot Water
Hot Water -> Kettle
Kettle -> Power
```

**Chain notation** for linear dependencies:
```wardley
Business -> Cup of Tea -> Hot Water -> Kettle -> Power
```

**Optional labels** to add context:
```wardley
Hot Water -> Kettle; limited by
```

### 4. Show Evolution

Illustrate how components evolve over time:

```wardley
component Manual Kettle [custom]
component Electric Kettle [product]

evolve Manual Kettle -> Electric Kettle [product]
```

Evolution arrows appear as dashed purple lines.

### 5. Add Strategic Insights

```wardley
annotation 1 Standardising power enables faster kettle evolution
annotation 2 Hot water is well understood and commoditized
```

Annotations appear at the bottom of your map.

---

## Complete Example: Tea Shop

See this classic Wardley Mapping example in action - check out [`Tea-Shop.md`](./Tea-Shop.md) in this repository!

````markdown
```wardley
title Tea Shop Strategy

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
Hot Water -> Kettle; limited by
Kettle -> Power

evolve Kettle -> Electric Kettle [product]

annotation 1 Standardising power allows Kettles to evolve faster
annotation 2 Hot water is obvious and well known
```
````

This creates a map showing:
- ✅ User needs (Business, Public) at the top
- ✅ Value chain flowing downward to infrastructure (Power)
- ✅ Components positioned by evolution stage (left = genesis, right = commodity)
- ✅ Color-coded by maturity (red → teal → blue → green)
- ✅ Evolution pathway from Kettle to Electric Kettle

---

## Understanding Your Maps

### Map Layout

**Horizontal (X-axis) - Evolution:**
- Left side: Genesis (novel, uncertain) - **Red**
- Left-center: Custom (competitive advantage) - **Teal**
- Right-center: Product (standardized) - **Blue**
- Right side: Commodity (utility, stable) - **Green**

**Vertical (Y-axis) - Value Chain:**
- Top: User needs and visible components
- Middle: Supporting components
- Bottom: Infrastructure and foundations

**The plugin automatically positions components** using:
- Evolution stage for horizontal placement
- Topological sorting of dependencies for vertical placement
- Smart spreading to prevent overlaps

### Visual Elements

- **Circles**: Regular components
- **Blue solid arrows**: Dependencies (what needs what)
- **Purple dashed arrows**: Evolution (how things progress)
- **Grid lines**: Evolution stage boundaries
- **Color coding**: Component maturity by evolution stage

---

## Syntax Quick Reference

### Components & Anchors
```wardley
component Name [stage]          # Regular component
anchor User Need [stage]        # User need (top of chain)
```

### Dependencies
```wardley
ComponentA -> ComponentB        # A depends on B
A -> B -> C -> D               # Chain notation
Kettle -> Power; limited by    # With annotation
```

### Evolution
```wardley
evolve OldTech -> NewTech [product]    # Shows progression
```

### Metadata
```wardley
title Your Map Title           # Optional title
annotation 1 Your insight      # Numbered insights
note General observation       # Map notes
```

### Evolution Stages
- `genesis` - Uncharted territory
- `custom` - Bespoke solutions
- `product` - Off-the-shelf products
- `commodity` - Standardized utilities

---

## Troubleshooting

### Map doesn't appear
- ✅ Check that you used triple backticks: ` ```wardley `
- ✅ Verify the plugin is enabled in Settings → Community Plugins
- ✅ Try reloading Obsidian

### Components are missing
- ✅ Make sure components are declared before they're referenced
- ✅ Check for typos in component names (they're case-sensitive)
- ✅ Verify evolution stage is valid (genesis, custom, product, commodity)

### "Parse error" message appears
- ✅ Check the error message - it includes the line number
- ✅ Verify syntax: `component Name [stage]`
- ✅ Make sure square brackets are present and stage name is correct
- ✅ Check that dependencies reference declared components

### Components overlap
- ✅ This is expected when multiple components share the same evolution stage and value chain layer
- ✅ The plugin spreads them horizontally to minimize overlap
- ✅ Consider using different evolution stages if components are truly at different maturity levels

### Colors look wrong
- ✅ Colors are based on evolution stage, not component type
- ✅ Genesis = Red, Custom = Teal, Product = Blue, Commodity = Green
- ✅ Anchors use the same color scheme as regular components

---

## More Examples

Check out these files in the repository:
- **[`Tea-Shop.md`](./Tea-Shop.md)** - Classic Tea Shop example with full annotations
- **[`test-examples.md`](./test-examples.md)** - Multiple examples from minimal to complex

---

## Tips for Better Maps

1. **Start simple** - Begin with just a few components and add more as needed
2. **Use anchors** - Always identify your user needs at the top
3. **Check dependencies** - Make sure arrows flow in the right direction (toward what's needed)
4. **Leverage evolution** - Position components based on their actual maturity, not desired state
5. **Add context** - Use annotations to capture strategic insights
6. **Iterate** - Wardley Maps evolve as your understanding deepens

---

## Learn More About Wardley Mapping

- **Official site**: https://wardleymaps.com/
- **Book**: "Wardley Maps" by Simon Wardley (free online)
- **Community**: [Map Camp](https://www.map-camp.com/)

---

## Support & Feedback

Found a bug? Have a suggestion?
- **Report issues**: [GitHub Issues](https://github.com/BlockSecCA/wardley_map_simple_obsidian_plugin/issues)
- **Contribute**: Pull requests welcome!

---

## About This Plugin

**Syntax Specification**: This plugin implements the [Wardley Inline Syntax Specification](./Wardley-Inline-Syntax-Specification.md)

**License**: MIT

**Credits**: Wardley Mapping methodology by [Simon Wardley](https://twitter.com/swardley)

---

**Ready to map your strategy?** Create a new note, add a `wardley` code block, and start visualizing your landscape! 🗺️
