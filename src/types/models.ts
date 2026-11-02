// ─── Data Models ─────────────────────────────────────────────────────────────
// Mirrors Section 10 of SPEC.md + Omnichannel WhatsApp & Purchase Budget Spec.

export type UserRole = 'CUSTOMER' | 'TASKBOY' | 'ADMIN';

export type SupportedLanguage = 'en' | 'ml';

export type OrderSourceChannel = 'APP' | 'WHATSAPP';

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

// ─── Payments & Reconciliation Ledger ─────────────────────────────────────────

export type PaymentKind =
  | 'ADVANCE'
  | 'FINAL'
  | 'PURCHASE_TOPUP'
  | 'REFUND_CREDIT';

export interface Payment {
  id: string;
  kind: PaymentKind;
  amount: number;
  method: 'UPI' | 'CASH' | 'WALLET_CREDIT';
  paidAt: string; // ISO 8601
  upiRef?: string;
  /** Breakdown for purchase-inclusive advance or reconciliation */
  serviceFeePortion?: number;
  purchaseBudgetPortion?: number;
  note?: string;
}

export type RefundStatus = 'NONE' | 'PENDING_CREDIT' | 'CREDITED';

export type TopUpStatus =
  | 'NONE'
  | 'AWAITING_CUSTOMER_APPROVAL'
  | 'APPROVED_AND_FUNDED'
  | 'DECLINED';

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
  updatedAt?: string; // ISO 8601 for omnichannel sync

  // Omnichannel metadata
  sourceChannel?: OrderSourceChannel;
  whatsappPhone?: string;
  customerLanguage?: SupportedLanguage;
  customerName?: string;

  // Purchase Budget & Goods Cost (Section 3 of Spec)
  requiresPurchase?: boolean;
  itemsSummary?: string;
  estimatedPurchaseCost?: number;
  /** Customer-approved max purchase budget funded upfront */
  approvedPurchaseBudget?: number;
  /** Actual purchase budget funded upfront (+ any confirmed top-up) */
  fundedPurchaseBudget?: number;
  /** Total upfront deposit = 50% service fee advance + approvedPurchaseBudget */
  totalAdvancePayable?: number;

  // Bidding
  threads: BidThread[];

  // Post-agreement
  assignedRunnerId?: string;
  assignedRunnerName?: string;
  agreedFee?: number;
  /** 50% of agreedFee (service-fee advance portion) */
  advanceAmount?: number;
  /** Remaining 50% of agreedFee */
  balanceFee?: number;

  // Proof & Bill Reconciliation
  completionPhotoUri?: string;
  billPhotoUri?: string;
  storeBillAmount?: number;
  /** Unused purchase budget to return/credit: max(0, fundedPurchaseBudget - storeBillAmount) */
  unusedPurchaseRefund?: number;
  /** Net reconciliation formula: balanceFee + actualStoreBill - fundedPurchaseBudget */
  finalAdjustment?: number;
  refundStatus?: RefundStatus;

  // Overspend Protection / Mid-Errand Top-Up Guard
  pendingStoreBillAmount?: number;
  pendingTopUpAmount?: number;
  pendingCompletionPhotoUri?: string;
  pendingBillPhotoUri?: string;
  topUpStatus?: TopUpStatus;

  // Payments
  payments: Payment[];
  /** Remaining service fee due at final settlement (or balance + unapproved bill in legacy mode) */
  finalBalance?: number;
  /** Net total payable by customer across the errand: agreedFee + storeBillAmount */
  totalPayable?: number;
  /** Selected final payment method when waiting for runner cash confirmation */
  pendingFinalPaymentMethod?: 'UPI' | 'CASH';

  // Resolution
  issueFlagged?: boolean;
  rating?: number;
  review?: string;
}

// ─── App-level UI state ───────────────────────────────────────────────────────

/** Which UI side the admin is currently acting as */
export type AdminMode = 'CUSTOMER' | 'TASKBOY';