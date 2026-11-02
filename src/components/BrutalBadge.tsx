/**
 * BrutalBadge
 * ─────────────────────────────────────────────────────────────────────────────
 * Thick pill badge with 3px solid black border, bold white text on a coloured
 * background. Optionally renders as a "starburst" style.
 *
 * Usage:
 *   <BrutalBadge label="BIDDING" color="#8B5CF6" />
 *   <BrutalBadge label="✓ DONE" color="#10B981" starburst />
 *
 * The `starburst` variant adds a large font with rotated decoration — kept
 * simple so it renders correctly on Expo Go without custom SVG.
 */

import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { BORDER_WIDTH, Neutral } from '../theme';

export interface BrutalBadgeProps {
  label: string;
  /** Badge background colour. Defaults to black. */
  color?: string;
  /** Text colour. Defaults to white. */
  textColor?: string;
  /** Make the badge larger with star-style bold decoration. */
  starburst?: boolean;
  style?: ViewStyle;
}

export function BrutalBadge({
  label,
  color = Neutral.black,
  textColor = Neutral.white,
  starburst = false,
  style,
}: BrutalBadgeProps) {
  const pill: ViewStyle = {
    alignSelf: 'flex-start',
    backgroundColor: color,
    borderWidth: BORDER_WIDTH - 1, // 3px for badges
    borderColor: Neutral.black,
    borderRadius: 9999,
    paddingHorizontal: starburst ? 18 : 12,
    paddingVertical: starburst ? 8 : 4,
  };

  return (
    <View style={[pill, style]}>
      <Text
        style={{
          fontWeight: '900',
          fontSize: starburst ? 16 : 11,
          color: textColor,
          textTransform: 'uppercase',
          letterSpacing: starburst ? -0.5 : 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Preset badge colours keyed by OrderStatus ────────────────────────────────
export const STATUS_BADGE_COLORS: Record<string, string> = {
  PLACED:                  '#6B7280', // gray
  BIDDING:                 '#8B5CF6', // purple
  AWAITING_PAYMENT:        '#EAB308', // amber
  ASSIGNED:                '#14B8A6', // teal
  IN_PROGRESS:             '#3B82F6', // blue
  PROOF_SUBMITTED:         '#EC4899', // hotpink
  AWAITING_ADDITIONAL_PAYMENT: '#F59E0B', // yellow-orange
  COMPLETED:               '#10B981', // emerald
  CANCELLED:               '#EF4444', // red
};

