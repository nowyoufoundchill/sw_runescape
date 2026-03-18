#!/bin/bash
# Download RSC assets from Open-RSC GitHub repositories
# These are RuneScape Classic assets from the preservation community (AGPL-3.0)
#
# Usage: ./scripts/download-assets.sh
#
# This script downloads ready-to-use sprites and textures from Open-RSC repos.
# The game works without these (using procedural textures), but real RSC assets
# make it look much more authentic.

set -euo pipefail

ASSETS_DIR="$(cd "$(dirname "$0")/.." && pwd)/assets"

echo "=== SolarWinds Quest - RSC Asset Downloader ==="
echo ""

# Check for required tools
if ! command -v git &>/dev/null; then
    echo "Error: git is required"
    exit 1
fi

TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# 1. Ground textures from RSC-OpenGL-Map-Viewer
echo "[1/4] Downloading ground textures..."
mkdir -p "$ASSETS_DIR/textures/ground"
mkdir -p "$ASSETS_DIR/textures/wall"
mkdir -p "$ASSETS_DIR/textures/model"

if git clone --depth 1 --filter=blob:none --sparse \
    https://github.com/Open-RSC/RSC-OpenGL-Map-Viewer.git \
    "$TEMP_DIR/map-viewer" 2>/dev/null; then
    cd "$TEMP_DIR/map-viewer"
    git sparse-checkout set data/textures 2>/dev/null || true
    cp -f data/textures/ground/*.bmp "$ASSETS_DIR/textures/ground/" 2>/dev/null || echo "  (no ground textures found)"
    cp -f data/textures/wall/*.bmp "$ASSETS_DIR/textures/wall/" 2>/dev/null || echo "  (no wall textures found)"
    cp -f data/textures/model/*.bmp "$ASSETS_DIR/textures/model/" 2>/dev/null || echo "  (no model textures found)"
    cd - >/dev/null
    echo "  Ground textures downloaded!"
else
    echo "  Warning: Could not clone RSC-OpenGL-Map-Viewer"
fi

# 2. Character sprites from rsc-sprite-generator
echo "[2/4] Downloading character sprites..."
mkdir -p "$ASSETS_DIR/sprites/characters"

if git clone --depth 1 --filter=blob:none --sparse \
    https://github.com/Open-RSC/rsc-sprite-generator.git \
    "$TEMP_DIR/sprite-gen" 2>/dev/null; then
    cd "$TEMP_DIR/sprite-gen"
    git sparse-checkout set res/sprites 2>/dev/null || true
    # Copy a selection of key sprites (not all 1144)
    for i in 0 1 2 3 4 5 10 20 30 40 50 100 200 300 400 500; do
        cp -f "res/sprites/$i.png" "$ASSETS_DIR/sprites/characters/" 2>/dev/null || true
    done
    cd - >/dev/null
    echo "  Character sprites downloaded!"
else
    echo "  Warning: Could not clone rsc-sprite-generator"
fi

# 3. Sprite atlases from rsc-c
echo "[3/4] Downloading sprite atlases..."
mkdir -p "$ASSETS_DIR/sprites/atlases"

if git clone --depth 1 --filter=blob:none --sparse \
    https://github.com/Open-RSC/rsc-c.git \
    "$TEMP_DIR/rsc-c" 2>/dev/null; then
    cd "$TEMP_DIR/rsc-c"
    git sparse-checkout set cache/textures 2>/dev/null || true
    cp -f cache/textures/sprites.png "$ASSETS_DIR/sprites/atlases/" 2>/dev/null || echo "  (no sprites atlas)"
    cp -f cache/textures/entities_*.png "$ASSETS_DIR/sprites/atlases/" 2>/dev/null || echo "  (no entity atlases)"
    cp -f cache/textures/model_textures.png "$ASSETS_DIR/sprites/atlases/" 2>/dev/null || echo "  (no model textures)"
    cd - >/dev/null
    echo "  Sprite atlases downloaded!"
else
    echo "  Warning: Could not clone rsc-c"
fi

# 4. Custom sprites
echo "[4/4] Downloading custom sprites..."
mkdir -p "$ASSETS_DIR/sprites/custom"

if git clone --depth 1 \
    https://github.com/Open-RSC/Custom-Sprite-Collection.git \
    "$TEMP_DIR/custom-sprites" 2>/dev/null; then
    cp -rf "$TEMP_DIR/custom-sprites"/* "$ASSETS_DIR/sprites/custom/" 2>/dev/null || true
    echo "  Custom sprites downloaded!"
else
    echo "  Warning: Could not clone Custom-Sprite-Collection"
fi

echo ""
echo "=== Download complete! ==="
echo "Assets saved to: $ASSETS_DIR"
echo ""
echo "Asset counts:"
find "$ASSETS_DIR" -type f | wc -l
echo "total files"
echo ""
echo "Note: The game works without these assets using procedural textures."
echo "These real RSC assets can be loaded via the asset loader for authentic look."
