---
title: "Row<Number>"
description: ""
---

# `Row<Number>`

<br><hr><br>

<Mermaid>
classDiagram
  class Row~Number~ {
    +string name
    +Field field?
    +Object~boolean, Field[]~ isMultiple?
    +update()
  }
  class Field~Number~ {
    +string label
    +number value
    +number min?
    +number max?
    +number step?
    +emit("update:value", label, value)
  }
  Row~T~ "1" *-- "1..*" Field~T~
</Mermaid>
