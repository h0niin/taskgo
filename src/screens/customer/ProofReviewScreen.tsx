import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BrutalBadge,
  BrutalButton,
  BrutalCard,
} from '../../components';
import { Canvas, Card, CTA, Neutral } from '../../theme';
import { useStore } from '../../store';
import { formatRupees } from '../../utils/format';
import { ArrowLeft, CheckCircle2, AlertTriangle, Receipt as ReceiptIcon, Camera } from 'lucide-react-native';

export function ProofReviewScreen({ route, navigation }: any) {
  const { orderId } = route.params;

  const orders = useStore((s) => s.orders);
  const approveProof = useStore((s) => s.approveProof);
  const raiseIssue = useStore((s) => s.raiseIssue);

  const order = orders.find((o) => o.id === orderId);

  const [issueMode, setIssueMode] = useState(false);
  const [issueNote, setIssueNote] = useState('');
  const [issueSubmitted, setIssueSubmitted] = useState(false);

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: Canvas.purple, padding: 20 }}>
        <Text style={{ fontWeight: '900', color: Neutral.white }}>Order not found.</Text>
      </View>
    );
  }

  const handleApprove = () => {
    approveProof(orderId);
    navigation.replace('FinalPayment', { orderId });
  };

  const handleRaiseIssue = () => {
    if (!issueNote.trim()) {
      alert('Please describe the issue.');
      return;
    }
    raiseIssue(orderId);
    setIssueSubmitted(true);
    setIssueMode(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Canvas.purple }}>
      {/* Top Bar */}
      <View
        style={{
          padding: 16,
          backgroundColor: Neutral.black,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={Neutral.white} />
        </TouchableOpacity>
        <Text
          style={{
            fontWeight: '900',
            fontSize: 16,
            color: Neutral.white,
            textTransform: 'uppercase',
          }}
        >
          Review Delivery Proof
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Banner */}
        <View
          style={{
            backgroundColor: CTA.lime,
            borderWidth: 4,
            borderColor: Neutral.black,
            borderRadius: 20,
            padding: 18,
            gap: 4,
          }}
        >
          <Text style={{ fontWeight: '900', fontSize: 20, textTransform: 'uppercase' }}>
            Runner Submitted Completion Proof
          </Text>
          <Text style={{ fontWeight: '700', fontSize: 13 }}>
            Inspect photos of the handover and any store bills before approving final settlement.
          </Text>
        </View>

        {order.issueFlagged || issueSubmitted ? (
          <View
            style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 3,
              borderColor: '#EF4444',
              borderRadius: 16,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <AlertTriangle size={24} color="#EF4444" strokeWidth={3} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '900', fontSize: 14, color: '#B91C1C' }}>
                ISSUE FLAGGED (DEMO MODE)
              </Text>
              <Text style={{ fontWeight: '700', fontSize: 12, color: '#7F1D1D' }}>
                Support notified: "{issueNote || 'Issue flagged for runner verification'}"
              </Text>
            </View>
          </View>
        ) : null}

        {/* 1. Completion Photo Card */}
        <BrutalCard backgroundColor={Card.cream}>
          <View style={{ padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Camera size={18} color={Neutral.black} strokeWidth={2.5} />
                <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                  Handover / Completion Photo
                </Text>
              </View>
              <BrutalBadge label="VERIFIED" color="#10B981" />
            </View>

            {order.completionPhotoUri ? (
              <Image
                source={{ uri: order.completionPhotoUri }}
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: 12,
                  borderWidth: 3,
                  borderColor: Neutral.black,
                  backgroundColor: '#E5E7EB',
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  height: 140,
                  backgroundColor: '#E5E7EB',
                  borderWidth: 3,
                  borderColor: Neutral.black,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>
                  📸 Delivered Item Snapshot
                </Text>
              </View>
            )}
          </View>
        </BrutalCard>

        {/* 2. Store Bill & Reimbursement Card (if purchase made) */}
        {order.storeBillAmount ? (
          <BrutalCard backgroundColor="#FFFFFF">
            <View style={{ padding: 16, gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ReceiptIcon size={18} color={Neutral.black} strokeWidth={2.5} />
                  <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                    Local Shop Bill Photo
                  </Text>
                </View>
                <BrutalBadge label={`+${formatRupees(order.storeBillAmount)}`} color="#F97316" />
              </View>

              {order.billPhotoUri ? (
                <Image
                  source={{ uri: order.billPhotoUri }}
                  style={{
                    width: '100%',
                    height: 180,
                    borderRadius: 12,
                    borderWidth: 3,
                    borderColor: Neutral.black,
                    backgroundColor: '#E5E7EB',
                  }}
                  resizeMode="cover"
                />
              ) : null}

              <View
                style={{
                  backgroundColor: '#FEF08A',
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: Neutral.black,
                }}
              >
                <Text style={{ fontWeight: '900', fontSize: 13 }}>
                  Runner fronted: {formatRupees(order.storeBillAmount)} from pocket.
                </Text>
                <Text style={{ fontWeight: '700', fontSize: 11, color: '#4B5563', marginTop: 2 }}>
                  This amount will be added to your final settlement to reimburse the runner.
                </Text>
              </View>
            </View>
          </BrutalCard>
        ) : null}

        {/* Final Amount Calculation Preview */}
        <BrutalCard backgroundColor={Card.mint}>
          <View style={{ padding: 16, gap: 8 }}>
            <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>
              Final Balance Due Now
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700', fontSize: 13 }}>Remaining Service Fee:</Text>
              <Text style={{ fontWeight: '900', fontSize: 13 }}>{formatRupees(order.balanceFee ?? 0)}</Text>
            </View>
            {order.storeBillAmount ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 13 }}>Store Bill Reimbursement:</Text>
                <Text style={{ fontWeight: '900', fontSize: 13 }}>+{formatRupees(order.storeBillAmount)}</Text>
              </View>
            ) : null}
            <View
              style={{
                borderTopWidth: 2,
                borderColor: Neutral.black,
                paddingTop: 6,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontWeight: '900', fontSize: 15, textTransform: 'uppercase' }}>
                Total Final Payment:
              </Text>
              <Text style={{ fontWeight: '900', fontSize: 20 }}>
                {formatRupees(order.finalBalance ?? ((order.balanceFee ?? 0) + (order.storeBillAmount ?? 0)))}
              </Text>
            </View>
          </View>
        </BrutalCard>

        {/* Action Buttons */}
        {!issueMode ? (
          <View style={{ gap: 10 }}>
            <BrutalButton
              label="APPROVE PROOF & PAY BALANCE →"
              color={CTA.lime}
              fullWidth
              size="lg"
              onPress={handleApprove}
            />

            <BrutalButton
              label="Raise Issue / Query Proof"
              color="#F87171"
              fullWidth
              size="sm"
              onPress={() => setIssueMode(true)}
            />
          </View>
        ) : (
          <BrutalCard backgroundColor="#FFFFFF">
            <View style={{ padding: 16, gap: 10 }}>
              <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                Describe The Issue
              </Text>
              <TextInput
                multiline
                numberOfLines={3}
                placeholder="e.g. Items missing from receipt or damaged package..."
                placeholderTextColor="#9CA3AF"
                value={issueNote}
                onChangeText={setIssueNote}
                style={{
                  borderWidth: 2,
                  borderColor: Neutral.black,
                  borderRadius: 12,
                  padding: 10,
                  fontWeight: '700',
                  fontSize: 13,
                  minHeight: 70,
                }}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <BrutalButton
                    label="Cancel"
                    color="#F3F4F6"
                    fullWidth
                    size="sm"
                    onPress={() => setIssueMode(false)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <BrutalButton
                    label="Submit Flag"
                    color="#EF4444"
                    fullWidth
                    size="sm"
                    onPress={handleRaiseIssue}
                  />
                </View>
              </View>
            </View>
          </BrutalCard>
        )}
      </ScrollView>
    </View>
  );
}

