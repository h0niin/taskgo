import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BrutalBadge, BrutalButton, BrutalCard } from '../../components';
import { Canvas, Card, CTA, Neutral } from '../../theme';
import { effectiveCustomerId, selectCustomerOrders, useStore } from '../../store';
import { formatDateTime, formatOrderId, formatPhone, humanizeStatus } from '../../utils/format';

export function CustomerProfileScreen({ navigation }: any) {
  const currentUser = useStore((s) => s.currentUser);
  const adminMode = useStore((s) => s.adminMode);
  const orders = useStore((s) => s.orders);
  const logout = useStore((s) => s.logout);
  const simulatorEnabled = useStore((s) => s.simulatorEnabled);
  const toggleSimulator = useStore((s) => s.toggleSimulator);
  const customerId = effectiveCustomerId(currentUser, adminMode);
  const historyOrders = selectCustomerOrders(orders, customerId).filter((order) =>
    ['COMPLETED', 'CANCELLED'].includes(order.status),
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Canvas.purple }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <BrutalCard backgroundColor={Card.cream}>
        <View style={{ padding: 20, gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              style={{
                fontWeight: '900',
                fontSize: 22,
                color: Neutral.black,
                textTransform: 'uppercase',
                letterSpacing: -0.5,
              }}
            >
              Account
            </Text>
            <BrutalBadge label={currentUser?.role ?? 'USER'} color="#8B5CF6" />
          </View>

          <View style={{ gap: 8 }}>
            <View>
              <Text style={{ fontWeight: '900', fontSize: 11, color: '#6B7280', textTransform: 'uppercase' }}>
                Full Name
              </Text>
              <Text style={{ fontWeight: '900', fontSize: 18, color: Neutral.black }}>
                {currentUser?.name}
              </Text>
            </View>

            <View>
              <Text style={{ fontWeight: '900', fontSize: 11, color: '#6B7280', textTransform: 'uppercase' }}>
                Email
              </Text>
              <Text style={{ fontWeight: '700', fontSize: 15, color: Neutral.black }}>
                {currentUser?.email}
              </Text>
            </View>

            <View>
              <Text style={{ fontWeight: '900', fontSize: 11, color: '#6B7280', textTransform: 'uppercase' }}>
                Mobile
              </Text>
              <Text style={{ fontWeight: '700', fontSize: 15, color: Neutral.black }}>
                {currentUser?.phone ? formatPhone(currentUser.phone) : '—'}
              </Text>
            </View>
          </View>
        </View>
      </BrutalCard>

      {/* Admin Simulator Switch (Section 12 of SPEC) */}
      {currentUser?.role === 'DUAL' && (
        <BrutalCard backgroundColor={Card.lavender}>
          <View style={{ padding: 18, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                ⚡ Dual Simulator
              </Text>
              <BrutalBadge
                label={simulatorEnabled ? 'ENABLED' : 'DISABLED'}
                color={simulatorEnabled ? '#10B981' : '#EF4444'}
              />
            </View>
            <Text style={{ fontWeight: '700', fontSize: 12, color: '#374151' }}>
              When enabled, simulated runners bid and respond automatically to simulate real activity on 1 device.
            </Text>
            <BrutalButton
              label={simulatorEnabled ? 'Turn Simulator OFF' : 'Turn Simulator ON'}
              size="sm"
              color={simulatorEnabled ? '#EF4444' : CTA.lime}
              onPress={toggleSimulator}
            />
          </View>
        </BrutalCard>
      )}

      <View style={{ gap: 12 }}>
        <Text style={{ fontWeight: '900', fontSize: 18, color: Neutral.white, textTransform: 'uppercase' }}>
          Errand History ({historyOrders.length})
        </Text>
        {historyOrders.length === 0 ? (
          <BrutalCard backgroundColor={Card.cream}>
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280' }}>
                Completed and cancelled errands will appear here.
              </Text>
            </View>
          </BrutalCard>
        ) : (
          historyOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
            >
              <BrutalCard backgroundColor="#E5E7EB">
                <View style={{ padding: 16, gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontWeight: '900', fontSize: 12, color: '#4B5563' }}>
                      {formatOrderId(order.id)} · {order.category}
                    </Text>
                    <BrutalBadge
                      label={humanizeStatus(order.status)}
                      color={order.status === 'COMPLETED' ? '#10B981' : '#EF4444'}
                    />
                  </View>
                  <Text style={{ fontWeight: '800', fontSize: 14, color: Neutral.black }}>
                    {order.stops[0]?.address} → {order.stops[order.stops.length - 1]?.address}
                  </Text>
                  <Text style={{ fontWeight: '700', fontSize: 11, color: '#6B7280' }}>
                    {formatDateTime(order.createdAt)}
                  </Text>
                </View>
              </BrutalCard>
            </TouchableOpacity>
          ))
        )}
      </View>

      <BrutalButton
        label="Log Out"
        color="#EF4444"
        fullWidth
        size="lg"
        onPress={logout}
      />
    </ScrollView>
  );
}
