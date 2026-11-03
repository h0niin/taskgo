// ─── Demo Simulator ───────────────────────────────────────────────────────────
// Section 12 of SPEC.md.
// Simulates runner responses on a single device without a real backend.
// All actions dispatch through the same store actions as real users.

import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { getAdminServerUrl } from '../utils/adminBridge';
import type { ErrandOrder } from '../types/models';

const SIMULATED_RUNNER_ID = 'u_run_2';
const SIMULATED_RUNNER_NAME = 'Vishnu Krishnan';

const MOCK_REASONING_NOTES = [
  'Near Mavoor Road right now. Can pick up immediately.',
  'Know the exact store in Nadakkavu, will avoid long queues.',
  'Taking Beach Road bypass, fast delivery guaranteed.',
  'On two-wheeler near Mananchira, ready to head over.',
];

/**
 * Hook to run background simulation logic.
 * Mount this once in the root app component.
 */
export function useSimulator() {
  const currentUser = useStore((s) => s.currentUser);
  const adminMode = useStore((s) => s.adminMode);
  const simulatorEnabled = useStore((s) => s.simulatorEnabled);
  const orders = useStore((s) => s.orders);

  const placeBid = useStore((s) => s.placeBid);
  const runnerAcceptCounter = useStore((s) => s.runnerAcceptCounter);
  const runnerCounter = useStore((s) => s.runnerCounter);
  const submitProof = useStore((s) => s.submitProof);

  // Track timer IDs to avoid duplicate execution
  const activeTimers = useRef<Set<string>>(new Set());

  // Keep the mobile app and local operations dashboard on a shared live order list.
  useEffect(() => {
    let active = true;
    let pushTimer: ReturnType<typeof setTimeout> | undefined;
    const baseUrl = getAdminServerUrl();
    const lastSent = new Map<string, string>();

    const pushChangedOrders = (currentOrders: ErrandOrder[]) => {
      const changed = currentOrders.filter((order) => {
        const snapshot = JSON.stringify(order);
        return lastSent.get(order.id) !== snapshot;
      }).map((order) => ({
        ...order,
        updatedAt: new Date().toISOString(),
      }));
      if (!changed.length) return;
      if (pushTimer) clearTimeout(pushTimer);
      pushTimer = setTimeout(() => {
        void fetch(`${baseUrl}/api/orders/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: changed }),
        }).then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          for (const order of changed) lastSent.set(order.id, JSON.stringify(order));
        }).catch(() => {
          if (active) useStore.setState({ bridgeConnected: false });
          if (active) {
            pushTimer = setTimeout(() => pushChangedOrders(useStore.getState().orders), 2000);
          }
        });
      }, 120);
    };

    const unsubscribe = useStore.subscribe((state) => pushChangedOrders(state.orders));

    const poll = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/orders`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as { orders?: ErrandOrder[] };
        if (active && Array.isArray(data.orders)) {
          useStore.getState().mergeRemoteOrders(data.orders, true);
        }
      } catch {
        if (active) useStore.setState({ bridgeConnected: false });
      }
    };

    void poll();
    const pollTimer = setInterval(() => void poll(), 2000);
    return () => {
      active = false;
      unsubscribe();
      clearInterval(pollTimer);
      if (pushTimer) clearTimeout(pushTimer);
    };
  }, []);

  useEffect(() => {
    if (!simulatorEnabled) return;

    // Rule: When real runner persona is actively in use, do not simulate for it
    const isRealRunnerActive =
      currentUser?.role === 'TASKER' ||
      (currentUser?.role === 'DUAL' && adminMode === 'TASKER');

    orders.forEach((order) => {
      // ── 1. Auto-place bid on PLACED order after 5-8s ───────────────────────
      if (order.status === 'PLACED' || order.status === 'BIDDING') {
        const hasSimBid = order.threads.some(
          (t) => t.runnerId === SIMULATED_RUNNER_ID,
        );
        const timerKey = `bid_${order.id}`;

        if (!hasSimBid && !activeTimers.current.has(timerKey)) {
          activeTimers.current.add(timerKey);

          const delay = 5000 + Math.random() * 2500; // 5 - 7.5s
          setTimeout(() => {
            activeTimers.current.delete(timerKey);
            // Verify order is still in PLACED or BIDDING before bidding
            const currentOrder = useStore.getState().orders.find((o) => o.id === order.id);
            if (currentOrder && ['PLACED', 'BIDDING'].includes(currentOrder.status)) {
              // Use order.basePrice as bid floor
              const basePrice = currentOrder.basePrice ?? 60;
              const plausiblePrice = Math.round(
                Math.max(basePrice, currentOrder.distanceKm * 24 + 40),
              );
              const note =
                MOCK_REASONING_NOTES[
                  Math.floor(Math.random() * MOCK_REASONING_NOTES.length)
                ];

              placeBid(
                order.id,
                SIMULATED_RUNNER_ID,
                SIMULATED_RUNNER_NAME,
                plausiblePrice,
                note,
              );
            }
          }, delay);
        }
      }

      // ── 2. Respond to Customer Counter on simulated thread after 4-6s ───────
      const simThread = order.threads.find(
        (t) => t.runnerId === SIMULATED_RUNNER_ID && t.status === 'OPEN',
      );

      if (simThread && simThread.offers.length > 0) {
        const latestOffer = simThread.offers[simThread.offers.length - 1];

        if (latestOffer.status === 'PENDING' && latestOffer.from === 'CUSTOMER') {
          const timerKey = `counter_${simThread.id}_${latestOffer.id}`;

          if (!activeTimers.current.has(timerKey)) {
            activeTimers.current.add(timerKey);

            const delay = 4000 + Math.random() * 2000; // 4 - 6s
            setTimeout(() => {
              activeTimers.current.delete(timerKey);

              const currentOrder = useStore.getState().orders.find((o) => o.id === order.id);
              const currentThread = currentOrder?.threads.find(
                (t) => t.id === simThread.id && t.status === 'OPEN',
              );
              const currentLatest =
                currentThread?.offers[currentThread.offers.length - 1];

              if (
                currentLatest &&
                currentLatest.id === latestOffer.id &&
                currentLatest.status === 'PENDING'
              ) {
                // Find runner's previous price
                const previousRunnerOffers = currentThread.offers.filter(
                  (o) => o.from === 'RUNNER',
                );
                const lastRunnerOffer =
                  previousRunnerOffers[previousRunnerOffers.length - 1];
                const lastRunnerPrice = lastRunnerOffer ? lastRunnerOffer.price : latestOffer.price * 1.2;

                const customerPrice = latestOffer.price;

                // SPEC Rule: accepts if counter is >= 85% of last price, otherwise midpoint
                if (customerPrice >= 0.85 * lastRunnerPrice) {
                  runnerAcceptCounter(order.id, simThread.id);
                } else {
                  const midPoint = Math.round((lastRunnerPrice + customerPrice) / 2);
                  runnerCounter(
                    order.id,
                    simThread.id,
                    midPoint,
                    `I can meet halfway at ₹${midPoint} to cover petrol along Kozhikode route.`,
                  );
                }
              }
            }, delay);
          }
        }
      }

      // ── 3. Auto-submit completion proof for simulated assigned runner ──────
      if (
        (order.status === 'ASSIGNED' || order.status === 'IN_PROGRESS') &&
        order.assignedRunnerId === SIMULATED_RUNNER_ID
      ) {
        const timerKey = `proof_${order.id}`;

        if (!activeTimers.current.has(timerKey)) {
          activeTimers.current.add(timerKey);

          setTimeout(() => {
            activeTimers.current.delete(timerKey);

            const currentOrder = useStore.getState().orders.find((o) => o.id === order.id);
            if (!currentOrder || currentOrder.assignedRunnerId !== SIMULATED_RUNNER_ID) return;

            const hasAdditionalCosts = currentOrder.category === 'Store Purchases';
            submitProof({
              orderId: currentOrder.id,
              completionPhotoUri: 'https://picsum.photos/seed/proof_sim/400/300',
              additionalCostPhotoUri: hasAdditionalCosts
                ? 'https://picsum.photos/seed/bill_sim/400/300'
                : undefined,
              additionalCosts: hasAdditionalCosts ? 220 : undefined,
            });
          }, 9000);
        }
      }
    });
  }, [orders, simulatorEnabled, currentUser, adminMode]);
}

/**
 * Fast-forward helper for debugging (SPEC Section 12 "Skip ahead" button)
 */
export function skipSimulationAhead(orderId: string) {
  const state = useStore.getState();
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;

  if (order.status === 'ASSIGNED' || order.status === 'IN_PROGRESS') {
    const hasAdditionalCosts = order.category === 'Store Purchases';
    state.submitProof({
      orderId,
      completionPhotoUri: 'https://picsum.photos/seed/proof_skip/400/300',
      additionalCostPhotoUri: hasAdditionalCosts
        ? 'https://picsum.photos/seed/bill_skip/400/300'
        : undefined,
      additionalCosts: hasAdditionalCosts ? 250 : undefined,
    });
  }
}