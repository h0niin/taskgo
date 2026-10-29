import React, { useState } from 'react';
import { RefreshControl, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import {
  BrutalBadge,
  BrutalButton,
  BrutalCard,
  BrutalCardSkeleton,
  RunnerBidSheet,
} from '../../components';
import { Canvas, Card, CTA, Neutral } from '../../theme';
import { effectiveRunnerId, selectRunnerFeed, useStore } from '../../store';
import { formatDistance } from '../../utils/format';
import type { ErrandOrder } from '../../types/models';
import { Bike, Navigation, MapPin } from 'lucide-react-native';

export function RunnerFeedScreen({ navigation }: any) {
  const [online, setOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ErrandOrder | null>(null);
  const [bidSheetVisible, setBidSheetVisible] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const currentUser = useStore((s) => s.currentUser);
  const adminMode = useStore((s) => s.adminMode);
  const orders = useStore((s) => s.orders);
  const placeBid = useStore((s) => s.placeBid);
  const editBid = useStore((s) => s.editBid);
  const withdrawBid = useStore((s) => s.withdrawBid);

  const runnerId = effectiveRunnerId(currentUser, adminMode) || 'u_run_1';
  const runnerName = currentUser?.role === 'TASKBOY' ? currentUser.name : 'Rahul Das';

  const feedOrders = selectRunnerFeed(orders);

  const handleOpenBid = (order: ErrandOrder) => {
    setSelectedOrder(order);
    setBidSheetVisible(true);
  };

  const handleSubmitBid = (orderId: string, price: number, note: string) => {
    placeBid(orderId, runnerId, runnerName, price, note);
  };

  const handleWithdrawBid = (orderId: string, threadId: string) => {
    withdrawBid(orderId, threadId);
  };

  const handleOpenNegotiation = (orderId: string, threadId: string) => {
    navigation.navigate('RunnerNegotiation', { orderId, threadId });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Canvas.orange }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Neutral.white} />
        }
      >
        {/* Online / Offline Status Toggle Banner (SPEC Section 9.1) */}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: online ? '#15803D' : '#6B7280',
                }}
              />
              <Text
                style={{
                  fontWeight: '900',
                  fontSize: 17,
                  color: Neutral.black,
                  textTransform: 'uppercase',
                  letterSpacing: -0.5,
                }}
              >
                {online ? 'ONLINE · READY FOR ERRANDS' : 'OFFLINE · NOT RECEIVING'}
              </Text>
            </View>
            <Text style={{ fontWeight: '700', fontSize: 12, color: '#374151' }}>
              {online ? 'Task Boy active around Kozhikode localities' : 'Turn switch on to view live gigs'}
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
            Live Gigs ({feedOrders.length})
          </Text>
          <BrutalBadge label="Kozhikode City" color={Neutral.black} />
        </View>

        {refreshing ? (
          <View style={{ gap: 12 }}>
            <BrutalCardSkeleton />
            <BrutalCardSkeleton />
          </View>
        ) : !online ? (
          <BrutalCard backgroundColor={Card.cream}>
            <View style={{ padding: 28, alignItems: 'center', gap: 8 }}>
              <Text style={{ fontWeight: '900', fontSize: 18, textTransform: 'uppercase' }}>
                You are currently Offline
              </Text>
              <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
                Toggle the switch above to make yourself available for new errands across Kozhikode.
              </Text>
            </View>
          </BrutalCard>
        ) : feedOrders.length === 0 ? (
          <BrutalCard backgroundColor={Card.cream}>
            <View style={{ padding: 28, alignItems: 'center', gap: 8 }}>
              <Text style={{ fontWeight: '900', fontSize: 18, textTransform: 'uppercase' }}>
                No Open Errands
              </Text>
              <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
                All Kozhikode requests are fulfilled. Check back in a few minutes!
              </Text>
            </View>
          </BrutalCard>
        ) : (
          feedOrders.map((order) => {
            const pickup = order.stops[0]?.address ?? 'Pickup';
            const dropoff = order.stops[order.stops.length - 1]?.address ?? 'Dropoff';
            const myThread = order.threads.find((t) => t.runnerId === runnerId);

            return (
              <TouchableOpacity
                key={order.id}
                activeOpacity={0.8}
                onPress={() => handleOpenBid(order)}
              >
                <BrutalCard backgroundColor={Card.cream}>
                  <View style={{ padding: 16, gap: 10 }}>
                    {/* Meta Row: Category + Distance */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <BrutalBadge label={order.category} color="#F97316" />
                      <BrutalBadge label={formatDistance(order.distanceKm)} color={Neutral.black} />
                    </View>

                    {/* Route Summary (SPEC Section 9.1) */}
                    <View>
                      <Text style={{ fontWeight: '900', fontSize: 16, color: Neutral.black }}>
                        {pickup} → {dropoff}
                      </Text>
                      <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563', marginTop: 2 }}>
                        {order.stops.length} checkpoint{order.stops.length > 1 ? 's' : ''} in route
                      </Text>
                    </View>

                    {/* Instructions preview */}
                    <View
                      style={{
                        backgroundColor: '#FEF08A',
                        padding: 10,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: Neutral.black,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: '700',
                          fontSize: 12,
                          color: '#1F2937',
                        }}
                        numberOfLines={2}
                      >
                        "{order.edgeCaseInstructions}"
                      </Text>
                    </View>

                    {/* Footer: Bids Count & Action Button */}
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

                      {myThread ? (
                        <BrutalButton
                          label="View My Bid"
                          color={CTA.violet}
                          size="sm"
                          onPress={() => handleOpenBid(order)}
                        />
                      ) : (
                        <BrutalButton
                          label="Place Bid"
                          color={CTA.lime}
                          size="sm"
                          onPress={() => handleOpenBid(order)}
                        />
                      )}
                    </View>
                  </View>
                </BrutalCard>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Runner Bidding & Order Checkpoints Bottom Sheet */}
      <RunnerBidSheet
        visible={bidSheetVisible}
        order={selectedOrder}
        runnerId={runnerId}
        runnerName={runnerName}
        onClose={() => setBidSheetVisible(false)}
        onSubmitBid={handleSubmitBid}
        onEditBid={(orderId, threadId, price, note) => editBid(orderId, threadId, price, note)}
        onWithdrawBid={handleWithdrawBid}
        onOpenNegotiation={handleOpenNegotiation}
      />
    </View>
  );
}
