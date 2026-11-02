// ─── Zustand Store ───────────────────────────────────────────────────────────
// Single store for the entire TaskGo demo app.
// All state transitions validate the current status before mutating.
// Section 0 rule: no backend — all in-memory.

import { create } from 'zustand';
import { SEED_USERS } from '../data/seed';
import type {
  AdminMode,
  BidThread,
  ErrandOrder,
  LocationStop,
  Offer,
  OrderStatus,
  Payment,
  User,
} from '../types/models';

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
  bridgeConnected: boolean;

  // ── Data ──────────────────────────────────────────────────────────────────
  users: User[];
  orders: ErrandOrder[];
  mergeRemoteOrders: (remoteOrders: ErrandOrder[], connected?: boolean) => void;

  // ── Auth actions ──────────────────────────────────────────────────────────
  login: (email: string, password: string) => User | null;
  logout: () => void;
  setAdminMode: (mode: AdminMode) => void;
  toggleSimulator: () => void;

  // ── Create order ─────────────────────────────────────────────────────────
  createOrder: (params: {
    category: string;
    stops: Omit<LocationStop, 'id'>[];
    edgeCaseInstructions: string;
    attachments?: string[];
    distanceKm?: number;
    loadWeightKg?: number;
    estHours?: number;
  }) => ErrandOrder;

  cancelOrder: (orderId: string) => void;

  acceptBid: (orderId: string, threadId: string) => void;

  /** Customer pays the full agreed fee; order → ASSIGNED. */
  payTaskFee: (orderId: string, upiRef: string) => void;

  /** Customer approves proof; order → AWAITING_ADDITIONAL_PAYMENT or COMPLETED. */
  approveProof: (orderId: string) => void;

  /** Customer raises an issue on proof. */
  raiseIssue: (orderId: string) => void;

  /** Customer pays additional costs; order → COMPLETED. */
  payAdditionalCosts: (orderId: string, upiRef: string) => void;

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

  // ── Order actions — runner ───────────────────────────────────────────────
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
  dismissBid: (orderId: string, threadId: string) => void;

  runnerCounter: (
    orderId: string,
    threadId: string,
    price: number,
    note: string,
  ) => void;

  runnerAcceptCounter: (orderId: string, threadId: string) => void;

  runnerRejectCounter: (orderId: string, threadId: string) => void;

  /** Runner begins the errand. */
  startOrder: (orderId: string) => void;

  submitProof: (params: {
    orderId: string;
    completionPhotoUri: string;
    additionalCostPhotoUri?: string;
    additionalCosts?: number;
  }) => void;

  // ── Utility ───────────────────────────────────────────────────────────────
  /** Internal helper used by the simulator. */
  _getOrder: (orderId: string) => ErrandOrder | undefined;
}

// ─── Store implementation ─────────────────────────────────────────────────────

export const useStore = create<AppState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  currentUser: null,
  adminMode: 'CUSTOMER',
  simulatorEnabled: false,
  bridgeConnected: false,
  users: SEED_USERS,
  orders: [],

  mergeRemoteOrders(remoteOrders, connected = true) {
    set((state) => {
      if (!Array.isArray(remoteOrders)) return { bridgeConnected: connected };
      const merged = new Map(state.orders.map((order) => [order.id, order]));
      let changed = state.bridgeConnected !== connected;
      for (const remote of remoteOrders) {
        if (!remote || typeof remote.id !== 'string') continue;
        const local = merged.get(remote.id);
        if (!local) {
          merged.set(remote.id, remote);
          changed = true;
          continue;
        }
        const remoteTime = Date.parse(remote.updatedAt || remote.createdAt || '') || 0;
        const localTime = Date.parse(local.updatedAt || local.createdAt || '') || 0;
        if (JSON.stringify(local) !== JSON.stringify(remote) && remoteTime >= localTime) {
          merged.set(remote.id, remote);
          changed = true;
        }
      }
      if (!changed) return state;
      return {
        orders: [...merged.values()].sort(
          (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
        ),
        bridgeConnected: connected,
      };
    });
  },

  // ── Auth ────────────────────────────────────────────────────────────────────
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

  // ── Create order ─────────────────────────────────────────────────────────
  createOrder({ category, stops, edgeCaseInstructions, attachments, distanceKm = 2.0, loadWeightKg, estHours }) {
    const { currentUser, adminMode, orders } = get();

    // When admin is acting as customer, use the demo customer id
    const customerId =
      currentUser?.role === 'ADMIN'
        ? 'u_cust_1'
        : currentUser?.id ?? 'u_cust_1';

    // Base price calculation using adjusted formula:
    // basePrice = max(80, min(distanceKm, 8) * 20 + 50 + weightKg * 5 + estHours * 80)
    const MAX_DISTANCE_KM = 8;
    const effectiveDist = Math.min(distanceKm, MAX_DISTANCE_KM);
    const distanceComponent = effectiveDist * 20 + 50; // ₹20/km + ₹50 flat
    const weightComponent = (loadWeightKg ?? 0) * 5; // ₹5 per kg
    const timeComponent = (estHours ?? 0) * 80; // ₹80 per hour
    const basePrice = Math.max(80, distanceComponent + weightComponent + timeComponent);

    const newOrder: ErrandOrder = {
      id: uid('ord'),
      customerId,
      category,
      stops: stops.map((s) => ({ ...s, id: uid('stp') })),
      edgeCaseInstructions,
      attachments,
      status: 'PLACED',
      distanceKm,
      createdAt: iso(),
      basePrice, // set bid floor
      updatedAt: iso(),
      sourceChannel: 'APP',
      threads: [],
      payments: [],
    };

    set({ orders: [...orders, newOrder] });
    return newOrder;
  },

  cancelOrder(orderId) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (['COMPLETED', 'CANCELLED'].includes(o.status)) return o;
        return { ...o, status: 'CANCELLED' };
      }),
    }));
  },

  acceptBid(orderId, threadId) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (!['PLACED', 'BIDDING'].includes(o.status)) return o;

        const winThread = o.threads.find((t) => t.id === threadId);
        if (!winThread) return o;

        const latestOffer = winThread.offers[winThread.offers.length - 1];
        if (!latestOffer || latestOffer.status !== 'PENDING') return o;

        const agreedFee = latestOffer.price;

        return {
          ...o,
          status: 'AWAITING_PAYMENT',
          agreedFee,
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

  customerCounter(orderId, threadId, price, note) {
    const state = get();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order || !order.basePrice || price < order.basePrice) return;

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

  placeBid(orderId, runnerId, runnerName, price, note) {
    const state = get();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order || !order.basePrice || price < order.basePrice) return null as any;

    const newOffer: Offer = {
      id: uid('off'),
      threadId: '',
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

  editBid(orderId, threadId, price, note) {
    const state = get();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order || !order.basePrice || price < order.basePrice) return;

    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
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
      }),
    }));
  },

  withdrawBid(orderId, threadId) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          threads: o.threads.map((t) => {
            if (t.id !== threadId) return t;
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

  dismissBid(orderId, threadId) {
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id !== orderId
          ? o
          : {
              ...o,
              threads: o.threads.map((t) =>
                t.id === threadId &&
                (t.status === 'REJECTED' || t.status === 'WITHDRAWN')
                  ? { ...t, dismissedByRunner: true }
                  : t,
              ),
            },
      ),
    }));
  },

  runnerCounter(orderId, threadId, price, note) {
    const state = get();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order || !order.basePrice || price < order.basePrice) return;

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

  runnerAcceptCounter(orderId, threadId) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        const thread = o.threads.find((t) => t.id === threadId);
        if (!thread) return o;
        const latestOffer = thread.offers[thread.offers.length - 1];
        if (!latestOffer || latestOffer.from !== 'CUSTOMER') return o;

        const agreedFee = latestOffer.price;

        return {
          ...o,
          status: 'AWAITING_PAYMENT',
          agreedFee,
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

  startOrder(orderId) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (!['ASSIGNED', 'IN_PROGRESS'].includes(o.status)) return o;
        return { ...o, status: 'IN_PROGRESS' };
      }),
    }));
  },

  submitProof({ orderId, completionPhotoUri, additionalCostPhotoUri, additionalCosts }) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (!['ASSIGNED', 'IN_PROGRESS'].includes(o.status)) return o;

        const costs = Math.max(0, Math.round(additionalCosts ?? 0));

        return {
          ...o,
          status: 'PROOF_SUBMITTED',
          completionPhotoUri,
          additionalCostPhotoUri: costs > 0 ? additionalCostPhotoUri : undefined,
          additionalCosts: costs,
        };
      }),
    }));
  },

  payTaskFee(orderId, upiRef) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status !== 'AWAITING_PAYMENT') return o;

        const payment: Payment = {
          id: uid('pay'),
          kind: 'TASK_FEE',
          amount: o.agreedFee ?? 0,
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

  // ── Approve proof ──────────────────────────────────────────────────────────
  approveProof(orderId) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status !== 'PROOF_SUBMITTED') return o;
        const hasAdditionalCosts = (o.additionalCosts ?? 0) > 0;
        return {
          ...o,
          status: hasAdditionalCosts
            ? 'AWAITING_ADDITIONAL_PAYMENT'
            : 'COMPLETED',
        };
      }),
    }));
  },

  raiseIssue(orderId) {
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId ? { ...o, issueFlagged: true } : o,
      ),
    }));
  },

  payAdditionalCosts(orderId, upiRef) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status !== 'AWAITING_ADDITIONAL_PAYMENT') return o;

        const payment: Payment = {
          id: uid('pay'),
          kind: 'ADDITIONAL_COST',
          amount: o.additionalCosts ?? 0,
          paidAt: iso(),
          upiRef,
        };

        return {
          ...o,
          status: 'COMPLETED',
          payments: [...o.payments, payment],
        };
      }),
    }));
  },

  rateOrder(orderId, rating, review) {
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId && o.status === 'COMPLETED'
          ? { ...o, rating, review }
          : o,
      ),
    }));
  },

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
      ['ASSIGNED', 'IN_PROGRESS', 'PROOF_SUBMITTED', 'AWAITING_ADDITIONAL_PAYMENT'].includes(o.status),
  );

/** Completed orders for a runner. */
export const selectRunnerDone = (
  orders: ErrandOrder[],
  runnerId: string,
): ErrandOrder[] =>
  orders.filter(
    (o) => o.assignedRunnerId === runnerId && o.status === 'COMPLETED',
  );

/** Open, withdrawn, and not-yet-dismissed rejected bid threads for a runner. */
export const selectRunnerBiddingThreads = (
  orders: ErrandOrder[],
  runnerId: string,
): { order: ErrandOrder; thread: BidThread }[] => {
  const result: { order: ErrandOrder; thread: BidThread }[] = [];
  for (const order of orders) {
    for (const thread of order.threads) {
      if (
        thread.runnerId === runnerId &&
        (thread.status === 'OPEN' ||
          ((thread.status === 'REJECTED' || thread.status === 'WITHDRAWN') &&
            !thread.dismissedByRunner))
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