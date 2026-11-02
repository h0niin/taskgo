import React, { useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BrutalBadge,
  BrutalButton,
  BrutalCard,
  OrderStatusFilter,
  ProofUploadSheet,
  StaticMapCard,
  STATUS_BADGE_COLORS,
} from '../../components';
import { Canvas, Card, CTA, Neutral } from '../../theme';
import {
  effectiveRunnerId,
  selectRunnerActive,
  selectRunnerBiddingThreads,
  selectRunnerDone,
  useStore,
} from '../../store';
import {
  formatDateTime,
  formatRupees,
  humanizeStatus,
} from '../../utils/format';
import type { ErrandOrder, OrderStatus, ProgressStep } from '../../types/models';
import {
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Receipt,
  Star,
  Zap,
} from 'lucide-react-native';

export function MyErrandsScreen({ navigation }: any) {
  const [statusFilters, setStatusFilters] = useState<OrderStatus[]>([]);
  const [proofSheetVisible, setProofSheetVisible] = useState(false);
  const [selectedProofOrder, setSelectedProofOrder] = useState<ErrandOrder | null>(null);

  const currentUser = useStore((s) => s.currentUser);
  const adminMode = useStore((s) => s.adminMode);
  const orders = useStore((s) => s.orders);
  const advanceProgress = useStore((s) => s.advanceProgress);
  const submitProof = useStore((s) => s.submitProof);
  const dismissRejectedBid = useStore((s) => s.dismissRejectedBid);

  const runnerId = effectiveRunnerId(currentUser, adminMode) || 'u_run_1';

  const biddingList = selectRunnerBiddingThreads(orders, runnerId);
  const activeList = selectRunnerActive(orders, runnerId);
  const doneList = selectRunnerDone(orders, runnerId);
  const runnerOrders = orders.filter(
    (order) =>
      order.assignedRunnerId === runnerId ||
      order.threads.some((thread) => thread.runnerId === runnerId),
  );
  const otherList = runnerOrders.filter(
    (order) =>
      ['AWAITING_PAYMENT', 'CANCELLED'].includes(order.status) &&
      (statusFilters.length === 0 || statusFilters.includes(order.status)),
  );
  const filteredBiddingList = biddingList.filter(
    ({ order }) => statusFilters.length === 0 || statusFilters.includes(order.status),
  );
  const filteredActiveList = activeList.filter(
    (order) => statusFilters.length === 0 || statusFilters.includes(order.status),
  );
  const filteredDoneList = doneList.filter(
    (order) => statusFilters.length === 0 || statusFilters.includes(order.status),
  );
  const statusCounts = runnerOrders.reduce<Partial<Record<OrderStatus, number>>>((counts, order) => {
    counts[order.status] = (counts[order.status] ?? 0) + 1;
    return counts;
  }, {});
  const showBidding = statusFilters.length
    ? statusFilters.some((status) => ['PLACED', 'BIDDING'].includes(status))
    : biddingList.length > 0;
  const showActive = statusFilters.length
    ? statusFilters.some((status) =>
        ['ASSIGNED', 'IN_PROGRESS', 'PROOF_SUBMITTED', 'AWAITING_ADDITIONAL_PAYMENT'].includes(status),
      )
    : activeList.length > 0;
  const showDoneOrders = statusFilters.length === 0 || statusFilters.includes('COMPLETED');
  const showOther = statusFilters.length
    ? statusFilters.some((status) => ['AWAITING_PAYMENT', 'CANCELLED'].includes(status))
    : otherList.length > 0;

  const handleAdvanceStep = (orderId: string, nextStep: ProgressStep) => {
    advanceProgress(orderId, nextStep);
  };

  const handleOpenProof = (order: ErrandOrder) => {
    setSelectedProofOrder(order);
    setProofSheetVisible(true);
  };

  const handleSubmitProof = (data: {
    completionPhotoUri: string;
    additionalCostPhotoUri?: string;
    additionalCosts?: number;
  }) => {
    if (!selectedProofOrder) return;
    submitProof({
      orderId: selectedProofOrder.id,
      completionPhotoUri: data.completionPhotoUri,
      additionalCostPhotoUri: data.additionalCostPhotoUri,
      additionalCosts: data.additionalCosts,
    });
  };

  const handleCallCustomer = () => {
    Linking.openURL('tel:+919876543210');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Canvas.orange }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <OrderStatusFilter
          value={statusFilters}
          onChange={setStatusFilters}
          counts={statusCounts}
          allCount={runnerOrders.length}
        />

        {runnerOrders.length === 0 && statusFilters.length === 0 && (
          <View style={{ gap: 12 }}>
            <BrutalCard backgroundColor={Card.cream}>
              <View style={{ padding: 24, alignItems: 'center', gap: 6 }}>
                <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                  No Errands Yet
                </Text>
              </View>
            </BrutalCard>
          </View>
        )}

        {/* ── Bidding ──────────────────────────────────────────────────────────── */}
        {showBidding && (
          <View style={{ gap: 12 }}>
            {filteredBiddingList.length === 0 ? (
              <BrutalCard backgroundColor={Card.cream}>
                <View style={{ padding: 24, alignItems: 'center', gap: 6 }}>
                  <Clock size={32} color="#6B7280" />
                  <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                    No Open Bids
                  </Text>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
                    Switch to the Errand Feed tab to bid on live gigs!
                  </Text>
                </View>
              </BrutalCard>
            ) : (
              filteredBiddingList.map(({ order, thread }) => {
                const latestOffer = thread.offers[thread.offers.length - 1];
                const isRejected = thread.status === 'REJECTED';
                const needsMyAction =
                  latestOffer?.status === 'PENDING' &&
                  latestOffer.from === 'CUSTOMER';

                const card = (
                  <BrutalCard backgroundColor={isRejected ? '#E5E7EB' : needsMyAction ? '#FEF08A' : Card.cream}>
                      <View style={{ padding: 16, gap: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <BrutalBadge label={order.category} color="#F97316" />
                          <BrutalBadge
                            label={isRejected ? 'REJECTED' : needsMyAction ? 'CUSTOMER COUNTERED!' : humanizeStatus(thread.status)}
                            color={isRejected ? '#EF4444' : needsMyAction ? '#10B981' : Neutral.black}
                          />
                        </View>

                        <Text style={{ fontWeight: '900', fontSize: 16 }}>
                          {order.stops[0]?.address} → {order.stops[order.stops.length - 1]?.address}
                        </Text>

                        <View
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderWidth: 2,
                            borderColor: Neutral.black,
                            borderRadius: 10,
                            padding: 10,
                            gap: 2,
                          }}
                        >
                          <Text style={{ fontWeight: '700', fontSize: 11, color: '#6B7280' }}>
                            Latest Offer in Thread:
                          </Text>
                          <Text style={{ fontWeight: '900', fontSize: 20 }}>
                            {formatRupees(latestOffer?.price ?? 0)} ({latestOffer?.from})
                          </Text>
                          <Text style={{ fontWeight: '700', fontSize: 12, color: '#374151' }}>
                            "{latestOffer?.note}"
                          </Text>
                        </View>

                        {isRejected ? (
                          <BrutalButton
                            label="Remove Rejected Bid"
                            color="#EF4444"
                            fullWidth
                            size="sm"
                            onPress={() => dismissRejectedBid(order.id, thread.id)}
                          />
                        ) : (
                          <BrutalButton
                            label={needsMyAction ? 'Respond to Counter →' : 'View Thread →'}
                            color={CTA.lime}
                            fullWidth
                            size="sm"
                            onPress={() =>
                              navigation.navigate('RunnerNegotiation', {
                                orderId: order.id,
                                threadId: thread.id,
                              })
                            }
                          />
                        )}
                      </View>
                    </BrutalCard>
                );

                return isRejected ? (
                  <View key={thread.id}>{card}</View>
                ) : (
                  <TouchableOpacity
                    key={thread.id}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('RunnerNegotiation', {
                        orderId: order.id,
                        threadId: thread.id,
                      })
                    }
                  >
                    {card}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* ── Active (SPEC Section 7 Sequential Execution Flow) ────────────────── */}
        {showActive && (
          <View style={{ gap: 14 }}>
            {filteredActiveList.length === 0 ? (
              <BrutalCard backgroundColor={Card.cream}>
                <View style={{ padding: 28, alignItems: 'center', gap: 8 }}>
                  <Bike size={36} color="#6B7280" />
                  <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                    No Active Tasks
                  </Text>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
                    Tasks will appear here as soon as a customer accepts your bid and pays the task fee!
                  </Text>
                </View>
              </BrutalCard>
            ) : (
              filteredActiveList.map((order) => {
                const step = order.progressStep;
                const isAssigned = order.status === 'ASSIGNED';
                const isInProgress = order.status === 'IN_PROGRESS';
                const isProofSubmitted = order.status === 'PROOF_SUBMITTED';

                // Sequential steps status:
                const isArrived =
                  isInProgress &&
                  (step === 'ARRIVED' ||
                    step === 'ITEMS_PURCHASED_OR_COLLECTED' ||
                    step === 'ON_THE_WAY');

                const isItemsCollected =
                  isInProgress &&
                  (step === 'ITEMS_PURCHASED_OR_COLLECTED' ||
                    step === 'ON_THE_WAY');

                const isOnTheWay = isInProgress && step === 'ON_THE_WAY';

                return (
                  <BrutalCard key={order.id} backgroundColor={Card.cream}>
                    <View style={{ padding: 18, gap: 14 }}>
                      {/* Top Meta */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <BrutalBadge label={humanizeStatus(order.status)} color="#14B8A6" />
                        <Text style={{ fontWeight: '900', fontSize: 16 }}>
                          Locked Fee: {formatRupees(order.agreedFee ?? 0)}
                        </Text>
                      </View>

                      {/* Route */}
                      <View>
                        <Text style={{ fontWeight: '900', fontSize: 17, color: Neutral.black }}>
                          {order.stops[0]?.address} → {order.stops[order.stops.length - 1]?.address}
                        </Text>
                        <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563', marginTop: 2 }}>
                          {order.stops.length} checkpoints · Special instruction: "{order.edgeCaseInstructions}"
                        </Text>
                      </View>

                      {/* Static Map Preview */}
                      <StaticMapCard
                        pickupAddress={order.stops[0]?.address}
                        dropoffAddress={order.stops[order.stops.length - 1]?.address}
                        etaText={
                          isProofSubmitted
                            ? undefined
                            : step === 'ON_THE_WAY'
                            ? '5 mins'
                            : '15 mins'
                        }
                      />

                      {/* Customer Call Button */}
                      <TouchableOpacity
                        onPress={handleCallCustomer}
                        style={{
                          backgroundColor: '#10B981',
                          borderWidth: 2,
                          borderColor: Neutral.black,
                          borderRadius: 999,
                          padding: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <Phone size={16} color={Neutral.black} />
                        <Text style={{ fontWeight: '900', fontSize: 12, textTransform: 'uppercase' }}>
                          Call Customer for Doubts.
                        </Text>
                      </TouchableOpacity>

                      {/* Sequential Execution Buttons (SPEC Section 7) */}
                      {(isAssigned || isInProgress) && (
                        <View style={{ gap: 8, borderTopWidth: 2, borderColor: Neutral.black, paddingTop: 10 }}>
                          <Text style={{ fontWeight: '900', fontSize: 12, textTransform: 'uppercase', color: Neutral.black }}>
                            Sequential Execution (Only next step enabled):
                          </Text>

                          {/* 1. Arrived at Location */}
                          <BrutalButton
                            label={isArrived ? '✓ 1. Arrived at Location' : '1. Arrived at Location'}
                            color={isArrived ? '#D1FAE5' : CTA.lime}
                            fullWidth
                            size="sm"
                            disabled={isArrived}
                            onPress={() => handleAdvanceStep(order.id, 'ARRIVED')}
                          />

                          {/* 2. Items Purchased / Collected */}
                          <BrutalButton
                            label={isItemsCollected ? '✓ 2. Items Purchased / Collected' : '2. Items Purchased / Collected'}
                            color={isItemsCollected ? '#D1FAE5' : CTA.lime}
                            fullWidth
                            size="sm"
                            disabled={!isArrived || isItemsCollected}
                            onPress={() => handleAdvanceStep(order.id, 'ITEMS_PURCHASED_OR_COLLECTED')}
                          />

                          {/* 3. On The Way */}
                          <BrutalButton
                            label={isOnTheWay ? '✓ 3. On The Way' : '3. On The Way'}
                            color={isOnTheWay ? '#D1FAE5' : CTA.lime}
                            fullWidth
                            size="sm"
                            disabled={!isItemsCollected || isOnTheWay}
                            onPress={() => handleAdvanceStep(order.id, 'ON_THE_WAY')}
                          />

                          {/* 4. Submit Completion Proof */}
                          <BrutalButton
                            label="4. Submit Completion Proof →"
                            color={CTA.violet}
                            fullWidth
                            size="md"
                            disabled={!isOnTheWay}
                            onPress={() => handleOpenProof(order)}
                            style={{ marginTop: 4 }}
                          />
                        </View>
                      )}

                      {isProofSubmitted && (
                        <View
                          style={{
                            backgroundColor: '#FEF08A',
                            borderWidth: 2,
                            borderColor: Neutral.black,
                            borderRadius: 12,
                            padding: 12,
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <CheckCircle2 size={24} color="#15803D" />
                          <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                            Proof Submitted
                          </Text>
                          <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563', textAlign: 'center' }}>
                            Customer is reviewing delivery proof photos and additional costs.
                          </Text>
                        </View>
                      )}
                    </View>
                  </BrutalCard>
                );
              })
            )}
          </View>
        )}

        {/* ── Done (SPEC Section 9.3 Earnings Breakdown) ───────────────────────── */}
        <View style={{ gap: 12 }}>
            {/* Runner Earnings Bento Summary */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <BrutalCard backgroundColor={Card.mint}>
                  <View style={{ padding: 14, gap: 4 }}>
                    <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase' }}>
                      Service Earnings
                    </Text>
                    <Text style={{ fontWeight: '900', fontSize: 24 }}>
                      {formatRupees(
                        doneList.reduce((acc, curr) => acc + (curr.agreedFee ?? 0), 0),
                      )}
                    </Text>
                  </View>
                </BrutalCard>
              </View>

              <View style={{ flex: 1 }}>
                <BrutalCard backgroundColor={Card.lavender}>
                  <View style={{ padding: 14, gap: 4 }}>
                    <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase' }}>
                      Additional Costs
                    </Text>
                    <Text style={{ fontWeight: '900', fontSize: 24 }}>
                      {formatRupees(
                        doneList.reduce((acc, curr) => acc + (curr.additionalCosts ?? 0), 0),
                      )}
                    </Text>
                  </View>
                </BrutalCard>
              </View>
            </View>

            {showDoneOrders && (filteredDoneList.length === 0 ? (
              <BrutalCard backgroundColor={Card.cream}>
                <View style={{ padding: 24, alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                    No Completed Tasks Yet
                  </Text>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280' }}>
                    Completed tasks will show with separated fees and additional costs.
                  </Text>
                </View>
              </BrutalCard>
            ) : (
              filteredDoneList.map((order) => (
                <BrutalCard key={order.id} backgroundColor={Card.cream}>
                  <View style={{ padding: 16, gap: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <BrutalBadge label="SETTLED" color="#10B981" />
                      <Text style={{ fontWeight: '900', fontSize: 12, color: '#6B7280' }}>
                        {formatDateTime(order.createdAt)}
                      </Text>
                    </View>

                    <Text style={{ fontWeight: '900', fontSize: 16 }}>
                      {order.stops[0]?.address} → {order.stops[order.stops.length - 1]?.address}
                    </Text>

                    {/* Separated Earnings Breakdown (SPEC Section 9.3) */}
                    <View
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 2,
                        borderColor: Neutral.black,
                        borderRadius: 12,
                        padding: 12,
                        gap: 6,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontWeight: '700', fontSize: 13 }}>Your Service Fee:</Text>
                        <Text style={{ fontWeight: '900', fontSize: 14, color: '#10B981' }}>
                          +{formatRupees(order.agreedFee ?? 0)}
                        </Text>
                      </View>

                      {order.additionalCosts ? (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontWeight: '700', fontSize: 13 }}>Additional Costs:</Text>
                          <Text style={{ fontWeight: '900', fontSize: 14, color: '#D97706' }}>
                            +{formatRupees(order.additionalCosts)}
                          </Text>
                        </View>
                      ) : null}

                      <View
                        style={{
                          borderTopWidth: 1.5,
                          borderColor: '#E5E7EB',
                          paddingTop: 6,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                          Total Payout:
                        </Text>
                        <Text style={{ fontWeight: '900', fontSize: 16 }}>
                          {formatRupees((order.agreedFee ?? 0) + (order.additionalCosts ?? 0))}
                        </Text>
                      </View>
                    </View>

                    {/* Customer Rating if given */}
                    {order.rating ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: '#FEF08A',
                          padding: 8,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: Neutral.black,
                        }}
                      >
                        <Star size={16} color="#EAB308" fill="#EAB308" />
                        <Text style={{ fontWeight: '900', fontSize: 12 }}>
                          {order.rating}/5 Stars
                        </Text>
                        {order.review ? (
                          <Text style={{ fontWeight: '700', fontSize: 12, color: '#374151', flex: 1 }} numberOfLines={1}>
                            "{order.review}"
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </BrutalCard>
              ))
            ))}
        </View>
        {showOther && (
          <View style={{ gap: 12 }}>
            {otherList.length === 0 ? (
              <BrutalCard backgroundColor={Card.cream}>
                <View style={{ padding: 24, alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                    No Errands With This Status
                  </Text>
                </View>
              </BrutalCard>
            ) : (
              otherList.map((order) => (
                <BrutalCard key={order.id} backgroundColor={Card.cream}>
                  <View style={{ padding: 16, gap: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <BrutalBadge
                        label={humanizeStatus(order.status)}
                        color={STATUS_BADGE_COLORS[order.status] ?? Neutral.black}
                      />
                      <Text style={{ fontWeight: '900', fontSize: 12, color: '#6B7280' }}>
                        {formatDateTime(order.createdAt)}
                      </Text>
                    </View>
                    <Text style={{ fontWeight: '900', fontSize: 16 }}>{order.category}</Text>
                    <Text style={{ fontWeight: '800', fontSize: 14 }}>
                      {order.stops[0]?.address} → {order.stops[order.stops.length - 1]?.address}
                    </Text>
                  </View>
                </BrutalCard>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Proof Upload Bottom Sheet */}
      <ProofUploadSheet
        visible={proofSheetVisible}
        orderId={selectedProofOrder?.id ?? ''}
        onClose={() => setProofSheetVisible(false)}
        onSubmit={handleSubmitProof}
      />
    </View>
  );
}
