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
    additionalCostPhotoUri?: string;
    additionalCosts?: number;
  }) => void;
}

export function ProofUploadSheet({
  visible,
  orderId,
  onClose,
  onSubmit,
}: ProofUploadSheetProps) {
  const [completionUri, setCompletionUri] = useState<string | null>(null);
  const [hasAdditionalCosts, setHasAdditionalCosts] = useState(false);
  const [costPhotoUri, setCostPhotoUri] = useState<string | null>(null);
  const [costAmount, setCostAmount] = useState('');
  const [costAmountModalVisible, setCostAmountModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async (
    target: 'completion' | 'cost',
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
        setCostPhotoUri(uri);
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

    // Rule 2: If additional costs were incurred, proof photo and exact amount (> 0) required
    let parsedCosts = 0;
    if (hasAdditionalCosts) {
      if (!costPhotoUri) {
        setError('Proof photo is required for additional costs.');
        return;
      }
      parsedCosts = parseInt(costAmount, 10);
      if (isNaN(parsedCosts) || parsedCosts <= 0) {
        setError('Please enter a valid additional cost amount greater than ₹0.');
        return;
      }
    }

    onSubmit({
      completionPhotoUri: completionUri,
      additionalCostPhotoUri: hasAdditionalCosts ? (costPhotoUri ?? undefined) : undefined,
      additionalCosts: hasAdditionalCosts ? parsedCosts : undefined,
    });

    // Reset state
    setCompletionUri(null);
    setHasAdditionalCosts(false);
    setCostPhotoUri(null);
    setCostAmount('');
    onClose();
  };

  return (
    <>
    <BottomSheet
      visible={visible && !costAmountModalVisible}
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

        {/* 2. Additional Costs Toggle */}
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
                2. Additional Costs Incurred?
              </Text>
              <Text style={{ fontWeight: '700', fontSize: 11, color: '#4B5563' }}>
                Toggle on if you paid for items, parking, fees, or anything else.
              </Text>
            </View>
            <Switch
              value={hasAdditionalCosts}
              onValueChange={setHasAdditionalCosts}
              trackColor={{ false: '#9CA3AF', true: Neutral.black }}
              thumbColor={hasAdditionalCosts ? CTA.lime : '#F3F4F6'}
            />
          </View>

          {/* Conditional additional cost inputs */}
          {hasAdditionalCosts && (
            <View style={{ gap: 10, borderTopWidth: 2, borderColor: '#E5E7EB', paddingTop: 10 }}>
              <View style={{ gap: 4 }}>
                <Text style={{ fontWeight: '700', fontSize: 13, textTransform: 'uppercase' }}>
                  Exact Additional Cost (₹) *
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setCostAmountModalVisible(true)}
                  style={{ backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: Neutral.black, borderRadius: 999, padding: 14 }}
                >
                  <Text style={{ fontWeight: '700', fontSize: 15, color: costAmount ? Neutral.black : '#9CA3AF' }}>
                    {costAmount ? `₹${costAmount}` : 'Tap to enter additional cost'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', color: Neutral.black }}>
                Proof Photo *
              </Text>

              {costPhotoUri ? (
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Image
                    source={{ uri: costPhotoUri }}
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
                    onPress={() => setCostPhotoUri(null)}
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
                    onPress={() => pickImage('cost', 'camera')}
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
                      Camera Photo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => pickImage('cost', 'gallery')}
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
                      Gallery Photo
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
      key={costAmountModalVisible ? 'cost-open' : 'cost-closed'}
      visible={costAmountModalVisible}
      amount={costAmount}
      note=""
      minAmount={0}
      showNote={false}
      title="Enter Additional Costs Amount"
      submitLabel="Use Amount"
      onCancel={() => setCostAmountModalVisible(false)}
      onSubmit={(amount) => {
        setCostAmount(amount);
        setCostAmountModalVisible(false);
      }}
    />
    </>
  );
}
