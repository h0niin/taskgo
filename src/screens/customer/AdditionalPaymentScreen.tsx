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
import { ArrowLeft, QrCode } from 'lucide-react-native';

export function AdditionalPaymentScreen({ route, navigation }: any) {
  const { orderId } = route.params;

  const orders = useStore((s) => s.orders);
  const payAdditionalCosts = useStore((s) => s.payAdditionalCosts);

  const order = orders.find((o) => o.id === orderId);
  const [upiSheetVisible, setUpiSheetVisible] = useState(false);

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: Canvas.purple, padding: 20 }}>
        <Text style={{ fontWeight: '900', color: Neutral.white }}>Order not found.</Text>
      </View>
    );
  }

  const additionalCosts = order.additionalCosts ?? 0;

  const handleUpiSuccess = (upiRef: string) => {
    payAdditionalCosts(orderId, upiRef);
    setUpiSheetVisible(false);
    navigation.replace('Receipt', { orderId });
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
          Additional Costs
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Banner */}
        <View
          style={{
            backgroundColor: Card.cream,
            borderWidth: 4,
            borderColor: Neutral.black,
            borderRadius: 20,
            padding: 18,
            gap: 4,
          }}
        >
          <Text style={{ fontWeight: '900', fontSize: 22, textTransform: 'uppercase' }}>
            Additional Costs Due
          </Text>
          <Text style={{ fontWeight: '700', fontSize: 13, color: '#374151' }}>
            {order.assignedRunnerName ?? 'The Task Boy'} incurred these costs during your errand.
          </Text>
        </View>

        {/* Breakdown Card */}
        <BrutalCard backgroundColor="#FFFFFF">
          <View style={{ padding: 18, gap: 12 }}>
            <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
              Amount Breakdown
            </Text>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280' }}>
                  Additional Costs:
                </Text>
                <Text style={{ fontWeight: '900', fontSize: 14 }}>
                  {formatRupees(additionalCosts)}
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
                  Total Payable:
                </Text>
                <Text style={{ fontWeight: '900', fontSize: 28, color: Neutral.black }}>
                  {formatRupees(additionalCosts)}
                </Text>
              </View>
            </View>
          </View>
        </BrutalCard>

        {/* Payment Method Card — UPI Only */}
        <BrutalCard backgroundColor={Card.cream}>
          <View style={{ padding: 16, gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    backgroundColor: '#8B5CF6',
                    padding: 10,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: Neutral.black,
                  }}
                >
                  <QrCode size={24} color={Neutral.white} />
                </View>
                <View>
                  <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                    Pay via UPI
                  </Text>
                  <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563' }}>
                    GPay / PhonePe / Paytm
                  </Text>
                </View>
              </View>
              <BrutalBadge label="UPI ONLY" color="#8B5CF6" />
            </View>

            <BrutalButton
              label={`PAY ${formatRupees(additionalCosts)} VIA UPI`}
              color={CTA.lime}
              fullWidth
              size="lg"
              onPress={() => setUpiSheetVisible(true)}
            />
          </View>
        </BrutalCard>
      </ScrollView>

      {/* Mock UPI Sheet */}
      <UpiPaymentSheet
        visible={upiSheetVisible}
        amount={additionalCosts}
        paymentTitle="Additional Costs"
        onClose={() => setUpiSheetVisible(false)}
        onSuccess={handleUpiSuccess}
      />
    </View>
  );
}
