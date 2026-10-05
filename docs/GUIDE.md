# Halation user guide

Everything you need to go from a blank canvas to a finished background. If you just want to start, open the app at **[ar13x3.github.io/halation](https://ar13x3.github.io/halation/)**, click a look on the left and press **Export**.

## Contents

1. [The interface](#the-interface)
2. [Your first background in five steps](#your-first-background-in-five-steps)
3. [Canvas](#canvas)
4. [Flow](#flow)
5. [Color](#color)
6. [Glass](#glass)
7. [Light](#light)
8. [Screen](#screen)
9. [Finish](#finish)
10. [Motion and seamless loops](#motion-and-seamless-loops)
11. [Exporting](#exporting)
12. [Saving and sharing looks](#saving-and-sharing-looks)
13. [Performance modes](#performance-modes)
14. [Recipes](#recipes)
15. [Keyboard and mouse](#keyboard-and-mouse)
16. [Troubleshooting](#troubleshooting)

---

## The interface

| Area | What it does |
| --- | --- |
| **Looks** (left) | Built-in starting points, plus looks you save yourself. Click one to load it. |
| **Canvas** (center) | Live preview at the exact proportions of your output size. Drag to pan, scroll to zoom. |
| **Transport bar** (bottom) | Play/pause, timeline, seamless-loop toggle, performance mode and frame-rate readout. The eye icon hides the interface. |
| **Controls** (right) | Every setting, grouped into sections: Canvas, Flow, Color, Glass, Light, Screen, Finish, Motion, Export. Canvas and Color start open; click a section title to expand or collapse it. Hover a title for its dice (randomize this section) and reset buttons. |
| **Top bar** | Undo/redo, **Surprise me**, **Share**, keyboard shortcuts, source code link and **Export**. |

A few habits that make editing fast:

- **Double-click a label** to reset that control to its default.
- **Drag a number** left or right to scrub it (hold `Shift` for fine steps), or click it to type a value. Arrow keys nudge it.
- Hover a label for a short explanation of what it does.
- **Search settings** at the top of the controls (or press `/`) to find any setting by name or by what it does: "blur" finds Soften and Frost, "rainbow" finds Dispersion. Settings that the current look hides, such as Band width while the pattern is Silk, are listed below the results with the change that reveals them. Press `Esc` to clear the search.

## Your first background in five steps

1. **Pick a size.** In **Canvas**, choose a preset such as *Phone — 1080 × 1920* or *Desktop 4K*, or type your own width and height.
2. **Start from a look.** Click any look in the sidebar, or press **Surprise me** (`R`) until something catches your eye.
3. **Make it yours.** Change the palette in **Color**, try a different **Glass** type, adjust **Refraction** and **Frost**. Drag the canvas to find the best composition.
4. **Pick a moment.** Pause (`Space`) when the motion looks right, or step frame by frame with `←` `→`. A paused preview sharpens itself to full quality within a second.
5. **Export.** Choose a scale and format in **Export** and press **Download image** (`S`).

## Canvas

- **Size**: presets for phones, desktops (HD to 5K and ultrawide), square, portrait 4:5, banners and A4 print at 300 dpi.
- **Pixels**: type any width and height from 64 to 8192 px. The swap button flips portrait/landscape.

All effects are defined relative to the canvas height, so a design looks the same at any size; larger exports are simply sharper.

## Flow

The flow is what sits *behind* the glass: the moving color field.

| Pattern | Good for | Key settings |
| --- | --- | --- |
| **Silk** | Satin folds, smoke, marble | Turbulence, Detail, **Folds** (sharp creases) |
| **Bands** | Soft beams and stripes of light | Bands, width, spacing, angle, **Length** |
| **Mesh** | Mesh gradients, color blobs | Points, Sharpness, Drift |
| **Ribbons** | Flowing line bundles, neon | Lines, bundle width, weight, glow, wave, fan |
| **Shapes** | Crisp spheres, chain links and pills to look *through* glass | Shape, count, size, edge softness, backdrop angle |
| **Fluid** | Real ink simulation you paint with the mouse | Force, brush size, vorticity, streams, ink amount and fade |
| **Image** | Your own photo or artwork behind the glass | Drop an image on the canvas or use *Choose image…*; **Gradient map** recolors it with your palette |

Settings shared by most patterns: **Scale**, **Turbulence**, **Soften** (blur), **Swirl**, **Rotate**, **Pan** and **Seed** (the dice gives a new random variation of the same pattern).

> **Tip:** glass looks most convincing when there is something with clear edges behind it. Try **Shapes** or **Image** with the Tiles, Pyramids or Reeded glass.

## Color

- **Gradient editor**: click the bar to add a color stop, drag stops to move them, drag a stop down off the bar to delete it. Select a stop to set its exact color or position.
- **Reverse** flips the gradient; **Generate** creates a new harmonious palette; **Library** holds ready-made palettes.
- **Contrast** and **Balance** decide how the flow spreads across the gradient.
- **Repeat**, **Offset** and **Mirror repeats** cycle the gradient several times across the flow.
- **Color cycle** animates the palette; with seamless loops it completes whole cycles per loop.
- **Posterize** turns smooth gradients into flat bands.
- **Relief** and **Gloss** light the flow like a 3D surface: liquid metal, satin, molten glass.

## Glass

The glass sits between you and the flow. Light is traced through it: it bends (refraction), scatters (frost), splits into colors (dispersion), reflects its surroundings and can be trapped inside steep edges (total internal reflection).

| Type | Description |
| --- | --- |
| **Reeded** | Vertical flutes, the classic architectural glass |
| **Wavy** | Reeded glass whose flutes undulate |
| **Rings** | Concentric circular flutes |
| **Tiles** | Glass blocks in a grid |
| **Hammered** | Soft dimples |
| **Water** | A moving water surface |
| **Crystal** | Cut glass with bevelled facets |
| **Rain** | Water drops on a fogged window, with trails |
| **Pyramids** | A sheet of tiny prisms that shatters shapes into fragments |

**Shape**: density of flutes/tiles, angle, **Profile** (the cross-section of each flute: Round, Linear, Prism, Wave, Bevel or **Glass block**, a flat lens with thin bevelled edges) and Irregularity.

**Coverage**: the pane can cover the full canvas, one side, the top or bottom, a centered window or a vertical band. Partial panes, with crisp image on one side and glass on the other, make striking compositions.

**Light path**

- **Refraction**: how strongly light bends. Negative values make concave flutes, which step the image into bars.
- **Index (IOR)**: the material. 1.33 is water, 1.5 glass, 2.4 diamond. Higher values reflect more and trap light at steep edges.
- **Frost** (or **Fog** for Rain): scatters light, as in frosted or misted glass.
- **Streak**: smears light along the flutes, like out-of-focus lights seen through reeded glass.
- **Dispersion**: rainbow fringes where light bends.
- **Caustics**: bright focus lines where each lens gathers light.

**Surface**: Fresnel **Reflections** of the light environment, the **Highlight** of the light source and its **Sharpness**, **Edge shadow**, and **Tint** (colored glass that absorbs more where it is thicker).

**Second pane**: stacks another sheet of glass behind the first. Two reeded panes at 90° give quilted glass.

> **Tip:** for natural-looking glass, rely on refraction and frost. Keep **Highlight** and **Reflections** low; strong values add bright lines on every flute.

## Light

**Direction** and **Elevation** of the light, **Intensity**, **Color**, and the **Environment** the glass reflects: a studio softbox, the palette's own colors, a window, or a dark room. Light also drives **Relief**, **Gloss** and the Mosaic bevel.

## Screen

A screen is the "display" the image is seen through, applied after the glass.

| Screen | Description |
| --- | --- |
| **Halftone** | Print dots (circle, square, diamond) |
| **Lines** | Line screen: straight, concentric rings or waves |
| **LED** | Dot-matrix display: round, square or RGB subpixels |
| **CRT** | Shadow mask and scanlines |
| **Mosaic** | Square or hexagonal tiles |
| **Contour** | Topographic lines, with optional bold index lines |
| **Dither** | Ordered dither in 2–8 levels |

**Color** takes the colors from the image or uses your own **Ink & paper**. **Mix** blends the screen with the clean image.

## Finish

Brightness, contrast, saturation and hue shift; film **Grain** (size, animated or static); **Vignette**; **Bloom** (glow around bright areas); chromatic **Aberration**; and a technical **Grid overlay** with crosshairs and markers.

## Motion and seamless loops

- **Speed** controls how fast everything moves.
- **Seamless loop** makes the animation repeat perfectly every **Loop length** seconds: the last frame flows straight into the first. Ideal for animated wallpapers and video backgrounds.
- The timeline scrubs through the loop; `←` `→` step one frame, `Shift` + arrow steps one second.

## Exporting

| Option | Use it for |
| --- | --- |
| **Scale** 0.5×–4× | Multiply your canvas size, e.g. 2× for retina screens or print |
| **PNG 8-bit** | Everyday use, lossless |
| **PNG 16-bit** | Smooth gradients with no banding, for print or heavy color grading |
| **JPEG / WebP** | Small files for the web (adjust **Quality**) |

- **Download image** (`S`) saves the current frame at full quality.
- **Copy** (`C`) puts a PNG on the clipboard to paste into Figma, Photoshop, Slack and similar apps.
- **Burst** saves several frames spread across the loop as a `.zip` (set the count with **Burst frames**), so you can pick the best one later.
- **Video** records the animation. With **Seamless loop** on it records exactly one loop and stops by itself; otherwise press **Video** again to stop. Videos are MP4 or WebM depending on your browser, up to 4K.

Exports always render at full quality, independent of the performance mode. Very large exports (8K and up) can take several seconds.

## Saving and sharing looks

- **My looks** (bottom of the sidebar): name and save the current look with a thumbnail. Saved looks live in your browser; use **Export** to download them as a `.json` file and **Import** to load them elsewhere.
- **Share** copies a link that recreates your exact look for anyone who opens it. Images you load yourself are not included in links.
- Your last session is restored automatically when you come back.
- **Undo/redo** with `Ctrl/⌘ Z` and `Ctrl/⌘ Shift Z`.

## Performance modes

The selector in the transport bar trades preview smoothness for detail **while things move**:

| Mode | For |
| --- | --- |
| **Auto** | Benchmarks your GPU when the app starts and picks the right mode |
| **Eco** | Laptops and integrated graphics: 30 fps cap, lower preview resolution |
| **Balanced** | Most computers |
| **Max** | Fast GPUs: full resolution at all times |

Whatever the mode, a still preview refines itself to full quality (the readout shows *Refining…*, then *Full quality*), and exports are identical on every machine.

## Recipes

**Phone wallpaper**: Canvas *Phone* or *iPhone Pro Max* → pick a look → pause on a nice frame → Export at 1×, PNG.

**4K desktop wallpaper**: Canvas *Desktop 4K* → Export at 1× (or set *Desktop HD* and export at 2×).

**Animated wallpaper or video background**: turn on **Seamless loop**, set **Loop length** (8–20 s works well) → **Video**. The file loops perfectly.

**Your photo behind glass**: Flow → **Image** → drop a photo on the canvas → Glass → **Reeded** or **Tiles** → raise **Frost** a little. Turn **Gradient map** off to keep the photo's colors.

**Glass panel composition**: Flow → **Shapes** (Sphere) → Glass → **Tiles**, Profile **Glass block**, Coverage **Right side**, Frost ~0.5. Drag the canvas so the sphere sits across the pane edge.

**Print poster**: Canvas *A4 @300dpi* → Export as **PNG 16-bit**.

**Pick the best frame**: set **Burst frames** to 12–24 → **Burst** → choose your favorite from the zip.

## Keyboard and mouse

| Key | Action |
| --- | --- |
| `Space` | Play / pause |
| `S` | Download image |
| `C` | Copy image to clipboard |
| `R` | Surprise me |
| `/` | Search settings (`Esc` clears) |
| `←` `→` | Step one frame (`Shift`: one second) |
| `1`–`9` | Load built-in looks 1–9 |
| `H` | Hide / show the interface |
| `F` | Fullscreen |
| `Ctrl/⌘ Z` | Undo (`Shift` to redo) |
| Drag canvas | Pan the flow (paint, in Fluid mode) |
| Scroll on canvas | Zoom the flow |
| Double-click canvas | Recenter |

## Troubleshooting

**"Halation needs WebGL 2"**: use a current Chrome, Edge, Firefox or Safari and make sure hardware acceleration is enabled in the browser settings.

**The first load takes a few seconds**: the browser is preparing the GPU shaders. It is much faster on later visits.

**The preview stutters**: switch the performance mode to **Eco** or **Balanced**. Exports are unaffected.

**16-bit PNG is unavailable**: your GPU/browser lacks float render targets. Use PNG 8-bit; a little **Grain** hides any banding.

**The video stutters**: video is recorded in real time, so heavy looks on slower machines can drop frames. Lower the canvas size, close other tabs or simplify the look (less frost, no bloom).

**Copy doesn't work**: some browsers only allow clipboard images on secure (https) pages and after a click. Use **Download image** instead.

**Something looks wrong after an update**: click any look in the sidebar to start fresh. Your saved looks are kept.
