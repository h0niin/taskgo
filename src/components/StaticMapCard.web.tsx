import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { BrutalBadge } from './BrutalBadge';
import { BrutalCard } from './BrutalCard';
import { Neutral } from '../theme';

interface StaticMapCardProps {
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  etaText?: string;
  style?: ViewStyle;
}

export function StaticMapCard({
  pickupAddress,
  dropoffAddress,
  etaText,
  style,
}: StaticMapCardProps) {
  return (
    <BrutalCard backgroundColor="#E0F2FE" style={style}>
      <View style={{ padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Navigation color={Neutral.black} size={16} strokeWidth={3} />
            <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>
              Route Preview
            </Text>
          </View>
          {etaText ? <BrutalBadge label={`ETA: ${etaText}`} color="#10B981" /> : null}
        </View>

        <View
          style={{
            height: 120,
            backgroundColor: '#BAE6FD',
            borderRadius: 12,
            borderWidth: 3,
            borderColor: Neutral.black,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            gap: 4,
          }}
        >
          <MapPin color="#0369A1" size={22} />
          <Text style={{ fontWeight: '900', fontSize: 12, color: '#0369A1' }}>
            Map preview is available in the mobile app
          </Text>
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ fontWeight: '800', fontSize: 11, color: '#1F2937' }} numberOfLines={1}>
            🟢 <Text style={{ fontWeight: '900' }}>From:</Text> {pickupAddress}
          </Text>
          <Text style={{ fontWeight: '800', fontSize: 11, color: '#1F2937' }} numberOfLines={1}>
            🔴 <Text style={{ fontWeight: '900' }}>To:</Text> {dropoffAddress}
          </Text>
        </View>
      </View>
    </BrutalCard>
  );
}
