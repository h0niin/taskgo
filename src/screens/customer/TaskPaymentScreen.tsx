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
import { ArrowLeft, ShieldCheck, Zap } from 'lucide-react-native';

export function TaskPaymentScreen({ route, navigation }: any) {
  const { orderId } = route.params;

  const orders = useStore((s) => s.orders);
  const payTaskFee = useStore((s) => s.payTaskFee);

  const order = orders.find((o) => o.id === orderId);
  const [upiSheetVisible, setUpiSheetVisible] = useState(false);

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: Canvas.purple, padding: 20 }}>
        <Text style={{ fontWeight: '900', color: Neutral.white }}>Order not found.</Text>
      </View>
    );
  }

  const agreedFee = order.agreedFee ?? 0;

  const handleUpiSuccess = (upiRef: string) => {
    payTaskFee(orderId, upiRef);
    setUpiSheetVisible(false);
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
          Secure Payment
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
              Runner Dispatched On Payment
            </Text>
          </View>
          <Text style={{ fontWeight: '700', fontSize: 13, color: '#1F2937' }}>
            Pay the agreed fee to start your errand with {order.assignedRunnerName ?? 'your Task Boy'}.
          </Text>
        </View>

        {/* Pricing Breakdown Card */}
        <BrutalCard backgroundColor={Card.cream}>
          <View style={{ padding: 20, gap: 14 }}>
            <Text style={{ fontWeight: '900', fontSize: 15, textTransform: 'uppercase' }}>
              Payment Breakdown
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
                  Platform Fee:
                </Text>
                <Text style={{ fontWeight: '900', fontSize: 15 }}>
                  ₹60
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
                  {formatRupees(agreedFee + 60)}
                </Text>
              </View>
            </View>
          </View>
        </BrutalCard>

        {/* Payment Method Card — UPI Only */}
        <BrutalCard backgroundColor="#FFFFFF">
          <View style={{ padding: 18, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                Payment Method
              </Text>
              <BrutalBadge label="UPI ONLY" color="#8B5CF6" />
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
                  Instant UPI Payment
                </Text>
                <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563' }}>
                  GPay / PhonePe / Paytm · Secure checkout
                </Text>
              </View>
            </View>

            <BrutalButton
              label={`PAY ${formatRupees(agreedFee)} VIA UPI`}
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
        amount={agreedFee}
        paymentTitle="Task Fee Payment"
        onClose={() => setUpiSheetVisible(false)}
        onSuccess={handleUpiSuccess}
      />
    </View>
  );
}
