import React from 'react';
import { Text, View } from 'react-native';

interface OfferCountdownProps {
  createdAtIso: string;
  onExpire?: () => void;
}

export function OfferCountdown(_props: OfferCountdownProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text style={{ fontWeight: '900', fontSize: 10, color: '#9CA3AF' }}>TIMER OFF</Text>
    </View>
  );
}
