import React, { useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
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
import { formatDateTime, formatRupees } from '../../utils/format';
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

type TabKind = 'Bidding' | 'Active' | 'Done' | 'Other';

export function MyErrandsScreen({ navigation }: any) {
  const [tab, setTab] = useState<TabKind>('Active');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [proofSheetVisible, setProofSheetVisible] = useState(false);
  const [selectedProofOrder, setSelectedProofOrder] = useState<ErrandOrder | null>(null);

  const currentUser = useStore((s) => s.currentUser);
  const adminMode = useStore((s) => s.adminMode);
  const orders = useStore((s) => s.orders);
  const advanceProgress = useStore((s) => s.advanceProgress);
  const submitProof = useStore((s) => s.submitProof);
  const confirmCashReceived = useStore((s) => s.confirmCashReceived);

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
      ['AGREED', 'AWAITING_DEPOSIT', 'CANCELLED'].includes(order.status) &&
      (statusFilter === 'ALL' || order.status === statusFilter),
  );
  const filteredBiddingList = biddingList.filter(
    ({ order }) => statusFilter === 'ALL' || order.status === statusFilter,
  );
  const filteredActiveList = activeList.filter(
    (order) => statusFilter === 'ALL' || order.status === statusFilter,
  );
  const filteredDoneList = doneList.filter(
    (order) => statusFilter === 'ALL' || order.status === statusFilter,
  );
  const handleStatusFilter = (status: OrderStatus | 'ALL') => {
    setStatusFilter(status);
    if (status === 'ALL') return;
    if (['PLACED', 'BIDDING'].includes(status)) setTab('Bidding');
    else if (['AGREED', 'AWAITING_DEPOSIT', 'CANCELLED'].includes(status)) setTab('Other');
    else if (status === 'COMPLETED') setTab('Done');
    else setTab('Active');
  };

  const handleAdvanceStep = (orderId: string, nextStep: ProgressStep) => {
    advanceProgress(orderId, nextStep);
  };

  const handleOpenProof = (order: ErrandOrder) => {
    setSelectedProofOrder(order);
    setProofSheetVisible(true);
  };

  const handleSubmitProof = (data: {
    completionPhotoUri: string;
    billPhotoUri?: string;
    storeBillAmount?: number;
  }) => {
    if (!selectedProofOrder) return;
    submitProof({
      orderId: selectedProofOrder.id,
      completionPhotoUri: data.completionPhotoUri,
      billPhotoUri: data.billPhotoUri,
      storeBillAmount: data.storeBillAmount,
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
        {/* Tab Switcher */}
        <View
          style={{
            flexDirection: 'row',
            borderWidth: 4,
            borderColor: Neutral.black,
            borderRadius: 9999,
            backgroundColor: Card.cream,
            overflow: 'hidden',
          }}
        >
          {(['Bidding', 'Active', 'Done', 'Other'] as TabKind[]).map((t) => {
            const active = tab === t;
            const count =
              t === 'Bidding'
                ? biddingList.length
                : t === 'Active'
                ? activeList.length
                : t === 'Done'
                ? doneList.length
                : runnerOrders.filter((order) =>
                    ['AGREED', 'AWAITING_DEPOSIT', 'CANCELLED'].includes(order.status),
                  ).length;

            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  backgroundColor: active ? Neutral.black : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontWeight: '900',
                    fontSize: 12,
                    color: active ? Neutral.white : Neutral.black,
                    textTransform: 'uppercase',
                  }}
                >
                  {t}
                </Text>
                <View
                  style={{
                    backgroundColor: active ? CTA.lime : '#E5E7EB',
                    borderRadius: 99,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ fontWeight: '900', fontSize: 10, color: Neutral.black }}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <OrderStatusFilter value={statusFilter} onChange={handleStatusFilter} />

        {/* ── Tab 1: Bidding ───────────────────────────────────────────────────── */}
        {tab === 'Bidding' && (
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
                const needsMyAction =
                  latestOffer?.status === 'PENDING' &&
                  latestOffer.from === 'CUSTOMER';

                return (
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
                    <BrutalCard backgroundColor={needsMyAction ? '#FEF08A' : Card.cream}>
                      <View style={{ padding: 16, gap: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <BrutalBadge label={order.category} color="#F97316" />
                          <BrutalBadge
                            label={needsMyAction ? 'CUSTOMER COUNTERED!' : thread.status}
                            color={needsMyAction ? '#10B981' : Neutral.black}
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
                      </View>
                    </BrutalCard>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* ── Tab 2: Active (SPEC Section 7 Sequential Execution Flow) ─────────── */}
        {tab === 'Active' && (
          <View style={{ gap: 14 }}>
            {filteredActiveList.length === 0 ? (
              <BrutalCard backgroundColor={Card.cream}>
                <View style={{ padding: 28, alignItems: 'center', gap: 8 }}>
                  <Bike size={36} color="#6B7280" />
                  <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                    No Active Tasks
                  </Text>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
                    Tasks will appear here as soon as a customer accepts your bid and deposits the advance!
                  </Text>
                </View>
              </BrutalCard>
            ) : (
              filteredActiveList.map((order) => {
                const step = order.progressStep;
                const isAssigned = order.status === 'ASSIGNED';
                const isInProgress = order.status === 'IN_PROGRESS';
                const isProofSubmitted = order.status === 'PROOF_SUBMITTED';
                const isAwaitingFinalPayment = order.status === 'AWAITING_FINAL_PAYMENT';
                const hasCashPending = order.payments.some(
                  (p) => p.kind === 'FINAL' && p.method === 'CASH',
                );

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
                        <BrutalBadge label={order.status} color="#14B8A6" />
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
                        currentStep={step ?? 'En route'}
                        etaText={step === 'ON_THE_WAY' ? '5 mins' : '15 mins'}
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

                      {/* Cash Handover Confirmation CTA */}
                      {isAwaitingFinalPayment && hasCashPending && (
                        <View
                          style={{
                            backgroundColor: CTA.lime,
                            borderWidth: 3,
                            borderColor: Neutral.black,
                            borderRadius: 14,
                            padding: 14,
                            gap: 8,
                          }}
                        >
                          <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                            💵 Customer Selected Cash Payment
                          </Text>
                          <Text style={{ fontWeight: '700', fontSize: 12 }}>
                            Collect {formatRupees(order.finalBalance ?? 0)} in hand from customer, then confirm below:
                          </Text>
                          <BrutalButton
                            label="CONFIRM CASH RECEIVED"
                            color={Neutral.black}
                            textColor={Neutral.white}
                            fullWidth
                            size="md"
                            onPress={() => confirmCashReceived(order.id)}
                          />
                        </View>
                      )}

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
                            Customer is reviewing delivery proof photos and store bills.
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

        {/* ── Tab 3: Done (SPEC Section 9.3 Earnings Breakdown) ────────────────── */}
        {tab === 'Done' && (
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
                        filteredDoneList.reduce((acc, curr) => acc + (curr.agreedFee ?? 0), 0),
                      )}
                    </Text>
                  </View>
                </BrutalCard>
              </View>

              <View style={{ flex: 1 }}>
                <BrutalCard backgroundColor={Card.lavender}>
                  <View style={{ padding: 14, gap: 4 }}>
                    <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase' }}>
                      Reimbursed Bills
                    </Text>
                    <Text style={{ fontWeight: '900', fontSize: 24 }}>
                      {formatRupees(
                        filteredDoneList.reduce((acc, curr) => acc + (curr.storeBillAmount ?? 0), 0),
                      )}
                    </Text>
                  </View>
                </BrutalCard>
              </View>
            </View>

            {filteredDoneList.length === 0 ? (
              <BrutalCard backgroundColor={Card.cream}>
                <View style={{ padding: 24, alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                    No Completed Tasks Yet
                  </Text>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280' }}>
                    Completed tasks will show with separated fees and bill reimbursements.
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

                      {order.storeBillAmount ? (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontWeight: '700', fontSize: 13 }}>Reimbursed Shop Bill:</Text>
                          <Text style={{ fontWeight: '900', fontSize: 14, color: '#D97706' }}>
                            +{formatRupees(order.storeBillAmount)}
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
                          Total Cash Inflow:
                        </Text>
                        <Text style={{ fontWeight: '900', fontSize: 16 }}>
                          {formatRupees((order.agreedFee ?? 0) + (order.storeBillAmount ?? 0))}
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
            )}
          </View>
        )}
        {tab === 'Other' && (
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
                        label={order.status}
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
