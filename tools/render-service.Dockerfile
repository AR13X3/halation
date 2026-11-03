# Halation render service on Linux with an Intel or AMD GPU (see docs/RENDER-SERVICE.md).
# Build from the repository root: docker build -f tools/render-service.Dockerfile -t halation-render .
FROM mcr.microsoft.com/playwright:v1.56.1-noble

RUN apt-get update \
  && apt-get install -y --no-install-recommends mesa-vulkan-drivers libgl1-mesa-dri libegl1 \
  && rm -rf /var/lib/apt/lists/* \
  && ln -s "$(ls -d /ms-playwright/chromium-*/chrome-linux/chrome | head -1)" /usr/local/bin/halation-chrome

COPY . /app
WORKDIR /app

ENV HOST=0.0.0.0 \
    PORT=8787 \
    HALATION_CHROME=/usr/local/bin/halation-chrome \
    HALATION_CHROME_ARGS="--no-sandbox --disable-gpu-sandbox --ignore-gpu-blocklist --use-gl=angle --use-angle=gl-egl"

EXPOSE 8787
CMD ["node", "tools/render-service.mjs"]
