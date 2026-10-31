import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BrutalBadge,
  BrutalButton,
  BrutalCard,
  BrutalInput,
  OfferCountdown,
} from '../../components';
import { Canvas, Card, CTA, Neutral } from '../../theme';
import { counterCount, useStore } from '../../store';
import { formatDateTime, formatRupees } from '../../utils/format';
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react-native';

export function RunnerNegotiationScreen({ route, navigation }: any) {
  const { orderId, threadId } = route.params;

  const orders = useStore((s) => s.orders);
  const runnerAcceptCounter = useStore((s) => s.runnerAcceptCounter);
  const runnerCounter = useStore((s) => s.runnerCounter);
  const runnerRejectCounter = useStore((s) => s.runnerRejectCounter);
  const expireOffer = useStore((s) => s.expireOffer);

  const order = orders.find((o) => o.id === orderId);
  const thread = order?.threads.find((t) => t.id === threadId);

  const [showCounterInput, setShowCounterInput] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!order || !thread) {
    return (
      <View style={{ flex: 1, backgroundColor: Canvas.orange, padding: 20, justifyContent: 'center' }}>
        <Text style={{ fontWeight: '900', color: Neutral.white, fontSize: 18 }}>
          Negotiation thread not found.
        </Text>
        <BrutalButton label="Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const latestOffer = thread.offers[thread.offers.length - 1];
  const isLatestPending = latestOffer && latestOffer.status === 'PENDING';
  const isActionableByRunner =
    isLatestPending && latestOffer.from === 'CUSTOMER' && thread.status === 'OPEN';

  const countersExchanged = counterCount(thread);
  const maxCountersReached = countersExchanged >= 5;

  const handleAccept = () => {
    runnerAcceptCounter(orderId, threadId);
    navigation.goBack();
  };

  const handleReject = () => {
    runnerRejectCounter(orderId, threadId);
    navigation.goBack();
  };

  const handleSendCounter = () => {
    setFormError(null);
    const parsedPrice = parseInt(counterPrice, 10);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError('Please enter a valid counter price (> ₹0)');
      return;
    }

    if (!counterNote.trim()) {
      setFormError('Reasoning note is required (max 120 chars)');
      return;
    }

    if (counterNote.trim().length > 120) {
      setFormError('Note must be at most 120 characters');
      return;
    }

    runnerCounter(orderId, threadId, parsedPrice, counterNote.trim());
    setShowCounterInput(false);
    setCounterPrice('');
    setCounterNote('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: Canvas.orange }}
    >
      {/* Top Bar */}
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
            Errand Feed
          </Text>
        </TouchableOpacity>

        <BrutalBadge label={`Thread: ${thread.status}`} color={CTA.lime} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="never">
        {/* Order Context Card */}
        <View
          style={{
            backgroundColor: Card.cream,
            borderWidth: 4,
            borderColor: Neutral.black,
            borderRadius: 16,
            padding: 16,
            gap: 4,
          }}
        >
          <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
            Negotiating: {order.category}
          </Text>
          <Text style={{ fontWeight: '700', fontSize: 13, color: '#374151' }}>
            {order.stops[0]?.address} → {order.stops[order.stops.length - 1]?.address}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Clock size={12} color="#6B7280" />
            <Text style={{ fontWeight: '700', fontSize: 11, color: '#6B7280' }}>
              {countersExchanged}/5 counter rounds used
            </Text>
          </View>
        </View>

        {/* Chronological Chat-Style Offers */}
        <View style={{ gap: 12 }}>
          {thread.offers.map((offer, idx) => {
            const isRunner = offer.from === 'RUNNER';

            return (
              <View
                key={offer.id}
                style={{
                  alignSelf: isRunner ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                }}
              >
                <BrutalCard
                  backgroundColor={isRunner ? '#FFEDD5' : Card.cream}
                  radius={16}
                >
                  <View style={{ padding: 14, gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <Text
                        style={{
                          fontWeight: '900',
                          fontSize: 12,
                          color: isRunner ? '#C2410C' : '#6D28D9',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isRunner ? 'Your Offer' : 'Customer Counter'}
                      </Text>
                      <BrutalBadge
                        label={offer.status}
                        color={
                          offer.status === 'ACCEPTED'
                            ? '#10B981'
                            : offer.status === 'REJECTED'
                            ? '#EF4444'
                            : offer.status === 'PENDING'
                            ? '#F97316'
                            : '#6B7280'
                        }
                      />
                    </View>

                    <Text style={{ fontWeight: '900', fontSize: 26, color: Neutral.black, letterSpacing: -0.5 }}>
                      {formatRupees(offer.price)}
                    </Text>

                    <Text style={{ fontWeight: '700', fontSize: 13, color: '#1F2937' }}>
                      "{offer.note}"
                    </Text>

                    {/* Timestamp & Expiry Countdown */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      {offer.status === 'PENDING' ? (
                        <OfferCountdown
                          createdAtIso={offer.createdAt}
                          onExpire={() => expireOffer(order.id, thread.id, offer.id)}
                        />
                      ) : <View />}
                      <Text style={{ fontWeight: '700', fontSize: 10, color: '#9CA3AF' }}>
                        {formatDateTime(offer.createdAt)}
                      </Text>
                    </View>
                  </View>
                </BrutalCard>
              </View>
            );
          })}
        </View>

        {/* Action Panel for Runner */}
        {isActionableByRunner ? (
          <View style={{ gap: 12, marginTop: 8 }}>
            <View
              style={{
                backgroundColor: CTA.lime,
                borderWidth: 3,
                borderColor: Neutral.black,
                padding: 12,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={20} color={Neutral.black} />
              <Text style={{ fontWeight: '900', fontSize: 12, flex: 1 }}>
                Customer offered {formatRupees(latestOffer.price)}. Accept to lock task, counter with your fee, or reject.
              </Text>
            </View>

            {!showCounterInput ? (
              <View style={{ gap: 10 }}>
                <BrutalButton
                  label={`ACCEPT ${formatRupees(latestOffer.price)} & LOCK DEAL`}
                  color={CTA.lime}
                  fullWidth
                  size="lg"
                  onPress={handleAccept}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <BrutalButton
                      label={maxCountersReached ? 'Counter Limit (5/5)' : 'Send Counter'}
                      color={CTA.violet}
                      fullWidth
                      disabled={maxCountersReached}
                      onPress={() => setShowCounterInput(true)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <BrutalButton
                      label="Reject Offer"
                      color="#EF4444"
                      fullWidth
                      onPress={handleReject}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <BrutalCard backgroundColor="#FFFFFF">
                <View style={{ padding: 16, gap: 12 }}>
                  <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                    Send Counter Quote ({countersExchanged + 1}/5)
                  </Text>

                  {formError ? (
                    <Text style={{ fontWeight: '900', fontSize: 12, color: '#EF4444' }}>
                      ⚠️ {formError}
                    </Text>
                  ) : null}

                  <BrutalInput
                    label="Counter Price (₹)"
                    placeholder="e.g. 110"
                    keyboardType="numeric"
                    value={counterPrice}
                    onChangeText={setCounterPrice}
                  />

                  <BrutalInput
                    label={`Reasoning Note (${120 - counterNote.length} left)`}
                    placeholder="Rationale for counter..."
                    value={counterNote}
                    onChangeText={setCounterNote}
                    maxLength={120}
                  />

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    <View style={{ flex: 1 }}>
                      <BrutalButton
                        label="Cancel"
                        color="#F3F4F6"
                        fullWidth
                        size="sm"
                        onPress={() => setShowCounterInput(false)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <BrutalButton
                        label="Submit Counter"
                        color={CTA.lime}
                        fullWidth
                        size="sm"
                        onPress={handleSendCounter}
                      />
                    </View>
                  </View>
                </View>
              </BrutalCard>
            )}
          </View>
        ) : thread.status === 'AGREED' ? (
          <BrutalCard backgroundColor={Card.mint}>
            <View style={{ padding: 18, alignItems: 'center', gap: 8 }}>
              <BrutalBadge label="ACCEPTED & LOCKED" color="#10B981" starburst />
              <Text style={{ fontWeight: '900', fontSize: 16, textAlign: 'center' }}>
                Deal agreed on {formatRupees(order.agreedFee ?? latestOffer.price)}!
              </Text>
              <Text style={{ fontWeight: '700', fontSize: 12, color: '#065F46' }}>
                Status: {order.status}. Awaiting customer's advance deposit to dispatch you.
              </Text>
            </View>
          </BrutalCard>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

