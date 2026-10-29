import React, { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { BrutalBadge, BrutalButton, BrutalCard } from '../../components';
import { Canvas, Card, CTA, Neutral } from '../../theme';
import { selectRunnerFeed, useStore } from '../../store';
import { formatDistance } from '../../utils/format';

export function RunnerFeedScreen() {
  const [online, setOnline] = useState(true);
  const currentUser = useStore((s) => s.currentUser);
  const orders = useStore((s) => s.orders);
  const feedOrders = selectRunnerFeed(orders);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Canvas.orange }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      {/* Online Status Banner */}
      <View
        style={{
          backgroundColor: online ? CTA.lime : '#E5E7EB',
          borderWidth: 4,
          borderColor: Neutral.black,
          borderRadius: 20,
          padding: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              fontWeight: '900',
              fontSize: 18,
              color: Neutral.black,
              textTransform: 'uppercase',
              letterSpacing: -0.5,
            }}
          >
            {online ? 'ONLINE · READY FOR ERRANDS' : 'OFFLINE · NOT RECEIVING'}
          </Text>
          <Text style={{ fontWeight: '700', fontSize: 12, color: '#374151' }}>
            {online ? 'Active around Kozhikode localities' : 'Turn switch on to view live gigs'}
          </Text>
        </View>

        <Switch
          value={online}
          onValueChange={setOnline}
          trackColor={{ false: '#9CA3AF', true: Neutral.black }}
          thumbColor={online ? CTA.lime : '#F3F4F6'}
        />
      </View>

      {/* Feed Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          style={{
            fontWeight: '900',
            fontSize: 20,
            color: Neutral.white,
            textTransform: 'uppercase',
            letterSpacing: -0.5,
          }}
        >
          Open Errands ({feedOrders.length})
        </Text>
        <BrutalBadge label="Kozhikode City" color={Neutral.black} />
      </View>

      {!online ? (
        <BrutalCard backgroundColor={Card.cream}>
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
              You are currently Offline
            </Text>
            <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              Toggle the switch above to become available for tasks.
            </Text>
          </View>
        </BrutalCard>
      ) : feedOrders.length === 0 ? (
        <BrutalCard backgroundColor={Card.cream}>
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
              No Open Errands
            </Text>
            <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              All Kozhikode requests are currently fulfilled!
            </Text>
          </View>
        </BrutalCard>
      ) : (
        feedOrders.map((order) => {
          const pickup = order.stops[0]?.address ?? 'Pickup';
          const dropoff = order.stops[order.stops.length - 1]?.address ?? 'Dropoff';

          return (
            <BrutalCard key={order.id} backgroundColor={Card.cream}>
              <View style={{ padding: 16, gap: 10 }}>
                {/* Meta Row: Category + Distance */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <BrutalBadge label={order.category} color="#F97316" />
                  <BrutalBadge label={formatDistance(order.distanceKm)} color={Neutral.black} />
                </View>

                {/* Route Summary */}
                <View>
                  <Text style={{ fontWeight: '900', fontSize: 16, color: Neutral.black }}>
                    {pickup} → {dropoff}
                  </Text>
                  <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563', marginTop: 2 }}>
                    {order.stops.length} stop{order.stops.length > 1 ? 's' : ''} in route
                  </Text>
                </View>

                {/* Instructions preview */}
                <Text
                  style={{
                    fontWeight: '700',
                    fontSize: 13,
                    color: '#374151',
                    backgroundColor: '#FEF08A',
                    padding: 8,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: Neutral.black,
                  }}
                  numberOfLines={2}
                >
                  {order.edgeCaseInstructions}
                </Text>

                {/* Footer: Bids Count & Action */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontWeight: '900', fontSize: 13, color: Neutral.black }}>
                    {order.threads.length} Current Bid{order.threads.length === 1 ? '' : 's'}
                  </Text>

                  <BrutalButton
                    label="Place Bid"
                    color={CTA.lime}
                    size="sm"
                    onPress={() => {
                      alert(`Bidding on ${order.id} will open in Step 5!`);
                    }}
                  />
                </View>
              </View>
            </BrutalCard>
          );
        })
      )}
    </ScrollView>
  );
}

