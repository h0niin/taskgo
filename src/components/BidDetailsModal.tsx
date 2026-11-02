import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BrutalButton } from './BrutalButton';
import { KeyboardAwareScrollView } from './KeyboardAwareScrollView';
import { Card, CTA, Neutral } from '../theme';

interface BidDetailsModalProps {
  visible: boolean;
  amount: string;
  note: string;
  showNote?: boolean;
  title?: string;
  submitLabel?: string;
  minAmount?: number;
  onCancel: () => void;
  onSubmit: (amount: string, note: string) => void;
}

export function BidDetailsModal({
  visible,
  amount,
  note,
  showNote = true,
  title = 'Enter Bid Amount & Note',
  submitLabel = 'Use Amount & Note',
  minAmount = 60,
  onCancel,
  onSubmit,
}: BidDetailsModalProps) {
  const [draftAmount, setDraftAmount] = useState(amount);
  const [draftNote, setDraftNote] = useState(note);
  const [error, setError] = useState<string | null>(null);

  const confirm = () => {
    if (!/^\d+$/.test(draftAmount) || Number(draftAmount) < minAmount) {
      const msg = `Amount cannot be below ₹${minAmount}.`;
      setError(msg);
      Alert.alert('Invalid Amount', msg);
      return;
    }
    if (showNote && !draftNote.trim()) {
      setError('Add a short reasoning note.');
      return;
    }

    onSubmit(draftAmount, draftNote.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }}
      >
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        >
          <View style={{ backgroundColor: Card.cream, borderWidth: 4, borderColor: Neutral.black, borderRadius: 20, padding: 20, gap: 16 }}>
            <Text style={{ fontWeight: '900', fontSize: 18, textTransform: 'uppercase', color: Neutral.black }}>
              {title}
            </Text>
            <TextInput
              autoFocus
              value={draftAmount}
              onChangeText={(value) => {
                setDraftAmount(value.replace(/\D/g, ''));
                setError(null);
              }}
              placeholder="Amount in rupees"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              returnKeyType="next"
              style={{ backgroundColor: Neutral.white, borderWidth: 3, borderColor: Neutral.black, borderRadius: 14, padding: 14, fontWeight: '900', fontSize: 24, color: Neutral.black }}
            />
            {showNote ? (
              <>
                <TextInput
                  value={draftNote}
                  onChangeText={(value) => {
                    setDraftNote(value);
                    setError(null);
                  }}
                  placeholder="Short reasoning note (max 120 characters)"
                  placeholderTextColor="#9CA3AF"
                  maxLength={120}
                  multiline
                  textAlignVertical="top"
                  style={{ minHeight: 96, backgroundColor: Neutral.white, borderWidth: 3, borderColor: Neutral.black, borderRadius: 14, padding: 14, fontWeight: '700', fontSize: 16, color: Neutral.black }}
                />
                <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563', textAlign: 'right' }}>
                  {120 - draftNote.length} characters left
                </Text>
              </>
            ) : null}
            {error ? <Text style={{ fontWeight: '700', color: '#DC2626' }}>{error}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <BrutalButton
                  label="Cancel"
                  color={Neutral.white}
                  fullWidth
                  size="sm"
                  onPress={onCancel}
                />
              </View>
              <View style={{ flex: 1 }}>
                <BrutalButton
                  label={submitLabel}
                  color={CTA.lime}
                  fullWidth
                  size="sm"
                  onPress={confirm}
                />
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
