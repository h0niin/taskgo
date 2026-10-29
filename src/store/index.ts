// ─── Zustand Store ────────────────────────────────────────────────────────────
// Single store for the entire TaskGo demo app.
// All state transitions validate the current status before mutating.
// Section 0 rule: no backend — all in-memory.

import { create } from 'zustand';
import { SEED_ORDERS, SEED_USERS } from '../data/seed';
import type {
  AdminMode,
  BidThread,
  ErrandOrder,
  LocationStop,
  Offer,
  OrderStatus,
  Payment,
  ProgressStep,
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

// ─── State shape ──────────────────────────────────────────────────────────────

interface AppState {
  // ── Auth ──────────────────────────────────────────────────────────────────
  currentUser: User | null;
  adminMode: AdminMode;          // only relevant when role === 'ADMIN'
  simulatorEnabled: boolean;     // admin-only toggle

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
    category: string;
    stops: Omit<LocationStop, 'id'>[];
    edgeCaseInstructions: string;
    distanceKm?: number;
  }) => ErrandOrder;

  cancelOrder: (orderId: string) => void;

  acceptBid: (orderId: string, threadId: string) => void;

  /** Customer pays advance; order → ASSIGNED. */
  payAdvance: (
    orderId: string,
    method: 'UPI',
    upiRef: string,
  ) => void;

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

  /** Runner confirms cash received; order → COMPLETED. */
  confirmCashReceived: (orderId: string) => void;

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
  createOrder({ category, stops, edgeCaseInstructions, distanceKm = 2.0 }) {
    const { currentUser, adminMode, orders } = get();

    // When admin is acting as customer, use the demo customer id
    const customerId =
      currentUser?.role === 'ADMIN'
        ? 'u_cust_1'
        : currentUser?.id ?? 'u_cust_1';

    const newOrder: ErrandOrder = {
      id: uid('ord'),
      customerId,
      category,
      stops: stops.map((s) => ({ ...s, id: uid('stp') })),
      edgeCaseInstructions,
      status: 'PLACED',
      distanceKm,
      createdAt: iso(),
      threads: [],
      payments: [],
    };

    set({ orders: [...orders, newOrder] });
    return newOrder;
  },

  // ── Cancel order ───────────────────────────────────────────────────────────
  cancelOrder(orderId) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        const preCancelStates: OrderStatus[] = [
          'PLACED', 'BIDDING', 'AGREED', 'AWAITING_DEPOSIT',
        ];
        if (!preCancelStates.includes(o.status)) return o; // guard
        return { ...o, status: 'CANCELLED' };
      }),
    }));
  },

  // ── Accept bid ─────────────────────────────────────────────────────────────
  acceptBid(orderId, threadId) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (!['PLACED', 'BIDDING', 'AGREED'].includes(o.status)) return o;

        const winThread = o.threads.find((t) => t.id === threadId);
        if (!winThread) return o;

        const latestOffer = winThread.offers[winThread.offers.length - 1];
        if (!latestOffer || latestOffer.status !== 'PENDING') return o;

        const agreedFee = latestOffer.price;
        const { advanceAmount, balanceFee } = calcPayments(agreedFee);

        return {
          ...o,
          status: 'AWAITING_DEPOSIT',
          agreedFee,
          advanceAmount,
          balanceFee,
          assignedRunnerId: winThread.runnerId,
          assignedRunnerName: winThread.runnerName,
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
      }),
    }));
  },

  // ── Customer counter ───────────────────────────────────────────────────────
  customerCounter(orderId, threadId, price, note) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          threads: o.threads.map((t) => {
            if (t.id !== threadId) return t;
            // Mark latest offer as COUNTERED
            const updatedOffers: Offer[] = t.offers.map((of, i) =>
              i === t.offers.length - 1 ? { ...of, status: 'COUNTERED' } : of,
            );
            // Add the new counter offer
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
      }),
    }));
  },

  // ── Customer reject ────────────────────────────────────────────────────────
  customerRejectOffer(orderId, threadId) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
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
      }),
    }));
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

    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (!['PLACED', 'BIDDING'].includes(o.status)) return o;
        return {
          ...o,
          status: 'BIDDING',
          threads: [...o.threads, newThread],
        };
      }),
    }));

    return newThread;
  },

  // ── Edit bid (SPEC Section 5.6: before customer response) ─────────────────
  editBid(orderId, threadId, price, note) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          threads: o.threads.map((t) => {
            if (t.id !== threadId) return t;
            // Can only edit before customer has responded
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
      }),
    }));
  },

  // ── Withdraw bid ───────────────────────────────────────────────────────────
  withdrawBid(orderId, threadId) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          threads: o.threads.map((t) => {
            if (t.id !== threadId) return t;
            // Can only withdraw before customer has responded
            const hasCustomerResponse = t.offers.some(
              (of) => of.from === 'CUSTOMER',
            );
            if (hasCustomerResponse) return t;
            return { ...t, status: 'WITHDRAWN' };
          }),
        };
      }),
    }));
  },

  // ── Runner counter ─────────────────────────────────────────────────────────
  runnerCounter(orderId, threadId, price, note) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
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
      }),
    }));
  },

  // ── Runner accepts a customer counter ──────────────────────────────────────
  runnerAcceptCounter(orderId, threadId) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        const thread = o.threads.find((t) => t.id === threadId);
        if (!thread) return o;
        const latestOffer = thread.offers[thread.offers.length - 1];
        if (!latestOffer || latestOffer.from !== 'CUSTOMER') return o;

        const agreedFee = latestOffer.price;
        const { advanceAmount, balanceFee } = calcPayments(agreedFee);

        return {
          ...o,
          status: 'AWAITING_DEPOSIT',
          agreedFee,
          advanceAmount,
          balanceFee,
          assignedRunnerId: thread.runnerId,
          assignedRunnerName: thread.runnerName,
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
      }),
    }));
  },

  // ── Runner rejects a customer counter ──────────────────────────────────────
  runnerRejectCounter(orderId, threadId) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
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
      }),
    }));
  },

  // ── Pay advance ────────────────────────────────────────────────────────────
  payAdvance(orderId, method, upiRef) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status !== 'AWAITING_DEPOSIT') return o;

        const payment: Payment = {
          id: uid('pay'),
          kind: 'ADVANCE',
          amount: o.advanceAmount ?? 0,
          method,
          paidAt: iso(),
          upiRef,
        };

        return {
          ...o,
          status: 'ASSIGNED',
          payments: [...o.payments, payment],
        };
      }),
    }));
  },

  // ── Advance progress (runner) ──────────────────────────────────────────────
  advanceProgress(orderId, step) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (!['ASSIGNED', 'IN_PROGRESS'].includes(o.status)) return o;
        return { ...o, status: 'IN_PROGRESS', progressStep: step };
      }),
    }));
  },

  // ── Submit proof ───────────────────────────────────────────────────────────
  submitProof({ orderId, completionPhotoUri, billPhotoUri, storeBillAmount }) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status !== 'IN_PROGRESS') return o;

        const bill = storeBillAmount ?? 0;
        const { finalBalance, totalPayable } = calcPayments(
          o.agreedFee ?? 0,
          bill,
        );

        return {
          ...o,
          status: 'PROOF_SUBMITTED',
          completionPhotoUri,
          billPhotoUri,
          storeBillAmount: bill,
          finalBalance,
          totalPayable,
        };
      }),
    }));
  },

  // ── Approve proof ──────────────────────────────────────────────────────────
  approveProof(orderId) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status !== 'PROOF_SUBMITTED') return o;
        return { ...o, status: 'AWAITING_FINAL_PAYMENT' };
      }),
    }));
  },

  // ── Raise issue ────────────────────────────────────────────────────────────
  raiseIssue(orderId) {
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId ? { ...o, issueFlagged: true } : o,
      ),
    }));
  },

  // ── Pay final ─────────────────────────────────────────────────────────────
  payFinal(orderId, method, upiRef) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status !== 'AWAITING_FINAL_PAYMENT') return o;

        const payment: Payment = {
          id: uid('pay'),
          kind: 'FINAL',
          amount: o.finalBalance ?? 0,
          method,
          paidAt: iso(),
          upiRef,
        };

        // UPI → immediately COMPLETED; CASH → wait for runner confirmation
        return {
          ...o,
          status: method === 'UPI' ? 'COMPLETED' : o.status,
          payments: [...o.payments, payment],
        };
      }),
    }));
  },

  // ── Confirm cash received (runner) ────────────────────────────────────────
  confirmCashReceived(orderId) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status !== 'AWAITING_FINAL_PAYMENT') return o;
        return { ...o, status: 'COMPLETED' };
      }),
    }));
  },

  // ── Rate order ────────────────────────────────────────────────────────────
  rateOrder(orderId, rating, review) {
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId && o.status === 'COMPLETED'
          ? { ...o, rating, review }
          : o,
      ),
    }));
  },

  // ── Expire offer ──────────────────────────────────────────────────────────
  expireOffer(orderId, threadId, offerId) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
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

/** Orders visible to the customer (their own orders). */
export const selectCustomerOrders = (
  orders: ErrandOrder[],
  customerId: string,
): ErrandOrder[] =>
  orders.filter((o) => o.customerId === customerId);

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

