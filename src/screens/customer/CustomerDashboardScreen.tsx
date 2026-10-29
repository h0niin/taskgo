import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BrutalBadge, BrutalButton, BrutalCard } from '../../components';
import { Canvas, Card, CTA, Neutral } from '../../theme';
import { effectiveCustomerId, selectCustomerOrders, useStore } from '../../store';
import { formatRupees } from '../../utils/format';

export function CustomerDashboardScreen({ navigation }: any) {
  const currentUser = useStore((s) => s.currentUser);
  const adminMode = useStore((s) => s.adminMode);
  const orders = useStore((s) => s.orders);

  const customerId = effectiveCustomerId(currentUser, adminMode);
  const myOrders = selectCustomerOrders(orders, customerId);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Canvas.purple }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      {/* Banner */}
      <View
        style={{
          backgroundColor: Card.cream,
          borderWidth: 4,
          borderColor: Neutral.black,
          borderRadius: 20,
          padding: 18,
          gap: 6,
        }}
      >
        <Text
          style={{
            fontWeight: '900',
            fontSize: 24,
            color: Neutral.black,
            textTransform: 'uppercase',
            letterSpacing: -1,
          }}
        >
          Kozhikode Errands
        </Text>
        <Text style={{ fontWeight: '700', fontSize: 14, color: '#374151' }}>
          Logged in as: {currentUser?.name} ({currentUser?.role})
        </Text>
        {currentUser?.role === 'ADMIN' && (
          <View style={{ marginTop: 4 }}>
            <BrutalBadge label="Admin Preview Mode · Acting as Customer" color="#EC4899" />
          </View>
        )}
      </View>

      {/* Action CTA */}
      <BrutalButton
        label="+ Post New Errand"
        color={CTA.lime}
        fullWidth
        size="lg"
        onPress={() => navigation.navigate('NewOrder')}
      />

      {/* Orders Summary Bento */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <BrutalCard backgroundColor={Card.mint}>
            <View style={{ padding: 16 }}>
              <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>
                Total Errands
              </Text>
              <Text style={{ fontWeight: '900', fontSize: 28, marginTop: 4 }}>
                {myOrders.length}
              </Text>
            </View>
          </BrutalCard>
        </View>

        <View style={{ flex: 1 }}>
          <BrutalCard backgroundColor={Card.lavender}>
            <View style={{ padding: 16 }}>
              <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>
                Active / In Progress
              </Text>
              <Text style={{ fontWeight: '900', fontSize: 28, marginTop: 4 }}>
                {myOrders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status)).length}
              </Text>
            </View>
          </BrutalCard>
        </View>
      </View>

      {/* Orders List Preview */}
      <Text
        style={{
          fontWeight: '900',
          fontSize: 18,
          color: Neutral.white,
          textTransform: 'uppercase',
          letterSpacing: -0.5,
          marginTop: 8,
        }}
      >
        Recent Errands
      </Text>

      {myOrders.length === 0 ? (
        <BrutalCard backgroundColor={Card.cream}>
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
              No Errands Yet
            </Text>
            <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              Post an errand to dispatch a Task Boy in Kozhikode!
            </Text>
          </View>
        </BrutalCard>
      ) : (
        myOrders.map((order) => (
          <BrutalCard key={order.id} backgroundColor={Card.cream}>
            <View style={{ padding: 16, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <BrutalBadge label={order.status} color="#8B5CF6" />
                <Text style={{ fontWeight: '900', fontSize: 12, color: '#4B5563' }}>
                  {order.category}
                </Text>
              </View>

              <Text style={{ fontWeight: '900', fontSize: 16, color: Neutral.black }}>
                {order.stops[0]?.address} → {order.stops[order.stops.length - 1]?.address}
              </Text>

              <Text style={{ fontWeight: '700', fontSize: 13, color: '#4B5563' }} numberOfLines={2}>
                {order.edgeCaseInstructions}
              </Text>

              <View
                style={{
                  borderTopWidth: 2,
                  borderColor: Neutral.black,
                  paddingTop: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontWeight: '900', fontSize: 12 }}>
                  {order.threads.length} {order.threads.length === 1 ? 'Bid' : 'Bids'}
                </Text>
                {order.agreedFee ? (
                  <Text style={{ fontWeight: '900', fontSize: 14 }}>
                    Agreed: {formatRupees(order.agreedFee)}
                  </Text>
                ) : (
                  <Text style={{ fontWeight: '900', fontSize: 12, color: '#F97316' }}>
                    Awaiting Bids
                  </Text>
                )}
              </View>
            </View>
          </BrutalCard>
        ))
      )}
    </ScrollView>
  );
}

