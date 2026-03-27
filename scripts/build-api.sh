#!/bin/bash
set -e
echo "[build-api] Installing all workspace dependencies..."
cd /opt/render/project/src
npm install

echo "[build-api] Building workspace (types → ai-core → api via turbo)..."
npx turbo run build --filter=@brandforge/api...

echo "[build-api] Build complete. Output at apps/api/dist/"
