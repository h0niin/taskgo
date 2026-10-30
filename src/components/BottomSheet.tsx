/**
 * BottomSheet
 * ─────────────────────────────────────────────────────────────────────────────
 * Neo-brutalist bottom sheet built on React Native Modal (no third-party lib).
 *
 * Appearance:
 *   - Cream (#FEF9C3) surface with 4px solid black top + sides border.
 *   - Rounded top corners (bento radius 24).
 *   - Black drag handle pill at the top.
 *   - Optional `title` rendered bold-uppercase in the header row.
 *   - Optional close button (X) rendered as a BrutalButton in the header.
 *   - Semi-transparent dark backdrop; tap to dismiss (if `dismissible`).
 *
 * Props:
 *   visible      – controls Modal visibility
 *   onClose      – called when user dismisses (backdrop tap or X button)
 *   title        – optional header title string
 *   dismissible  – whether backdrop/drag closes the sheet (default true)
 *   snapHeight   – fixed height in px, or undefined for fit-content
 *   children     – sheet body content
 */

import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import { BORDER_RADIUS, BORDER_WIDTH, Card, Neutral } from '../theme';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  dismissible?: boolean;
  /** Fixed height for the sheet. If omitted the sheet wraps its content. */
  snapHeight?: number;
  children: React.ReactNode;
  /** Extra style applied to the sheet surface view. */
  sheetStyle?: ViewStyle;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  dismissible = true,
  snapHeight,
  children,
  sheetStyle,
}: BottomSheetProps) {
  const sheet: ViewStyle = {
    backgroundColor: Card.cream,
    borderTopWidth: BORDER_WIDTH,
    borderLeftWidth: BORDER_WIDTH,
    borderRightWidth: BORDER_WIDTH,
    borderBottomWidth: 0,
    borderColor: Neutral.black,
    borderTopLeftRadius: BORDER_RADIUS.bento,
    borderTopRightRadius: BORDER_RADIUS.bento,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    ...(snapHeight ? { height: snapHeight } : {}),
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={dismissible ? onClose : undefined}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback
        onPress={() => {
          if (dismissible) {
            Keyboard.dismiss();
            onClose();
          }
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            justifyContent: 'flex-end',
          }}
        >
          {/* Sheet — prevent backdrop press from bubbling through */}
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[sheet, sheetStyle]}>
              {/* Drag handle */}
              <View
                style={{
                  width: 48,
                  height: 5,
                  borderRadius: 99,
                  backgroundColor: Neutral.black,
                  alignSelf: 'center',
                  marginBottom: 12,
                }}
              />

              {/* Header row */}
              {(title || dismissible) && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  {title ? (
                    <Text
                      style={{
                        fontWeight: '900',
                        fontSize: 20,
                        color: Neutral.black,
                        textTransform: 'uppercase',
                        letterSpacing: -0.5,
                        flex: 1,
                      }}
                    >
                      {title}
                    </Text>
                  ) : (
                    <View style={{ flex: 1 }} />
                  )}

                  {dismissible && (
                    <Pressable
                      onPress={onClose}
                      style={({ pressed }) => ({
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        borderWidth: BORDER_WIDTH,
                        borderColor: Neutral.black,
                        backgroundColor: pressed ? '#FEF08A' : Neutral.white,
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: pressed
                          ? [{ translateX: 2 }, { translateY: 2 }]
                          : [],
                      })}
                    >
                      <Text
                        style={{
                          fontWeight: '900',
                          fontSize: 16,
                          color: Neutral.black,
                        }}
                      >
                        ✕
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Body — scrollable when snapHeight is set; lifts above the keyboard */}
              {snapHeight ? (
                <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ flexGrow: 1 }}
                  >
                    {children}
                  </ScrollView>
                </KeyboardAvoidingView>
              ) : (
                <KeyboardAvoidingView behavior="padding">{children}</KeyboardAvoidingView>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

