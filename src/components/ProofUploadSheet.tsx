import React, { useState } from 'react';
import {
  Image,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BottomSheet } from './BottomSheet';
import { BrutalButton } from './BrutalButton';
import { BrutalBadge } from './BrutalBadge';
import { BidDetailsModal } from './BidDetailsModal';
import { CTA, Neutral } from '../theme';
import { Camera, Image as ImageIcon, Receipt, CheckCircle, AlertCircle } from 'lucide-react-native';

interface ProofUploadSheetProps {
  visible: boolean;
  orderId: string;
  onClose: () => void;
  onSubmit: (data: {
    completionPhotoUri: string;
    billPhotoUri?: string;
    storeBillAmount?: number;
  }) => void;
}

export function ProofUploadSheet({
  visible,
  orderId,
  onClose,
  onSubmit,
}: ProofUploadSheetProps) {
  const [completionUri, setCompletionUri] = useState<string | null>(null);
  const [purchaseMade, setPurchaseMade] = useState(false);
  const [billUri, setBillUri] = useState<string | null>(null);
  const [billAmount, setBillAmount] = useState('');
  const [billAmountModalVisible, setBillAmountModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async (
    target: 'completion' | 'bill',
    source: 'camera' | 'gallery',
  ) => {
    setError(null);
    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        // Fallback to gallery if camera permission not granted or unavailable in environment
        alert('Camera permission needed. Opening gallery fallback.');
        const galleryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!galleryPerm.granted) return;
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.7,
        });
      } else {
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.7,
        });
      }
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert('Gallery permission required to pick images.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      if (target === 'completion') {
        setCompletionUri(uri);
      } else {
        setBillUri(uri);
      }
    }
  };

  const handleSubmit = () => {
    setError(null);

    // Rule 1: Handover / Completion photo is required
    if (!completionUri) {
      setError('Photo of completion / delivered item is required.');
      return;
    }

    // Rule 2: If purchase made, photo of bill and exact bill amount (> 0) required
    let parsedBill = 0;
    if (purchaseMade) {
      if (!billUri) {
        setError('Store bill photo is required when local purchase was made.');
        return;
      }
      parsedBill = parseInt(billAmount, 10);
      if (isNaN(parsedBill) || parsedBill <= 0) {
        setError('Please enter a valid bill amount greater than ₹0.');
        return;
      }
    }

    onSubmit({
      completionPhotoUri: completionUri,
      billPhotoUri: purchaseMade ? (billUri ?? undefined) : undefined,
      storeBillAmount: purchaseMade ? parsedBill : undefined,
    });

    // Reset state
    setCompletionUri(null);
    setPurchaseMade(false);
    setBillUri(null);
    setBillAmount('');
    onClose();
  };

  return (
    <>
    <BottomSheet
      visible={visible && !billAmountModalVisible}
      onClose={onClose}
      title="SUBMIT PROOF OF COMPLETION"
      snapHeight={580}
    >
      <View style={{ gap: 16 }}>
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

        {/* 1. Completion / Handover Photo */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 3,
            borderColor: Neutral.black,
            borderRadius: 16,
            padding: 14,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>
              1. Completion Photo (Required)
            </Text>
            {completionUri ? (
              <BrutalBadge label="PHOTO ATTACHED" color="#10B981" />
            ) : (
              <BrutalBadge label="MANDATORY" color="#EF4444" />
            )}
          </View>

          <Text style={{ fontWeight: '700', fontSize: 11, color: '#4B5563' }}>
            Photo of delivered package at drop-off or recipient handover.
          </Text>

          {completionUri ? (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Image
                source={{ uri: completionUri }}
                style={{
                  width: '100%',
                  height: 140,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: Neutral.black,
                }}
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => setCompletionUri(null)}
                style={{ alignSelf: 'flex-end' }}
              >
                <Text style={{ fontWeight: '900', fontSize: 11, color: '#DC2626' }}>
                  Remove / Retake
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => pickImage('completion', 'camera')}
                style={{
                  flex: 1,
                  backgroundColor: '#FEF08A',
                  borderWidth: 2,
                  borderColor: Neutral.black,
                  borderRadius: 12,
                  padding: 12,
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Camera size={20} color={Neutral.black} />
                <Text style={{ fontWeight: '900', fontSize: 12, textTransform: 'uppercase' }}>
                  Take Camera Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => pickImage('completion', 'gallery')}
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  borderWidth: 2,
                  borderColor: Neutral.black,
                  borderRadius: 12,
                  padding: 12,
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <ImageIcon size={20} color={Neutral.black} />
                <Text style={{ fontWeight: '900', fontSize: 12, textTransform: 'uppercase' }}>
                  Pick from Gallery
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 2. Purchase Made Toggle */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 3,
            borderColor: Neutral.black,
            borderRadius: 16,
            padding: 14,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>
                2. Local Purchase Made?
              </Text>
              <Text style={{ fontWeight: '700', fontSize: 11, color: '#4B5563' }}>
                Toggle on if you bought items and need bill reimbursement.
              </Text>
            </View>
            <Switch
              value={purchaseMade}
              onValueChange={setPurchaseMade}
              trackColor={{ false: '#9CA3AF', true: Neutral.black }}
              thumbColor={purchaseMade ? CTA.lime : '#F3F4F6'}
            />
          </View>

          {/* Conditional store bill inputs */}
          {purchaseMade && (
            <View style={{ gap: 10, borderTopWidth: 2, borderColor: '#E5E7EB', paddingTop: 10 }}>
              <View style={{ gap: 4 }}>
                <Text style={{ fontWeight: '700', fontSize: 13, textTransform: 'uppercase' }}>
                  Exact Bill Amount (₹) *
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setBillAmountModalVisible(true)}
                  style={{ backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: Neutral.black, borderRadius: 999, padding: 14 }}
                >
                  <Text style={{ fontWeight: '700', fontSize: 15, color: billAmount ? Neutral.black : '#9CA3AF' }}>
                    {billAmount ? `₹${billAmount}` : 'Tap to enter bill amount'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', color: Neutral.black }}>
                Store Receipt Photo *
              </Text>

              {billUri ? (
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Image
                    source={{ uri: billUri }}
                    style={{
                      width: '100%',
                      height: 120,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: Neutral.black,
                    }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => setBillUri(null)}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    <Text style={{ fontWeight: '900', fontSize: 11, color: '#DC2626' }}>
                      Remove / Retake
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => pickImage('bill', 'camera')}
                    style={{
                      flex: 1,
                      backgroundColor: '#EDE9FE',
                      borderWidth: 2,
                      borderColor: Neutral.black,
                      borderRadius: 12,
                      padding: 10,
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Camera size={18} color={Neutral.black} />
                    <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase' }}>
                      Camera Bill
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => pickImage('bill', 'gallery')}
                    style={{
                      flex: 1,
                      backgroundColor: '#F3F4F6',
                      borderWidth: 2,
                      borderColor: Neutral.black,
                      borderRadius: 12,
                      padding: 10,
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Receipt size={18} color={Neutral.black} />
                    <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase' }}>
                      Gallery Bill
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Submit Proof Button */}
        <BrutalButton
          label="SUBMIT PROOF FOR VERIFICATION"
          color={CTA.lime}
          fullWidth
          size="lg"
          onPress={handleSubmit}
          style={{ marginBottom: 16 }}
        />
      </View>
    </BottomSheet>
    <BidDetailsModal
      key={billAmountModalVisible ? 'bill-open' : 'bill-closed'}
      visible={billAmountModalVisible}
      amount={billAmount}
      note=""
      showNote={false}
      title="Enter Local Purchase Bill Amount"
      submitLabel="Use Amount"
      onCancel={() => setBillAmountModalVisible(false)}
      onSubmit={(amount) => {
        setBillAmount(amount);
        setBillAmountModalVisible(false);
      }}
    />
    </>
  );
}
