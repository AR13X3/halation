# Contributing to Halation

Thanks for your interest in improving Halation. Bug reports, new looks, new effects, performance work and documentation are all welcome.

## Ways to contribute

- **Report a bug** or **suggest a feature** through [GitHub Issues](https://github.com/AR13X3/halation/issues). For bugs, include your browser, operating system and GPU, plus steps to reproduce. A share link (top bar → **Share**) to the look you were using helps a lot.
- **Share a look.** Export it from **My looks → Export** and attach the `.json` to an issue.
- **Improve the code or docs** with a pull request.

## Development setup

Halation is plain HTML, CSS and JavaScript (ES modules) with WebGL 2. There is no build step and there are no dependencies.

```bash
git clone https://github.com/AR13X3/halation.git
cd halation
npm start
```

`npm start` runs a tiny static server at http://localhost:5173. Any static server works, but the page must be served over HTTP; opening `index.html` from disk won't load ES modules.

Useful while developing:

- `window.halation` in the browser console exposes the store, renderer and a `perf()` snapshot.
- `?timer` in the URL drives the render loop with timers instead of `requestAnimationFrame`, which is handy for headless or background-tab testing.

## Project structure

```
index.html           app shell
css/app.css          UI styles
js/schema.js         every parameter: UI, defaults, ranges, randomizer, uniforms
js/gl/shaders.js     all GLSL for the main pipeline
js/gl/gl.js          WebGL 2 helpers (programs auto-bind uniforms by name)
js/renderer.js       render passes for preview, thumbnails and exports
js/fluid.js          GPU stable-fluids solver
js/palette.js        OKLab gradients, palette library and generator
js/presets.js        built-in looks
js/randomize.js      "Surprise me"
js/export.js         PNG (8/16-bit) encoder, ZIP writer, download helpers
js/store.js          state, undo/redo, share-link encoding
js/ui/               panel, controls, gradient editor, looks sidebar, icons
tools/serve.mjs      development server
docs/GUIDE.md        user guide
```

## Common changes

### Adding a parameter

Parameters are schema-driven:

1. Add an entry to `PARAMS` in `js/schema.js`, for example
   `{ key: 'glass.ripple', label: 'Ripple', type: 'range', min: 0, max: 1, step: 0.01, def: 0, show: isGlass('reeded') }`.
   The panel control, presets, undo, share links and the randomizer pick it up automatically.
2. Declare `uniform float u_glass_ripple;` in the relevant shader and use it. Uniforms are bound by name (`section.key` → `u_section_key`); `select` and `chips` values arrive as an `int` index into their `options`.

### Adding a glass or screen type

Add an entry to `GLASS_TYPES` or `SCREEN_TYPES` in `js/schema.js`, add a branch to the shader (the type's position in the list is the value of `u_glass_type` / `u_screen_type`), and give it an icon in `js/ui/icons.js`.

### Adding a built-in look

Add an entry to `js/presets.js`. A look only lists values that differ from the defaults. Looks must be original: please don't recreate someone else's artwork.

## Guidelines

- **No dependencies and no build step.** Halation should keep working by serving the folder as static files.
- **Keep shaders fast to compile.** On Windows, browsers translate WebGL to Direct3D, whose compiler unrolls fixed-length loops and inlines every function. Give loops a runtime bound (add `u_zero`, e.g. `for (int i = 0; i < 9 + u_zero; i++)`) and avoid calling large functions from several places. Check a cold start in a fresh browser profile after shader changes.
- **Keep output resolution-independent.** Express sizes relative to the canvas height (see `u_pxScale`) so previews and exports match.
- **Preserve seamless loops.** Anything animated must use `u_phase` (integer multiples) or the `u_W` noise coordinate, so the last frame matches the first.
- Match the style of the surrounding code; keep comments short and useful.
- Test in at least one Chromium browser and Firefox, and in the **Eco** performance mode.

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Keep each pull request focused on one change, and describe what it does and why. Include before/after images for visual changes.
3. Make sure the app loads without console errors and exports still work.

## Licensing of contributions

Halation is licensed under the [GNU AGPL-3.0](LICENSE), and the project owner also offers it under separate commercial terms. By submitting a contribution, you confirm that you wrote it (or have the right to submit it), and you agree that it is licensed under the AGPL-3.0 **and** that the project owner may also license it under other terms, including commercial licenses. If you can't agree to this, please open an issue to discuss before sending code.
