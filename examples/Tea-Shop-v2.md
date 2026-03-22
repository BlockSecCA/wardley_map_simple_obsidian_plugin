# Tea Shop v2 (New Features Test)

```wardley
title Tea Shop Enhanced

anchor Business [custom]
anchor Public [commodity]

component Cup of Tea [product] (build)
component Cup [commodity] (buy)
component Tea [commodity] (buy)
component Hot Water [commodity]
component Water [commodity]
component Kettle [custom]
component Electric Kettle [product]
component Power [commodity] (market)

inertia Kettle

Business -> Cup of Tea
Public -> Cup of Tea
Cup of Tea -> Cup
Cup of Tea -> Tea
Cup of Tea -> Hot Water
Hot Water -> Water
Hot Water -> Kettle
Kettle -> Power

evolve Kettle -> Electric Kettle [product]
evolve Kettle [product]

Business +> Public; shared customers
Cup of Tea +<> Hot Water; critical flow
```
