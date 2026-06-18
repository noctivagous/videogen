#!/usr/bin/env python3
"""Resize and chroma-key green screen to transparent PNG for subject cutouts."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image

TARGET_W, TARGET_H = 1280, 720
CHROMA = (0, 255, 0)
TOLERANCE = 85


def chroma_to_alpha(img: Image.Image) -> Image.Image:
    img = img.convert('RGBA')
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if g > 160 and g > r + 40 and g > b + 40:
                dist = ((r - CHROMA[0]) ** 2 + (g - CHROMA[1]) ** 2 + (b - CHROMA[2]) ** 2) ** 0.5
                if dist < TOLERANCE:
                    px[x, y] = (r, g, b, 0)
                elif dist < TOLERANCE * 1.8:
                    fade = int(255 * (dist - TOLERANCE) / (TOLERANCE * 0.8))
                    px[x, y] = (r, g, b, min(255, fade))
    return img


def process(src: Path, dest: Path) -> None:
    img = Image.open(src).convert('RGB')
    img = img.resize((TARGET_W, TARGET_H), Image.Resampling.LANCZOS)
    out = chroma_to_alpha(img)
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, 'PNG')
    print(f'Wrote {dest}')


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('src')
    p.add_argument('dest')
    args = p.parse_args()
    process(Path(args.src), Path(args.dest))
    return 0


if __name__ == '__main__':
    sys.exit(main())