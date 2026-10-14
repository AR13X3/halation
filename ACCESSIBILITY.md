# Accessibility

Halation is a visual tool, but the interface for making things with it should work for as many people as possible. The goal is for the interface to meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA. It hasn't been formally audited yet, so this page describes where things stand today.

## What works

- **Keyboard.** Controls are standard buttons, sliders, menus, switches and text fields, so you can reach and change them with Tab, the arrow keys, Enter and Space. Section headers open and close with Enter or Space.
- **Exact values.** Every slider has a number field next to it, so you can type a value instead of dragging. The selected gradient stop's color and position can also be typed in.
- **Shortcuts.** Space plays or pauses, ← and → step through frames, / searches settings, S downloads, H hides the interface and ? lists every shortcut.
- **Settings search** finds any control by name, so you don't need to browse every section.
- **Motion you can stop.** The animation can be paused at any time, and paused frames are what you export. The tutorial's spotlight respects your system's reduced motion setting.
- **Tutorial.** The guided tour never blocks the app, and you can leave it at any point with Esc or End tutorial.

## Supported environments

Halation needs WebGL 2 and works in current versions of Chrome, Edge, Firefox and Safari. It's designed for desktop and laptop screens; narrow windows switch to a stacked layout.

## Known limitations

- **The output is visual.** Generated images and videos have no text alternative, and the live preview is an unlabeled canvas.
- **Motion starts automatically.** The animation plays when the app opens and doesn't yet follow the reduced motion setting. Press Space to pause it.
- **Strong patterns.** Some combinations, such as moiré screens, sparkle and fast speeds, can produce intense patterns or flicker. Lower the speed or pause if they're uncomfortable.
- **Pointer-only actions.** Adding and dragging gradient stops and painting the fluid simulation need a mouse, pen or touch. The palette library and Generate button offer keyboard-friendly ways to change colors.
- **Screen readers.** Several icon-only buttons are named only by their tooltip, and the app hasn't been tested systematically with screen readers.
- **Single-key shortcuts** can't be turned off yet, which may get in the way of speech input.
- **Visual design.** The interface is dark only, uses small text, and focus outlines are subtle on some controls.

## Reporting a barrier

If something gets in your way, please [open an issue](https://github.com/AR13X3/halation/issues/new) that starts its title with "Accessibility:". Describe what you were trying to do, what happened, and the browser, operating system and any assistive technology you use. Accessibility issues are treated as bugs.
