import React, { useState } from 'react';
import {
  Image,
  Linking,
  Modal,
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
  StaticMapCard,
  STATUS_BADGE_COLORS,
} from '../../components';
import { Canvas, Card, CTA, Neutral } from '../../theme';
import { useStore } from '../../store';
import { skipSimulationAhead } from '../../sim';
import { formatOrderId, formatOrderStage, formatPhone, formatRupees, humanizeStatus } from '../../utils/format';
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react-native';

export function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;

  const orders = useStore((s) => s.orders);
  const cancelOrder = useStore((s) => s.cancelOrder);

  const order = orders.find((o) => o.id === orderId);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: Canvas.purple, padding: 20, justifyContent: 'center' }}>
        <Text style={{ fontWeight: '900', color: Neutral.white, fontSize: 18 }}>Order not found.</Text>
        <BrutalButton label="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const pickup = order.stops[0]?.address ?? 'Pickup';
  const dropoff = order.stops[order.stops.length - 1]?.address ?? 'Dropoff';

  const isPreAssigned = ['PLACED', 'BIDDING', 'AWAITING_PAYMENT'].includes(order.status);
  const isPostAssigned = ['ASSIGNED', 'IN_PROGRESS'].includes(order.status);
  const canCancel = isPreAssigned || isPostAssigned;

  const handleCallRunner = () => {
    Linking.openURL('tel:+919876543210');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Canvas.purple }}>
      {/* Top Header Bar */}
      <View
        style={{
          padding: 16,
          backgroundColor: Neutral.black,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={18} color={Neutral.white} />
          <Text style={{ fontWeight: '900', color: Neutral.white, fontSize: 13, textTransform: 'uppercase' }}>
            Errands
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontWeight: '900', color: '#D1D5DB', fontSize: 12 }}>
            {formatOrderId(order.id)}
          </Text>
          <BrutalBadge
            label={humanizeStatus(order.status)}
            color={STATUS_BADGE_COLORS[order.status] ?? Neutral.black}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Status Action Cards (State Machine Junctions) */}
        {order.status === 'AWAITING_PAYMENT' && (
          <View
            style={{
              backgroundColor: CTA.lime,
              borderWidth: 4,
              borderColor: Neutral.black,
              borderRadius: 20,
              padding: 16,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '900', fontSize: 18, textTransform: 'uppercase' }}>
                Deal Agreed!
              </Text>
              <BrutalBadge label={`FEE: ${formatRupees(order.agreedFee ?? 0)}`} color={Neutral.black} />
            </View>
            <Text style={{ fontWeight: '700', fontSize: 13, color: '#1F2937' }}>
              Tasker gets {formatRupees(order.agreedFee ?? 0)} · Platform fee ₹60 extra.
            </Text>
            <BrutalButton
              label={`Pay Total ${formatRupees((order.agreedFee ?? 0) + 60)} via UPI →`}
              color={Neutral.black}
              textColor={Neutral.white}
              fullWidth
              size="md"
              onPress={() => navigation.navigate('TaskPayment', { orderId })}
              style={{ marginTop: 4 }}
            />
          </View>
        )}

        {order.status === 'PROOF_SUBMITTED' && (
          <View
            style={{
              backgroundColor: '#FEF08A',
              borderWidth: 4,
              borderColor: Neutral.black,
              borderRadius: 20,
              padding: 16,
              gap: 8,
            }}
          >
            <Text style={{ fontWeight: '900', fontSize: 18, textTransform: 'uppercase' }}>
              📸 Proof Submitted
            </Text>
            <Text style={{ fontWeight: '700', fontSize: 13, color: '#374151' }}>
              {order.assignedRunnerName} has submitted drop-off photos and additional cost proof for your approval.
            </Text>
            <BrutalButton
              label="Review Proof Photos & Bill →"
              color={CTA.lime}
              fullWidth
              size="md"
              onPress={() => navigation.navigate('ProofReview', { orderId })}
              style={{ marginTop: 4 }}
            />
          </View>
        )}

        {order.status === 'AWAITING_ADDITIONAL_PAYMENT' && (
          <View
            style={{
              backgroundColor: '#A7F3D0',
              borderWidth: 4,
              borderColor: Neutral.black,
              borderRadius: 20,
              padding: 16,
              gap: 8,
            }}
          >
            <Text style={{ fontWeight: '900', fontSize: 18, textTransform: 'uppercase' }}>
              💰 Additional Costs Due
            </Text>
            <Text style={{ fontWeight: '700', fontSize: 13, color: '#065F46' }}>
              Proof approved! Pay the additional costs of {formatRupees(order.additionalCosts ?? 0)}.
            </Text>
            <BrutalButton
              label={`Pay Additional Costs (${formatRupees(order.additionalCosts ?? 0)}) →`}
              color={CTA.lime}
              fullWidth
              size="md"
              onPress={() => navigation.navigate('AdditionalPayment', { orderId })}
              style={{ marginTop: 4 }}
            />
          </View>
        )}

        {order.status === 'COMPLETED' && (
          <BrutalCard backgroundColor={Card.mint}>
            <View style={{ padding: 16, gap: 10, alignItems: 'center' }}>
              <BrutalBadge label="COMPLETED & SETTLED" color="#10B981" starburst />
              <Text style={{ fontWeight: '900', fontSize: 16, textAlign: 'center' }}>
                All payments cleared. Receipt & rating unlocked.
              </Text>
              <BrutalButton
                label="View Full Paper Receipt →"
                color={Neutral.black}
                textColor={Neutral.white}
                fullWidth
                onPress={() => navigation.navigate('Receipt', { orderId })}
              />
            </View>
          </BrutalCard>
        )}

        {/* Live Tracking Map (if assigned or in progress) */}
        {['ASSIGNED', 'IN_PROGRESS', 'PROOF_SUBMITTED'].includes(order.status) && (
          <View style={{ gap: 12 }}>
            {/* Simulator Fast-Forward Debug Button (SPEC Section 12) */}
            {order.assignedRunnerId === 'u_run_2' && order.status !== 'PROOF_SUBMITTED' && (
              <View
                style={{
                  backgroundColor: '#FEF08A',
                  borderWidth: 3,
                  borderColor: Neutral.black,
                  borderRadius: 14,
                  padding: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '900', fontSize: 12, textTransform: 'uppercase' }}>
                    ⚡ Sim: {order.assignedRunnerName}
                  </Text>
                  <Text style={{ fontWeight: '700', fontSize: 11, color: '#4B5563' }}>
                    Auto-progresses every ~9s
                  </Text>
                </View>
                <BrutalButton
                  label="Skip Ahead ⏩"
                  color={CTA.lime}
                  size="sm"
                  onPress={() => skipSimulationAhead(order.id)}
                />
              </View>
            )}

            <StaticMapCard
              pickupAddress={pickup}
              dropoffAddress={dropoff}
              etaText={
                order.status === 'PROOF_SUBMITTED'
                  ? undefined
                  : order.status === 'IN_PROGRESS'
                  ? '5 mins'
                  : '12-15 mins'
              }
            />

            {/* Runner Contact Card */}
            <BrutalCard backgroundColor={Card.cream}>
              <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ gap: 2 }}>
                  <Text style={{ fontWeight: '900', fontSize: 16 }}>
                    {order.assignedRunnerName ?? 'Assigned Tasker'}
                  </Text>
                  <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563' }}>
                    Status: {formatOrderStage(order)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCallRunner}
                  style={{
                    backgroundColor: '#10B981',
                    borderWidth: 3,
                    borderColor: Neutral.black,
                    borderRadius: 999,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Phone size={16} color={Neutral.black} />
                  <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>
                    Call
                  </Text>
                </TouchableOpacity>
              </View>
            </BrutalCard>
          </View>
        )}

        {/* Bids Inbox (Sections 5 & 8 of SPEC) */}
        {['PLACED', 'BIDDING'].includes(order.status) && (
          <BrutalCard backgroundColor={Card.cream}>
            <View style={{ padding: 18, gap: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                    📥 Bids Inbox
                  </Text>
                  <Text style={{ fontWeight: '700', fontSize: 12, color: '#6B7280' }}>
                    Taskers proposing competitive fees
                  </Text>
                </View>
                <BrutalBadge label={`${order.threads.length} BIDS`} color={Neutral.black} />
              </View>

              {order.threads.length === 0 ? (
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 2,
                    borderColor: Neutral.black,
                    borderRadius: 12,
                    padding: 20,
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Clock size={28} color="#6B7280" />
                  <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                    Awaiting First Bid
                  </Text>
                  <Text style={{ fontWeight: '700', fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
                    Your request is live on the Kozhikode runner feed. Bids will arrive shortly!
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {order.threads.map((thread) => {
                    const latestOffer = thread.offers[thread.offers.length - 1];
                    const price = latestOffer?.price ?? 0;
                    const note = latestOffer?.note ?? 'Ready to run errand';
                    const isInactive =
                      thread.status === 'REJECTED' || thread.status === 'WITHDRAWN';

                    return (
                      <TouchableOpacity
                        key={thread.id}
                        activeOpacity={0.8}
                        onPress={() =>
                          navigation.navigate('NegotiationThread', {
                            orderId: order.id,
                            threadId: thread.id,
                          })
                        }
                      >
                        <View
                          style={{
                            backgroundColor: isInactive ? '#E5E7EB' : '#FFFFFF',
                            borderWidth: 3,
                            borderColor: Neutral.black,
                            borderRadius: 14,
                            padding: 14,
                            gap: 8,
                            opacity: isInactive ? 0.85 : 1,
                          }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Bike size={16} color="#F97316" />
                              <Text style={{ fontWeight: '900', fontSize: 14 }}>
                                {thread.runnerName}
                              </Text>
                            </View>
                            <Text style={{ fontWeight: '900', fontSize: 20, color: Neutral.black }}>
                              {formatRupees(price)}
                            </Text>
                          </View>

                          {isInactive ? (
                            <BrutalBadge
                              label={humanizeStatus(thread.status)}
                              color={thread.status === 'REJECTED' ? '#EF4444' : '#6B7280'}
                              style={{ alignSelf: 'flex-start' }}
                            />
                          ) : null}

                          <Text
                            style={{
                              fontWeight: '700',
                              fontSize: 12,
                              color: '#4B5563',
                              fontStyle: 'italic',
                            }}
                            numberOfLines={2}
                          >
                            "{note}"
                          </Text>

                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              borderTopWidth: 1.5,
                              borderColor: '#E5E7EB',
                              paddingTop: 6,
                            }}
                          >
                            <Text style={{ fontWeight: '700', fontSize: 11, color: '#6B7280' }}>
                              {thread.offers.length} message{thread.offers.length > 1 ? 's' : ''} in thread
                            </Text>
                            <Text
                              style={{
                                fontWeight: '900',
                                fontSize: 12,
                                color: isInactive ? '#6B7280' : '#8B5CF6',
                              }}
                            >
                              View Thread →
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </BrutalCard>
        )}

        {/* Route Stops Summary */}
        <BrutalCard backgroundColor="#FFFFFF">
          <View style={{ padding: 18, gap: 12 }}>
            <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
              Route Checkpoints ({order.stops.length})
            </Text>

            <View style={{ gap: 10 }}>
              {order.stops.map((stop, i) => (
                <View key={stop.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <View
                    style={{
                      backgroundColor: i === 0 ? '#10B981' : i === order.stops.length - 1 ? '#EF4444' : '#F97316',
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: Neutral.black,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontWeight: '900', fontSize: 11, color: Neutral.white }}>
                      {i + 1}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '900', fontSize: 14 }}>{stop.address}</Text>
                    {stop.landmark ? (
                      <Text style={{ fontWeight: '700', fontSize: 12, color: '#6B7280' }}>
                        Landmark: {stop.landmark}
                      </Text>
                    ) : null}
                    {stop.contactName ? (
                      <Text style={{ fontWeight: '700', fontSize: 12, color: '#6B7280' }}>
                        Contact: {stop.contactName} ({stop.contactPhone ? formatPhone(stop.contactPhone) : ''})
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </BrutalCard>

        {/* Special Instructions */}
        <BrutalCard backgroundColor={Card.cream}>
          <View style={{ padding: 16, gap: 6 }}>
            <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>
              Special Instructions
            </Text>
            <Text style={{ fontWeight: '700', fontSize: 13, color: '#1F2937', lineHeight: 18 }}>
              {order.edgeCaseInstructions}
            </Text>
          </View>
        </BrutalCard>

        {/* Optional Attachments */}
        {order.attachments?.length ? (
          <BrutalCard backgroundColor="#FFFFFF">
            <View style={{ padding: 16, gap: 10 }}>
              <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>
                Attachments ({order.attachments.length})
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {order.attachments.map((uri, index) => (
                  <Image
                    key={`${uri}-${index}`}
                    source={{ uri }}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: Neutral.black,
                      backgroundColor: '#E5E7EB',
                    }}
                    resizeMode="cover"
                  />
                ))}
              </View>
            </View>
          </BrutalCard>
        ) : null}

        {/* Cancel Order (SPEC Section 4: Pre-assigned free, Post-assigned forfeited confirm dialog) */}
        {canCancel && (
          <BrutalButton
            label={isPreAssigned ? 'Cancel Errand (No Charge)' : 'Cancel Errand (Payment Forfeited)'}
            color="#EF4444"
            fullWidth
            size="sm"
            onPress={() => {
              if (isPreAssigned) {
                cancelOrder(order.id);
                navigation.goBack();
              } else {
                setCancelModalVisible(true);
              }
            }}
            style={{ marginBottom: 20 }}
          />
        )}
      </ScrollView>

      {/* Post-Assigned Cancel Confirmation Dialog */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <Pressable
          onPress={() => setCancelModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: Card.cream,
              borderWidth: 4,
              borderColor: Neutral.black,
              borderRadius: 20,
              padding: 20,
              gap: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={28} color="#DC2626" strokeWidth={3} />
              <Text style={{ fontWeight: '900', fontSize: 18, textTransform: 'uppercase', flex: 1 }}>
                Cancel Errand?
              </Text>
            </View>

            <View
              style={{
                backgroundColor: '#FEE2E2',
                borderWidth: 2,
                borderColor: '#DC2626',
                borderRadius: 12,
                padding: 12,
                gap: 6,
              }}
            >
              <Text style={{ fontWeight: '900', fontSize: 13, color: '#DC2626', textTransform: 'uppercase' }}>
                Payment Forfeited
              </Text>
              <Text style={{ fontWeight: '700', fontSize: 12, color: '#7F1D1D' }}>
                Because {order.assignedRunnerName} has already been dispatched to Mavoor Road / Kozhikode locations, your paid fee of {formatRupees(order.agreedFee ?? 0)} will be paid to the runner as a travel compensation.
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              <BrutalButton
                label="Confirm Cancel (Forfeit Payment)"
                color="#EF4444"
                fullWidth
                size="md"
                onPress={() => {
                  cancelOrder(order.id);
                  setCancelModalVisible(false);
                  navigation.goBack();
                }}
              />

              <BrutalButton
                label="Keep Errand Active"
                color={Neutral.white}
                fullWidth
                size="sm"
                onPress={() => setCancelModalVisible(false)}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

