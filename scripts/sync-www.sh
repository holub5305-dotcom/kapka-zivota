#!/usr/bin/env bash
# Copy PWA assets into Capacitor/Tauri www folders (does not delete the PWA root).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
sync_to() {
  local DEST="$1"
  rm -rf "$DEST"
  mkdir -p "$DEST"
  for item in index.html manifest.webmanifest sw.js css js data icons; do
    cp -a "$ROOT/$item" "$DEST/"
  done
  echo "Synced PWA → $DEST"
}
sync_to "$ROOT/mobile/www"
sync_to "$ROOT/desktop/www"
