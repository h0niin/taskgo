import React, { useState } from 'react';
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomSheet } from './BottomSheet';
import { BrutalButton } from './BrutalButton';
import { BrutalInput } from './BrutalInput';
import { BrutalBadge } from './BrutalBadge';
import { Card, CTA, Neutral } from '../theme';
import { formatDistance, formatRupees } from '../utils/format';
import type { ErrandOrder } from '../types/models';
import { Bike, Clock, Phone, MapPin, AlertCircle, CheckCircle } from 'lucide-react-native';

interface RunnerBidSheetProps {
  visible: boolean;
  order: ErrandOrder | null;
  runnerId: string;
  runnerName: string;
  onClose: () => void;
  onSubmitBid: (orderId: string, price: number, note: string) => void;
  onEditBid?: (orderId: string, threadId: string, price: number, note: string) => void;
  onWithdrawBid?: (orderId: string, threadId: string) => void;
  onOpenNegotiation?: (orderId: string, threadId: string) => void;
}

export function RunnerBidSheet({
  visible,
  order,
  runnerId,
  runnerName,
  onClose,
  onSubmitBid,
  onEditBid,
  onWithdrawBid,
  onOpenNegotiation,
}: RunnerBidSheetProps) {
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;

  const existingThread = order.threads.find((t) => t.runnerId === runnerId);
  const myLatestOffer = existingThread
    ? existingThread.offers[existingThread.offers.length - 1]
    : null;

  const canEditOrWithdraw =
    existingThread &&
    existingThread.status === 'OPEN' &&
    !existingThread.offers.some((o) => o.from === 'CUSTOMER');

  const handleStartEdit = () => {
    if (myLatestOffer) {
      setPrice(myLatestOffer.price.toString());
      setNote(myLatestOffer.note);
      setEditing(true);
    }
  };

  const handleSaveEdit = () => {
    setError(null);
    const parsedPrice = parseInt(price, 10);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!note.trim()) {
      setError('Reasoning note is required (max 120 chars)');
      return;
    }
    if (existingThread && onEditBid) {
      onEditBid(order.id, existingThread.id, parsedPrice, note.trim());
      setEditing(false);
    }
  };

  const handlePlaceBid = () => {
    setError(null);
    const parsedPrice = parseInt(price, 10);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Please enter a valid bid amount (₹)');
      return;
    }

    if (!note.trim()) {
      setError('A short reasoning note is required (max 120 chars)');
      return;
    }

    if (note.trim().length > 120) {
      setError('Note must be at most 120 characters');
      return;
    }

    onSubmitBid(order.id, parsedPrice, note.trim());
    setPrice('');
    setNote('');
    onClose();
  };

  const handleCallCustomer = () => {
    Linking.openURL('tel:+919876543210');
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="ERRAND & BIDDING"
      snapHeight={600}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
        {error ? (
          <View
            style={{
              backgroundColor: '#FEE2E2',
              borderWidth: 3,
              borderColor: '#DC2626',
              borderRadius: 12,
              padding: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={18} color="#DC2626" />
            <Text style={{ fontWeight: '900', fontSize: 12, color: '#DC2626', flex: 1 }}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* Category & Distance Header */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 3,
            borderColor: Neutral.black,
            borderRadius: 14,
            padding: 14,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <BrutalBadge label={order.category} color="#F97316" />
            <BrutalBadge label={formatDistance(order.distanceKm)} color={Neutral.black} />
          </View>

          {/* Route Checkpoints */}
          <View style={{ gap: 6, marginTop: 4 }}>
            <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>
              Checkpoints ({order.stops.length} Stops):
            </Text>
            {order.stops.map((stop, i) => (
              <View key={stop.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    backgroundColor: i === 0 ? '#10B981' : i === order.stops.length - 1 ? '#EF4444' : '#F97316',
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: Neutral.black,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontWeight: '900', fontSize: 10, color: Neutral.white }}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={{ fontWeight: '800', fontSize: 13, flex: 1 }}>
                  {stop.address} {stop.landmark ? `(${stop.landmark})` : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Special Instructions */}
        <View
          style={{
            backgroundColor: '#FEF08A',
            borderWidth: 3,
            borderColor: Neutral.black,
            borderRadius: 14,
            padding: 14,
            gap: 4,
          }}
        >
          <Text style={{ fontWeight: '900', fontSize: 12, textTransform: 'uppercase' }}>
            Customer Instructions:
          </Text>
          <Text style={{ fontWeight: '700', fontSize: 13, color: '#1F2937' }}>
            "{order.edgeCaseInstructions}"
          </Text>
        </View>

        {/* Customer Contact Button (SPEC Section 9.2) */}
        <TouchableOpacity
          onPress={handleCallCustomer}
          style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 3,
            borderColor: Neutral.black,
            borderRadius: 14,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Phone size={18} color="#10B981" />
            <Text style={{ fontWeight: '900', fontSize: 13 }}>Contact Customer (Call)</Text>
          </View>
          <Text style={{ fontWeight: '800', fontSize: 12, color: '#6B7280' }}>+91 98765 43210</Text>
        </TouchableOpacity>

        {/* Existing Bid Status vs Place Bid Form */}
        {existingThread ? (
          editing ? (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 3,
                borderColor: Neutral.black,
                borderRadius: 16,
                padding: 16,
                gap: 12,
              }}
            >
              <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                Edit Your Bid (Before Customer Reply)
              </Text>
              <BrutalInput
                label="New Price (₹)"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
              <BrutalInput
                label="New Reasoning Note"
                value={note}
                onChangeText={setNote}
                maxLength={120}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <BrutalButton
                    label="Cancel"
                    color="#F3F4F6"
                    fullWidth
                    size="sm"
                    onPress={() => setEditing(false)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <BrutalButton
                    label="Save Bid"
                    color={CTA.lime}
                    fullWidth
                    size="sm"
                    onPress={handleSaveEdit}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: Card.mint,
                borderWidth: 3,
                borderColor: Neutral.black,
                borderRadius: 16,
                padding: 16,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                  Your Active Bid:
                </Text>
                <BrutalBadge label={existingThread.status} color="#10B981" />
              </View>

              <Text style={{ fontWeight: '900', fontSize: 28, color: Neutral.black }}>
                {formatRupees(myLatestOffer?.price ?? 0)}
              </Text>
              <Text style={{ fontWeight: '700', fontSize: 13, color: '#374151' }}>
                Reason: "{myLatestOffer?.note}"
              </Text>

              <View style={{ gap: 8, marginTop: 4 }}>
                <BrutalButton
                  label="Open Negotiation Thread →"
                  color={CTA.lime}
                  fullWidth
                  size="md"
                  onPress={() => {
                    onClose();
                    onOpenNegotiation?.(order.id, existingThread.id);
                  }}
                />

                {canEditOrWithdraw && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <BrutalButton
                        label="Edit Bid"
                        color="#FEF08A"
                        fullWidth
                        size="sm"
                        onPress={handleStartEdit}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <BrutalButton
                        label="Withdraw"
                        color="#EF4444"
                        fullWidth
                        size="sm"
                        onPress={() => {
                          onWithdrawBid?.(order.id, existingThread.id);
                          onClose();
                        }}
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>
          )
        ) : (
          /* Place Bid Form */
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 3,
              borderColor: Neutral.black,
              borderRadius: 16,
              padding: 16,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                Submit Your Fee Quote
              </Text>
              <BrutalBadge label="NO BASE PRICE" color="#8B5CF6" />
            </View>

            <BrutalInput
              label="Your Price (₹) *"
              placeholder="e.g. 120"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />

            <BrutalInput
              label={`Short Note (${120 - note.length} chars left) *`}
              placeholder="e.g. Heavy rain along Mavoor Road & long shop queue"
              value={note}
              onChangeText={setNote}
              maxLength={120}
            />

            <BrutalButton
              label="SUBMIT RUNNER BID"
              color={CTA.lime}
              fullWidth
              size="lg"
              onPress={handlePlaceBid}
            />
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

