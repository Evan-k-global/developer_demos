#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_DIR="$ROOT_DIR/installer"
PAYLOAD_DIR="$PKG_DIR/payload"
SCRIPTS_DIR="$PKG_DIR/scripts"
OUT_DIR="$ROOT_DIR/dist"

mkdir -p "$OUT_DIR"

PKG_PATH="$OUT_DIR/AIImageVerdictZK.pkg"

pkgbuild \
  --root "$PAYLOAD_DIR" \
  --scripts "$SCRIPTS_DIR" \
  --identifier "com.aiimage.verdict.zk" \
  --version "1.0.0" \
  "$PKG_PATH"

echo "Created: $PKG_PATH"
