---
title: "Getting Started"
---

# Getting Started

This is a very barebones WIP tutorial, if you have any questions, feel free to join our [Discord](https://discord.gg/MXWb4W92ZH)!

Everything is subject to change, and sorry that it looks ugly.

<br><hr><br>

## Add things

Everything on a slide is a **node**. Click **New node** at the top of the Hierarchy.

| Node       | What it is                      |
| ---------- | ------------------------------- |
| Text       | Words. Double-click to edit.    |
| Image      | A picture from your assets.     |
| Shape      | A rectangle, ellipse, line or polygon. |
| Code Block | Code with colours.              |
| Group      | A box that holds other nodes.   |
| 3D Canvas  | A 3D scene. See [3D](#3d).      |

## Move things

- **Click** to select. **Shift + click** to select more.
- **Drag** to move. Things snap into line.
- **Drag a corner** to resize. **Ctrl + drag** a corner to rotate.
- Select a few nodes to **align** them.

## Change how things look

Select a node and use **Properties**:

- **Transform**: position and size
- **Layout**: `free` or `grid`, plus background
- **Typography**: font, size, colour
- **Shape**: kind, fill, outline
- **Image**: picture and fit

**Animation** and **Event** are extras. Add them from Properties.

## Draw shapes

Press **P** for the Pen and click to place points. Press **Enter** to finish. Press **A** to move points later.

## Assets

Open **Assets** from the rail and drop files in. Then drag an asset onto the slide.

## 3D

1. Add a **3D Canvas**. It comes with a camera and a background.
2. Drag a 3D model from Assets onto it, or add a **3D Object** inside it.
3. Select the object and drag it around, or use its **transform** (position, rotation, scale).

On a 3D Object, **model** picks the shape: `box`, `sphere`, `icosahedron`, `triangle`, or your own model. You can also set its colour and a picture as its texture.

Models can be `.glb`, `.gltf`, `.fbx`, `.obj` or `.stl`.

Move the **camera** on the 3D Canvas to change the view.

## Variables

Save a value once, use it everywhere.

1. Add a variable in **Base → variables**.
2. Type `{{ name }}` to use it.

Built in: `{{ slides.index }}`, `{{ slides.count }}`, `{{ deck.title }}`, `{{ date }}`.

## Shared nodes

Same logo on every slide? Give the nodes the same name in **Base → reference**. They now stay in sync.

## States

A state is another look for a node, like "big". Add one in **Base → states**.

## Animation

1. Add **Animation** to a node.
2. Move the playhead.
3. Change something. Quartz saves a key.

Press play to watch. Set **loop** to repeat.

## Events

Add **Event**, then pick **on** and **do**.

- **on**: click, hover, key, enter (slide opens)
- **do**: setState, toggleState, animate, seek, nextSlide, prevSlide, goToSlide

## Present

Click the **run** button at the top, then **Confirm** under **Local**.

## Keyboard shortcuts

**Mod** is **Ctrl** on Windows, **Cmd** on Mac.

### Editor

| Shortcut                | What it does      |
| ----------------------- | ----------------- |
| Mod + K                 | Command palette   |
| Mod + Z                 | Undo              |
| Mod + Shift + Z / Mod + Y | Redo            |
| Mod + A                 | Select all        |
| Mod + C / X / V         | Copy / cut / paste |
| Mod + D                 | Duplicate         |
| Mod + G                 | Group             |
| Mod + Shift + G         | Ungroup           |
| Mod + Shift + L         | Lock / unlock     |
| Backspace / Delete      | Delete            |
| Esc                     | Deselect          |
| ← / →                   | Previous / next slide |
| P                       | Pen               |
| A                       | Point             |

### Canvas

| Shortcut                | What it does            |
| ----------------------- | ----------------------- |
| Arrows                  | Nudge by 1              |
| Shift + arrows          | Nudge by 10             |
| Shift + click           | Add to selection        |
| Shift + drag corner     | Resize, keep shape      |
| Ctrl + drag corner      | Rotate                  |
| Double-click text       | Edit text               |
| Esc                     | Stop editing text       |

### Pen

| Shortcut             | What it does          |
| -------------------- | --------------------- |
| Enter                | Finish shape          |
| Esc                  | Finish, or leave Pen  |
| Shift + drag         | Straight lines        |
| Alt + drag handle    | Bend one side         |
| Backspace / Delete   | Delete points         |

### Lists and panels

| Shortcut          | What it does                     |
| ----------------- | -------------------------------- |
| ↑ / ↓             | Move up / down                   |
| ← / →             | Close / open a group (Hierarchy) |
| Enter             | Pick                             |
| Esc               | Leave                            |
| Shift + click     | Select a range (Hierarchy)       |
| Shift + ← / →     | Move playhead 1s (0.1s without Shift) |
