import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { BrutalCard } from './BrutalCard';
import { BrutalBadge } from './BrutalBadge';
import { Neutral } from '../theme';
import { MapPin, Navigation, Bike } from 'lucide-react-native';

interface StaticMapCardProps {
  pickupAddress: string;
  dropoffAddress: string;
  currentStep?: string;
  etaText?: string;
  style?: ViewStyle;
}

export function StaticMapCard({
  pickupAddress,
  dropoffAddress,
  currentStep,
  etaText = '12-15 mins',
  style,
}: StaticMapCardProps) {
  return (
    <BrutalCard backgroundColor="#E0F2FE" style={style}>
      <View style={{ padding: 14, gap: 10 }}>
        {/* Map Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Navigation color={Neutral.black} size={16} strokeWidth={3} />
            <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>
              Live Kozhikode Route
            </Text>
          </View>
          <BrutalBadge label={`ETA: ${etaText}`} color="#10B981" />
        </View>

        {/* Stylized Grid Map Canvas */}
        <View
          style={{
            height: 120,
            backgroundColor: '#BAE6FD',
            borderRadius: 12,
            borderWidth: 3,
            borderColor: Neutral.black,
            position: 'relative',
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Street Grid Lines */}
          <View
            style={{
              position: 'absolute',
              top: 30,
              left: 0,
              right: 0,
              height: 14,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 2,
              borderBottomWidth: 2,
              borderColor: Neutral.black,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '42%',
              width: 16,
              backgroundColor: '#FFFFFF',
              borderLeftWidth: 2,
              borderRightWidth: 2,
              borderColor: Neutral.black,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 75,
              left: 0,
              right: 0,
              height: 10,
              backgroundColor: '#FEF08A',
              borderTopWidth: 1.5,
              borderBottomWidth: 1.5,
              borderColor: Neutral.black,
            }}
          />

          {/* Street Labels */}
          <Text
            style={{
              position: 'absolute',
              top: 32,
              left: 10,
              fontWeight: '900',
              fontSize: 9,
              color: '#374151',
              textTransform: 'uppercase',
            }}
          >
            Mavoor Road
          </Text>
          <Text
            style={{
              position: 'absolute',
              bottom: 8,
              right: 12,
              fontWeight: '900',
              fontSize: 9,
              color: '#374151',
              textTransform: 'uppercase',
            }}
          >
            Beach Rd → Palayam
          </Text>

          {/* Route Connection Line */}
          <View
            style={{
              position: 'absolute',
              width: '65%',
              height: 4,
              backgroundColor: '#EF4444',
              borderRadius: 2,
            }}
          />

          {/* Pickup Pin */}
          <View
            style={{
              position: 'absolute',
              left: 24,
              top: 24,
              backgroundColor: '#10B981',
              padding: 4,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: Neutral.black,
            }}
          >
            <MapPin size={14} color={Neutral.black} strokeWidth={3} />
          </View>

          {/* Runner Bike Moving Icon */}
          <View
            style={{
              position: 'absolute',
              left: '45%',
              top: 42,
              backgroundColor: '#F97316',
              padding: 6,
              borderRadius: 999,
              borderWidth: 3,
              borderColor: Neutral.black,
              transform: [{ scale: 1.1 }],
            }}
          >
            <Bike size={18} color={Neutral.black} strokeWidth={3} />
          </View>

          {/* Dropoff Pin */}
          <View
            style={{
              position: 'absolute',
              right: 28,
              top: 68,
              backgroundColor: '#EC4899',
              padding: 4,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: Neutral.black,
            }}
          >
            <MapPin size={14} color={Neutral.black} strokeWidth={3} />
          </View>
        </View>

        {/* Route Address Tags */}
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

