import React, { useState } from 'react';
import {
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
import {
  BrutalBadge,
  BrutalButton,
  BrutalCard,
  BrutalInput,
} from '../../components';
import { Canvas, Card, CTA, Neutral } from '../../theme';
import { ORDER_CATEGORIES } from '../../data/seed';
import { useStore } from '../../store';
import { Plus, Trash2, Search, MapPin } from 'lucide-react-native';

const KOZHIKODE_LOCALITIES = [
  'Mavoor Road',
  'Palayam',
  'Beach Road',
  'Medical College',
  'Nadakkavu',
  'Mananchira',
  'Feroke',
  'Kallai',
];

interface StopDraft {
  id: string;
  type: 'PICKUP' | 'DROPOFF' | 'STOP';
  address: string;
  landmark: string;
  contactName: string;
  contactPhone: string;
}

export function CreateOrderScreen({ navigation }: any) {
  const createOrder = useStore((s) => s.createOrder);

  // Category state
  const [category, setCategory] = useState<string>(ORDER_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // Location chain starting with Pickup + Dropoff
  const [stops, setStops] = useState<StopDraft[]>([
    {
      id: '1',
      type: 'PICKUP',
      address: 'Mavoor Road, Kozhikode',
      landmark: 'Near Focus Mall',
      contactName: 'Shop Manager',
      contactPhone: '9876543210',
    },
    {
      id: '2',
      type: 'DROPOFF',
      address: 'Beach Road, Kozhikode',
      landmark: 'Sea View Apartment 3B',
      contactName: 'Arjun Menon',
      contactPhone: '9876543210',
    },
  ]);

  // Multiline edge-case instructions
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  const updateStop = (id: string, field: keyof StopDraft, value: string) => {
    setStops(
      stops.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const handleSubmit = () => {
    setError(null);

    // Validate stops
    for (let i = 0; i < stops.length; i++) {
      if (!stops[i].address.trim()) {
        setError(`Please enter the address for Stop #${i + 1}`);
        return;
      }
    }

    // Validate instructions
    if (!instructions.trim()) {
      setError('Edge-case instructions are required (e.g. what to do if shop is closed or items unavailable).');
      return;
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
      })),
      edgeCaseInstructions: instructions.trim(),
      distanceKm: Math.round((2.0 + stops.length * 1.2) * 10) / 10,
    });

    // Reset and navigate to order detail or dashboard
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
      <ScrollView
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
          No upfront price. Local Task Boys will submit competitive quotes.
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
              Category: <Text style={{ color: '#8B5CF6' }}>{category}</Text>
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

                  <BrutalInput
                    placeholder="Address in Kozhikode (e.g. Nadakkavu)"
                    value={stop.address}
                    onChangeText={(val) => updateStop(stop.id, 'address', val)}
                  />

                  {/* Kozhikode Locality Quick Chips */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {KOZHIKODE_LOCALITIES.map((loc) => (
                      <TouchableOpacity
                        key={loc}
                        onPress={() => updateStop(stop.id, 'address', `${loc}, Kozhikode`)}
                        style={{
                          backgroundColor: '#FEF08A',
                          borderWidth: 1.5,
                          borderColor: Neutral.black,
                          borderRadius: 999,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}
                      >
                        <Text style={{ fontWeight: '800', fontSize: 10, color: Neutral.black }}>
                          + {loc}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        placeholder="Landmark (Optional)"
                        placeholderTextColor="#9CA3AF"
                        value={stop.landmark}
                        onChangeText={(val) => updateStop(stop.id, 'landmark', val)}
                        style={{
                          backgroundColor: '#F3F4F6',
                          borderWidth: 2,
                          borderColor: Neutral.black,
                          borderRadius: 999,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          fontWeight: '700',
                          fontSize: 12,
                          color: Neutral.black,
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        placeholder="Contact Person (Optional)"
                        placeholderTextColor="#9CA3AF"
                        value={stop.contactName}
                        onChangeText={(val) => updateStop(stop.id, 'contactName', val)}
                        style={{
                          backgroundColor: '#F3F4F6',
                          borderWidth: 2,
                          borderColor: Neutral.black,
                          borderRadius: 999,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          fontWeight: '700',
                          fontSize: 12,
                          color: Neutral.black,
                        }}
                      />
                    </View>
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

      {/* Edge-Case Instructions */}
      <BrutalCard backgroundColor={Card.cream}>
        <View style={{ padding: 18, gap: 10 }}>
          <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
            Edge-Case Instructions (Required)
          </Text>
          <Text style={{ fontWeight: '700', fontSize: 12, color: '#4B5563' }}>
            What should the runner do if the shop is closed, item out of stock, or contact unreachable?
          </Text>

          <TextInput
            multiline
            numberOfLines={4}
            placeholder="e.g. If specific brand unavailable, call me before replacing. Keep all printed bills for reimbursement."
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
          </Pressable>
        </Pressable>
      </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
