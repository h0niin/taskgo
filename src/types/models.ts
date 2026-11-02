// ─── Data Models ─────────────────────────────────────────────────────────────
// Mirrors Section 10 of SPEC.md exactly.

export type UserRole = 'CUSTOMER' | 'TASKER' | 'ADMIN';

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
  | 'AWAITING_PAYMENT'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PROOF_SUBMITTED'
  | 'AWAITING_ADDITIONAL_PAYMENT'
  | 'COMPLETED'
  | 'CANCELLED';

// ─── Locations ────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

export interface LocationStop {
  id: string;
  type: 'PICKUP' | 'DROPOFF' | 'STOP';
  address: string;
  landmark?: string;
  contactName?: string;
  contactPhone?: string;
  lat?: number;
  lng?: number;
}

// ─── Bidding & Negotiation ────────────────────────────────────────────────────

export interface Offer {
  id: string;
  threadId: string;
  from: 'CUSTOMER' | 'RUNNER';
  price: number;
  note: string;
  createdAt: string; // ISO 8601
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
}

export interface BidThread {
  id: string;
  orderId: string;
  runnerId: string;
  runnerName: string;
  offers: Offer[];
  status: 'OPEN' | 'AGREED' | 'LOST' | 'REJECTED' | 'WITHDRAWN';
  dismissedByRunner?: boolean;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  kind: 'TASK_FEE' | 'ADDITIONAL_COST';
  amount: number;
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
  itemsSummary?: string;
  /** Optional reference photos attached when the errand was posted. */
  attachments?: string[];
  status: OrderStatus;
  distanceKm: number;
  createdAt: string; // ISO 8601
  basePrice?: number; // bid floor derived from distance/weight/time
  updatedAt?: string;
  sourceChannel?: 'APP' | 'WHATSAPP' | 'ADMIN';
  assignmentMode?: 'BIDDING' | 'ADMIN_FIXED';

  // Bidding
  threads: BidThread[];

  // Post-agreement
  assignedRunnerId?: string;
  assignedRunnerName?: string;
  agreedFee?: number;

  // Proof
  completionPhotoUri?: string;
  additionalCostPhotoUri?: string;
  additionalCosts?: number;

  // Payments
  payments: Payment[];

  // Resolution
  issueFlagged?: boolean;
  rating?: number;
  review?: string;
}

// ─── App-level UI state ───────────────────────────────────────────────────────

/** Which UI side the admin is currently acting as */
export type AdminMode = 'CUSTOMER' | 'TASKER';