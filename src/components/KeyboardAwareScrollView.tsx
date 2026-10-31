import React, { useEffect, useRef } from 'react';
import { Keyboard, ScrollView, type ScrollViewProps } from 'react-native';

export function KeyboardAwareScrollView(props: ScrollViewProps) {
  const scrollView = useRef<React.ElementRef<typeof ScrollView>>(null);
  const focusedInput = useRef<number | null>(null);

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      if (focusedInput.current !== null) {
        scrollView.current?.scrollResponderScrollNativeHandleToKeyboard(
          focusedInput.current,
          24,
          true,
        );
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <ScrollView
      {...props}
      keyboardShouldPersistTaps={props.keyboardShouldPersistTaps ?? 'handled'}
      ref={scrollView}
      onFocus={(event) => {
        props.onFocus?.(event);
        focusedInput.current = event.nativeEvent.target;
      }}
      onBlur={(event) => {
        props.onBlur?.(event);
        if (focusedInput.current === event.nativeEvent.target) {
          focusedInput.current = null;
        }
      }}
    />
  );
}
