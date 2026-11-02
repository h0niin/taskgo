import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  BrutalBadge,
  BrutalButton,
  BrutalCard,
  BrutalInput,
  KeyboardAwareScrollView,
} from '../../components';
import { Canvas, Card, CTA, Neutral } from '../../theme';
import { ORDER_CATEGORIES } from '../../data/seed';
import { useStore } from '../../store';
import { Plus, Trash2, Search, MapPin, Camera } from 'lucide-react-native';

const MAX_ATTACHMENTS = 3;

interface StopDraft {
  id: string;
  type: 'PICKUP' | 'DROPOFF' | 'STOP';
  address: string;
  landmark: string;
  contactName: string;
  contactPhone: string;
  lat?: number;
  lng?: number;
}

export function CreateOrderScreen({ navigation }: any) {
  const createOrder = useStore((s) => s.createOrder);

  // Category state
  const [category, setCategory] = useState<string>('');
  const [customCategory, setCustomCategory] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // Location chain starting with Pickup + Dropoff
  const [stops, setStops] = useState<StopDraft[]>([
    {
      id: '1',
      type: 'PICKUP',
      address: '',
      landmark: '',
      contactName: '',
      contactPhone: '',
    },
    {
      id: '2',
      type: 'DROPOFF',
      address: '',
      landmark: '',
      contactName: '',
      contactPhone: '',
    },
  ]);

  // OSM location search state
  const [locationSuggestions, setLocationSuggestions] = useState<{[key: string]: Array<{name: string, lat: number, lng: number}>}>({});
  const [locationSearchLoading, setLocationSearchLoading] = useState<{[key: string]: boolean}>({});

  // Multiline special instructions
  const [instructions, setInstructions] = useState('');
  const [loadWeightKg, setLoadWeightKg] = useState('');
  const [estHours, setEstHours] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pickAttachment = async (source: 'camera' | 'gallery') => {
    if (attachments.length >= MAX_ATTACHMENTS) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} photos.`);
      return;
    }

    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        alert('Camera permission needed. Use Gallery instead.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert('Gallery permission required to pick images.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_ATTACHMENTS - attachments.length,
        quality: 0.7,
      });
    }

    const uris = result.assets?.map((asset) => asset.uri) ?? [];
    if (!result.canceled && uris.length > 0) {
      setAttachments((prev) => [...prev, ...uris].slice(0, MAX_ATTACHMENTS));
      setError(null);
    }
  };

  const addStop = () => {
    const nextIndex = stops.length + 1;
    const newStop: StopDraft = {
      id: Date.now().toString(),
      type: 'STOP',
      address: '',
      landmark: '',
      contactName: '',
      contactPhone: '',
    };
    // Insert before the last stop (which is the final dropoff)
    const updated = [...stops];
    updated.splice(updated.length - 1, 0, newStop);
    setStops(updated);
  };

  const removeStop = (id: string) => {
    if (stops.length <= 2) {
      alert('An errand must have at least a pickup and a dropoff stop.');
      return;
    }
    setStops(stops.filter((s) => s.id !== id));
  };

  const updateStop = (id: string, field: keyof StopDraft, value: string | number) => {
    setStops((currentStops) =>
      currentStops.map((s) => (s.id === id ? { ...s, [field]: value as any } : s)),
    );
  };

  // Debounced OSM search when address text changes
  const debounceAddressSearch = (id: string, text: string) => {
    if (!text.trim()) { setLocationSuggestions((p: any) => ({ ...p, [id]: [] })); return; }
    const t = setTimeout(() => { fetchOSM(id, text); }, 400);
  };

  const selectLocation = (id: string, suggestion: { name: string, lat: number, lng: number }) => {
    updateStop(id, 'address', suggestion.name);
    updateStop(id, 'lat', suggestion.lat);
    updateStop(id, 'lng', suggestion.lng);
    setLocationSuggestions((p: any) => ({ ...p, [id]: [] }));
  };

  const fetchOSM = async (id: string, query: string) => {
    if (!query.trim()) { setLocationSuggestions((p: any) => ({ ...p, [id]: [] })); return; }
    setLocationSearchLoading((p: any) => ({ ...p, [id]: true }));
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=4`);
      const data = await res.json();
      const hits = (data.features || []).map((f: any) => ({
        name: f.properties?.name || f.properties?.label || query,
        lat: f.geometry?.coordinates?.[1] || 0,
        lng: f.geometry?.coordinates?.[0] || 0,
      }));
      setLocationSuggestions((p: any) => ({ ...p, [id]: hits }));
    } catch { setLocationSuggestions((p: any) => ({ ...p, [id]: [] })); }
    setLocationSearchLoading((p: any) => ({ ...p, [id]: false }));
  };

  const handleSubmit = () => {
    setError(null);

    if (!category.trim()) {
      setError('Please select a category.');
      return;
    }

    if (category === 'Custom Task' && !customCategory.trim()) {
      setError('Please describe the custom task.');
      return;
    }

    // Validate stops
    for (let i = 0; i < stops.length; i++) {
      if (!stops[i].address.trim()) {
        setError(`Please enter the address for Stop #${i + 1}`);
        return;
      }
    }

    const effectiveCategory =
      category === 'Custom Task' && customCategory.trim()
        ? customCategory.trim()
        : category;

    const newOrder = createOrder({
      category: effectiveCategory,
      stops: stops.map((s) => ({
        type: s.type,
        address: s.address.trim(),
        landmark: s.landmark.trim() || undefined,
        contactName: s.contactName.trim() || undefined,
        contactPhone: s.contactPhone.trim() || undefined,
        lat: s.lat,
        lng: s.lng,
      })),
      edgeCaseInstructions: instructions.trim(),
      attachments,
      distanceKm: Math.round((2.0 + stops.length * 1.2) * 10) / 10,
      loadWeightKg: loadWeightKg.trim() ? parseFloat(loadWeightKg) : undefined,
      estHours: estHours.trim() ? parseFloat(estHours) : undefined,
    });

    // Reset and navigate to order detail or dashboard
    setAttachments([]);
    navigation.navigate('OrderDetail', { orderId: newOrder.id });
  };

  const filteredCategories = ORDER_CATEGORIES.filter((c) =>
    c.toLowerCase().includes(categorySearchQuery.toLowerCase()),
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={{ flex: 1, backgroundColor: Canvas.purple }}
    >
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
      {/* Top Banner */}
      <View
        style={{
          backgroundColor: Card.cream,
          borderWidth: 4,
          borderColor: Neutral.black,
          padding: 16,
          borderRadius: 20,
          gap: 4,
        }}
      >
        <Text
          style={{
            fontWeight: '900',
            fontSize: 24,
            color: Neutral.black,
            textTransform: 'uppercase',
            letterSpacing: -1,
          }}
        >
          Post An Errand
        </Text>
        <Text style={{ fontWeight: '700', fontSize: 13, color: '#4B5563' }}>
          No upfront price. Local Taskers will submit competitive quotes.
        </Text>
      </View>

      {error ? (
        <View
          style={{
            backgroundColor: '#FEE2E2',
            borderWidth: 3,
            borderColor: '#DC2626',
            borderRadius: 12,
            padding: 12,
          }}
        >
          <Text style={{ fontWeight: '900', fontSize: 13, color: '#DC2626' }}>
            ⚠️ {error}
          </Text>
        </View>
      ) : null}

      {/* Category Selection Card */}
      <BrutalCard backgroundColor="#FFFFFF">
        <View style={{ padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
              Category: <Text style={{ color: '#8B5CF6' }}>{category || 'Select category *'}</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setCategoryModalVisible(true)}
              style={{
                backgroundColor: Card.cream,
                borderWidth: 2,
                borderColor: Neutral.black,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase' }}>
                Change ▾
              </Text>
            </TouchableOpacity>
          </View>

          {category === 'Custom Task' && (
            <BrutalInput
              label="Custom Task Description"
              placeholder="e.g. Queue at KSEB office"
              value={customCategory}
              onChangeText={setCustomCategory}
            />
          )}
        </View>
      </BrutalCard>

      {/* Dynamic Location Stops Chain */}
      <BrutalCard backgroundColor={Card.cream}>
        <View style={{ padding: 18, gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                Route Checkpoints
              </Text>
              <Text style={{ fontWeight: '700', fontSize: 12, color: '#6B7280' }}>
                Add intermediate pickup/deliver stops
              </Text>
            </View>
            <BrutalBadge label={`${stops.length} STOPS`} color={Neutral.black} />
          </View>

          {/* Stops List */}
          <View style={{ gap: 14 }}>
            {stops.map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === stops.length - 1;
              const stopTitle = isFirst
                ? '📍 Stop 1 (Pickup)'
                : isLast
                ? `🏁 Stop ${index + 1} (Final Dropoff)`
                : `🔄 Stop ${index + 1} (Intermediate)`;

              return (
                <View
                  key={stop.id}
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
                      {stopTitle}
                    </Text>
                    {!isFirst && !isLast && (
                      <TouchableOpacity
                        onPress={() => removeStop(stop.id)}
                        style={{ padding: 4 }}
                      >
                        <Trash2 size={16} color="#DC2626" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Address + OSM Search */}
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <View style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        borderWidth: 2,
                        borderColor: Neutral.black,
                        borderRadius: 14,
                        paddingHorizontal: 10,
                      }}>
                        <Search size={18} color="#6B7280" />
                        <TextInput
                          placeholder="Search any address or place..."
                          placeholderTextColor="#9CA3AF"
                          value={stop.address}
                          onChangeText={(val) => {
                            updateStop(stop.id, 'address', val);
                            if (val.trim()) debounceAddressSearch(stop.id, val);
                            else setLocationSuggestions((p) => ({ ...p, [stop.id]: [] }));
                          }}
                          style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontWeight: '700', fontSize: 13, color: Neutral.black }}
                        />
                      </View>
                      <TouchableOpacity
                        onPress={() => selectLocation(stop.id, {
                          name: 'NIT Calicut',
                          lat: 11.3196773,
                          lng: 75.9316848,
                        })}
                        style={{
                          width: 44, height: 44,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: '#FEF08A',
                          borderWidth: 2, borderColor: Neutral.black,
                          borderRadius: 12,
                        }}
                      >
                        <MapPin size={20} color={Neutral.black} />
                      </TouchableOpacity>
                    </View>
                    {(locationSuggestions[stop.id]?.length ?? 0) > 0 && (
                      <View style={{ borderWidth: 2, borderColor: Neutral.black, borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                        {locationSuggestions[stop.id].map((s, i) => (
                          <TouchableOpacity key={`${s.name}-${i}`} onPress={() => selectLocation(stop.id, s)} style={{ padding: 10, borderBottomWidth: i === (locationSuggestions[stop.id]?.length ?? 0) - 1 ? 0 : 1, borderBottomColor: '#D1D5DB', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MapPin size={14} color="#7C3AED" />
                            <Text style={{ fontWeight: '700', fontSize: 12, color: Neutral.black }}>{s.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Landmark & Contact stacked below */}
                  <View style={{ gap: 6 }}>
                    <TextInput
                      placeholder="Landmark (Optional)"
                      placeholderTextColor="#9CA3AF"
                      value={stop.landmark}
                      onChangeText={(val) => updateStop(stop.id, 'landmark', val)}
                      style={{ backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: Neutral.black, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, fontWeight: '700', fontSize: 12, color: Neutral.black }}
                    />
                    <TextInput
                      placeholder="Contact Person (Optional)"
                      placeholderTextColor="#9CA3AF"
                      value={stop.contactName}
                      onChangeText={(val) => updateStop(stop.id, 'contactName', val)}
                      style={{ backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: Neutral.black, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, fontWeight: '700', fontSize: 12, color: Neutral.black }}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Add Stop Button */}
          <BrutalButton
            label="+ Add Stop / Location"
            color={CTA.violet}
            fullWidth
            size="sm"
            onPress={addStop}
          />
        </View>
      </BrutalCard>

      {/* Special Instructions */}
      <BrutalCard backgroundColor={Card.cream}>
        <View style={{ padding: 18, gap: 10 }}>
          <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
            Special Instructions (Optional)
          </Text>
          <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563' }}>
            What should the runner do if the shop is closed, item out of stock, or contact unreachable?
          </Text>

          <TextInput
            multiline
            numberOfLines={4}
            placeholder="e.g. If specific brand unavailable, call me before replacing. Keep all receipts for additional costs."
            placeholderTextColor="#9CA3AF"
            value={instructions}
            onChangeText={(t) => {
              setInstructions(t);
              if (error) setError(null);
            }}
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 3,
              borderColor: Neutral.black,
              borderRadius: 16,
              padding: 14,
              fontWeight: '700',
              fontSize: 14,
              color: Neutral.black,
              minHeight: 90,
              textAlignVertical: 'top',
            }}
          />
        </View>
      </BrutalCard>

      {/* Load Weight & Estimated Time */}
      <BrutalCard backgroundColor={Card.cream}>
        <View style={{ padding: 18, gap: 10 }}>
          <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
            Load & Time Estimate (Optional)
          </Text>
          <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563' }}>
            Helps Taskers price the errand fairly.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <BrutalInput
              label="Load Weight (kg)"
              placeholder="e.g. 5"
              value={loadWeightKg}
              onChangeText={setLoadWeightKg}
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
            <BrutalInput
              label="Est. Time (hours)"
              placeholder="e.g. 1"
              value={estHours}
              onChangeText={setEstHours}
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </BrutalCard>

      {/* Optional Attachments */}
      <BrutalCard backgroundColor={Card.cream}>
        <View style={{ padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
              Attachments (Optional)
            </Text>
            <BrutalBadge label={`${attachments.length}/${MAX_ATTACHMENTS}`} color={Neutral.black} />
          </View>
          <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563' }}>
            Add photos or screenshots to help the Tasker understand the errand.
          </Text>

          {attachments.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {attachments.map((uri, index) => (
                <View key={`${uri}-${index}`} style={{ width: 92, height: 92 }}>
                  <Image
                    source={{ uri }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: Neutral.black,
                    }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Remove attachment ${index + 1}`}
                    onPress={() =>
                      setAttachments((prev) => prev.filter((_, i) => i !== index))
                    }
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      backgroundColor: '#DC2626',
                      borderWidth: 2,
                      borderColor: Neutral.black,
                      borderRadius: 999,
                      padding: 4,
                    }}
                  >
                    <Trash2 size={12} color={Neutral.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <BrutalButton
              label="Camera"
              color="#EDE9FE"
              size="sm"
              leftIcon={<Camera size={16} color={Neutral.black} />}
              onPress={() => pickAttachment('camera')}
              style={{ flex: 1 }}
              fullWidth
            />
            <BrutalButton
              label="Gallery"
              color="#F3F4F6"
              size="sm"
              leftIcon={<Camera size={16} color={Neutral.black} />}
              onPress={() => pickAttachment('gallery')}
              style={{ flex: 1 }}
              fullWidth
            />
          </View>
        </View>
      </BrutalCard>

      {/* Neon Lime Full Width CTA — No Price Field (Section 8) */}
      <BrutalButton
        label="SUBMIT TASKGO ERRAND"
        color={CTA.lime}
        fullWidth
        size="lg"
        onPress={handleSubmit}
        style={{ marginBottom: 24 }}
      />

      {/* Category Search Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <Pressable
            onPress={() => setCategoryModalVisible(false)}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: Card.cream,
                borderWidth: 4,
                borderColor: Neutral.black,
                borderRadius: 20,
                padding: 20,
                gap: 16,
                maxHeight: '80%',
              }}
            >
              <KeyboardAwareScrollView
                style={{ maxHeight: '100%', flexShrink: 1 }}
                contentContainerStyle={{ gap: 16 }}
              >
                <Text style={{ fontWeight: '900', fontSize: 18, textTransform: 'uppercase' }}>
                  Select Errand Category
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    borderWidth: 2,
                    borderColor: Neutral.black,
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    gap: 8,
                  }}
                >
                  <Search size={18} color="#6B7280" />
                  <TextInput
                    placeholder="Search categories..."
                    placeholderTextColor="#9CA3AF"
                    value={categorySearchQuery}
                    onChangeText={setCategorySearchQuery}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      fontWeight: '700',
                      fontSize: 14,
                      color: Neutral.black,
                    }}
                  />
                </View>

                <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                  <View style={{ gap: 8 }}>
                    {filteredCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => {
                          setCategory(cat);
                          setCategoryModalVisible(false);
                        }}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 14,
                          backgroundColor: cat === category ? '#FEF08A' : '#FFFFFF',
                          borderWidth: 2,
                          borderColor: Neutral.black,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={{ fontWeight: '900', fontSize: 14 }}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <BrutalButton
                  label="Close"
                  color={Neutral.white}
                  fullWidth
                  size="sm"
                  onPress={() => setCategoryModalVisible(false)}
                />
              </KeyboardAwareScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
}
