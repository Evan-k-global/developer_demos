#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/Applications/AIImageVerdictZK"
cd "$APP_DIR"

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  fi
fi

./setup.sh

echo "\nLaunching app..."

npm run dev &

sleep 2
open "http://localhost:5173"
