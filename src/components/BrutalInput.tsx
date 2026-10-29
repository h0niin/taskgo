/**
 * BrutalInput
 * ─────────────────────────────────────────────────────────────────────────────
 * Neo-brutalist text input.
 *
 * Shape: rounded-full pill (borderRadius pill).
 * Border: 4px solid black.
 * No shadow in the resting state (inputs don't "lift").
 * Focus state: white background becomes creamDark (#FEF08A).
 *
 * Supports:
 *   - label (rendered above with bold black text)
 *   - error (rendered below in bold red)
 *   - leftIcon / rightIcon (inside the pill)
 *   - all standard TextInput props via ...rest
 */

import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { BORDER_RADIUS, BORDER_WIDTH, Neutral } from '../theme';

export interface BrutalInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  /** Fill when idle. Defaults to white. */
  backgroundColor?: string;
  /** Fill when focused. Defaults to #FEF08A. */
  focusColor?: string;
}

export function BrutalInput({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  backgroundColor = '#FFFFFF',
  focusColor = '#FEF08A',
  style,
  onFocus,
  onBlur,
  ...rest
}: BrutalInputProps) {
  const [focused, setFocused] = useState(false);

  const pill: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: focused ? focusColor : backgroundColor,
    borderWidth: BORDER_WIDTH,
    borderColor: Neutral.black,
    borderRadius: BORDER_RADIUS.pill,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  };

  return (
    <View style={[{ gap: 4 }, containerStyle]}>
      {label ? (
        <Text
          style={{
            fontWeight: '700',
            fontSize: 13,
            color: Neutral.black,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginLeft: 4,
          }}
        >
          {label}
        </Text>
      ) : null}

      <View style={pill}>
        {leftIcon}
        <TextInput
          placeholderTextColor="#9CA3AF"
          style={[
            {
              flex: 1,
              fontWeight: '700',
              fontSize: 15,
              color: Neutral.black,
              padding: 0, // reset internal padding on Android
            },
            style,
          ]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {rightIcon}
      </View>

      {error ? (
        <Text
          style={{
            fontWeight: '700',
            fontSize: 12,
            color: '#EF4444',
            marginLeft: 4,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

