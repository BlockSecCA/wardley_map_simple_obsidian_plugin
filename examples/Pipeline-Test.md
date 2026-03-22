# Pipeline Test

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
