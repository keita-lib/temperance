#!/usr/bin/env python3
"""Generate Temperance icon artwork as portable pixmap files.

The script keeps the drawing procedural so we don't need external
dependencies. Each render produces a 1024x1024 PPM image that can be
converted into PNG assets (e.g. with macOS `sips`).
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path
from typing import Iterable, Tuple

Color = Tuple[int, int, int]


def hex_to_rgb(value: str) -> Color:
    value = value.lstrip('#')
    return tuple(int(value[i : i + 2], 16) for i in range(0, 6, 2))  # type: ignore[return-value]


def mix(a: Color, b: Color, t: float) -> Color:
    t = max(0.0, min(1.0, t))
    return tuple(int(round(ai + (bi - ai) * t)) for ai, bi in zip(a, b))


def draw_icon(scale: float, dest: Path, size: int = 1024) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)

    bg_start = hex_to_rgb('0f172a')
    bg_end = hex_to_rgb('1e1b4b')
    glow_color = hex_to_rgb('2dd4bf')
    ring_color = hex_to_rgb('facc15')
    inner_ring = hex_to_rgb('a16207')
    stem_light = hex_to_rgb('fef3c7')
    stem_shadow = hex_to_rgb('ca8a04')
    accent = hex_to_rgb('34d399')

    margin = (1.0 - scale) / 2.0

    def transform(value: float) -> float:
        return margin + value * scale

    def to_px(norm_value: float) -> int:
        norm_value = max(0.0, min(1.0, norm_value))
        return int(round(norm_value * (size - 1)))

    # Normalized layout definitions before scaling.
    top_y = 0.32
    bar_thickness = 0.10
    bar_left = transform(0.18)
    bar_right = transform(0.82)
    bar_top = transform(top_y - bar_thickness / 2)
    bar_bottom = transform(top_y + bar_thickness / 2)

    stem_width = 0.16
    stem_top = transform(top_y + bar_thickness / 2 - 0.02)
    stem_bottom = transform(0.78)
    stem_left = transform(0.5 - stem_width / 2)
    stem_right = transform(0.5 + stem_width / 2)

    bar_left_px, bar_right_px = to_px(bar_left), to_px(bar_right)
    bar_top_px, bar_bottom_px = to_px(bar_top), to_px(bar_bottom)
    stem_left_px, stem_right_px = to_px(stem_left), to_px(stem_right)
    stem_top_px, stem_bottom_px = to_px(stem_top), to_px(stem_bottom)

    bar_height = max(1, bar_bottom_px - bar_top_px)
    stem_height = max(1, stem_bottom_px - stem_top_px)
    stem_width_px = max(1, stem_right_px - stem_left_px)

    pixels = bytearray()

    ring_inner = 0.32 * scale
    ring_outer = 0.40 * scale
    inner_core = 0.26 * scale

    for y in range(size):
        yn = y / (size - 1)
        for x in range(size):
            xn = x / (size - 1)
            diag = 0.35 * xn + 0.65 * yn
            color = mix(bg_start, bg_end, diag)

            dist = math.hypot(xn - 0.5, yn - 0.5)
            if dist < 0.48:
                glow_strength = (0.48 - dist) / 0.48
                color = mix(color, glow_color, 0.25 * glow_strength)

            if dist < ring_outer:
                if dist <= ring_inner:
                    color = mix(color, inner_ring, 0.15)
                elif ring_inner < dist <= ring_outer:
                    ring_mix = 1.0 - (dist - ring_inner) / max(1e-6, ring_outer - ring_inner)
                    color = mix(color, ring_color, 0.5 * ring_mix)

            if dist < inner_core:
                color = mix(color, inner_ring, 0.2)

            # Upward accent ridge
            ridge_line = transform(0.55)
            if yn < ridge_line and xn > transform(0.55):
                accent_mix = max(0.0, 1.0 - (xn - transform(0.55)) * 2.5)
                color = mix(color, accent, 0.2 * accent_mix)

            in_bar = bar_left_px <= x <= bar_right_px and bar_top_px <= y <= bar_bottom_px
            if in_bar:
                t = (y - bar_top_px) / bar_height
                color = mix(stem_light, stem_shadow, min(1.0, t * 0.8))

            in_stem = stem_left_px <= x <= stem_right_px and stem_top_px <= y <= stem_bottom_px
            if in_stem:
                t = (y - stem_top_px) / stem_height
                color = mix(stem_light, stem_shadow, min(1.0, 0.3 + t * 0.6))

            # Inner highlight stripe
            if in_stem and abs(x - (stem_left_px + stem_right_px) / 2) < stem_width_px * 0.1:
                color = mix(color, stem_light, 0.6)

            pixels.extend(color)

    header = f"P6\n{size} {size}\n255\n".encode('ascii')
    dest.write_bytes(header + bytes(pixels))


def parse_args(argv: Iterable[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Generate Temperance icon artwork (PPM format).')
    parser.add_argument('--scale', type=float, default=0.9, help='glyph scale factor (0-1) to add safe padding')
    parser.add_argument('--size', type=int, default=1024, help='canvas size in pixels (square)')
    parser.add_argument('output', type=Path, help='destination PPM path')
    return parser.parse_args(argv)


def main() -> None:
    args = parse_args()
    draw_icon(scale=args.scale, dest=args.output, size=args.size)


if __name__ == '__main__':
    main()
