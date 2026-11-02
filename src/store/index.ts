// ─── Zustand Store + Omnichannel WhatsApp LAN Bridge ─────────────────────────
// Single store for the entire TaskGo demo app.
// Synchronizes automatically over LAN with the TaskGo WhatsApp Bot Server when
// running in Expo Go on a physical phone, an emulator, or Expo Web.

import { NativeModules, Platform } from 'react-native';
import { create } from 'zustand';
import { SEED_ORDERS, SEED_USERS } from '../data/seed';
import type {
  AdminMode,
  BidThread,
  ErrandOrder,
  LocationStop,
  Offer,
  OrderSourceChannel,
  Payment,
  ProgressStep,
  SupportedLanguage,
  User,
} from '../types/models';
import { calcPayments } from '../utils/pricing';

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _seq = Date.now();
const uid = (prefix: string) => `${prefix}_${(++_seq).toString(36)}`;

const iso = () => new Date().toISOString();

/** Deep-clone an order so mutations don't leak across renders. */
const cloneOrder = (o: ErrandOrder): ErrandOrder =>
  JSON.parse(JSON.stringify(o));

// ─── Automatic Expo Go LAN Bridge Discovery ───────────────────────────────────

const BRIDGE_PORT = 3001;

/**
 * Automatically detects the laptop's LAN IP when running inside Expo Go on a
 * physical phone over Wi-Fi/Hotspot, or falls back to localhost on Web/Simulator.
 * Can also be overridden via EXPO_PUBLIC_WHATSAPP_BRIDGE_URL.
 */
export function getBridgeServerUrl(): string {
  try {
    const envUrl =
      typeof process !== 'undefined' &&
      process.env &&
      (process.env as Record<string, string | undefined>).EXPO_PUBLIC_WHATSAPP_BRIDGE_URL;
    if (envUrl) {
      return envUrl.replace(/\/$/, '');
    }

    // In Expo Go / React Native Metro bundler, scriptURL contains http://<LAPTOP_LAN_IP>:8081/...
    const scriptURL: string | undefined =
      NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^/:]+)(?::\d+)?/);
      if (match && match[1]) {
        return `http://${match[1]}:${BRIDGE_PORT}`;
      }
    }

    // Web browser fallback
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      window.location?.hostname
    ) {
      return `http://${window.location.hostname}:${BRIDGE_PORT}`;
    }
  } catch {
    // Ignore environment detection errors
  }
  return `http://localhost:${BRIDGE_PORT}`;
}

/**
 * Pushes an updated order and action name to the local WhatsApp Bot Bridge Server.
 * Non-blocking: if the bridge server isn't running, the mobile app continues offline.
 */
export async function pushOrderEventToBridge(
  action: string,
  order: ErrandOrder | undefined,
  extra?: Record<string, unknown>,
): Promise<void> {
  if (!order) return;
  const baseUrl = getBridgeServerUrl();
  try {
    await fetch(`${baseUrl}/api/sync-from-app`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        order,
        extra,
        timestamp: iso(),
      }),
    });
  } catch {
    // Silently ignore when running standalone without the WhatsApp server
  }
}

// ─── State shape ──────────────────────────────────────────────────────────────

interface AppState {
  // ── Auth ──────────────────────────────────────────────────────────────────
  currentUser: User | null;
  adminMode: AdminMode;          // only relevant when role === 'ADMIN'
  simulatorEnabled: boolean;     // admin-only toggle
  bridgeConnected: boolean;      // true when linked to WhatsApp Bot Server

  // ── Data ──────────────────────────────────────────────────────────────────
  users: User[];
  orders: ErrandOrder[];

  // ── Auth actions ──────────────────────────────────────────────────────────
  login: (email: string, password: string) => User | null;
  logout: () => void;
  setAdminMode: (mode: AdminMode) => void;
  toggleSimulator: () => void;

  // ── Order actions — customer ──────────────────────────────────────────────
  createOrder: (params: {
    id?: string;
    category: string;
    stops: Omit<LocationStop, 'id'>[];
    edgeCaseInstructions: string;
    distanceKm?: number;
    requiresPurchase?: boolean;
    itemsSummary?: string;
    estimatedPurchaseCost?: number;
    approvedPurchaseBudget?: number;
    sourceChannel?: OrderSourceChannel;
    whatsappPhone?: string;
    customerLanguage?: SupportedLanguage;
    customerName?: string;
  }) => ErrandOrder;

  cancelOrder: (orderId: string) => void;

  acceptBid: (orderId: string, threadId: string) => void;

  /** Customer pays advance (50% service fee + 100% approvedPurchaseBudget); order → ASSIGNED. */
  payAdvance: (
    orderId: string,
    method: 'UPI',
    upiRef: string,
  ) => void;

  /** Customer approves and funds an extra purchase top-up when bill > fundedPurchaseBudget. */
  approvePurchaseTopUp: (
    orderId: string,
    upiRef?: string,
  ) => void;

  /** Customer declines extra spend above the approved purchase budget cap. */
  declinePurchaseTopUp: (orderId: string) => void;

  /** Customer approves proof; order → AWAITING_FINAL_PAYMENT. */
  approveProof: (orderId: string) => void;

  /** Customer raises an issue on proof. */
  raiseIssue: (orderId: string) => void;

  /** Customer pays final balance; order → COMPLETED (UPI) or waits for runner confirm (CASH). */
  payFinal: (
    orderId: string,
    method: 'UPI' | 'CASH',
    upiRef?: string,
  ) => void;

  /** Customer saves rating + review after completion. */
  rateOrder: (orderId: string, rating: number, review: string) => void;

  // ── Order actions — customer negotiation ──────────────────────────────────
  customerCounter: (
    orderId: string,
    threadId: string,
    price: number,
    note: string,
  ) => void;

  customerRejectOffer: (orderId: string, threadId: string) => void;

  // ── Order actions — runner ────────────────────────────────────────────────
  placeBid: (
    orderId: string,
    runnerId: string,
    runnerName: string,
    price: number,
    note: string,
  ) => BidThread;

  editBid: (
    orderId: string,
    threadId: string,
    price: number,
    note: string,
  ) => void;

  withdrawBid: (orderId: string, threadId: string) => void;

  runnerCounter: (
    orderId: string,
    threadId: string,
    price: number,
    note: string,
  ) => void;

  runnerAcceptCounter: (orderId: string, threadId: string) => void;

  runnerRejectCounter: (orderId: string, threadId: string) => void;

  advanceProgress: (orderId: string, step: ProgressStep) => void;

  submitProof: (params: {
    orderId: string;
    completionPhotoUri: string;
    billPhotoUri?: string;
    storeBillAmount?: number;
  }) => void;

  /** Runner confirms cash received; order → COMPLETED + credits any unused purchase budget. */
  confirmCashReceived: (orderId: string) => void;

  // ── Omnichannel Sync ──────────────────────────────────────────────────────
  /** Merges orders pulled from the WhatsApp Bot Bridge Server into local state. */
  mergeRemoteOrders: (remoteOrders: ErrandOrder[], connected?: boolean) => void;

  // ── Utility ───────────────────────────────────────────────────────────────
  /** Expire a pending offer (called by simulator / countdown timer). */
  expireOffer: (orderId: string, threadId: string, offerId: string) => void;

  /** Internal helper used by the simulator. */
  _getOrder: (orderId: string) => ErrandOrder | undefined;
}

// ─── Store implementation ─────────────────────────────────────────────────────

export const useStore = create<AppState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  currentUser: null,
  adminMode: 'CUSTOMER',
  simulatorEnabled: true,
  bridgeConnected: false,
  users: SEED_USERS,
  orders: SEED_ORDERS.map(cloneOrder),

  // ── Auth ───────────────────────────────────────────────────────────────────
  login(email, password) {
    const user = get().users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password,
    );
    if (user) {
      set({ currentUser: user });
    }
    return user ?? null;
  },

  logout() {
    set({ currentUser: null, adminMode: 'CUSTOMER' });
  },

  setAdminMode(mode) {
    set({ adminMode: mode });
  },

  toggleSimulator() {
    set((s) => ({ simulatorEnabled: !s.simulatorEnabled }));
  },

  // ── Create order ───────────────────────────────────────────────────────────
  createOrder({
    id,
    category,
    stops,
    edgeCaseInstructions,
    distanceKm = 2.0,
    requiresPurchase,
    itemsSummary,
    estimatedPurchaseCost,
    approvedPurchaseBudget,
    sourceChannel = 'APP',
    whatsappPhone,
    customerLanguage = 'en',
    customerName,
  }) {
    const { currentUser, orders } = get();

    // When admin is acting as customer, use the demo customer id
    const customerId =
      currentUser?.role === 'ADMIN'
        ? 'u_cust_1'
        : currentUser?.id ?? 'u_cust_1';

    const isPurchaseCategory =
      requiresPurchase ??
      (category === 'Store Purchases' || (approvedPurchaseBudget ?? 0) > 0);
    const safeApprovedBudget = isPurchaseCategory
      ? Math.max(0, Math.round(approvedPurchaseBudget ?? estimatedPurchaseCost ?? 0))
      : 0;

    const now = iso();
    const newOrder: ErrandOrder = {
      id: id ?? uid('ord'),
      customerId,
      category,
      stops: stops.map((s) => ({ ...s, id: uid('stp') })),
      edgeCaseInstructions,
      status: 'PLACED',
      distanceKm,
      createdAt: now,
      updatedAt: now,
      sourceChannel,
      whatsappPhone,
      customerLanguage,
      customerName,
      requiresPurchase: isPurchaseCategory,
      itemsSummary,
      estimatedPurchaseCost: estimatedPurchaseCost ?? safeApprovedBudget,
      approvedPurchaseBudget: safeApprovedBudget,
      fundedPurchaseBudget: 0,
      refundStatus: 'NONE',
      topUpStatus: 'NONE',
      threads: [],
      payments: [],
    };

    set({ orders: [newOrder, ...orders] });
    void pushOrderEventToBridge('CREATE_ORDER', newOrder);
    return newOrder;
  },

  // ── Cancel order (SPEC Section 4: pre-assigned free, post-assigned forfeited)
  cancelOrder(orderId) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (['COMPLETED', 'CANCELLED'].includes(o.status)) return o;
        updated = { ...o, status: 'CANCELLED', updatedAt: iso() };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('CANCEL_ORDER', updated);
  },

  // ── Accept bid ─────────────────────────────────────────────────────────────
  acceptBid(orderId, threadId) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (!['PLACED', 'BIDDING', 'AGREED'].includes(o.status)) return o;

        const winThread = o.threads.find((t) => t.id === threadId);
        if (!winThread) return o;

        const latestOffer = winThread.offers[winThread.offers.length - 1];
        if (!latestOffer || latestOffer.status !== 'PENDING') return o;

        const agreedFee = latestOffer.price;
        const purchaseCap = o.approvedPurchaseBudget ?? 0;
        const {
          advanceAmount,
          balanceFee,
          totalAdvancePayable,
        } = calcPayments(agreedFee, 0, purchaseCap);

        updated = {
          ...o,
          status: 'AWAITING_DEPOSIT',
          agreedFee,
          advanceAmount,
          balanceFee,
          totalAdvancePayable,
          assignedRunnerId: winThread.runnerId,
          assignedRunnerName: winThread.runnerName,
          updatedAt: iso(),
          threads: o.threads.map((t) => {
            if (t.id === threadId) {
              return {
                ...t,
                status: 'AGREED',
                offers: t.offers.map((of, i) =>
                  i === t.offers.length - 1
                    ? { ...of, status: 'ACCEPTED' }
                    : of,
                ),
              };
            }
            return { ...t, status: 'LOST' };
          }),
        };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('ACCEPT_BID', updated, { threadId });
  },

  // ── Customer counter ───────────────────────────────────────────────────────
  customerCounter(orderId, threadId, price, note) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        updated = {
          ...o,
          updatedAt: iso(),
          threads: o.threads.map((t) => {
            if (t.id !== threadId) return t;
            const updatedOffers: Offer[] = t.offers.map((of, i) =>
              i === t.offers.length - 1 ? { ...of, status: 'COUNTERED' } : of,
            );
            const newOffer: Offer = {
              id: uid('off'),
              threadId,
              from: 'CUSTOMER',
              price,
              note,
              createdAt: iso(),
              status: 'PENDING',
            };
            return { ...t, offers: [...updatedOffers, newOffer] };
          }),
        };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('CUSTOMER_COUNTER', updated, {
      threadId,
      price,
      note,
    });
  },

  // ── Customer reject ────────────────────────────────────────────────────────
  customerRejectOffer(orderId, threadId) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        updated = {
          ...o,
          updatedAt: iso(),
          threads: o.threads.map((t) => {
            if (t.id !== threadId) return t;
            return {
              ...t,
              status: 'REJECTED',
              offers: t.offers.map((of, i) =>
                i === t.offers.length - 1 ? { ...of, status: 'REJECTED' } : of,
              ),
            };
          }),
        };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('CUSTOMER_REJECT_OFFER', updated, { threadId });
  },

  // ── Place bid ──────────────────────────────────────────────────────────────
  placeBid(orderId, runnerId, runnerName, price, note) {
    const newOffer: Offer = {
      id: uid('off'),
      threadId: '', // filled below
      from: 'RUNNER',
      price,
      note,
      createdAt: iso(),
      status: 'PENDING',
    };
    const newThread: BidThread = {
      id: uid('thr'),
      orderId,
      runnerId,
      runnerName,
      offers: [],
      status: 'OPEN',
    };
    newOffer.threadId = newThread.id;
    newThread.offers = [newOffer];

    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (!['PLACED', 'BIDDING'].includes(o.status)) return o;
        updated = {
          ...o,
          status: 'BIDDING',
          updatedAt: iso(),
          threads: [...o.threads, newThread],
        };
        return updated;
      }),
    }));

    void pushOrderEventToBridge('PLACE_BID', updated, {
      threadId: newThread.id,
      runnerId,
      runnerName,
      price,
      note,
    });
    return newThread;
  },

  // ── Edit bid (SPEC Section 5.6: before customer response) ─────────────────
  editBid(orderId, threadId, price, note) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        updated = {
          ...o,
          updatedAt: iso(),
          threads: o.threads.map((t) => {
            if (t.id !== threadId) return t;
            const hasCustomerResponse = t.offers.some((of) => of.from === 'CUSTOMER');
            if (hasCustomerResponse || t.offers.length === 0) return t;

            return {
              ...t,
              offers: t.offers.map((of, i) =>
                i === t.offers.length - 1
                  ? { ...of, price, note, createdAt: iso() }
                  : of,
              ),
            };
          }),
        };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('EDIT_BID', updated, { threadId, price, note });
  },

  // ── Withdraw bid ───────────────────────────────────────────────────────────
  withdrawBid(orderId, threadId) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        updated = {
          ...o,
          updatedAt: iso(),
          threads: o.threads.map((t) => {
            if (t.id !== threadId) return t;
            const hasCustomerResponse = t.offers.some(
              (of) => of.from === 'CUSTOMER',
            );
            if (hasCustomerResponse) return t;
            return { ...t, status: 'WITHDRAWN' };
          }),
        };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('WITHDRAW_BID', updated, { threadId });
  },

  // ── Runner counter ─────────────────────────────────────────────────────────
  runnerCounter(orderId, threadId, price, note) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        updated = {
          ...o,
          updatedAt: iso(),
          threads: o.threads.map((t) => {
            if (t.id !== threadId) return t;
            const updatedOffers: Offer[] = t.offers.map((of, i) =>
              i === t.offers.length - 1 ? { ...of, status: 'COUNTERED' } : of,
            );
            const newOffer: Offer = {
              id: uid('off'),
              threadId,
              from: 'RUNNER',
              price,
              note,
              createdAt: iso(),
              status: 'PENDING',
            };
            return { ...t, offers: [...updatedOffers, newOffer] };
          }),
        };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('RUNNER_COUNTER', updated, {
      threadId,
      price,
      note,
    });
  },

  // ── Runner accepts a customer counter ──────────────────────────────────────
  runnerAcceptCounter(orderId, threadId) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        const thread = o.threads.find((t) => t.id === threadId);
        if (!thread) return o;
        const latestOffer = thread.offers[thread.offers.length - 1];
        if (!latestOffer || latestOffer.from !== 'CUSTOMER') return o;

        const agreedFee = latestOffer.price;
        const purchaseCap = o.approvedPurchaseBudget ?? 0;
        const {
          advanceAmount,
          balanceFee,
          totalAdvancePayable,
        } = calcPayments(agreedFee, 0, purchaseCap);

        updated = {
          ...o,
          status: 'AWAITING_DEPOSIT',
          agreedFee,
          advanceAmount,
          balanceFee,
          totalAdvancePayable,
          assignedRunnerId: thread.runnerId,
          assignedRunnerName: thread.runnerName,
          updatedAt: iso(),
          threads: o.threads.map((t) => {
            if (t.id === threadId) {
              return {
                ...t,
                status: 'AGREED',
                offers: t.offers.map((of, i) =>
                  i === t.offers.length - 1
                    ? { ...of, status: 'ACCEPTED' }
                    : of,
                ),
              };
            }
            return { ...t, status: 'LOST' };
          }),
        };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('RUNNER_ACCEPT_COUNTER', updated, { threadId });
  },

  // ── Runner rejects a customer counter ──────────────────────────────────────
  runnerRejectCounter(orderId, threadId) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        updated = {
          ...o,
          updatedAt: iso(),
          threads: o.threads.map((t) => {
            if (t.id !== threadId) return t;
            return {
              ...t,
              status: 'REJECTED',
              offers: t.offers.map((of, i) =>
                i === t.offers.length - 1 ? { ...of, status: 'REJECTED' } : of,
              ),
            };
          }),
        };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('RUNNER_REJECT_COUNTER', updated, { threadId });
  },

  // ── Pay advance (50% service fee + 100% approvedPurchaseBudget) ────────────
  payAdvance(orderId, method, upiRef) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status !== 'AWAITING_DEPOSIT') return o;

        const serviceFeeAdvance = o.advanceAmount ?? 0;
        const purchaseCap = o.approvedPurchaseBudget ?? 0;
        const totalAdvance =
          o.totalAdvancePayable ?? serviceFeeAdvance + purchaseCap;

        const payment: Payment = {
          id: uid('pay'),
          kind: 'ADVANCE',
          amount: totalAdvance,
          method,
          paidAt: iso(),
          upiRef,
          serviceFeePortion: serviceFeeAdvance,
          purchaseBudgetPortion: purchaseCap,
          note:
            purchaseCap > 0
              ? `₹${serviceFeeAdvance} service-fee advance + ₹${purchaseCap} purchase budget`
              : `₹${serviceFeeAdvance} service-fee advance`,
        };

        updated = {
          ...o,
          status: 'ASSIGNED',
          totalAdvancePayable: totalAdvance,
          fundedPurchaseBudget: purchaseCap,
          updatedAt: iso(),
          payments: [...o.payments, payment],
        };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('PAY_ADVANCE', updated, { method, upiRef });
  },

  // ── Advance progress (runner) ──────────────────────────────────────────────
  advanceProgress(orderId, step) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (!['ASSIGNED', 'IN_PROGRESS'].includes(o.status)) return o;
        updated = {
          ...o,
          status: 'IN_PROGRESS',
          progressStep: step,
          updatedAt: iso(),
        };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('ADVANCE_PROGRESS', updated, { step });
  },

  // ── Submit proof (with Overspend Guard if bill > fundedPurchaseBudget) ─────
  submitProof({ orderId, completionPhotoUri, billPhotoUri, storeBillAmount }) {
    let updated: ErrandOrder | undefined;
    let actionType = 'SUBMIT_PROOF';

    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status !== 'IN_PROGRESS') return o;

        const bill = Math.max(0, Math.round(storeBillAmount ?? 0));
        const fundedBudget = o.fundedPurchaseBudget ?? o.approvedPurchaseBudget ?? 0;

        // Overspend Guard (Spec Section 3):
        // If this is a purchase errand with a funded budget cap and the bill exceeds
        // the funded purchase budget, pause settlement and request customer approval & top-up first.
        if (
          (o.requiresPurchase || fundedBudget > 0) &&
          fundedBudget > 0 &&
          bill > fundedBudget
        ) {
          const extraNeeded = bill - fundedBudget;
          actionType = 'OVERSPEND_TOPUP_REQUIRED';
          updated = {
            ...o,
            // Remain IN_PROGRESS while awaiting customer top-up confirmation
            pendingStoreBillAmount: bill,
            pendingTopUpAmount: extraNeeded,
            pendingCompletionPhotoUri: completionPhotoUri,
            pendingBillPhotoUri: billPhotoUri,
            topUpStatus: 'AWAITING_CUSTOMER_APPROVAL',
            updatedAt: iso(),
          };
          return updated;
        }

        const {
          unusedPurchaseRefund,
          finalAdjustment,
          finalBalance,
          totalPayable,
        } = calcPayments(
          o.agreedFee ?? 0,
          bill,
          o.approvedPurchaseBudget ?? 0,
          fundedBudget,
        );

        updated = {
          ...o,
          status: 'PROOF_SUBMITTED',
          completionPhotoUri,
          billPhotoUri,
          storeBillAmount: bill,
          unusedPurchaseRefund,
          finalAdjustment,
          finalBalance,
          totalPayable,
          refundStatus: unusedPurchaseRefund > 0 ? 'PENDING_CREDIT' : 'NONE',
          topUpStatus: o.topUpStatus === 'AWAITING_CUSTOMER_APPROVAL'
            ? 'APPROVED_AND_FUNDED'
            : (o.topUpStatus ?? 'NONE'),
          updatedAt: iso(),
        };
        return updated;
      }),
    }));

    void pushOrderEventToBridge(actionType, updated, {
      completionPhotoUri,
      billPhotoUri,
      storeBillAmount,
    });
  },

  // ── Customer approves & funds extra purchase top-up ────────────────────────
  approvePurchaseTopUp(orderId, upiRef = `UPI-TOPUP-${Date.now().toString().slice(-6)}`) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.topUpStatus !== 'AWAITING_CUSTOMER_APPROVAL') return o;

        const topUpAmount = o.pendingTopUpAmount ?? 0;
        const newFundedBudget = (o.fundedPurchaseBudget ?? o.approvedPurchaseBudget ?? 0) + topUpAmount;
        const bill = o.pendingStoreBillAmount ?? newFundedBudget;

        const topUpPayment: Payment = {
          id: uid('pay'),
          kind: 'PURCHASE_TOPUP',
          amount: topUpAmount,
          method: 'UPI',
          paidAt: iso(),
          upiRef,
          purchaseBudgetPortion: topUpAmount,
          note: `Customer-approved purchase budget top-up of ₹${topUpAmount}`,
        };

        const {
          unusedPurchaseRefund,
          finalAdjustment,
          finalBalance,
          totalPayable,
        } = calcPayments(
          o.agreedFee ?? 0,
          bill,
          o.approvedPurchaseBudget ?? 0,
          newFundedBudget,
        );

        updated = {
          ...o,
          status: 'PROOF_SUBMITTED',
          fundedPurchaseBudget: newFundedBudget,
          storeBillAmount: bill,
          completionPhotoUri: o.pendingCompletionPhotoUri ?? o.completionPhotoUri,
          billPhotoUri: o.pendingBillPhotoUri ?? o.billPhotoUri,
          unusedPurchaseRefund,
          finalAdjustment,
          finalBalance,
          totalPayable,
          refundStatus: unusedPurchaseRefund > 0 ? 'PENDING_CREDIT' : 'NONE',
          topUpStatus: 'APPROVED_AND_FUNDED',
          pendingTopUpAmount: 0,
          updatedAt: iso(),
          payments: [...o.payments, topUpPayment],
        };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('APPROVE_PURCHASE_TOPUP', updated, { upiRef });
  },

  // ── Customer declines extra spend above approved purchase cap ──────────────
  declinePurchaseTopUp(orderId) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        updated = {
          ...o,
          topUpStatus: 'DECLINED',
          pendingTopUpAmount: 0,
          pendingStoreBillAmount: undefined,
          updatedAt: iso(),
        };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('DECLINE_PURCHASE_TOPUP', updated);
  },

  // ── Approve proof ──────────────────────────────────────────────────────────
  approveProof(orderId) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status !== 'PROOF_SUBMITTED') return o;
        updated = {
          ...o,
          status: 'AWAITING_FINAL_PAYMENT',
          updatedAt: iso(),
        };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('APPROVE_PROOF', updated);
  },

  // ── Raise issue ────────────────────────────────────────────────────────────
  raiseIssue(orderId) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        updated = { ...o, issueFlagged: true, updatedAt: iso() };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('RAISE_ISSUE', updated);
  },

  // ── Pay final ─────────────────────────────────────────────────────────────
  payFinal(orderId, method, upiRef) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status !== 'AWAITING_FINAL_PAYMENT') return o;

        const finalAmount = o.finalBalance ?? o.balanceFee ?? 0;
        const refundAmount = o.unusedPurchaseRefund ?? 0;
        const newPayments: Payment[] = [...o.payments];

        const finalPayment: Payment = {
          id: uid('pay'),
          kind: 'FINAL',
          amount: finalAmount,
          method,
          paidAt: iso(),
          upiRef,
          serviceFeePortion: o.balanceFee ?? finalAmount,
          note: `Remaining service fee settlement (${method})`,
        };
        newPayments.push(finalPayment);

        // If UPI, complete immediately and record any unused purchase budget refund/credit
        const alreadyCredited = newPayments.some((p) => p.kind === 'REFUND_CREDIT');
        if (method === 'UPI' && refundAmount > 0 && !alreadyCredited) {
          newPayments.push({
            id: uid('ref'),
            kind: 'REFUND_CREDIT',
            amount: refundAmount,
            method: 'WALLET_CREDIT',
            paidAt: iso(),
            upiRef: `REFUND-${Date.now().toString().slice(-6)}`,
            purchaseBudgetPortion: refundAmount,
            note: `Unused purchase budget returned/credited (Funded ₹${o.fundedPurchaseBudget} - Bill ₹${o.storeBillAmount})`,
          });
        }

        updated = {
          ...o,
          status: method === 'UPI' ? 'COMPLETED' : o.status,
          pendingFinalPaymentMethod: method,
          refundStatus:
            method === 'UPI' && refundAmount > 0
              ? 'CREDITED'
              : o.refundStatus,
          updatedAt: iso(),
          payments: newPayments,
        };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('PAY_FINAL', updated, { method, upiRef });
  },

  // ── Confirm cash received (runner) ────────────────────────────────────────
  confirmCashReceived(orderId) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status !== 'AWAITING_FINAL_PAYMENT') return o;

        const newPayments: Payment[] = [...o.payments];
        const hasFinal = newPayments.some((p) => p.kind === 'FINAL');
        if (!hasFinal) {
          newPayments.push({
            id: uid('pay'),
            kind: 'FINAL',
            amount: o.finalBalance ?? o.balanceFee ?? 0,
            method: 'CASH',
            paidAt: iso(),
            serviceFeePortion: o.balanceFee ?? o.finalBalance ?? 0,
            note: 'Remaining service fee paid in Cash to Task Boy',
          });
        }

        const refundAmount = o.unusedPurchaseRefund ?? 0;
        const alreadyCredited = newPayments.some((p) => p.kind === 'REFUND_CREDIT');
        if (refundAmount > 0 && !alreadyCredited) {
          newPayments.push({
            id: uid('ref'),
            kind: 'REFUND_CREDIT',
            amount: refundAmount,
            method: 'WALLET_CREDIT',
            paidAt: iso(),
            upiRef: `REFUND-${Date.now().toString().slice(-6)}`,
            purchaseBudgetPortion: refundAmount,
            note: `Unused purchase budget returned/credited (Funded ₹${o.fundedPurchaseBudget} - Bill ₹${o.storeBillAmount})`,
          });
        }

        updated = {
          ...o,
          status: 'COMPLETED',
          refundStatus: refundAmount > 0 ? 'CREDITED' : o.refundStatus,
          updatedAt: iso(),
          payments: newPayments,
        };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('CONFIRM_CASH_RECEIVED', updated);
  },

  // ── Rate order ────────────────────────────────────────────────────────────
  rateOrder(orderId, rating, review) {
    let updated: ErrandOrder | undefined;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId || o.status !== 'COMPLETED') return o;
        updated = { ...o, rating, review, updatedAt: iso() };
        return updated;
      }),
    }));
    void pushOrderEventToBridge('RATE_ORDER', updated, { rating, review });
  },

  // ── Merge remote orders from WhatsApp Bot Bridge Server ───────────────────
  mergeRemoteOrders(remoteOrders, connected = true) {
    set((s) => {
      if (!remoteOrders || !Array.isArray(remoteOrders)) {
        return { bridgeConnected: connected };
      }

      const localById = new Map<string, ErrandOrder>();
      for (const lo of s.orders) {
        localById.set(lo.id, lo);
      }

      let changed = s.bridgeConnected !== connected;
      const mergedMap = new Map<string, ErrandOrder>(localById);

      for (const ro of remoteOrders) {
        const existing = mergedMap.get(ro.id);
        if (!existing) {
          mergedMap.set(ro.id, cloneOrder(ro));
          changed = true;
        } else {
          const remoteTime = ro.updatedAt ? Date.parse(ro.updatedAt) : 0;
          const localTime = existing.updatedAt ? Date.parse(existing.updatedAt) : 0;
          const remoteSnapshot = JSON.stringify(ro);
          const localSnapshot = JSON.stringify(existing);

          if (remoteSnapshot !== localSnapshot && remoteTime >= localTime) {
            mergedMap.set(ro.id, cloneOrder(ro));
            changed = true;
          }
        }
      }

      if (!changed) return s;

      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );
      return {
        orders: mergedList,
        bridgeConnected: connected,
      };
    });
  },

  // ── Expire offer ──────────────────────────────────────────────────────────
  expireOffer(orderId, threadId, offerId) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          updatedAt: iso(),
          threads: o.threads.map((t) => {
            if (t.id !== threadId) return t;
            return {
              ...t,
              offers: t.offers.map((of) =>
                of.id === offerId && of.status === 'PENDING'
                  ? { ...of, status: 'EXPIRED' }
                  : of,
              ),
            };
          }),
        };
      }),
    }));
  },

  // ── Internal helper ───────────────────────────────────────────────────────
  _getOrder(orderId) {
    return get().orders.find((o) => o.id === orderId);
  },
}));

// ─── Selector helpers (use in components) ────────────────────────────────────

/** The effective customer user id (handles admin acting-as). */
export const effectiveCustomerId = (
  user: User | null,
  adminMode: AdminMode,
): string => {
  if (!user) return '';
  if (user.role === 'ADMIN') return adminMode === 'CUSTOMER' ? 'u_cust_1' : 'u_run_1';
  return user.id;
};

/** The effective runner user id (handles admin acting-as). */
export const effectiveRunnerId = (
  user: User | null,
  adminMode: AdminMode,
): string => {
  if (!user) return '';
  if (user.role === 'ADMIN') return adminMode === 'TASKBOY' ? 'u_run_1' : '';
  return user.role === 'TASKBOY' ? user.id : '';
};

/** Orders visible to the customer (their own orders + WhatsApp orders linked to demo customer). */
export const selectCustomerOrders = (
  orders: ErrandOrder[],
  customerId: string,
): ErrandOrder[] =>
  orders.filter(
    (o) => o.customerId === customerId || o.sourceChannel === 'WHATSAPP',
  );

/** Orders visible in the runner feed (PLACED or BIDDING). */
export const selectRunnerFeed = (
  orders: ErrandOrder[],
): ErrandOrder[] =>
  orders.filter((o) => o.status === 'PLACED' || o.status === 'BIDDING');

/** Active orders assigned to a runner. */
export const selectRunnerActive = (
  orders: ErrandOrder[],
  runnerId: string,
): ErrandOrder[] =>
  orders.filter(
    (o) =>
      o.assignedRunnerId === runnerId &&
      ['ASSIGNED', 'IN_PROGRESS', 'PROOF_SUBMITTED', 'AWAITING_FINAL_PAYMENT'].includes(o.status),
  );

/** Completed orders for a runner. */
export const selectRunnerDone = (
  orders: ErrandOrder[],
  runnerId: string,
): ErrandOrder[] =>
  orders.filter(
    (o) => o.assignedRunnerId === runnerId && o.status === 'COMPLETED',
  );

/** All threads a runner has open across all orders. */
export const selectRunnerBiddingThreads = (
  orders: ErrandOrder[],
  runnerId: string,
): { order: ErrandOrder; thread: BidThread }[] => {
  const result: { order: ErrandOrder; thread: BidThread }[] = [];
  for (const order of orders) {
    for (const thread of order.threads) {
      if (
        thread.runnerId === runnerId &&
        thread.status === 'OPEN'
      ) {
        result.push({ order, thread });
      }
    }
  }
  return result;
};

/** Latest pending offer in a thread (the one that needs action). */
export const latestPendingOffer = (thread: BidThread): Offer | undefined =>
  thread.offers.findLast?.((o) => o.status === 'PENDING') ??
  [...thread.offers].reverse().find((o) => o.status === 'PENDING');

/** How many counters have been exchanged in a thread. */
export const counterCount = (thread: BidThread): number =>
  thread.offers.filter(
    (o) => o.status === 'COUNTERED' || o.status === 'PENDING',
  ).length - 1; // subtract the original bid