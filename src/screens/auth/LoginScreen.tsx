import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BrutalBadge, BrutalButton, BrutalCard, BrutalInput } from '../../components';
import { Canvas, CTA, Card, Neutral } from '../../theme';
import { useStore } from '../../store';

export function LoginScreen() {
  const login = useStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (userEmail = email, userPassword = password) => {
    setError(null);
    if (!userEmail || !userPassword) {
      setError('Please fill in both email and password');
      return;
    }
    const user = login(userEmail, userPassword);
    if (!user) {
      setError('Invalid credentials. Check demo accounts below.');
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleLogin(demoEmail, demoPass);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: Canvas.purple }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 20,
          gap: 20,
        }}
        keyboardShouldPersistTaps="never"
      >
        {/* Brand Title */}
        <View style={{ alignItems: 'center', marginVertical: 12 }}>
          <View
            style={{
              backgroundColor: CTA.lime,
              borderWidth: 4,
              borderColor: Neutral.black,
              paddingHorizontal: 20,
              paddingVertical: 8,
              transform: [{ rotate: '-2deg' }],
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontWeight: '900',
                fontSize: 40,
                color: Neutral.black,
                textTransform: 'uppercase',
                letterSpacing: -1.5,
              }}
            >
              TASKGO
            </Text>
          </View>
          <Text
            style={{
              fontWeight: '900',
              fontSize: 16,
              color: Neutral.white,
              textTransform: 'uppercase',
              letterSpacing: -0.5,
              textAlign: 'center',
            }}
          >
            Hyperlocal Errand Runner · Kozhikode
          </Text>
        </View>

        {/* Login Card */}
        <BrutalCard backgroundColor={Card.cream}>
          <View style={{ padding: 22, gap: 16 }}>
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
                Sign In
              </Text>
              <BrutalBadge label="Demo Auth" color={CTA.violet} />
            </View>

            {error ? (
              <View
                style={{
                  backgroundColor: '#FEE2E2',
                  borderWidth: 3,
                  borderColor: '#DC2626',
                  borderRadius: 12,
                  padding: 10,
                }}
              >
                <Text
                  style={{
                    fontWeight: '900',
                    fontSize: 13,
                    color: '#DC2626',
                    textTransform: 'uppercase',
                  }}
                >
                  {error}
                </Text>
              </View>
            ) : null}

            <BrutalInput
              label="Email Address"
              placeholder="e.g. customer@taskgo.in"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (error) setError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <BrutalInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (error) setError(null);
              }}
              secureTextEntry
            />

            <BrutalButton
              label="Enter App"
              fullWidth
              size="lg"
              color={CTA.lime}
              onPress={() => handleLogin()}
              style={{ marginTop: 4 }}
            />
          </View>
        </BrutalCard>

        {/* Quick Demo Login Chips */}
        <BrutalCard backgroundColor="#FFFFFF">
          <View style={{ padding: 18, gap: 12 }}>
            <Text
              style={{
                fontWeight: '900',
                fontSize: 14,
                color: Neutral.black,
                textTransform: 'uppercase',
                letterSpacing: -0.3,
              }}
            >
              ⚡ Quick Demo Login (One-Tap)
            </Text>

            <View style={{ gap: 10 }}>
              {/* Customer chip */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleQuickLogin('customer@taskgo.in', 'customer123')}
                style={{
                  backgroundColor: '#EDE9FE',
                  borderWidth: 3,
                  borderColor: Neutral.black,
                  borderRadius: 9999,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <BrutalBadge label="Customer" color="#8B5CF6" />
                  <Text style={{ fontWeight: '900', fontSize: 13, color: Neutral.black }}>
                    Arjun Menon
                  </Text>
                </View>
                <Text style={{ fontWeight: '900', fontSize: 12, color: '#6B7280' }}>
                  Tap →
                </Text>
              </TouchableOpacity>

              {/* Task Boy chip */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleQuickLogin('runner@taskgo.in', 'runner123')}
                style={{
                  backgroundColor: '#FFEDD5',
                  borderWidth: 3,
                  borderColor: Neutral.black,
                  borderRadius: 9999,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <BrutalBadge label="Task Boy" color="#F97316" />
                  <Text style={{ fontWeight: '900', fontSize: 13, color: Neutral.black }}>
                    Rahul Das
                  </Text>
                </View>
                <Text style={{ fontWeight: '900', fontSize: 12, color: '#6B7280' }}>
                  Tap →
                </Text>
              </TouchableOpacity>

              {/* Admin chip */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleQuickLogin('admin@taskgo.in', 'admin123')}
                style={{
                  backgroundColor: '#FCE7F3',
                  borderWidth: 3,
                  borderColor: Neutral.black,
                  borderRadius: 9999,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <BrutalBadge label="Admin" color="#EC4899" />
                  <Text style={{ fontWeight: '900', fontSize: 13, color: Neutral.black }}>
                    Priya Nair (Dual Mode)
                  </Text>
                </View>
                <Text style={{ fontWeight: '900', fontSize: 12, color: '#6B7280' }}>
                  Tap →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BrutalCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

