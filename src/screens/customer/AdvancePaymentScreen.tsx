import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
  BrutalBadge,
  BrutalButton,
  BrutalCard,
  UpiPaymentSheet,
} from '../../components';
import { Canvas, Card, CTA, Neutral } from '../../theme';
import { useStore } from '../../store';
import { formatRupees } from '../../utils/format';
import { ADVANCE_PCT } from '../../utils/pricing';
import { ArrowLeft, ShieldCheck, Zap } from 'lucide-react-native';

export function AdvancePaymentScreen({ route, navigation }: any) {
  const { orderId } = route.params;

  const orders = useStore((s) => s.orders);
  const payAdvance = useStore((s) => s.payAdvance);

  const order = orders.find((o) => o.id === orderId);
  const [upiSheetVisible, setUpiSheetVisible] = useState(false);

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: Canvas.purple, padding: 20 }}>
        <Text style={{ fontWeight: '900', color: Neutral.white }}>Order not found.</Text>
      </View>
    );
  }

  const agreedFee = order.agreedFee ?? 100;
  const advanceAmount = order.advanceAmount ?? Math.round((agreedFee * ADVANCE_PCT) / 100);
  const balanceFee = order.balanceFee ?? agreedFee - advanceAmount;

  const handleUpiSuccess = (upiRef: string) => {
    payAdvance(orderId, 'UPI', upiRef);
    setUpiSheetVisible(false);
    // Navigate to order detail to see live progress
    navigation.replace('OrderDetail', { orderId });
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
            letterSpacing: -0.5,
          }}
        >
          Secure Advance Deposit
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
            gap: 6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Zap size={20} color={Neutral.black} strokeWidth={3} />
            <Text style={{ fontWeight: '900', fontSize: 20, textTransform: 'uppercase' }}>
              Runner Dispatched On Deposit
            </Text>
          </View>
          <Text style={{ fontWeight: '700', fontSize: 13, color: '#1F2937' }}>
            To dispatch {order.assignedRunnerName ?? 'your Task Boy'}, pay {ADVANCE_PCT}% advance of the agreed fee.
          </Text>
        </View>

        {/* Pricing Breakdown Card */}
        <BrutalCard backgroundColor={Card.cream}>
          <View style={{ padding: 20, gap: 14 }}>
            <Text style={{ fontWeight: '900', fontSize: 15, textTransform: 'uppercase' }}>
              Deposit Breakdown
            </Text>

            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: '#4B5563' }}>
                  Agreed Service Fee:
                </Text>
                <Text style={{ fontWeight: '900', fontSize: 15 }}>
                  {formatRupees(agreedFee)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: '#4B5563' }}>
                  Advance Required ({ADVANCE_PCT}%):
                </Text>
                <Text style={{ fontWeight: '900', fontSize: 15, color: '#10B981' }}>
                  {formatRupees(advanceAmount)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: '#4B5563' }}>
                  Balance Due Upon Completion:
                </Text>
                <Text style={{ fontWeight: '900', fontSize: 15, color: '#6B7280' }}>
                  {formatRupees(balanceFee)}
                </Text>
              </View>

              <View
                style={{
                  borderTopWidth: 2,
                  borderColor: Neutral.black,
                  paddingTop: 10,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                  Payable Right Now:
                </Text>
                <Text style={{ fontWeight: '900', fontSize: 26, color: Neutral.black }}>
                  {formatRupees(advanceAmount)}
                </Text>
              </View>
            </View>
          </View>
        </BrutalCard>

        {/* Payment Method Card — UPI Only for Advance */}
        <BrutalCard backgroundColor="#FFFFFF">
          <View style={{ padding: 18, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                Payment Method
              </Text>
              <BrutalBadge label="UPI MANDATORY" color="#8B5CF6" />
            </View>

            <View
              style={{
                backgroundColor: '#EDE9FE',
                borderWidth: 3,
                borderColor: Neutral.black,
                borderRadius: 14,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <ShieldCheck size={28} color="#6D28D9" strokeWidth={2.5} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '900', fontSize: 14 }}>
                  Instant UPI Escrow Transfer
                </Text>
                <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563' }}>
                  Held safely. Released to Task Boy upon verification.
                </Text>
              </View>
            </View>

            <BrutalButton
              label={`PAY ${formatRupees(advanceAmount)} VIA UPI`}
              color={CTA.lime}
              fullWidth
              size="lg"
              onPress={() => setUpiSheetVisible(true)}
              style={{ marginTop: 6 }}
            />
          </View>
        </BrutalCard>
      </ScrollView>

      {/* Mock UPI Sheet */}
      <UpiPaymentSheet
        visible={upiSheetVisible}
        amount={advanceAmount}
        paymentTitle="Advance Errand Deposit"
        onClose={() => setUpiSheetVisible(false)}
        onSuccess={handleUpiSuccess}
      />
    </View>
  );
}

