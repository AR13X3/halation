# Render service

`tools/render-service.mjs` runs Halation in headless Chromium and answers HTTP requests with finished images, so scripts and automation tools can create backgrounds without opening the app. It has no dependencies beyond Node 22 and a Chromium or Chrome binary.

It has no authentication. Keep it on `localhost` or a private network.

## Run it

```bash
HALATION_CHROME=/path/to/chrome npm run render-service
```

| Variable | Default | Meaning |
|---|---|---|
| `HALATION_CHROME` | required | Path of the browser binary |
| `HALATION_CHROME_ARGS` | empty | Extra browser flags, separated by spaces |
| `HOST`, `PORT` | `127.0.0.1`, `8787` | Where the service listens |
| `HALATION_KEEP` | `20` | How many finished images stay available |

### Docker, on Linux with an Intel or AMD GPU

```bash
docker build -f tools/render-service.Dockerfile -t halation-render .
docker run -d --name halation-render --restart unless-stopped --device /dev/dri --group-add "$(stat -c %g /dev/dri/renderD128)" -p 127.0.0.1:8787:8787 halation-render
```

Without a usable GPU, Chromium falls back to software rendering, which is many times slower. Check `software` in `GET /health`.

## API

### `GET /health`

Returns `ok`, the `renderer` in use, whether it is `software`, and the default weight of each Surprise me direction in `recipes`.

### `POST /surprise`

Creates a new design with Surprise me. Every field is optional.

| Field | Default | Meaning |
|---|---|---|
| `width`, `height` | `1000`, `1500` | Image size in pixels, 64 to 8192 |
| `candidates` | `24` | Designs to compare for each try, up to 64 |
| `minScore` | none | Try other directions, up to 5 times, until a design scores this high; the best one is returned either way |
| `weights` | defaults | How often each direction comes up, such as `{ "airy": 2, "print": 0 }`; 0 means never |
| `time` | random | Moment in the animation, in seconds |
| `format` | `jpeg` | `jpeg`, `png` or `webp` |
| `quality` | `0.93` | JPEG and WebP quality, 0 to 1 |

The response:

| Field | Meaning |
|---|---|
| `code` | A random ID for this image |
| `recipe`, `score` | The direction used and its automatic score, which only catches technical failures |
| `features` | Flow, form, glass, screen, material and object count |
| `look`, `time` | Everything needed to render this design again |
| `shareUrl` | A link that opens the design in Halation |
| `image`, `bytes`, `width`, `height` | The path to fetch the image from, and its size |

### `POST /render`

Renders a saved design. Send `look`, plus `time`, `width`, `height`, `format` and `quality` as above. The response has the same shape, with `recipe` and `score` set to `null`.

### `GET /images/<name>`

Returns a finished image. Only the newest `HALATION_KEEP` images are kept, and restarting the service clears them, so save an image once it's rendered.

## Behavior

Requests render one at a time, in order. If a render takes more than 3 minutes or the browser exits, the service stops so that a process manager can restart it.
