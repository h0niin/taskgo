// ─── Navigation Type Declarations ─────────────────────────────────────────────
// All navigator param lists in one place for typed useNavigation / useRoute.

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// ─── Root (auth gate) ────────────────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  CustomerApp: undefined;
  RunnerApp: undefined;
};

// ─── Customer tab navigator ───────────────────────────────────────────────────

export type CustomerTabParamList = {
  Dashboard: undefined;
  NewOrder: undefined;
  Profile: undefined;
};

// ─── Customer stack (within each tab, for drill-downs in later steps) ─────────

export type CustomerStackParamList = {
  // Placeholder roots — screens added in Step 4
  CustomerDashboard: undefined;
  CustomerNewOrder: undefined;
  CustomerProfile: undefined;
};

// ─── Runner tab navigator ────────────────────────────────────────────────────

export type RunnerTabParamList = {
  Feed: undefined;
  MyErrands: undefined;
};

// ─── Navigation prop helpers ──────────────────────────────────────────────────

export type RootNavProp = NativeStackNavigationProp<RootStackParamList>;
export type CustomerTabNavProp = BottomTabNavigationProp<CustomerTabParamList>;
export type RunnerTabNavProp   = BottomTabNavigationProp<RunnerTabParamList>;

