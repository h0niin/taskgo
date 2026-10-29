// ─── Neo-Brutalist Color Palette ─────────────────────────────────────────────

/** Canvas background colors — one per screen/role */
export const Canvas = {
  purple:  '#8B5CF6',
  orange:  '#F97316',
  teal:    '#14B8A6',
  emerald: '#10B981',
} as const;

/** Card fills */
export const Card = {
  cream:     '#FEF9C3',
  creamDark: '#FEF08A',
  lavender:  '#EDE9FE',
  mint:      '#D1FAE5',
} as const;

/** CTA button fills */
export const CTA = {
  lime:    '#84CC16',
  hotpink: '#EC4899',
  violet:  '#A855F7',
} as const;

/** Always-on neutrals */
export const Neutral = {
  black: '#000000',
  white: '#FFFFFF',
} as const;

/** Hard shadow — always solid black offset 4px right & down */
export const SHADOW_OFFSET = 4;
export const BORDER_WIDTH  = 4;
export const BORDER_RADIUS = {
  pill:    9999,
  bento:   24,
  card:    16,
  input:   9999,
};

