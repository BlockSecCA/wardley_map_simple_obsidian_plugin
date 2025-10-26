# Wardley Map Test Examples

## Example 1: Tea Shop (Complete Example)

```wardley
title Tea Shop

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

## Example 2: Minimal Example

```wardley
component Business [custom]
component Cup of Tea [product]
component Hot Water [commodity]

Business -> Cup of Tea -> Hot Water
```

## Example 3: Technology Stack

```wardley
title Modern Web Application

anchor User Need [genesis]

component Web App [product]
component API Gateway [product]
component Microservices [custom]
component Database [commodity]
component Cloud Infrastructure [commodity]

User Need -> Web App
Web App -> API Gateway
API Gateway -> Microservices
Microservices -> Database
Microservices -> Cloud Infrastructure
```

## Example 4: With Evolution

```wardley
title Evolution Example

component Manual Process [genesis]
component Automated Process [custom]
component SaaS Solution [product]
component Standard Platform [commodity]

anchor Customer Need [product]

Customer Need -> Manual Process
Manual Process -> Standard Platform

evolve Manual Process -> Automated Process [custom]
evolve Automated Process -> SaaS Solution [product]
```

## Example 5: Test Error Handling

This should show errors for undefined components:

```wardley
title Error Test

component A [custom]
component B [product]

A -> C
D -> B
```

## Example 6: Complex Dependencies

```wardley
title Service Architecture

anchor Customer [product]

component Web Portal [product]
component Mobile App [product]
component API Layer [custom]
component Auth Service [product]
component User Service [custom]
component Payment Service [product]
component Database [commodity]
component Cache [commodity]

Customer -> Web Portal
Customer -> Mobile App
Web Portal -> API Layer
Mobile App -> API Layer
API Layer -> Auth Service
API Layer -> User Service
API Layer -> Payment Service
User Service -> Database
Payment Service -> Database
API Layer -> Cache
```
