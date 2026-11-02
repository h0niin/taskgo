import React, { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BrutalBadge,
  BrutalButton,
  BrutalCard,
  BrutalCardSkeleton,
  OrderStatusFilter,
  STATUS_BADGE_COLORS,
} from '../../components';
import { Canvas, Card, CTA, Neutral } from '../../theme';
import {
  effectiveCustomerId,
  selectCustomerOrders,
  useStore,
} from '../../store';
import { formatOrderId, formatOrderStage, formatRupees, humanizeStatus } from '../../utils/format';
import type { OrderStatus } from '../../types/models';
import { Bike, Navigation, ArrowRight, Clock, Plus } from 'lucide-react-native';

export function CustomerDashboardScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilters, setStatusFilters] = useState<OrderStatus[]>([]);
  const currentUser = useStore((s) => s.currentUser);
  const adminMode = useStore((s) => s.adminMode);
  const orders = useStore((s) => s.orders);

  const customerId = effectiveCustomerId(currentUser, adminMode);
  const myOrders = selectCustomerOrders(orders, customerId);
  const activeOrders = myOrders.filter(
    (order) => !['COMPLETED', 'CANCELLED'].includes(order.status),
  );
  const customerStatuses: OrderStatus[] = [
    'PLACED',
    'BIDDING',
    'AWAITING_PAYMENT',
    'ASSIGNED',
    'IN_PROGRESS',
    'PROOF_SUBMITTED',
    'AWAITING_ADDITIONAL_PAYMENT',
  ];
  const statusCounts = activeOrders.reduce<Partial<Record<OrderStatus, number>>>((counts, order) => {
    counts[order.status] = (counts[order.status] ?? 0) + 1;
    return counts;
  }, {});
  const filteredOrders = activeOrders.filter(
    (order) => statusFilters.length === 0 || statusFilters.includes(order.status),
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  // Active order for the hard-shadow tracking card (Section 8)
  const activeOrder = myOrders.find((o) =>
    ['ASSIGNED', 'IN_PROGRESS', 'PROOF_SUBMITTED', 'AWAITING_ADDITIONAL_PAYMENT'].includes(o.status),
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Canvas.purple }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Neutral.white} />
      }
    >
      {/* ── Active Order Hard-Shadow Tracking Card (SPEC Section 8.1) ────────── */}
      {activeOrder ? (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Navigation size={16} color={Neutral.white} />
              <Text
                style={{
                  fontWeight: '900',
                  fontSize: 14,
                  color: Neutral.white,
                  textTransform: 'uppercase',
                  letterSpacing: -0.5,
                }}
              >
                Live Errand In Progress
              </Text>
            </View>
            <BrutalBadge
              label={humanizeStatus(activeOrder.status)}
              color={STATUS_BADGE_COLORS[activeOrder.status] ?? '#10B981'}
            />
          </View>

          <BrutalCard backgroundColor={CTA.lime}>
            <View style={{ padding: 18, gap: 12 }}>
              {/* Header: Runner Name & ETA */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      backgroundColor: Neutral.black,
                      padding: 6,
                      borderRadius: 999,
                    }}
                  >
                    <Bike size={18} color={Neutral.white} />
                  </View>
                  <View>
                    <Text style={{ fontWeight: '900', fontSize: 16, color: Neutral.black }}>
                      {activeOrder.assignedRunnerName ?? 'Tasker'}
                    </Text>
                    <Text style={{ fontWeight: '700', fontSize: 11, color: '#374151' }}>
                      Step: {formatOrderStage(activeOrder)}
                    </Text>
                  </View>
                </View>

                <BrutalBadge label="ETA ~10-15m" color={Neutral.black} />
              </View>

              {/* Route */}
              <Text style={{ fontWeight: '900', fontSize: 14, color: Neutral.black }}>
                {activeOrder.stops[0]?.address} → {activeOrder.stops[activeOrder.stops.length - 1]?.address}
              </Text>

              {/* Progress Bar mapped to lifecycle */}
              <View style={{ gap: 4 }}>
                <View
                  style={{
                    height: 10,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 999,
                    borderWidth: 2,
                    borderColor: Neutral.black,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      backgroundColor: Neutral.black,
                      width:
                        activeOrder.status === 'AWAITING_ADDITIONAL_PAYMENT'
                          ? '95%'
                          : activeOrder.status === 'PROOF_SUBMITTED'
                          ? '85%'
                          : activeOrder.status === 'IN_PROGRESS'
                          ? '65%'
                          : activeOrder.status === 'ASSIGNED'
                          ? '45%'
                          : '25%',
                    }}
                  />
                </View>
                <Text style={{ fontWeight: '700', fontSize: 10, color: '#1F2937' }}>
                  Lifecycle Step: {formatOrderStage(activeOrder)}
                </Text>
              </View>

              <BrutalButton
                label="Track Errand & View Checkpoints →"
                color={Neutral.black}
                textColor={Neutral.white}
                fullWidth
                size="sm"
                onPress={() => navigation.navigate('OrderDetail', { orderId: activeOrder.id })}
              />
            </View>
          </BrutalCard>
        </View>
      ) : null}

      {/* ── Welcome & Post Errand CTA ────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: Card.cream,
          borderWidth: 4,
          borderColor: Neutral.black,
          borderRadius: 20,
          padding: 18,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text
              style={{
                fontWeight: '900',
                fontSize: 22,
                color: Neutral.black,
                textTransform: 'uppercase',
                letterSpacing: -1,
              }}
            >
              Kozhikode Errands
            </Text>
            <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563' }}>
              Logged in as {currentUser?.name}
            </Text>
          </View>
          <BrutalBadge label={`${myOrders.length} ORDERS`} color={Neutral.black} />
        </View>

        <BrutalButton
          label="+ Post New Errand"
          color={CTA.lime}
          fullWidth
          size="lg"
          onPress={() => navigation.navigate('NewOrder')}
        />
      </View>

      {/* ── Bento Grid Summary (SPEC Section 8.1) ────────────────────────────── */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <BrutalCard backgroundColor={Card.mint}>
            <View style={{ padding: 14, gap: 4 }}>
              <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase' }}>
                Active Tasks
              </Text>
              <Text style={{ fontWeight: '900', fontSize: 28 }}>
                {myOrders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status)).length}
              </Text>
            </View>
          </BrutalCard>
        </View>

        <View style={{ flex: 1 }}>
          <BrutalCard backgroundColor={Card.lavender}>
            <View style={{ padding: 14, gap: 4 }}>
              <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase' }}>
                Completed
              </Text>
              <Text style={{ fontWeight: '900', fontSize: 28 }}>
                {myOrders.filter((o) => o.status === 'COMPLETED').length}
              </Text>
            </View>
          </BrutalCard>
        </View>
      </View>

      {/* ── Bento Orders List ────────────────────────────────────────────────── */}
      <OrderStatusFilter
        value={statusFilters}
        onChange={setStatusFilters}
        counts={statusCounts}
        allCount={activeOrders.length}
        statuses={customerStatuses}
      />
      <Text
        style={{
          fontWeight: '900',
          fontSize: 18,
          color: Neutral.white,
          textTransform: 'uppercase',
          letterSpacing: -0.5,
          marginTop: 4,
        }}
      >
        Your Orders Bento
      </Text>

      {refreshing ? (
        <View style={{ gap: 12 }}>
          <BrutalCardSkeleton />
          <BrutalCardSkeleton />
        </View>
      ) : filteredOrders.length === 0 ? (
        <BrutalCard backgroundColor={Card.cream}>
          <View style={{ padding: 28, alignItems: 'center', gap: 8 }}>
            <Clock size={32} color="#6B7280" />
            <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
              {activeOrders.length === 0
                ? myOrders.length === 0
                  ? 'No Errands Yet'
                  : 'No Active Errands'
                : 'No Matching Errands'}
            </Text>
            <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
              {activeOrders.length === 0 && myOrders.length === 0
                ? 'Create an errand in Kozhikode to receive bids from Taskers!'
                : activeOrders.length === 0
                ? 'Completed and cancelled errands are available in your Profile history.'
                : `You have no errands with the selected statuses.`}
            </Text>
          </View>
        </BrutalCard>
      ) : (
        <View style={{ gap: 12 }}>
          {filteredOrders.map((order) => {
            const hasBids = order.threads.length > 0;
            const isDone = order.status === 'COMPLETED';

            return (
              <TouchableOpacity
                key={order.id}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              >
                <BrutalCard
                  backgroundColor={isDone ? '#F3F4F6' : Card.cream}
                >
                  <View style={{ padding: 16, gap: 10 }}>
                    {/* Header Row: ID, Category & Status Badge */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontWeight: '900', fontSize: 12, color: '#4B5563' }}>
                          {formatOrderId(order.id)}
                        </Text>
                        <Text style={{ fontWeight: '900', fontSize: 12 }}>· {order.category}</Text>
                      </View>
                      <BrutalBadge
                        label={humanizeStatus(order.status)}
                        color={STATUS_BADGE_COLORS[order.status] ?? Neutral.black}
                      />
                    </View>

                    {/* Route Preview */}
                    <Text style={{ fontWeight: '900', fontSize: 15, color: Neutral.black }}>
                      {order.stops[0]?.address} → {order.stops[order.stops.length - 1]?.address}
                    </Text>

                    {/* Footer Row: Bids count or Agreed Fee & Arrow */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTopWidth: 2,
                        borderColor: Neutral.black,
                        paddingTop: 8,
                        marginTop: 2,
                      }}
                    >
                      {order.agreedFee ? (
                        <Text style={{ fontWeight: '900', fontSize: 13, color: '#10B981' }}>
                          Agreed Fee: {formatRupees(order.agreedFee)}
                        </Text>
                      ) : hasBids ? (
                        <Text style={{ fontWeight: '900', fontSize: 13, color: '#8B5CF6' }}>
                          📥 {order.threads.length} Bid{order.threads.length > 1 ? 's' : ''} Received
                        </Text>
                      ) : (
                        <Text style={{ fontWeight: '900', fontSize: 12, color: '#F97316' }}>
                          Awaiting First Bid
                        </Text>
                      )}

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontWeight: '900', fontSize: 12, color: Neutral.black }}>
                          Manage
                        </Text>
                        <ArrowRight size={14} color={Neutral.black} strokeWidth={3} />
                      </View>
                    </View>
                  </View>
                </BrutalCard>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
