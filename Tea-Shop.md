# Tea Shop Strategy

This is the classic Tea Shop example from Simon Wardley, demonstrating value chain mapping and component evolution.

```wardley
title Tea Shop

anchor Business [commodity]
anchor Public [commodity]

component Cup of Tea [commodity]
component Cup [product]
component Tea [product]
component Hot Water [product]
component Water [custom]
component Kettle [custom]
component Electric Kettle [product]
component Power [genesis]

Business -> Cup of Tea
Public -> Cup of Tea
Cup of Tea -> Cup
Cup of Tea -> Tea
Cup of Tea -> Hot Water
Hot Water -> Water
Hot Water -> Kettle; limited by
Kettle -> Power

evolve Kettle -> Electric Kettle [product]
evolve Power [commodity]

annotation 1 Standardising power allows Kettles to evolve faster
annotation 2 Hot water is obvious and well known
```

## Key Strategic Insights

1. **Value Chain**: The map shows how a cup of tea depends on multiple components, from the user need (Business/Public) down through the physical components (cup, tea, water) to infrastructure (kettle, power).

2. **Evolution**:
   - The kettle is evolving from a custom-built solution to an electric product
   - Power itself is shown evolving from genesis to commodity, illustrating how infrastructure standardization enables evolution of dependent components

3. **Dependencies**: Hot water is limited by the kettle, showing a constraint in the value chain.

4. **Strategic Context**: As power becomes standardized and commoditized, it allows kettles to evolve more rapidly, which in turn enables better hot water solutions.

This map demonstrates the fundamental Wardley Mapping principles:
- Components are positioned by their evolution stage
- Value chain flows from top (user needs) to bottom (infrastructure)
- Evolution and inertia affect strategic decisions
- Commoditization of lower components enables innovation higher up
