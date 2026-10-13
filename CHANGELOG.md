# Changelog

Notable changes to Halation. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

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

[1.1.0]: https://github.com/AR13X3/halation/releases/tag/v1.1.0
[1.0.0]: https://github.com/AR13X3/halation/releases/tag/v1.0.0
