#!/usr/bin/env bash
# Import a generated JPG from Grok images folder into a transparent PNG cutout.
# Usage: ./scripts/import-cutout.sh <source.jpg> <dest.png>
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$ROOT/scripts/process-cutout.py" "$1" "$ROOT/public/stock/$2"
echo "Imported public/stock/$2"