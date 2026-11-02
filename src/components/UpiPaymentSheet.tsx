import React, { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { BrutalButton } from './BrutalButton';
import { CTA, Neutral } from '../theme';
import { formatRupees } from '../utils/format';
import { CheckCircle2, ShieldCheck } from 'lucide-react-native';

interface UpiPaymentSheetProps {
  visible: boolean;
  amount: number;
  paymentTitle?: string;
  onClose: () => void;
  onSuccess: (upiRef: string) => void;
}

export function UpiPaymentSheet({
  visible,
  amount,
  paymentTitle = 'Task Payment',
  onClose,
  onSuccess,
}: UpiPaymentSheetProps) {
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePay = () => {
    setProcessing(true);

    // Fake ~2s processing per SPEC Section 6
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);

      const mockUpiRef = `UPI${Date.now().toString().slice(-8)}`;
      setTimeout(() => {
        setSuccess(false);
        onSuccess(mockUpiRef);
      }, 1200);
    }, 2000);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={() => {
        if (!processing) onClose();
      }}
      title="DEMO PAYMENT"
      snapHeight={430}
    >
      <View style={{ gap: 16 }}>
        {/* Banner */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#FEF08A',
            padding: 12,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: Neutral.black,
          }}
        >
          <View>
            <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>
              {paymentTitle}
            </Text>
            <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563' }}>
              Mock UPI Gateway (Safe Sandbox)
            </Text>
          </View>
          <Text style={{ fontWeight: '900', fontSize: 24, color: Neutral.black }}>
            {formatRupees(amount)}
          </Text>
        </View>

        {success ? (
          <View
            style={{
              padding: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#D1FAE5',
              borderWidth: 3,
              borderColor: Neutral.black,
              borderRadius: 16,
              gap: 12,
            }}
          >
            <CheckCircle2 color="#10B981" size={52} strokeWidth={3} />
            <Text
              style={{
                fontWeight: '900',
                fontSize: 20,
                color: Neutral.black,
                textTransform: 'uppercase',
              }}
            >
              Payment Successful!
            </Text>
            <Text style={{ fontWeight: '700', fontSize: 13, color: '#374151' }}>
              Amount paid: {formatRupees(amount)} · Payment complete!
            </Text>
          </View>
        ) : processing ? (
          <View
            style={{
              padding: 32,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              borderWidth: 3,
              borderColor: Neutral.black,
              borderRadius: 16,
              gap: 16,
            }}
          >
            <ActivityIndicator size="large" color={Neutral.black} />
            <Text
              style={{
                fontWeight: '900',
                fontSize: 16,
                color: Neutral.black,
                textTransform: 'uppercase',
                letterSpacing: -0.5,
              }}
            >
              Processing UPI Transaction…
            </Text>
            <Text style={{ fontWeight: '700', fontSize: 12, color: '#6B7280' }}>
              Simulating banking switch response (~2s)
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color="#10B981" />
              <Text style={{ fontWeight: '700', fontSize: 12, color: '#374151' }}>
                Zero real money deducted. Click below to simulate UPI.
              </Text>
            </View>

            <BrutalButton
              label={`PAY ${formatRupees(amount)} WITH UPI`}
              color={CTA.lime}
              fullWidth
              size="lg"
              onPress={handlePay}
            />
          </View>
        )}
      </View>
    </BottomSheet>
  );
}

