// ─── Seed Data ───────────────────────────────────────────────────────────────
// Section 11 of SPEC.md:
//  • 3 named users (customer, runner, admin) + 2 extra runner personas
//  • 5 open orders in Kozhikode (varied categories, one with 3 stops)
//  • 1 order already BIDDING with 2 threads + counter-offers
//  • 1 order in PROOF_SUBMITTED
//  • 1 COMPLETED order

import type {
  BidThread,
  ErrandOrder,
  Offer,
  Payment,
  User,
} from '../types/models';

// ─── Users ────────────────────────────────────────────────────────────────────

export const SEED_USERS: User[] = [
  {
    id: 'u_cust_1',
    name: 'Arjun Menon',
    email: 'customer@taskgo.in',
    password: 'customer123',
    role: 'CUSTOMER',
    phone: '9876543210',
  },
  {
    id: 'u_run_1',
    name: 'Rahul Das',
    email: 'runner@taskgo.in',
    password: 'runner123',
    role: 'TASKBOY',
    phone: '9567891234',
  },
  {
    id: 'u_admin_1',
    name: 'Priya Nair',
    email: 'admin@taskgo.in',
    password: 'admin123',
    role: 'ADMIN',
    phone: '9447112233',
  },
  // Extra runner personas for competing bids / simulator
  {
    id: 'u_run_2',
    name: 'Vishnu Krishnan',
    email: 'vishnu@taskgo.in',
    password: 'runner123',
    role: 'TASKBOY',
    phone: '9562341234',
  },
  {
    id: 'u_run_3',
    name: 'Sreekanth P',
    email: 'sreekanth@taskgo.in',
    password: 'runner123',
    role: 'TASKBOY',
    phone: '9544219876',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _offerSeq = 0;
const oid = () => `off_${++_offerSeq}`;

let _threadSeq = 0;
const tid = () => `thr_${++_threadSeq}`;

let _paySeq = 0;
const pid = () => `pay_${++_paySeq}`;

/** ISO strings relative to "now" for a consistent demo */
const ago = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

// ─── Orders ───────────────────────────────────────────────────────────────────

// ── 1. PLACED ─────────────────────────────────────────────────────────────────
const order1: ErrandOrder = {
  id: 'ord_001',
  customerId: 'u_cust_1',
  category: 'Store Purchases',
  stops: [
    {
      id: 'stp_001a',
      type: 'PICKUP',
      address: 'Mananchira Square, Kozhikode',
      landmark: 'Near the fountain',
      contactName: 'Arjun',
      contactPhone: '9876543210',
    },
    {
      id: 'stp_001b',
      type: 'DROPOFF',
      address: 'Nadakkavu, Kozhikode',
      landmark: 'Opposite KSRTC Bus Stop',
    },
  ],
  edgeCaseInstructions:
    'Buy 2 kg basmati rice (Kohinoor brand), 1 litre Milma milk, and a pack of Britannia biscuits from the store near Mananchira. Call me before purchasing if unsure.',
  status: 'PLACED',
  distanceKm: 2.3,
  createdAt: ago(5),
  threads: [],
  payments: [],
};

// ── 2. PLACED ─────────────────────────────────────────────────────────────────
const order2: ErrandOrder = {
  id: 'ord_002',
  customerId: 'u_cust_1',
  category: 'Document Work',
  stops: [
    {
      id: 'stp_002a',
      type: 'PICKUP',
      address: 'Palayam, Kozhikode',
      landmark: 'Near Palayam Police Station',
      contactName: 'Arjun',
      contactPhone: '9876543210',
    },
    {
      id: 'stp_002b',
      type: 'DROPOFF',
      address: 'Kallai Road, Kozhikode',
      landmark: 'Timber Depot area, 3rd building',
    },
  ],
  edgeCaseInstructions:
    'Collect signed land documents from Mr. Suresh at Palayam and deliver them to the Kallai office. Handle with care — do not fold. Get a photo of handover.',
  status: 'PLACED',
  distanceKm: 3.8,
  createdAt: ago(12),
  threads: [],
  payments: [],
};

// ── 3. PLACED — 3 stops ──────────────────────────────────────────────────────
const order3: ErrandOrder = {
  id: 'ord_003',
  customerId: 'u_cust_1',
  category: 'Pickups & Drop-offs',
  stops: [
    {
      id: 'stp_003a',
      type: 'PICKUP',
      address: 'Beach Road, Kozhikode',
      landmark: 'Near Kozhikode Beach entrance',
      contactName: 'Arjun',
      contactPhone: '9876543210',
    },
    {
      id: 'stp_003b',
      type: 'STOP',
      address: 'Mavoor Road, Kozhikode',
      landmark: 'Opposite SBI Bank',
      contactName: 'Suresh Kumar',
      contactPhone: '9447000111',
    },
    {
      id: 'stp_003c',
      type: 'DROPOFF',
      address: 'Medical College, Kozhikode',
      landmark: 'Main gate, give to security desk',
    },
  ],
  edgeCaseInstructions:
    'Pick up a parcel from Beach Road, stop at Mavoor Road to collect a signed letter from Suresh, then deliver both to Medical College security desk. Urgent — patient documents.',
  status: 'PLACED',
  distanceKm: 6.1,
  createdAt: ago(18),
  threads: [],
  payments: [],
};

// ── 4. PLACED ─────────────────────────────────────────────────────────────────
const order4: ErrandOrder = {
  id: 'ord_004',
  customerId: 'u_cust_1',
  category: 'Device Repairs',
  stops: [
    {
      id: 'stp_004a',
      type: 'PICKUP',
      address: 'Feroke, Kozhikode',
      landmark: 'Near Feroke Railway Station',
      contactName: 'Arjun',
      contactPhone: '9876543210',
    },
    {
      id: 'stp_004b',
      type: 'DROPOFF',
      address: 'Mavoor Road, Kozhikode',
      landmark: 'iCare Mobile Service Centre',
    },
  ],
  edgeCaseInstructions:
    'Collect my iPhone 13 from home and drop it at the iCare service centre on Mavoor Road. Tell them it has a cracked screen. Get the job card number and WhatsApp it to me.',
  status: 'PLACED',
  distanceKm: 4.5,
  createdAt: ago(30),
  threads: [],
  payments: [],
};

// ── 5. PLACED ─────────────────────────────────────────────────────────────────
const order5: ErrandOrder = {
  id: 'ord_005',
  customerId: 'u_cust_1',
  category: 'Urgent Business Errand',
  stops: [
    {
      id: 'stp_005a',
      type: 'PICKUP',
      address: 'Palayam, Kozhikode',
      landmark: 'Near Zain Hotel',
      contactName: 'Arjun',
      contactPhone: '9876543210',
    },
    {
      id: 'stp_005b',
      type: 'DROPOFF',
      address: 'Mananchira, Kozhikode',
      landmark: 'District Collectorate building',
    },
  ],
  edgeCaseInstructions:
    'Deliver a sealed tender envelope to the Collectorate tender box before 3 PM. Time-sensitive. Call me immediately once dropped.',
  status: 'PLACED',
  distanceKm: 1.9,
  createdAt: ago(8),
  threads: [],
  payments: [],
};

// ── 6. BIDDING — two threads with counter-offers ──────────────────────────────

const offer_b1_1: Offer = {
  id: oid(),
  threadId: 'thr_b1',
  from: 'RUNNER',
  price: 120,
  note: 'Heavy rain along Mavoor Road & long shop queue expected.',
  createdAt: ago(25),
  status: 'COUNTERED',
};

const offer_b1_2: Offer = {
  id: oid(),
  threadId: 'thr_b1',
  from: 'CUSTOMER',
  price: 90,
  note: 'Queue should be short at this hour. Can you do ₹90?',
  createdAt: ago(20),
  status: 'COUNTERED',
};

const offer_b1_3: Offer = {
  id: oid(),
  threadId: 'thr_b1',
  from: 'RUNNER',
  price: 105,
  note: 'Final offer — petrol costs are up this week.',
  createdAt: ago(15),
  status: 'PENDING',
};

const thread_b1: BidThread = {
  id: 'thr_b1',
  orderId: 'ord_006',
  runnerId: 'u_run_1',
  runnerName: 'Rahul Das',
  offers: [offer_b1_1, offer_b1_2, offer_b1_3],
  status: 'OPEN',
};

const offer_b2_1: Offer = {
  id: oid(),
  threadId: 'thr_b2',
  from: 'RUNNER',
  price: 100,
  note: 'I know the exact shop — will be quick.',
  createdAt: ago(22),
  status: 'PENDING',
};

const thread_b2: BidThread = {
  id: 'thr_b2',
  orderId: 'ord_006',
  runnerId: 'u_run_2',
  runnerName: 'Vishnu Krishnan',
  offers: [offer_b2_1],
  status: 'OPEN',
};

const order6: ErrandOrder = {
  id: 'ord_006',
  customerId: 'u_cust_1',
  category: 'Store Purchases',
  stops: [
    {
      id: 'stp_006a',
      type: 'PICKUP',
      address: 'Nadakkavu, Kozhikode',
      landmark: 'Big Bazaar Mall',
      contactName: 'Arjun',
      contactPhone: '9876543210',
    },
    {
      id: 'stp_006b',
      type: 'DROPOFF',
      address: 'Palayam, Kozhikode',
      landmark: 'Near Palayam Tower junction',
    },
  ],
  edgeCaseInstructions:
    'Buy 500g cashews (unsalted) and 1 kg dates from the dry-fruits section inside Big Bazaar. Keep the bill. Do NOT buy salted cashews.',
  status: 'BIDDING',
  distanceKm: 2.8,
  createdAt: ago(40),
  threads: [thread_b1, thread_b2],
  payments: [],
};

// ── 7. PROOF_SUBMITTED ────────────────────────────────────────────────────────

const thread_ps: BidThread = {
  id: 'thr_ps',
  orderId: 'ord_007',
  runnerId: 'u_run_1',
  runnerName: 'Rahul Das',
  offers: [
    {
      id: oid(),
      threadId: 'thr_ps',
      from: 'RUNNER',
      price: 80,
      note: 'Short distance — quick delivery guaranteed.',
      createdAt: ago(120),
      status: 'ACCEPTED',
    },
  ],
  status: 'AGREED',
};

const payment_ps_fee: Payment = {
  id: pid(),
  kind: 'TASK_FEE',
  amount: 80,
  paidAt: ago(100),
  upiRef: 'UPI202610DEMO01',
};

const order7: ErrandOrder = {
  id: 'ord_007',
  customerId: 'u_cust_1',
  category: 'Pickups & Drop-offs',
  stops: [
    {
      id: 'stp_007a',
      type: 'PICKUP',
      address: 'Beach Road, Kozhikode',
      landmark: 'Sweet Magic bakery',
      contactName: 'Arjun',
      contactPhone: '9876543210',
    },
    {
      id: 'stp_007b',
      type: 'DROPOFF',
      address: 'Mananchira, Kozhikode',
      landmark: 'Opposite HDFC Bank',
    },
  ],
  edgeCaseInstructions: 'Pick up a birthday cake and deliver it carefully. Do not tilt.',
  status: 'PROOF_SUBMITTED',
  distanceKm: 1.6,
  createdAt: ago(150),
  threads: [thread_ps],
  assignedRunnerId: 'u_run_1',
  assignedRunnerName: 'Rahul Das',
  agreedFee: 80,
  additionalCosts: 450,
  completionPhotoUri: 'https://picsum.photos/seed/proof007/400/300',
  additionalCostPhotoUri: 'https://picsum.photos/seed/bill007/400/300',
  payments: [payment_ps_fee],
};

// ── 8. COMPLETED ──────────────────────────────────────────────────────────────

const thread_done: BidThread = {
  id: 'thr_done',
  orderId: 'ord_008',
  runnerId: 'u_run_2',
  runnerName: 'Vishnu Krishnan',
  offers: [
    {
      id: oid(),
      threadId: 'thr_done',
      from: 'RUNNER',
      price: 150,
      note: 'Long route via Feroke — need petrol allowance.',
      createdAt: ago(300),
      status: 'ACCEPTED',
    },
  ],
  status: 'AGREED',
};

const payment_done_fee: Payment = {
  id: pid(),
  kind: 'TASK_FEE',
  amount: 150,
  paidAt: ago(280),
  upiRef: 'UPI202610DEMO02',
};

const payment_done_additional: Payment = {
  id: pid(),
  kind: 'ADDITIONAL_COST',
  amount: 200,
  paidAt: ago(220),
  upiRef: 'UPI202610DEMO03',
};

const thread_done_ps: BidThread = {
  ...thread_done,
};

const order8: ErrandOrder = {
  id: 'ord_008',
  customerId: 'u_cust_1',
  category: 'Store Purchases',
  stops: [
    {
      id: 'stp_008a',
      type: 'PICKUP',
      address: 'Feroke, Kozhikode',
      landmark: 'Near railway station',
      contactName: 'Arjun',
      contactPhone: '9876543210',
    },
    {
      id: 'stp_008b',
      type: 'DROPOFF',
      address: 'Kallai Road, Kozhikode',
      landmark: 'House #42, near the mosque',
    },
  ],
  edgeCaseInstructions:
    'Purchase 5 kg rice, cooking oil 1 litre, and 2 coconuts from the local market near Feroke. Keep all bills.',
  status: 'COMPLETED',
  distanceKm: 5.2,
  createdAt: ago(320),
  threads: [thread_done_ps],
  assignedRunnerId: 'u_run_2',
  assignedRunnerName: 'Vishnu Krishnan',
  agreedFee: 150,
  additionalCosts: 200,
  completionPhotoUri: 'https://picsum.photos/seed/proof008/400/300',
  additionalCostPhotoUri: 'https://picsum.photos/seed/bill008/400/300',
  payments: [payment_done_fee, payment_done_additional],
  rating: 4,
  review: 'Fast delivery, very professional. Will use again!',
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const SEED_ORDERS: ErrandOrder[] = [
  order1,
  order2,
  order3,
  order4,
  order5,
  order6,
  order7,
  order8,
];

export const ORDER_CATEGORIES = [
  'Pickups & Drop-offs',
  'Store Purchases',
  'Document Work',
  'Device Repairs',
  'Urgent Business Errand',
  'Custom Task',
] as const;

export type OrderCategory = (typeof ORDER_CATEGORIES)[number];

