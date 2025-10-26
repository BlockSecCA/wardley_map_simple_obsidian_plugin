# Tea Shop Strategy

This is the classic Tea Shop example from Simon Wardley, demonstrating value chain mapping and component evolution.

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

## Key Strategic Insights

1. **Value Chain**: The map shows how a cup of tea depends on multiple components, from the user need (Business/Public) down through the physical components (cup, tea, water) to infrastructure (kettle, power).

2. **Evolution**:
   - The kettle is evolving from a custom-built solution (stovetop) to a standardized electric product
   - Components span all evolution stages: from custom kettles, through product-stage tea service, to commodity infrastructure like power and water

3. **Dependencies**: Hot water is constrained by the kettle's capabilities, showing a bottleneck in the value chain that the evolution to electric kettles addresses.

4. **Strategic Context**: As power became standardized and commoditized, it enabled kettles to evolve more rapidly from custom-built to mass-produced products. This commoditization of infrastructure enables innovation in the layers above.

This map demonstrates the fundamental Wardley Mapping principles:
- **Horizontal positioning**: Components are positioned by their evolution stage (custom → product → commodity)
- **Vertical positioning**: Value chain flows from top (user needs) to bottom (infrastructure)
- **Evolution dynamics**: Standardization of foundational components (power, water) enables evolution of higher-level components (kettles, tea service)
- **Strategic leverage**: Investment in commodity infrastructure (reliable power) creates opportunities for differentiation at higher levels (electric kettles, premium tea service)
- **Inertia**: The evolution from traditional kettles to electric kettles shows how components resist change even when better alternatives exist

The Tea Shop example illustrates that competitive advantage comes not from the commoditized components (power, water, cups) but from how you orchestrate them and where you choose to invest in custom or product-stage capabilities (the kettle, the tea selection, the service experience).
