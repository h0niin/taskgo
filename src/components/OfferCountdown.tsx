import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';

interface OfferCountdownProps {
  createdAtIso: string;
  onExpire?: () => void;
}

const EXPIRY_MINUTES = 10;

export function OfferCountdown({ createdAtIso, onExpire }: OfferCountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const created = new Date(createdAtIso).getTime();
    const expiresAt = created + EXPIRY_MINUTES * 60 * 1000;
    const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    return diff;
  });

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      const created = new Date(createdAtIso).getTime();
      const expiresAt = created + EXPIRY_MINUTES * 60 * 1000;
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(diff);

      if (diff <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAtIso, onExpire, secondsLeft]);

  if (secondsLeft <= 0) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Clock size={11} color="#EF4444" />
        <Text style={{ fontWeight: '900', fontSize: 10, color: '#EF4444', textTransform: 'uppercase' }}>
          Expired (10m passed)
        </Text>
      </View>
    );
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEF08A',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
      }}
    >
      <Clock size={10} color="#78350F" />
      <Text style={{ fontWeight: '900', fontSize: 10, color: '#78350F' }}>
        Expires in {timeFormatted}
      </Text>
    </View>
  );
}

