// ─── Navigation Type Declarations ─────────────────────────────────────────────
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

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

// ─── Customer stack navigator (Step 4 drill-downs) ───────────────────────────

export type CustomerStackParamList = {
  CustomerTabs: undefined;
  OrderDetail: { orderId: string };
  NegotiationThread: { orderId: string; threadId: string };
  TaskPayment: { orderId: string };
  ProofReview: { orderId: string };
  AdditionalPayment: { orderId: string };
  Receipt: { orderId: string };
};

// ─── Runner tab navigator ────────────────────────────────────────────────────

export type RunnerTabParamList = {
  Feed: undefined;
  MyErrands: undefined;
};

// ─── Runner stack navigator (Step 5 drill-downs) ─────────────────────────────

export type RunnerStackParamList = {
  RunnerTabs: undefined;
  RunnerNegotiation: { orderId: string; threadId: string };
};

// ─── Navigation prop helpers ──────────────────────────────────────────────────

export type RootNavProp = NativeStackNavigationProp<RootStackParamList>;
export type CustomerTabNavProp = BottomTabNavigationProp<CustomerTabParamList>;
export type CustomerStackNavProp = NativeStackNavigationProp<CustomerStackParamList>;
export type RunnerTabNavProp   = BottomTabNavigationProp<RunnerTabParamList>;

export type CustomerStackRouteProp<T extends keyof CustomerStackParamList> =
  RouteProp<CustomerStackParamList, T>;
