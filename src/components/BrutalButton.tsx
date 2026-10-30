/**
 * BrutalButton
 * ─────────────────────────────────────────────────────────────────────────────
 * Neo-brutalist Pressable button.
 *
 * Shadow mechanics identical to BrutalCard: an absolutely-positioned black
 * View is the shadow; press translates the button surface into the shadow and
 * hides it, giving tactile "press" feedback.
 *
 * Props
 *   label      – button text (uppercased via style)
 *   onPress    – tap handler
 *   color      – fill colour (defaults to lime #84CC16)
 *   disabled   – renders at 50% opacity, no press feedback
 *   fullWidth  – stretches to parent width
 *   size       – 'sm' | 'md' | 'lg'  (controls padding & font size)
 *   leftIcon   – React node rendered before label
 *   rightIcon  – React node rendered after label
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { BORDER_RADIUS, BORDER_WIDTH, Neutral, SHADOW_OFFSET } from '../theme';

export type BrutalButtonSize = 'sm' | 'md' | 'lg';

export interface BrutalButtonProps {
  label: string;
  onPress: () => void;
  /** Fill color. Defaults to lime #84CC16. */
  color?: string;
  /** Label text color. Defaults to Neutral.black. */
  textColor?: string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  size?: BrutalButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

const SIZE_MAP: Record<
  BrutalButtonSize,
  { px: number; py: number; fontSize: number }
> = {
  sm: { px: 16, py:  8, fontSize: 13 },
  md: { px: 24, py: 12, fontSize: 15 },
  lg: { px: 32, py: 16, fontSize: 18 },
};

export function BrutalButton({
  label,
  onPress,
  color = '#84CC16',
  textColor = Neutral.black,
  disabled = false,
  loading = false,
  fullWidth = false,
  size = 'md',
  leftIcon,
  rightIcon,
  style,
}: BrutalButtonProps) {
  const { px, py, fontSize } = SIZE_MAP[size];

  const shadow: ViewStyle = {
    position: 'absolute',
    top:    SHADOW_OFFSET,
    left:   SHADOW_OFFSET,
    right:  -SHADOW_OFFSET,
    bottom: -SHADOW_OFFSET,
    backgroundColor: Neutral.black,
    borderRadius: BORDER_RADIUS.pill,
    zIndex: 0,
  };

  const surface: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color,
    borderWidth: BORDER_WIDTH,
    borderColor: Neutral.black,
    borderRadius: BORDER_RADIUS.pill,
    paddingHorizontal: px,
    paddingVertical: py,
    zIndex: 1,
    opacity: disabled ? 0.5 : 1,
    gap: 8,
  };

  return (
    <View
      style={[
        {
          marginBottom: SHADOW_OFFSET,
          marginRight: SHADOW_OFFSET,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      <View style={shadow} />
      <Pressable
        onPress={disabled || loading ? undefined : onPress}
        style={({ pressed }) => [
          surface,
          pressed && !disabled && {
            transform: [
              { translateX: SHADOW_OFFSET },
              { translateY: SHADOW_OFFSET },
            ],
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Neutral.black} />
        ) : (
          <>
            {leftIcon}
            <Text
              style={{
                fontWeight: '900',
                fontSize,
                color: textColor,
                textTransform: 'uppercase',
                letterSpacing: -0.5,
              }}
            >
              {label}
            </Text>
            {rightIcon}
          </>
        )}
      </Pressable>
    </View>
  );
}

