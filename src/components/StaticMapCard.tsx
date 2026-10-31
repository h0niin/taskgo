import React from 'react';
import { Text, View, ViewStyle, Image } from 'react-native';
import { BrutalCard } from './BrutalCard';
import { BrutalBadge } from './BrutalBadge';
import { Neutral } from '../theme';
import { MapPin, Navigation, Bike } from 'lucide-react-native';

interface StaticMapCardProps {
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  currentStep?: string;
  etaText?: string;
  style?: ViewStyle;
}

export function StaticMapCard({
  pickupAddress,
  dropoffAddress,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
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

        {/* Real OSM Map */}
        {(pickupLat && pickupLng) ? (
          <View style={{ height: 120, borderRadius: 12, overflow: 'hidden', borderWidth: 3, borderColor: Neutral.black }}>
            <Text style={{ position: 'absolute', top: 4, left: 6, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontWeight: '900', fontSize: 10, color: Neutral.black }}>LIVE MAP · OSM</Text>
            <Image source={{ uri: `https://staticmap.openstreetmap.de/staticmap.php?center=${pickupLat},${pickupLng}&zoom=15&size=400x300&maptype=mapnik` }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
        ) : (
          <View style={{ height: 120, backgroundColor: '#BAE6FD', borderRadius: 12, borderWidth: 3, borderColor: Neutral.black, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <Text style={{ fontWeight: '900', fontSize: 12, color: '#0369A1' }}>MAP READY</Text>
          </View>
        )}

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

