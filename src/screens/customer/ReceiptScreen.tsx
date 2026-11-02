import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BrutalBadge,
  BrutalButton,
  BrutalCard,
  KeyboardAwareScrollView,
} from '../../components';
import { Canvas, Card, CTA, Neutral } from '../../theme';
import { useStore } from '../../store';
import {
  formatDate,
  formatDateTime,
  formatOrderId,
  formatRupees,
} from '../../utils/format';
import { ArrowLeft, CheckCircle2, Star, Share2, ZoomIn, X } from 'lucide-react-native';

export function ReceiptScreen({ route, navigation }: any) {
  const { orderId } = route.params;

  const orders = useStore((s) => s.orders);
  const rateOrder = useStore((s) => s.rateOrder);

  const order = orders.find((o) => o.id === orderId);

  const [rating, setRating] = useState<number>(order?.rating ?? 5);
  const [review, setReview] = useState<string>(order?.review ?? '');
  const [rated, setRated] = useState<boolean>(!!order?.rating);
  const [billModalVisible, setBillModalVisible] = useState(false);

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: Canvas.purple, padding: 20 }}>
        <Text style={{ fontWeight: '900', color: Neutral.white }}>Order not found.</Text>
      </View>
    );
  }

  const feePayment = order.payments.find((p) => p.kind === 'TASK_FEE');
  const additionalPayment = order.payments.find((p) => p.kind === 'ADDITIONAL_COST');

  const agreedFee = order.agreedFee ?? 0;
  const additionalCosts = order.additionalCosts ?? 0;
  const PLATFORM_FEE = 60;
  const totalPaid =
    (order.payments.reduce((sum, p) => sum + p.amount, 0) || agreedFee + additionalCosts) +
    PLATFORM_FEE;

  const handleSaveRating = () => {
    rateOrder(orderId, rating, review.trim());
    setRated(true);
    alert('Thank you! Rating saved to order.');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={{ flex: 1, backgroundColor: Canvas.purple }}
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
            Dashboard
          </Text>
        </TouchableOpacity>
        <BrutalBadge label="SETTLED" color="#10B981" starburst />
      </View>

      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Paper Invoice Container with Jagged Top/Bottom Edge (SPEC Section 8.5) */}
        <View style={{ position: 'relative' }}>
          {/* Top Jagged Perforation Teeth */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              marginBottom: -4,
              zIndex: 2,
              paddingHorizontal: 8,
            }}
          >
            {[...Array(14)].map((_, i) => (
              <View
                key={i}
                style={{
                  width: 14,
                  height: 10,
                  backgroundColor: Canvas.purple,
                  transform: [{ rotate: '45deg' }],
                  borderBottomWidth: 3,
                  borderRightWidth: 3,
                  borderColor: Neutral.black,
                }}
              />
            ))}
          </View>

          {/* Paper Invoice Card */}
          <View
            style={{
              backgroundColor: Card.cream,
              borderWidth: 4,
              borderColor: Neutral.black,
              borderRadius: 4,
              padding: 20,
              gap: 14,
              shadowColor: Neutral.black,
              shadowOffset: { width: 5, height: 5 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 4,
            }}
          >
            {/* Jagged Stamp / Header */}
            <View style={{ alignItems: 'center', borderBottomWidth: 3, borderBottomColor: Neutral.black, paddingBottom: 14, gap: 4 }}>
              <View
                style={{
                  backgroundColor: Neutral.black,
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 4,
                  transform: [{ rotate: '-1deg' }],
                }}
              >
                <Text
                  style={{
                    fontWeight: '900',
                    fontSize: 22,
                    color: Neutral.white,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                  }}
                >
                  TASKGO INVOICE
                </Text>
              </View>
              <Text style={{ fontWeight: '800', fontSize: 12, color: '#4B5563', textTransform: 'uppercase' }}>
                Kozhikode Hyperlocal Errand Platform
              </Text>
            </View>

            {/* Meta Details */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 12, color: '#6B7280' }}>Order ID:</Text>
                <Text style={{ fontWeight: '900', fontSize: 12 }}>{formatOrderId(order.id)}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 12, color: '#6B7280' }}>Date:</Text>
                <Text style={{ fontWeight: '900', fontSize: 12 }}>{formatDate(order.createdAt)}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 12, color: '#6B7280' }}>Category:</Text>
                <Text style={{ fontWeight: '900', fontSize: 12 }}>{order.category}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 12, color: '#6B7280' }}>Task Boy:</Text>
                <Text style={{ fontWeight: '900', fontSize: 12, color: '#C2410C' }}>
                  {order.assignedRunnerName ?? 'Assigned Runner'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 12, color: '#6B7280' }}>Route:</Text>
                <Text style={{ fontWeight: '900', fontSize: 11, maxWidth: '65%', textAlign: 'right' }}>
                  {order.stops[0]?.address} → {order.stops[order.stops.length - 1]?.address}
                </Text>
              </View>
            </View>

            {/* Dashed Separator */}
            <View
              style={{
                borderStyle: 'dashed',
                borderWidth: 1.5,
                borderColor: Neutral.black,
                marginVertical: 4,
              }}
            />

            {/* Financials Breakdown */}
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 13 }}>Agreed Service Fee:</Text>
                <Text style={{ fontWeight: '900', fontSize: 13 }}>{formatRupees(agreedFee)}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 13 }}>Platform Fee:</Text>
                <Text style={{ fontWeight: '900', fontSize: 13 }}>{formatRupees(PLATFORM_FEE)}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontWeight: '700', fontSize: 13 }}>Task Fee Paid:</Text>
                  {feePayment?.paidAt && (
                    <Text style={{ fontWeight: '700', fontSize: 10, color: '#6B7280' }}>
                      {formatDateTime(feePayment.paidAt)}
                    </Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <BrutalBadge label="UPI" color="#8B5CF6" />
                  <Text style={{ fontWeight: '900', fontSize: 13 }}>
                    {formatRupees(feePayment?.amount ?? agreedFee)}
                  </Text>
                </View>
              </View>

              {additionalCosts > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontWeight: '700', fontSize: 13 }}>Additional Costs Paid:</Text>
                    {additionalPayment?.paidAt && (
                      <Text style={{ fontWeight: '700', fontSize: 10, color: '#D97706' }}>
                        {formatDateTime(additionalPayment.paidAt)}
                      </Text>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <BrutalBadge label="UPI" color="#F97316" />
                    <Text style={{ fontWeight: '900', fontSize: 13, color: '#D97706' }}>
                      +{formatRupees(additionalPayment?.amount ?? additionalCosts)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Double Solid Line for Total */}
            <View style={{ borderTopWidth: 3, borderBottomWidth: 1, borderColor: Neutral.black, paddingVertical: 8, marginTop: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: '900', fontSize: 18, textTransform: 'uppercase' }}>
                  Total Paid:
                </Text>
                <Text style={{ fontWeight: '900', fontSize: 26, color: Neutral.black }}>
                  {formatRupees(totalPaid)}
                </Text>
              </View>
            </View>

            {/* Additional Costs Photo with modal trigger (SPEC Section 8.5) */}
            {order.additionalCostPhotoUri ? (
              <View style={{ marginTop: 4, gap: 6 }}>
                <Text style={{ fontWeight: '800', fontSize: 11, textTransform: 'uppercase' }}>
                  Attached Additional Costs Receipt (Tap to Zoom):
                </Text>
                <TouchableOpacity
                  onPress={() => setBillModalVisible(true)}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <View style={{ position: 'relative' }}>
                    <Image
                      source={{ uri: order.additionalCostPhotoUri }}
                      style={{
                        width: 90,
                        height: 90,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: Neutral.black,
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        right: 4,
                        bottom: 4,
                        backgroundColor: Neutral.black,
                        padding: 3,
                        borderRadius: 4,
                      }}
                    >
                      <ZoomIn size={12} color={Neutral.white} />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* Bottom Jagged Perforation Teeth */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              marginTop: -4,
              zIndex: 2,
              paddingHorizontal: 8,
            }}
          >
            {[...Array(14)].map((_, i) => (
              <View
                key={i}
                style={{
                  width: 14,
                  height: 10,
                  backgroundColor: Canvas.purple,
                  transform: [{ rotate: '45deg' }],
                  borderTopWidth: 3,
                  borderLeftWidth: 3,
                  borderColor: Neutral.black,
                }}
              />
            ))}
          </View>
        </View>

        {/* Chunky 5-Star Rating Selector */}
        <BrutalCard backgroundColor="#FFFFFF">
          <View style={{ padding: 18, gap: 14 }}>
            <Text style={{ fontWeight: '900', fontSize: 15, textTransform: 'uppercase' }}>
              Rate Your Task Boy
            </Text>

            {/* Chunky Star Buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={{
                    backgroundColor: star <= rating ? '#FEF08A' : '#F3F4F6',
                    borderWidth: 3,
                    borderColor: Neutral.black,
                    padding: 10,
                    borderRadius: 12,
                  }}
                >
                  <Star
                    size={28}
                    color={Neutral.black}
                    fill={star <= rating ? '#EAB308' : 'none'}
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Review Comment Box */}
            <TextInput
              placeholder="Leave feedback on communication, speed, or handling..."
              placeholderTextColor="#9CA3AF"
              value={review}
              onChangeText={setReview}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: '#F9FAFB',
                borderWidth: 2,
                borderColor: Neutral.black,
                borderRadius: 12,
                padding: 12,
                fontWeight: '700',
                fontSize: 13,
                minHeight: 60,
              }}
            />

            <BrutalButton
              label={rated ? 'Update Rating & Review' : 'Save Rating & Feedback'}
              color={CTA.lime}
              fullWidth
              onPress={handleSaveRating}
            />
          </View>
        </BrutalCard>

        {/* Back to Dashboard Button */}
        <BrutalButton
          label="Return to Dashboard"
          color={Neutral.white}
          fullWidth
          size="lg"
          onPress={() => navigation.goBack()}
          style={{ marginBottom: 20 }}
        />
      </KeyboardAwareScrollView>

      {/* Additional Costs Photo Full-Screen Modal */}
      {order.additionalCostPhotoUri ? (
        <Modal
          visible={billModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setBillModalVisible(false)}
        >
          <Pressable
            onPress={() => setBillModalVisible(false)}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.85)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <View
              style={{
                width: '100%',
                maxHeight: '80%',
                backgroundColor: Card.cream,
                borderRadius: 16,
                borderWidth: 4,
                borderColor: Neutral.black,
                padding: 16,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                  Original Additional Costs Receipt
                </Text>
                <TouchableOpacity
                  onPress={() => setBillModalVisible(false)}
                  style={{
                    backgroundColor: Neutral.black,
                    padding: 6,
                    borderRadius: 999,
                  }}
                >
                  <X size={16} color={Neutral.white} />
                </TouchableOpacity>
              </View>

              <Image
                source={{ uri: order.additionalCostPhotoUri }}
                style={{
                  width: '100%',
                  height: 320,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: Neutral.black,
                }}
                resizeMode="contain"
              />

              <Text style={{ fontWeight: '700', fontSize: 13, textAlign: 'center', color: '#374151' }}>
                Additional Costs: {formatRupees(order.additionalCosts ?? 0)}
              </Text>
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </KeyboardAvoidingView>
  );
}
