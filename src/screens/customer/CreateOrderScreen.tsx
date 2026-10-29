import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BrutalBadge, BrutalButton, BrutalCard, BrutalInput } from '../../components';
import { Canvas, Card, CTA, Neutral } from '../../theme';
import { ORDER_CATEGORIES } from '../../data/seed';
import { useStore } from '../../store';

export function CreateOrderScreen({ navigation }: any) {
  const createOrder = useStore((s) => s.createOrder);

  const [category, setCategory] = useState<string>(ORDER_CATEGORIES[0]);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleSubmit = () => {
    if (!pickup || !dropoff || !instructions) {
      alert('Please fill out pickup, dropoff, and instructions');
      return;
    }

    createOrder({
      category,
      stops: [
        { type: 'PICKUP', address: pickup },
        { type: 'DROPOFF', address: dropoff },
      ],
      edgeCaseInstructions: instructions,
      distanceKm: 2.5,
    });

    navigation.navigate('Dashboard');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Canvas.purple }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          backgroundColor: CTA.lime,
          borderWidth: 4,
          borderColor: Neutral.black,
          padding: 16,
          borderRadius: 20,
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
        <Text style={{ fontWeight: '700', fontSize: 13, marginTop: 4 }}>
          Task Boys around Kozhikode will place competitive bids on your request.
        </Text>
      </View>

      <BrutalCard backgroundColor={Card.cream}>
        <View style={{ padding: 18, gap: 14 }}>
          <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
            Errand Category
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ORDER_CATEGORIES.map((cat) => {
              const active = cat === category;
              return (
                <View key={cat}>
                  <BrutalBadge
                    label={cat}
                    color={active ? Neutral.black : '#FFFFFF'}
                    textColor={active ? Neutral.white : Neutral.black}
                    style={{ borderColor: Neutral.black }}
                  />
                </View>
              );
            })}
          </View>

          <BrutalInput
            label="Pickup Location"
            placeholder="e.g. Mavoor Road, near Baby Memorial"
            value={pickup}
            onChangeText={setPickup}
          />

          <BrutalInput
            label="Dropoff Location"
            placeholder="e.g. Beach Road, Kozhikode"
            value={dropoff}
            onChangeText={setDropoff}
          />

          <BrutalInput
            label="Errand Instructions (Required)"
            placeholder="Exact instructions, contact persons, item names..."
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={3}
            style={{ minHeight: 60 }}
          />

          <BrutalButton
            label="Submit TaskGo Errand"
            color={CTA.lime}
            fullWidth
            size="lg"
            onPress={handleSubmit}
            style={{ marginTop: 8 }}
          />
        </View>
      </BrutalCard>
    </ScrollView>
  );
}

