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
import { ArrowLeft, Banknote, QrCode, CheckCircle2 } from 'lucide-react-native';

export function FinalPaymentScreen({ route, navigation }: any) {
  const { orderId } = route.params;

  const orders = useStore((s) => s.orders);
  const payFinal = useStore((s) => s.payFinal);
  const confirmCashReceived = useStore((s) => s.confirmCashReceived);

  const order = orders.find((o) => o.id === orderId);
  const [upiSheetVisible, setUpiSheetVisible] = useState(false);
  const [cashSelected, setCashSelected] = useState(false);

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: Canvas.purple, padding: 20 }}>
        <Text style={{ fontWeight: '900', color: Neutral.white }}>Order not found.</Text>
      </View>
    );
  }

  const finalBalance =
    order.finalBalance ??
    (order.balanceFee ?? 0) + (order.storeBillAmount ?? 0);

  const handleUpiSuccess = (upiRef: string) => {
    payFinal(orderId, 'UPI', upiRef);
    setUpiSheetVisible(false);
    navigation.replace('Receipt', { orderId });
  };

  const handleChooseCash = () => {
    payFinal(orderId, 'CASH');
    setCashSelected(true);
  };

  const handleSimulateCashConfirm = () => {
    confirmCashReceived(orderId);
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
          Final Payment Settlement
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
            Errand Completed!
          </Text>
          <Text style={{ fontWeight: '700', fontSize: 13, color: '#374151' }}>
            Settle the final balance with {order.assignedRunnerName ?? 'the Task Boy'} using UPI or Cash.
          </Text>
        </View>

        {/* Settlement Breakdown Card */}
        <BrutalCard backgroundColor="#FFFFFF">
          <View style={{ padding: 18, gap: 12 }}>
            <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
              Final Amount Breakdown
            </Text>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280' }}>
                  Remaining Service Fee:
                </Text>
                <Text style={{ fontWeight: '900', fontSize: 14 }}>
                  {formatRupees(order.balanceFee ?? 0)}
                </Text>
              </View>

              {order.storeBillAmount ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280' }}>
                    Reimbursed Store Bill:
                  </Text>
                  <Text style={{ fontWeight: '900', fontSize: 14, color: '#D97706' }}>
                    +{formatRupees(order.storeBillAmount)}
                  </Text>
                </View>
              ) : null}

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
                  Total Final Payable:
                </Text>
                <Text style={{ fontWeight: '900', fontSize: 28, color: Neutral.black }}>
                  {formatRupees(finalBalance)}
                </Text>
              </View>
            </View>
          </View>
        </BrutalCard>

        {/* Payment Method Selector */}
        {!cashSelected ? (
          <View style={{ gap: 12 }}>
            <Text
              style={{
                fontWeight: '900',
                fontSize: 16,
                color: Neutral.white,
                textTransform: 'uppercase',
                letterSpacing: -0.5,
              }}
            >
              Choose Settlement Method
            </Text>

            {/* Option 1: Instant UPI */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setUpiSheetVisible(true)}
            >
              <BrutalCard backgroundColor={Card.cream}>
                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
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
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                      Pay via UPI (Recommended)
                    </Text>
                    <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563' }}>
                      Instant confirmation · GPay / PhonePe / Paytm
                    </Text>
                  </View>
                  <BrutalBadge label="FAST" color="#10B981" />
                </View>
              </BrutalCard>
            </TouchableOpacity>

            {/* Option 2: Cash Handover */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleChooseCash}
            >
              <BrutalCard backgroundColor="#EDE9FE">
                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View
                    style={{
                      backgroundColor: '#10B981',
                      padding: 10,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: Neutral.black,
                    }}
                  >
                    <Banknote size={24} color={Neutral.black} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                      Pay Cash to Task Boy
                    </Text>
                    <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563' }}>
                      Hand exact cash at drop-off
                    </Text>
                  </View>
                  <BrutalBadge label="CASH" color="#F97316" />
                </View>
              </BrutalCard>
            </TouchableOpacity>
          </View>
        ) : (
          /* Cash Handover Confirmation Panel */
          <BrutalCard backgroundColor="#FEF08A">
            <View style={{ padding: 20, gap: 14 }}>
              <Text style={{ fontWeight: '900', fontSize: 18, textTransform: 'uppercase' }}>
                💵 Cash Selected
              </Text>
              <Text style={{ fontWeight: '800', fontSize: 14, color: '#1F2937' }}>
                Please hand <Text style={{ fontWeight: '900', fontSize: 18 }}>{formatRupees(finalBalance)}</Text> in cash directly to {order.assignedRunnerName ?? 'the Task Boy'}.
              </Text>

              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: Neutral.black,
                }}
              >
                <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563' }}>
                  ⏳ Awaiting runner's "Confirm Cash Received" tap. In demo mode, click below to simulate runner confirmation.
                </Text>
              </View>

              <BrutalButton
                label="Confirm Cash Received (Demo Simulate)"
                color={CTA.lime}
                fullWidth
                onPress={handleSimulateCashConfirm}
              />

              <BrutalButton
                label="Switch to UPI Payment"
                color={Neutral.white}
                fullWidth
                size="sm"
                onPress={() => setCashSelected(false)}
              />
            </View>
          </BrutalCard>
        )}
      </ScrollView>

      {/* Mock UPI Sheet */}
      <UpiPaymentSheet
        visible={upiSheetVisible}
        amount={finalBalance}
        paymentTitle="Final Balance Settlement"
        onClose={() => setUpiSheetVisible(false)}
        onSuccess={handleUpiSuccess}
      />
    </View>
  );
}

