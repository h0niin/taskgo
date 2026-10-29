/**
 * BrutalCard
 * ─────────────────────────────────────────────────────────────────────────────
 * Neo-brutalist card with a hard black shadow implemented as an absolutely
 * positioned sibling View — NOT CSS box-shadow (not native-safe).
 *
 * Layout (z-order):
 *   ┌─────────────────────────┐  ← outer container (transparent, no border)
 *   │  ░░ shadow View ░░      │  absolutely positioned, offset +4/+4, z:0
 *   │  ▓▓ content View ▓▓     │  border + fill, z:1, contains {children}
 *   └─────────────────────────┘
 *
 * Press behaviour (when `onPress` is supplied):
 *   Pressable translates the content view by [+shadowOffset, +shadowOffset]
 *   and hides the shadow, giving a "sink in" tactile effect.
 */

import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { BORDER_RADIUS, BORDER_WIDTH, Neutral, SHADOW_OFFSET } from '../theme';

export interface BrutalCardProps {
  children: React.ReactNode;
  /** Fill colour of the card surface. Defaults to cream #FEF9C3. */
  backgroundColor?: string;
  /** Border-radius preset or custom number. Defaults to 'card' (16). */
  radius?: 'card' | 'bento' | 'pill' | number;
  /** Called on tap. When absent the card is non-interactive. */
  onPress?: () => void;
  /** Extra styles for the outer wrapper (controls margin/width/flex). */
  style?: ViewStyle;
  /** Extra styles applied directly to the content surface. */
  contentStyle?: ViewStyle;
}

export function BrutalCard({
  children,
  backgroundColor = '#FEF9C3',
  radius = 'card',
  onPress,
  style,
  contentStyle,
}: BrutalCardProps) {
  const r =
    typeof radius === 'number'
      ? radius
      : BORDER_RADIUS[radius] ?? BORDER_RADIUS.card;

  const shadow: ViewStyle = {
    position: 'absolute',
    top:    SHADOW_OFFSET,
    left:   SHADOW_OFFSET,
    right:  -SHADOW_OFFSET,
    bottom: -SHADOW_OFFSET,
    backgroundColor: Neutral.black,
    borderRadius: r,
    zIndex: 0,
  };

  const surface: ViewStyle = {
    backgroundColor,
    borderWidth: BORDER_WIDTH,
    borderColor: Neutral.black,
    borderRadius: r,
    zIndex: 1,
    overflow: 'hidden',
    ...contentStyle,
  };

  if (onPress) {
    return (
      <View style={[{ marginBottom: SHADOW_OFFSET, marginRight: SHADOW_OFFSET }, style]}>
        <View style={shadow} />
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            surface,
            pressed && {
              transform: [
                { translateX: SHADOW_OFFSET },
                { translateY: SHADOW_OFFSET },
              ],
            },
          ]}
        >
          {({ pressed }) => (
            <>
              {/* Hide shadow when pressed by covering it */}
              {pressed && (
                <View
                  style={{
                    position: 'absolute',
                    top: -SHADOW_OFFSET,
                    left: -SHADOW_OFFSET,
                    right: SHADOW_OFFSET,
                    bottom: SHADOW_OFFSET,
                    backgroundColor: Neutral.black,
                    zIndex: -1,
                  }}
                />
              )}
              {children}
            </>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[{ marginBottom: SHADOW_OFFSET, marginRight: SHADOW_OFFSET }, style]}>
      <View style={shadow} />
      <View style={surface}>{children}</View>
    </View>
  );
}

