# Wardley Map Test Examples

## Example 1: Minimal

```wardley
component Business [custom]
component App [product]
component Infra [commodity]

Business -> App -> Infra
```

## Example 2: Technology Stack

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

## Example 3: With Strategy and Inertia

```wardley
title Build vs Buy

anchor Customer [product]

component Frontend [product] (build)
component Backend [custom] (build)
component Auth [product] (buy)
component Database [commodity] (buy)
component Hosting [commodity] (market)

inertia Backend

Customer -> Frontend
Frontend -> Backend
Frontend -> Auth
Backend -> Database
Backend -> Hosting

evolve Backend [product]
```

## Example 4: Flow Arrows

```wardley
title Data Pipeline

anchor Analytics Team [custom]

component Dashboard [product]
component Processing [custom]
component Raw Data [commodity]
component Storage [commodity]

Analytics Team -> Dashboard
Dashboard -> Processing
Processing -> Raw Data
Processing -> Storage

Raw Data +> Processing; ingest
Processing +> Dashboard; metrics
Analytics Team +<> Dashboard; feedback loop
```

## Example 5: Pipeline

```wardley
title Database Evolution

anchor Business [custom]

component Service [product]
component Database [product]
component Cache [commodity]

pipeline Database
  component File Storage [genesis]
  component SQL DB [custom]
  component NoSQL [product]
  component Cloud DB [commodity]

Business -> Service
Service -> Database
Service -> Cache
```

## Example 6: Error Handling Test

This should show errors for undefined components:

```wardley
title Error Test

component A [custom]
component B [product]

A -> C
D -> B
```
