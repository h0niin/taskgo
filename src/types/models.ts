// ─── Data Models ─────────────────────────────────────────────────────────────
// Mirrors Section 10 of SPEC.md exactly.

export type UserRole = 'CUSTOMER' | 'TASKBOY' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // stored plaintext — demo only, no real auth
  role: UserRole;
  phone?: string;
}

// ─── Order lifecycle ──────────────────────────────────────────────────────────

export type OrderStatus =
  | 'PLACED'
  | 'BIDDING'
  | 'AGREED'
  | 'AWAITING_DEPOSIT'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PROOF_SUBMITTED'
  | 'AWAITING_FINAL_PAYMENT'
  | 'COMPLETED'
  | 'CANCELLED';

/** Sub-steps while an order is IN_PROGRESS */
export type ProgressStep =
  | 'ARRIVED'
  | 'ITEMS_PURCHASED_OR_COLLECTED'
  | 'ON_THE_WAY';

// ─── Locations ────────────────────────────────────────────────────────────────

export interface LocationStop {
  id: string;
  type: 'PICKUP' | 'DROPOFF' | 'STOP';
  address: string;
  landmark?: string;
  contactName?: string;
  contactPhone?: string;
}

// ─── Bidding & Negotiation ────────────────────────────────────────────────────

export interface Offer {
  id: string;
  threadId: string;
  from: 'CUSTOMER' | 'RUNNER';
  price: number;
  note: string;
  createdAt: string; // ISO 8601
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED';
}

export interface BidThread {
  id: string;
  orderId: string;
  runnerId: string;
  runnerName: string;
  offers: Offer[];
  status: 'OPEN' | 'AGREED' | 'LOST' | 'REJECTED' | 'WITHDRAWN';
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  kind: 'ADVANCE' | 'FINAL';
  amount: number;
  method: 'UPI' | 'CASH';
  paidAt: string; // ISO 8601
  upiRef?: string;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export interface ErrandOrder {
  id: string;
  customerId: string;
  category: string;
  stops: LocationStop[];
  edgeCaseInstructions: string;
  status: OrderStatus;
  progressStep?: ProgressStep;
  distanceKm: number;
  createdAt: string; // ISO 8601

  // Bidding
  threads: BidThread[];

  // Post-agreement
  assignedRunnerId?: string;
  assignedRunnerName?: string;
  agreedFee?: number;
  advanceAmount?: number;
  balanceFee?: number;

  // Proof
  completionPhotoUri?: string;
  billPhotoUri?: string;
  storeBillAmount?: number;

  // Payments
  payments: Payment[];
  finalBalance?: number;
  totalPayable?: number;

  // Resolution
  issueFlagged?: boolean;
  rating?: number;
  review?: string;
}

// ─── App-level UI state ───────────────────────────────────────────────────────

/** Which UI side the admin is currently acting as */
export type AdminMode = 'CUSTOMER' | 'TASKBOY';

