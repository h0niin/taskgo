import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BrutalBadge, BrutalButton, BrutalCard } from '../../components';
import { Canvas, Card, CTA, Neutral } from '../../theme';
import { useStore } from '../../store';
import { formatPhone } from '../../utils/format';

export function CustomerProfileScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);
  const simulatorEnabled = useStore((s) => s.simulatorEnabled);
  const toggleSimulator = useStore((s) => s.toggleSimulator);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Canvas.purple }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <BrutalCard backgroundColor={Card.cream}>
        <View style={{ padding: 20, gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              style={{
                fontWeight: '900',
                fontSize: 22,
                color: Neutral.black,
                textTransform: 'uppercase',
                letterSpacing: -0.5,
              }}
            >
              Account
            </Text>
            <BrutalBadge label={currentUser?.role ?? 'USER'} color="#8B5CF6" />
          </View>

          <View style={{ gap: 8 }}>
            <View>
              <Text style={{ fontWeight: '900', fontSize: 11, color: '#6B7280', textTransform: 'uppercase' }}>
                Full Name
              </Text>
              <Text style={{ fontWeight: '900', fontSize: 18, color: Neutral.black }}>
                {currentUser?.name}
              </Text>
            </View>

            <View>
              <Text style={{ fontWeight: '900', fontSize: 11, color: '#6B7280', textTransform: 'uppercase' }}>
                Email
              </Text>
              <Text style={{ fontWeight: '700', fontSize: 15, color: Neutral.black }}>
                {currentUser?.email}
              </Text>
            </View>

            <View>
              <Text style={{ fontWeight: '900', fontSize: 11, color: '#6B7280', textTransform: 'uppercase' }}>
                Mobile
              </Text>
              <Text style={{ fontWeight: '700', fontSize: 15, color: Neutral.black }}>
                {currentUser?.phone ? formatPhone(currentUser.phone) : '—'}
              </Text>
            </View>
          </View>
        </View>
      </BrutalCard>

      {/* Admin Simulator Switch (Section 12 of SPEC) */}
      {currentUser?.role === 'ADMIN' && (
        <BrutalCard backgroundColor={Card.lavender}>
          <View style={{ padding: 18, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                ⚡ Admin Simulator
              </Text>
              <BrutalBadge
                label={simulatorEnabled ? 'ENABLED' : 'DISABLED'}
                color={simulatorEnabled ? '#10B981' : '#EF4444'}
              />
            </View>
            <Text style={{ fontWeight: '700', fontSize: 12, color: '#374151' }}>
              When enabled, simulated runners bid and respond automatically to simulate real activity on 1 device.
            </Text>
            <BrutalButton
              label={simulatorEnabled ? 'Turn Simulator OFF' : 'Turn Simulator ON'}
              size="sm"
              color={simulatorEnabled ? '#EF4444' : CTA.lime}
              onPress={toggleSimulator}
            />
          </View>
        </BrutalCard>
      )}

      <BrutalButton
        label="Log Out"
        color="#EF4444"
        fullWidth
        size="lg"
        onPress={logout}
      />
    </ScrollView>
  );
}

