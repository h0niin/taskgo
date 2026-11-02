/**
 * AppHeader
 * ─────────────────────────────────────────────────────────────────────────────
 * Persistent header shown on every authenticated screen.
 *
 * Contains:
 *   • TaskGo wordmark (bold, uppercase)
 *   • User role badge (BrutalBadge)
 *   • [ Customer Mode ] ↔ [ Tasker Mode ] toggle — ADMIN ONLY
 *   • Logout button
 *
 * The admin toggle is hidden entirely for CUSTOMER and TASKER roles.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrutalBadge } from './BrutalBadge';
import { BORDER_WIDTH, Neutral } from '../theme';
import { useStore } from '../store';
import type { AdminMode } from '../types/models';

const ROLE_COLORS: Record<string, string> = {
  CUSTOMER: '#8B5CF6',
  TASKER:  '#F97316',
  ADMIN:    '#EC4899',
};

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'Customer',
  TASKER:  'Tasker',
  ADMIN:    'Dual',
};

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const currentUser = useStore((s) => s.currentUser);
  const adminMode    = useStore((s) => s.adminMode);
  const setAdminMode = useStore((s) => s.setAdminMode);
  const logout       = useStore((s) => s.logout);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'DUAL';

  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: Neutral.black,
        gap: 10,
      }}
    >
      {/* ── Row 1: logo + role badge + logout ──────────────────────── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {/* Logo */}
        <Text
          style={{
            fontWeight: '900',
            fontSize: 22,
            color: Neutral.white,
            textTransform: 'uppercase',
            letterSpacing: -1,
            flex: 1,
          }}
        >
          TaskGo
        </Text>

        {/* User role badge */}
        <BrutalBadge
          label={ROLE_LABELS[currentUser.role]}
          color={ROLE_COLORS[currentUser.role]}
        />

        {/* User name */}
        <Text
          style={{
            fontWeight: '700',
            fontSize: 13,
            color: '#D1D5DB',
            maxWidth: 90,
          }}
          numberOfLines={1}
        >
          {currentUser.name.split(' ')[0]}
        </Text>

        {/* Logout */}
        <Pressable
          onPress={logout}
          style={({ pressed }) => ({
            borderWidth: BORDER_WIDTH - 1,
            borderColor: Neutral.white,
            borderRadius: 9999,
            paddingHorizontal: 12,
            paddingVertical: 5,
            backgroundColor: pressed ? '#374151' : 'transparent',
          })}
        >
          <Text style={{ fontWeight: '900', fontSize: 11, color: Neutral.white, textTransform: 'uppercase' }}>
            Logout
          </Text>
        </Pressable>
      </View>

      {/* ── Row 2: Admin mode toggle + Simulator Switch (ADMIN only) ──── */}
      {isAdmin && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Text style={{ fontWeight: '700', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase' }}>
              Mode:
            </Text>
            <AdminToggle
              value={adminMode}
              onChange={setAdminMode}
            />
          </View>

        </View>
      )}
    </View>
  );
}

// ─── Admin Mode Toggle ────────────────────────────────────────────────────────

interface AdminToggleProps {
  value: AdminMode;
  onChange: (mode: AdminMode) => void;
}

function AdminToggle({ value, onChange }: AdminToggleProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        borderWidth: BORDER_WIDTH - 1,
        borderColor: Neutral.white,
        borderRadius: 9999,
        overflow: 'hidden',
      }}
    >
      <ToggleSegment
        label="Customer Mode"
        active={value === 'CUSTOMER'}
        activeColor="#8B5CF6"
        onPress={() => onChange('CUSTOMER')}
      />
      <ToggleSegment
        label="Tasker Mode"
        active={value === 'TASKER'}
        activeColor="#F97316"
        onPress={() => onChange('TASKER')}
      />
    </View>
  );
}

interface ToggleSegmentProps {
  label: string;
  active: boolean;
  activeColor: string;
  onPress: () => void;
}

function ToggleSegment({ label, active, activeColor, onPress }: ToggleSegmentProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: active ? activeColor : pressed ? '#1F2937' : 'transparent',
      })}
    >
      <Text
        style={{
          fontWeight: '900',
          fontSize: 11,
          color: active ? Neutral.white : '#9CA3AF',
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

