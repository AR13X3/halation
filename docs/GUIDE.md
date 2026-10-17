# Halation user guide

Everything you need to go from a blank canvas to a finished background. If you just want to start, open the app at **[ar13x3.github.io/halation](https://ar13x3.github.io/halation/)**, click a look on the left and press **Export**.

## Contents

1. [The interface](#the-interface)
2. [Your first background in five steps](#your-first-background-in-five-steps)
3. [Canvas](#canvas)
4. [Flow](#flow)
5. [Objects](#objects)
6. [Color](#color)
7. [Surface](#surface)
8. [Glass](#glass)
9. [Light](#light)
10. [Screen](#screen)
11. [Finish](#finish)
12. [Motion and seamless loops](#motion-and-seamless-loops)
13. [Exporting](#exporting)
14. [Saving and sharing looks](#saving-and-sharing-looks)
15. [Performance modes](#performance-modes)
16. [Recipes](#recipes)
17. [Keyboard and mouse](#keyboard-and-mouse)
18. [Troubleshooting](#troubleshooting)
19. [Privacy](#privacy)

---

## The interface

The artwork fills the window, lit by a soft glow of its own colors, and the controls float above it on frosted glass.

| Area | What it does |
| --- | --- |
| **Canvas** (center) | Live preview at the exact proportions of your output size. Drag to pan, scroll to zoom, or drag an object to move it. |
| **Look name** (top left) | The look you are working on, with undo and redo next to it. A dot appears once you change it; click the name to browse all looks. |
| **Top right** | **Surprise me**, **Share**, the **Help** menu (tutorial, keyboard shortcuts, this guide and the source code) and **Export**. |
| **Controls** (right) | Every setting, one section per tab: Canvas, Flow, Objects, Color, Surface, Glass, Light, Screen, Finish, Motion, Export. Each section has dice (randomize this section) and reset buttons next to its title. |
| **Dock** (bottom) | Play/pause, timeline, seamless-loop toggle, performance mode and frame-rate readout, and a strip of looks to click through. **All looks** (`L`) opens every built-in look plus the ones you save under **My looks**. The eye icon hides the interface. |

On phones and portrait tablets the dock spans the bottom of the screen, and **Edit** opens the controls as a sheet (**Done** closes it).

New to Halation? Open **Help → Tutorial** for a one-minute guided tour of the basics. It points out each part of the interface and lets you try things as you go; press **End tutorial** or `Esc` to leave it at any time.

A few habits that make editing fast:

- **Click or drag anywhere along a slider bar** to set it; the filled part shows the value.
- **Double-click a setting** to reset it to its default.
- **Drag a number** left or right to scrub it (hold `Shift` for fine steps), or click it to type a value. Arrow keys nudge it.
- Hover a setting for a short explanation of what it does.
- **Search settings** at the top of the controls (or press `/`) to find any setting by name or by what it does: "blur" finds Soften and Frost, "rainbow" finds Dispersion. Settings that the current look hides, such as Band width while the pattern is Silk, are listed below the results with the change that reveals them. Press `Esc` to clear the search.

## Your first background in five steps

1. **Pick a size.** In **Canvas**, choose a preset such as *Phone — 1080 × 1920* or *Desktop 4K*, or type your own width and height.
2. **Start from a look.** Click any look in the dock or under **All looks**, or press **Surprise me** (`R`) until something catches your eye.
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
| **None** | A still background behind objects or glass: a plain color or a gradient | **Background** (Color or Gradient), and for gradients **Shape** (linear, radial or conic), **Angle**, **Center**, **Ripple**, **Length**, **Offset**, **Palette range** and the **Library** |
| **Silk** | Satin folds, smoke, marble | Turbulence, Detail, **Folds** (sharp creases) |
| **Bands** | Soft beams and stripes of light | Bands, width, spacing, angle, **Length** |
| **Mesh** | Mesh gradients, color blobs | Points, Sharpness, Drift |
| **Ribbons** | Flowing line bundles, neon | Lines, bundle width, weight, glow, wave, fan |
| **Threads** | Light trails, filaments, hyperspace streaks, starbursts | Threads, weight, glow, bundle width, **Converge**, **Depth of field**, **Breakup** |
| **Fluid** | Real ink simulation you paint with the mouse | Force, brush size, vorticity, streams, ink amount and fade |
| **Image** | Your own photo or artwork behind the glass | Drop an image on the canvas or use *Choose image…*; **Gradient map** recolors it with your palette |

Settings shared by most patterns: **Scale**, **Turbulence**, **Soften** (blur), **Swirl**, **Rotate**, **Pan** and **Seed** (the dice gives a new random variation of the same pattern).

**None** turns the flow off for a still background. Choose a plain **Color**, or a **Gradient** made from your palette: pick one from the **Library** right there, or edit its colors in the Color section. **Palette range** uses only the start of the palette for the background, leaving its other end for objects colored from the palette.

A gradient can be **Linear**, **Radial** (rings around a **Center**) or **Conic** (swept around a center, like a sunburst). **Ripple** bends it into slowly moving waves: wavy stripes, wobbly rings or swaying rays, and **Ripple size** goes from tight squiggles to broad curves; **Seed** picks a different wave. Center positions are measured in frames (±1 = the edges), so a center on a third stays on that third at any canvas size. Combined with Color → **Repeat** and **Posterize**, these make retro patterns: wavy 70s stripes, concentric arcs and groovy sunbursts.

**Threads** are thin lines of light that flow side by side. **Converge** pinches them toward the center: halfway gives an hourglass, all the way gives a starburst of rays (rotate 90° for a vertical hourglass). **Depth of field** adds soft, out-of-focus threads behind the sharp ones, and **Breakup** cuts them into streaks that race along the threads as the animation plays.

**Silhouette** shapes any pattern into a single sculpted form over a plain **Backdrop** color: a vertical **Ribbon**, a horizontal **Wave** or a **Blob**. **Meander** bends and swells the form, **Depth** shades it toward its edges so it reads as a rounded body, and Surface effects such as Relief and Chrome treat its rim as a curved edge. **Position** and **Angle** place the form anywhere in the frame, for example tilted into a diagonal across one third.

## Objects

Objects float in front of the flow: up to six spheres, pills, panes and chain links, each made of **glass** or a **solid** material. Raise **Objects** to add them; each new one has its own starting place, so they build up a composition. Glass objects are best over a calm background, such as **None** with a gradient or a light color, or a soft **Mesh**, where their frost, tint and edges read clearly.

**Edit** chooses which object the settings below it change; each button shows that object's color. You can also click an object on the canvas, and **drag it to move it**. Higher numbers sit in front, and glass objects always float in front of solid ones.

Each object has its own:

- **Material**: **Glass** refracts, frosts and tints what is behind it; **Solid** is an opaque, softly lit body.
- **Shape**: **Sphere**, **Pill**, **Pane** (a flat sheet with a rounded bevel) or **Link** (a chain link).
- **Color**: a position along your palette (**Palette color**, so objects follow palette changes), a **Custom color**, or a **Gradient** across the object, chosen from the library (or your own palette) with its own **Gradient angle**.
- **Tint** (glass): how strongly the glass is colored. Thicker parts, toward the edges, are deeper.
- **Frost** (glass): clear glass, or frosted glass that blurs what is behind it.
- **Size**, **Length** (pills, panes and links), **Corners** (panes), **Position** and **Rotation**.

Shared by all objects:

- **Refraction**: how strongly rounded glass bends the view. Spheres and pills act as lenses; past about 0.7 they show the scene upside down, like a glass ball. Panes bend light only at their bevel.
- **Bevel**: the width of the rounded edge on glass panes.
- **Edge light**: highlights and reflections along the edges, from the light in the **Light** section. The edges also mirror the scene around them, so they look light on a light background and dark on a dark one.
- **Thickness**: shows the side of each piece of glass as a darker, deeply tinted band.
- **Shadow**: soft shadows on the flow behind, falling away from the light. Glass casts colored shadows.
- **Edge softness** (solid objects) blurs their outline.
- **Arrange all** scales, rotates and moves every object together.
- **Drift** lets the objects float gently as the animation plays (it loops seamlessly); **Drift seed** varies the motion.

The main **Glass** pane, when there is one, sits in front of everything, objects included: frosted panes over a glass ball, or objects seen through reeded glass.

> **Tip:** glass looks most convincing when there is something with clear edges behind it. Try solid **Objects** or **Image** with the Tiles, Pyramids or Reeded glass.

## Color

- **Gradient editor**: click the bar to add a color stop, drag stops to move them, drag a stop down off the bar to delete it. Select a stop to set its exact color or position.
- **Reverse** flips the gradient; **Generate** creates a new harmonious palette; **Library** holds ready-made palettes.
- **Contrast** and **Balance** decide how the flow spreads across the gradient.
- **Repeat**, **Offset** and **Mirror repeats** cycle the gradient several times across the flow (up to 40 times, for fine stripes or sunburst rays).
- **Color cycle** animates the palette; with seamless loops it completes whole cycles per loop.
- **Posterize** turns smooth gradients into flat bands with crisp, antialiased edges.

## Surface

Surface treats the flow as a 3D landscape (bright = high) and lights it. These effects work with every pattern and sit behind any glass.

| Setting | Effect |
| --- | --- |
| **Relief** | Shades the slopes facing away from the light: satin, molten wax, embossing |
| **Gloss** | A highlight of the light source; **Gloss tightness** makes it small and sharp |
| **Chrome** | Polished metal that mirrors a horizon lit in your palette colors: liquid mercury, silver, colored metals |
| **Liquid** | A clear liquid: each fold bends the colors beneath it, catches light along its edges and focuses light under its crests |
| **Iridescence** | Thin-film interference, the rainbow sheen of soap bubbles, oil and holographic foil. Colors follow the flow and shift on slopes. **Film thickness**: thin films give a few vivid bands, thick films many pale ones |
| **Sparkle** | Tiny glints that twinkle on the bright parts of the flow, with adjustable density and size |

Chrome with Iridescence gives holographic metal. Liquid with Gloss and a little Sparkle gives liquid glass. Light **Direction** and **Elevation** steer all of these.

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

**Direction** and **Elevation** of the light, **Intensity**, **Color**, and the **Environment** the glass reflects: a studio softbox, the palette's own colors, a window, or a dark room. Light also drives the Surface effects (Relief, Gloss, Chrome, Liquid) and the Mosaic bevel.

## Screen

A screen is the "display" the image is seen through, applied after the glass.

| Screen | Description |
| --- | --- |
| **Halftone** | Print dots (circle, square, diamond) |
| **Lines** | Line screen: straight, concentric rings or waves |
| **Moiré** | Fine engraved lines that **Bend** with the shapes in the image, like hatching on a 3D surface. **Interference** adds a second layer at a slight angle for moiré fringes |
| **LED** | Dot-matrix display: round, square or RGB subpixels |
| **CRT** | Shadow mask and scanlines |
| **Mosaic** | Square or hexagonal tiles |
| **Contour** | Topographic lines, with optional bold index lines |
| **Dither** | Ordered dither in 2–8 levels |

**Color** takes the colors from the image or uses your own **Ink & paper**. **Mix** blends the screen with the clean image.

## Finish

Brightness, contrast, saturation and hue shift; film **Grain** (size, animated or static); **Speckle**, which scatters the image into grainy speckles like sprayed paint or a riso print; **Vignette**, whose **Focus** moves the bright center onto your focal point; **Bloom** (glow around bright areas); and a technical **Grid overlay** with crosshairs and markers.

- **Aberration** splits light into rainbow fringes like an imperfect lens. **Lens** fringes outward from the center; **Orbit** fringes around it, which colors the sides of lines that point at the center (great with converging Threads).
- **Streaks** smear the image as if the camera moved during the exposure: **Zoom** away from a center, **Spin** around it, or **Directional** along an angle. Move the center with **Streak center X/Y**.

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

- **My looks** (**All looks → My looks**): name and save the current look with a thumbnail. Saved looks also appear first in the dock. Saved looks live in your browser; use **Export** to download them as a `.json` file and **Import** to load them elsewhere.
- **Share** copies a link that recreates your exact look for anyone who opens it. Images you load yourself are not included in links.
- Your last session is restored automatically when you come back.
- **Undo/redo** with `Ctrl/⌘ Z` and `Ctrl/⌘ Shift Z`.

## Performance modes

The selector under the timeline in the dock trades preview smoothness for detail **while things move**:

| Mode | For |
| --- | --- |
| **Auto** | Benchmarks your GPU when the app starts and picks the right mode |
| **Eco** | Laptops and integrated graphics: 30 fps cap, lower preview resolution, solid instead of frosted panels |
| **Balanced** | Most computers |
| **Max** | Fast GPUs: full resolution at all times |

Whatever the mode, a still preview refines itself to full quality (the readout shows *Refining…*, then *Full quality*), and exports are identical on every machine.

## Recipes

**Phone wallpaper**: Canvas *Phone* or *iPhone Pro Max* → pick a look → pause on a nice frame → Export at 1×, PNG.

**4K desktop wallpaper**: Canvas *Desktop 4K* → Export at 1× (or set *Desktop HD* and export at 2×).

**Animated wallpaper or video background**: turn on **Seamless loop**, set **Loop length** (8–20 s works well) → **Video**. The file loops perfectly.

**Your photo behind glass**: Flow → **Image** → drop a photo on the canvas → Glass → **Reeded** or **Tiles** → raise **Frost** a little. Turn **Gradient map** off to keep the photo's colors.

**Glass panel composition**: Flow → **None** → Objects → **1**, Material **Solid**, Shape **Sphere** → Glass → **Tiles**, Profile **Glass block**, Coverage **Right side**, Frost ~0.5. Drag the sphere so it sits across the pane edge.

**Frosted glass objects**: Flow → **None** with a light **Color** or a soft gradient (or a gentle **Mesh**) → Objects → **3**, all **Glass**, Shape **Pane** or **Pill**, **Frost** 0.6–0.8, **Tint** 0.4–0.6 → **Shadow** ~0.4. Turn the objects to the same angle and drag them so they overlap.

**Liquid chrome**: Flow → **Silk** with Detail 2–3 and a little **Soften** → Surface → **Chrome** 1, **Gloss** 0.4. Add **Iridescence** for holographic metal; choose a palette that ends in a light color.

**Groovy sunburst**: Flow → **None** → Gradient, Shape **Conic**, **Ripple** ~0.7 → Color: a 3-color palette, **Repeat** 40, **Posterize** 3.

**Grainy gradient**: Flow → **Silk** with a large **Scale** and a little **Soften**, on a palette that is mostly one dark or light color → Finish → **Speckle** 0.3–0.7, **Grain** ~0.1.

**Light trails**: Flow → **Threads** → **Converge** 0.6, **Bundle width** ~0.4, **Rotate** 90° → Finish → **Bloom** 0.6, **Streaks** (Zoom) 0.2, **Aberration** (Orbit) 0.5, on a dark palette that ends in white.

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
| Drag an object | Move it (and edit it in Objects) |
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

**Something looks wrong after an update**: click any look in the dock to start fresh. Your saved looks are kept.

## Privacy

Everything you make stays in your browser: images, videos, saved looks and images you load are never uploaded.

The official site ([ar13x3.github.io/halation](https://ar13x3.github.io/halation/)) counts visits with [GoatCounter](https://www.goatcounter.com), a privacy-friendly, open-source analytics service. It uses no cookies and stores nothing personal: a visit records the page, the referring site, your browser, screen size and country. Besides visits, it counts a few actions by name only, to show which parts of Halation get used:

- exports (image format, copy, burst, video)
- the built-in look you pick, or that it was one of your own looks
- Surprise me, copying a share link and opening one
- starting the tutorial, finishing it, or the step where you left it

Your settings, colors and images are never included. Nothing is counted when your browser sends **Do Not Track** or **Global Privacy Control**, and copies of Halation running anywhere else (your own computer or a fork) don't count anything.
