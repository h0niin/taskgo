import React from 'react';
import { Platform, Text, View, ViewStyle } from 'react-native';
import MapView, {
  Marker,
  Polyline,
  UrlTile,
  type LatLng,
  type Region,
} from 'react-native-maps';
import { BrutalCard } from './BrutalCard';
import { BrutalBadge } from './BrutalBadge';
import { Neutral } from '../theme';
import { getAdminServerUrl } from '../utils/adminBridge';
import { MapPin, Navigation } from 'lucide-react-native';

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

function toCoordinate(latitude?: number, longitude?: number): LatLng | null {
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function routeRegion(pickup: LatLng, dropoff: LatLng): Region {
  return {
    latitude: (pickup.latitude + dropoff.latitude) / 2,
    longitude: (pickup.longitude + dropoff.longitude) / 2,
    latitudeDelta: Math.max(Math.abs(pickup.latitude - dropoff.latitude) * 1.5, 0.008),
    longitudeDelta: Math.max(Math.abs(pickup.longitude - dropoff.longitude) * 1.5, 0.008),
  };
}

export function StaticMapCard({
  pickupAddress,
  dropoffAddress,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  etaText,
  style,
}: StaticMapCardProps) {
  const pickup = toCoordinate(pickupLat, pickupLng);
  const dropoff = toCoordinate(dropoffLat, dropoffLng);
  const hasRoute = pickup !== null && dropoff !== null;

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

        {hasRoute ? (
          <View style={{ height: 180, borderRadius: 12, overflow: 'hidden', borderWidth: 3, borderColor: Neutral.black }}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={routeRegion(pickup, dropoff)}
              mapType={Platform.OS === 'android' ? 'none' : 'standard'}
              loadingEnabled
            >
              <UrlTile
                urlTemplate={`${getAdminServerUrl()}/api/map-tiles/{z}/{x}/{y}.png`}
                minimumZ={0}
                maximumZ={19}
                shouldReplaceMapContent={Platform.OS === 'ios'}
                zIndex={-1}
              />
              <Polyline
                coordinates={[pickup, dropoff]}
                strokeColor="#7C3AED"
                strokeWidth={4}
              />
              <Marker coordinate={pickup} title="Pickup" description={pickupAddress} pinColor="#16A34A" />
              <Marker coordinate={dropoff} title="Dropoff" description={dropoffAddress} pinColor="#DC2626" />
            </MapView>
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                right: 4,
                bottom: 4,
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 4,
                paddingHorizontal: 5,
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '700', color: Neutral.black }}>
                © OpenStreetMap contributors
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ height: 120, backgroundColor: '#BAE6FD', borderRadius: 12, borderWidth: 3, borderColor: Neutral.black, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', gap: 4 }}>
            <MapPin color="#0369A1" size={22} />
            <Text style={{ fontWeight: '900', fontSize: 12, color: '#0369A1' }}>
              Choose pickup and dropoff locations to view the map
            </Text>
          </View>
        )}

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
