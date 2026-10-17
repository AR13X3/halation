# Changelog

Notable changes to Halation. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- **A new interface.** The artwork fills the window, lit by a soft glow of its own colors, and every control floats above it on frosted glass that darkens over bright artwork to stay readable.
- **Looks** moved into a dock below the canvas, next to the timeline. **All looks** opens every built-in look and your saved **My looks** at once, and the look's name at the top left marks it once you change it (click it to browse).
- **Settings** are organized in tabs, one section at a time, and every slider is a bar you can click or drag anywhere along. Double-click a setting to reset it.
- A **Help** menu gathers the tutorial, keyboard shortcuts, user guide and source code.
- On phones and portrait tablets, looks and the timeline sit in a dock at the bottom and **Edit** opens the settings as a sheet.

### Added

- `L` opens all looks.
- Anonymous usage statistics on the official site through [GoatCounter](https://www.goatcounter.com): visits, plus how often people export, pick looks, press Surprise me, share and take the tutorial. No cookies or personal data, nothing is counted with Do Not Track or Global Privacy Control, and local copies and forks send nothing. See [Privacy](docs/GUIDE.md#privacy).

## [1.2.0] - 2026-10-16

### Added

- **Objects**: up to six spheres, pills, panes and chain links floating in front of any flow, each in **glass** or a **solid** material with its own shape, color (a palette color, any color, or a gradient from the library), size, position and rotation. Glass objects refract, frost and tint what is behind them, reflect the scene along their edges and cast soft, colored shadows. Drag an object on the canvas to move it.
- **None** flow: no moving pattern, just a still background in a plain color or a linear, radial or conic gradient, with the gradient library at hand. **Ripple** bends the gradient into moving waves (wavy stripes, wobbly rings, swaying rays) and **Center** places radial and conic gradients.
- **Speckle** in Finish: scatters the image into grainy speckles, like sprayed paint or a riso print.
- Composition controls: **Position** and **Angle** for Silhouette forms, and **Focus** for the vignette, which moves its bright center onto the focal point.
- **Tutorial**: a guided tour of the basics from the new Tutorial button in the top bar. It spotlights each part of the interface, moves on when you try what it suggests, and can be ended at any time.
- 29 new looks: Indigo Harp, Ember Bow, Moss Reeds, Mercury Silk, Emerald Pour, Berry Wave, Neon Contours, Navy Rings, Pearl Orbs, Onyx Prism, Opal Wave, Cobalt Flutes, Indigo Satin, Ivory Matrix, Neon Hourglass, Amber Smoke, Night Survey, Pearl Marble, Blue Mercury, Azure Spray, Violet Aurora, Thermal Bloom, Molten Glow, Dusk Horizon, Coral Arcs, Tangerine Groove, Zebra Swirl, Sky Sunburst and Saffron River.

### Changed

- **Posterize** bands now have crisp, antialiased edges, and **Repeat** goes up to 40 for fine stripes and sunburst rays.
- The **Shapes** flow pattern is now part of **Objects**. Looks and share links made with it open with no flow, a gradient background and the same objects, and look the same.
- **Surprise me** has a new art direction built around frosted glass objects.

### Removed

- The Holo Chrome, Light Speed, Neon Rain, Plum Halftone, Lilac Waves, Peach Streaks, Teal Blocks, Dusk Pool, Slate Quilt, Pearl Waves, Riso Print, Terracotta Mosaic and Saffron Ink looks.

### Fixed

- A thin black line could cross Wavy glass, and Surface gloss could turn black, when the light stood straight above a flute or the surface.

## [1.1.0] - 2026-10-14

### Added

- **Threads** flow pattern: thin lines of light with depth of field and travelling streaks, which can converge into an hourglass or a starburst.
- **Silhouette**: shapes any flow into a sculpted ribbon, wave or blob over a backdrop color.
- **Surface** section with new **Chrome**, **Liquid**, **Iridescence** (thin-film interference) and **Sparkle** effects.
- **Moiré** screen: fine engraved lines that bend with the image, with an optional second layer for interference fringes.
- **Streaks** in Finish: zoom, spin or directional motion blur.
- **Aberration style**: Orbit fringes around the center, in addition to the radial Lens style.
- Five new looks: Moiré Ribbon, Liquid Glass, Holo Chrome, Light Speed and Prism Filaments.

### Changed

- **Surprise me** now picks one coherent art direction at a time (gradient, fluted glass, glass blocks, weathered glass, print screens, liquid metal, liquid glass, light trails, neon ribbons, sculpted forms, or a variation of a built-in look), with palettes chosen to suit it. It renders a few candidates offscreen and keeps the best, so washed-out, blown-out or noisy results are rare.
- The section dice change one material at a time in Surface and leave the color grading alone in Finish.
- Relief and Gloss moved from Color to the new Surface section. Saved looks and share links are upgraded automatically.
- Chromatic aberration is now spectral, giving smooth rainbow fringes instead of three separate color copies.
- The flow shader shares one noise evaluation between patterns, which keeps first-load shader compilation fast.

## [1.0.0] - 2026-10-05

First public release.

### Added

- **Flow**: silk, light bands, mesh gradients, ribbons, lit shapes, a real-time fluid simulation you paint with the mouse, and image input.
- **Color**: gradient editor with OKLab blending, a palette library and generator, repeats, posterize, animated color cycling, and relief and gloss lighting.
- **Glass**: nine physically based glass types (reeded, wavy, rings, glass-block tiles, hammered, water, crystal, rain and pyramids) with adjustable index of refraction, frost, streaks, dispersion, caustics, Fresnel reflections, tint, partial panes and a stacked second pane.
- **Screen**: halftone, line screens, LED matrix, CRT, mosaic, topographic contours and dither.
- **Finish**: grading, film grain, vignette, bloom, chromatic aberration and a grid overlay.
- **Export**: PNG (8- and 16-bit), JPEG and WebP at 0.5×–4×, copy to clipboard, burst capture as a .zip, and seamless-loop video.
- 20 built-in looks, saved looks with import and export, share links, undo/redo and Surprise me.
- Settings search (`/`), which also lists settings hidden by the current look and the change that reveals them.
- Performance modes (Auto, Eco, Balanced, Max) with dynamic resolution.

[Unreleased]: https://github.com/AR13X3/halation/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/AR13X3/halation/releases/tag/v1.2.0
[1.1.0]: https://github.com/AR13X3/halation/releases/tag/v1.1.0
[1.0.0]: https://github.com/AR13X3/halation/releases/tag/v1.0.0
