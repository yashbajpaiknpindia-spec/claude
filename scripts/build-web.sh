#!/bin/bash
set -e
echo "[build-web] Installing all workspace dependencies..."
cd /opt/render/project/src
npm install

echo "[build-web] Building workspace (types → web via turbo)..."
npx turbo run build --filter=@brandforge/web...

echo "[build-web] Build complete."
