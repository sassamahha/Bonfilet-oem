// lib/color.ts
export function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

export function normalizeHex(input: string): string | null {
  if (typeof input !== 'string') return null;
  let v = input.trim().toLowerCase();
  if (!v) return null;
  if (!v.startsWith('#')) v = `#${v}`;
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(v)) return null;
  if (v.length === 4) {
    // #abc -> #aabbcc
    v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  return v.toUpperCase();
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  const m = /^#([0-9a-f]{6})$/i.exec(n);
  if (!m) return null;
  const int = parseInt(m[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (x: number) => x.toString(16).padStart(2, '0');
  return `#${to((r | 0) & 255)}${to((g | 0) & 255)}${to((b | 0) & 255)}`.toUpperCase();
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      default: h = ((r - g) / d + 4);
    }
    h *= 60;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60)       { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120){ r = x; g = c; b = 0; }
  else if (120 <= h && h < 180){ r = 0; g = c; b = x; }
  else if (180 <= h && h < 240){ r = 0; g = x; b = c; }
  else if (240 <= h && h < 300){ r = x; g = 0; b = c; }
  else                         { r = c; g = 0; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function hexToHsv(hex: string): { h: number; s: number; v: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsv(rgb.r, rgb.g, rgb.b);
}

export function hsvToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}
