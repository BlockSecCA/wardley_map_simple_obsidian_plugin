# Manual UAT Checklist

This checklist covers **subjective criteria** that require human visual inspection.
The automated validator (`validate-svg.js`) covers objective criteria.

## How to Use

1. Open `Tea-Shop.svg` in a web browser (Chrome, Firefox, Safari, etc.)
2. Go through each item below and mark ✅ or ❌
3. For failures, note what needs improvement

---

## Visual Quality

### Readability
- [ ] **Component labels**: Text is large enough to read comfortably
- [ ] **Axis labels**: Evolution stages (Genesis, Custom Built, Product, Commodity) are clear
- [ ] **Title**: "Tea Shop" is prominent and readable
- [ ] **Annotations**: Any annotation text is legible (if present)

**Notes:**
```
(Add observations about text size, font clarity, etc.)
```

---

### Visual Distinction

- [ ] **Anchors vs Components**: Can you easily tell anchors (Business, Public) apart from regular components?
  - What makes them different? (shape, size, color, border?)

- [ ] **Evolution stages**: Can you visually distinguish components by evolution stage?
  - Genesis (red/orange)
  - Custom (teal/cyan)
  - Product (blue)
  - Commodity (green)

- [ ] **Dependencies vs Evolution**: Are dependency arrows (solid blue) clearly different from evolution arrows (dashed purple)?

**Notes:**
```
(Add observations about visual clarity and differentiation)
```

---

### Layout Quality

- [ ] **Spacing**: Components have adequate spacing - not too crowded or too sparse

- [ ] **Alignment**: Components are reasonably aligned and organized

- [ ] **Balance**: The map uses the canvas space efficiently (not all bunched in one corner)

- [ ] **Value chain flow**: Can you trace dependencies from top (user needs) to bottom (infrastructure)?

**Notes:**
```
(Add observations about layout, spacing, and flow)
```

---

### Overlaps

- [ ] **Component overlap**: No components completely obscure each other

- [ ] **Label overlap**: Component labels don't overlap each other significantly
  - Check the bottom row especially (Cup, Tea, Water, Power, Electric Kettle)

- [ ] **Arrow overlap**: Dependency arrows don't obscure components or labels

- [ ] **Severity**: Any overlaps that exist are minor and don't prevent understanding

**Notes:**
```
(Identify specific overlaps and their severity: minor/moderate/severe)
```

---

### Aesthetics

- [ ] **Colors**: Color scheme is pleasant and professional

- [ ] **Overall appearance**: The map looks polished and presentation-ready

- [ ] **Grid lines**: Evolution stage grid lines are subtle but helpful

- [ ] **Arrows**: Arrow styles and sizes are appropriate

**Notes:**
```
(General aesthetic feedback)
```

---

## Functional Testing

### Navigation
- [ ] **Zoom**: SVG scales well when zooming in/out in browser

- [ ] **Clarity at different sizes**: Map remains readable at different zoom levels

**Notes:**
```
(Test at 50%, 100%, 150%, 200% zoom)
```

---

### Comprehension

- [ ] **Strategic insight**: Looking at the map, can you understand:
  - Which components are mature vs novel?
  - What depends on what?
  - Where evolution is happening?

- [ ] **Wardley mapping principles**: Does this match what you'd expect from a Wardley Map?
  - X-axis shows evolution (left=novel, right=commodity)
  - Y-axis shows value chain (top=user-facing, bottom=infrastructure)
  - Dependencies flow downward

**Notes:**
```
(Does the map communicate strategy effectively?)
```

---

## Specific Tea Shop Checks

### Expected Components (all visible?)
- [ ] Business (anchor, custom, top-left area)
- [ ] Public (anchor, commodity, top-right area)
- [ ] Cup of Tea (product, middle-right)
- [ ] Cup (commodity, bottom-right area)
- [ ] Tea (commodity, bottom-right area)
- [ ] Hot Water (commodity, middle-right)
- [ ] Water (commodity, bottom-right area)
- [ ] Kettle (custom, middle-left)
- [ ] Electric Kettle (product, bottom-middle)
- [ ] Power (commodity, bottom-right area)

### Expected Relationships (all visible?)
- [ ] Business → Cup of Tea
- [ ] Public → Cup of Tea
- [ ] Cup of Tea → Cup
- [ ] Cup of Tea → Tea
- [ ] Cup of Tea → Hot Water
- [ ] Hot Water → Water
- [ ] Hot Water → Kettle (labeled "limited by")
- [ ] Kettle → Power

### Expected Evolution (visible?)
- [ ] Kettle → Electric Kettle (dashed purple arrow)

---

## Summary

### Pass/Fail Count
- **Passed:** _____ / 30
- **Failed:** _____
- **Not Applicable:** _____

### Overall Assessment
```
Rate the map quality:
[ ] Excellent - Production ready
[ ] Good - Minor improvements needed
[ ] Fair - Significant improvements needed
[ ] Poor - Major rework required
```

### Priority Issues
```
List the top 3 issues that should be fixed:
1.
2.
3.
```

### Recommendations
```
Additional suggestions for improvement:


```

---

## Automated Validation Results

For reference, the automated validator (`validate-svg.js`) reported:

**Score: 100% (20/20 checks passed)**

✅ Document structure valid
✅ Component count correct (10/10)
✅ Labels correct (10/10)
✅ Dependencies correct (8/8)
✅ Evolution arrows correct (1/1)
✅ Axes and grid present
✅ Title present
✅ Colors use evolution stages

---

**Next Steps:** Once manual UAT is complete, compile findings and create improvement tasks if needed.
