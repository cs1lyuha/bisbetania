// Calcule de culoare pure (fără React), ca să poată fi testate cu Node.

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1, 7), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

/** Nuanța (0–360), saturația și luminozitatea (0–100). */
export function hexToHsl(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === rr ? (gg - bb) / d + (gg < bb ? 6 : 0) : max === gg ? (bb - rr) / d + 2 : (rr - gg) / d + 4;
  return { h: h * 60, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number) {
  const ss = clamp(s / 100);
  const ll = clamp(l / 100);
  const k = (n: number) => (n + h / 30) % 12;
  const a = ss * Math.min(ll, 1 - ll);
  const f = (n: number) => ll - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

/** Amestecul a două culori: t = 0 → a, t = 1 → b. */
export function mix(a: string, b: string, t: number) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex(x.r + (y.r - x.r) * t, x.g + (y.g - x.g) * t, x.b + (y.b - x.b) * t);
}

/** Contrastul WCAG dintre două culori (1–21). */
export function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const { r, g, b: bl } = hexToRgb(hex);
    const ch = (v: number) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(bl);
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/**
 * Culorile neutre (fundal, carduri, margini, text) din nuanța accentului: un fundal abia colorat
 * în aceeași familie, ca un accent albastru să nu stea pe un crem cald (și invers).
 */
export function neutralsFor(accent: string, dark: boolean) {
  const { h } = hexToHsl(accent);
  if (dark) {
    return {
      bg: hslToHex(h, 22, 6),
      card: hslToHex(h, 16, 10.5),
      ink: hslToHex(h, 14, 92),
      muted: hslToHex(h, 8, 63),
      line: hslToHex(h, 14, 17),
    };
  }
  return {
    bg: hslToHex(h, 30, 96.5),
    card: '#FFFFFF',
    ink: hslToHex(h, 28, 13),
    muted: hslToHex(h, 9, 41),
    line: hslToHex(h, 22, 90),
  };
}
