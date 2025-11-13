export const BODY_COLORS = [
  'black',
  'white',
  'red',
  'blue',
  'yellow',
  'green',
  'pink',
  'purple',
  'navy',
  'custom'
] as const;

export const TEXT_COLORS = BODY_COLORS;

export const BAND_SIZES = [
  { id: '12x202', label: '12mm/202mm' }
] as const;

export const BAND_FINISHES = [
  { id: 'normal', label: 'Normal' }
] as const;

export type BandColorId = (typeof BODY_COLORS)[number];
export type BandSizeId = (typeof BAND_SIZES)[number]['id'];
export type BandFinishId = (typeof BAND_FINISHES)[number]['id'];

export const BAND_COLOR_PRESETS: Record<Exclude<BandColorId, 'custom'>, { label: string; hex: string }> = {
  black: { label: 'Black', hex: '#111827' },
  white: { label: 'White', hex: '#FFFFFF' },
  red: { label: 'Red', hex: '#DC2626' },
  blue: { label: 'Blue', hex: '#2563EB' },
  yellow: { label: 'Yellow', hex: '#FACC15' },
  green: { label: 'Green', hex: '#16A34A' },
  pink: { label: 'Pink', hex: '#EC4899' },
  purple: { label: 'Purple', hex: '#8B5CF6' },
  navy: { label: 'Navy', hex: '#1E3A8A' }
};

export const DEFAULT_BODY_COLOR: BandColorId = 'black';
export const DEFAULT_TEXT_COLOR: BandColorId = 'white';
export const DEFAULT_SIZE: BandSizeId = BAND_SIZES[0].id;
export const DEFAULT_FINISH: BandFinishId = BAND_FINISHES[0].id;

export function resolveColorHex(color: BandColorId, customHex?: string): string {
  if (color === 'custom') {
    return customHex ?? '#000000';
  }

  return BAND_COLOR_PRESETS[color].hex;
}

export function resolveColorLabel(color: BandColorId): string {
  if (color === 'custom') {
    return 'Custom';
  }

  return BAND_COLOR_PRESETS[color].label;
}
