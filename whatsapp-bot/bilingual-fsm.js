/**
 * TaskGo Kozhikode — Bilingual (English & Malayalam) WhatsApp Chatbot FSM
 * & Shared Omnichannel Order Engine
 *
 * Synchronizes directly with the Expo Go Mobile App (`src/store/index.ts`).
 * Supports all 6 errand categories, dynamic purchase budget caps, upfront
 * purchase-inclusive advances, overspend protection, bill reconciliation,
 * and full English ('en') + Malayalam ('ml') conversation flows.
 */

'use strict';

// ─── Categories & Localized Labels ───────────────────────────────────────────

const CATEGORIES = [
  {
    num: '1',
    id: 'Pickups & Drop-offs',
    requiresPurchaseDefault: false,
    en: 'Pickups & Drop-offs',
    ml: 'പിക്കപ്പ് & ഡ്രോപ്പ്-ഓഫ് (Pickups & Drop-offs)',
  },
  {
    num: '2',
    id: 'Store Purchases',
    requiresPurchaseDefault: true,
    en: 'Store Purchases',
    ml: 'സ്റ്റോർ പർച്ചേസുകൾ (Store Purchases)',
  },
  {
    num: '3',
    id: 'Document Work',
    requiresPurchaseDefault: false,
    en: 'Document Work',
    ml: 'ഡോക്യുമെന്റ് ജോലികൾ (Document Work)',
  },
  {
    num: '4',
    id: 'Device Repairs',
    requiresPurchaseDefault: false,
    en: 'Device Repairs',
    ml: 'ഡിവൈസ് റിപ്പയർ (Device Repairs)',
  },
  {
    num: '5',
    id: 'Urgent Business Errand',
    requiresPurchaseDefault: false,
    en: 'Urgent Business Errand',
    ml: 'അടിയന്തര ബിസിനസ്സ് ആവശ്യങ്ങൾ (Urgent Business Errand)',
  },
  {
    num: '6',
    id: 'Custom Task',
    requiresPurchaseDefault: false,
    en: 'Custom Task',
    ml: 'മറ്റ് ആവശ്യങ്ങൾ (Custom Task)',
  },
];

// Kozhikode landmarks for realistic distance estimation
const KOZHIKODE_LANDMARKS = [
  'Mananchira',
  'SM Street',
  'Mittai Theruvu',
  'Mavoor Road',
  'Beach Road',
  'Palayam',
  'Nadakkavu',
  'Medical College',
  'Railway Station',
  'Vellayil',
  'West Hill',
  'Erhippalam',
  'Civil Station',
  'KSRTC',
  'Thondayad',
  'Meenchanda',
  'Feroke',
  'Chevayur',
];

// ─── Pricing & Reconciliation Helper (Matches src/utils/pricing.ts) ──────────

function calcPayments(
  agreedFee,
  storeBillAmount = 0,
  approvedPurchaseBudget = 0,
  fundedPurchaseBudget = undefined,
) {
  const safeFee = Math.max(0, Math.round(Number(agreedFee) || 0));
  const safeBill = Math.max(0, Math.round(Number(storeBillAmount) || 0));
  const safeApprovedBudget = Math.max(0, Math.round(Number(approvedPurchaseBudget) || 0));

  const advanceAmount = Math.round(safeFee * 0.5);
  const balanceFee = safeFee - advanceAmount;
  const totalAdvancePayable = advanceAmount + safeApprovedBudget;

  const effectiveFundedBudget =
    fundedPurchaseBudget !== undefined
      ? Math.max(0, Math.round(Number(fundedPurchaseBudget) || 0))
      : safeApprovedBudget;

  const unusedPurchaseRefund = Math.max(0, effectiveFundedBudget - safeBill);
  const extraPurchaseTopUpNeeded = Math.max(0, safeBill - effectiveFundedBudget);
  const finalAdjustment = balanceFee + safeBill - effectiveFundedBudget;

  const finalBalance =
    effectiveFundedBudget > 0
      ? balanceFee + extraPurchaseTopUpNeeded
      : balanceFee + safeBill;

  const totalPayable = safeFee + safeBill;

  return {
    advanceAmount,
    balanceFee,
    approvedPurchaseBudget: safeApprovedBudget,
    totalAdvancePayable,
    fundedPurchaseBudget: effectiveFundedBudget,
    actualStoreBill: safeBill,
    unusedPurchaseRefund,
    extraPurchaseTopUpNeeded,
    finalAdjustment,
    finalBalance,
    totalPayable,
  };
}

// ─── Bilingual Dictionary (English 'en' & Malayalam 'ml') ────────────────────

const MESSAGES = {
  en: {
    welcome:
      '👋 *Welcome to TaskGo Kozhikode!*\n' +
      'Your trusted local errand partner. How can we help you today?\n\n' +
      '🌐 *Select Language / ഭാഷ തിരഞ്ഞെടുക്കുക:*\n' +
      '1️⃣ English\n' +
      '2️⃣ മലയാളം (Malayalam)\n\n' +
      'Reply with *1* or *2* (You can switch anytime by typing */language*)',

    languageSwitched: '🌐 Language set to *English*.',

    selectCategory:
      'Great! What kind of task do you need done today?\n\n' +
      '1️⃣ Pickups & Drop-offs\n' +
      '2️⃣ Store Purchases\n' +
      '3️⃣ Document Work\n' +
      '4️⃣ Device Repairs\n' +
      '5️⃣ Urgent Business Errand\n' +
      '6️⃣ Custom Task\n\n' +
      'Reply with a number (*1–6*) or type the category name.',

    invalidCategory:
      '⚠️ Please reply with a valid category number (*1* to *6*) or type *NEW* to restart.',

    askStorePurchaseDetails:
      '🛒 *Store Purchases:* Please tell us what you need bought:\n' +
      '1. *Item Name & Quantity* (e.g., 1 kg, 2 packets)\n' +
      '2. *Estimated Cost & Max Purchase Budget (₹)* (approximate money needed for the goods)\n' +
      '3. Preferred brands or substitution instructions',

    askGeneralTaskDetails: (catName) =>
      `📝 *${catName}:* Please describe your task in detail:\n` +
      '1. *What needs to be picked up, delivered, or done*\n' +
      '2. *Any special handling or edge-case instructions*\n' +
      '3. If the Task Boy needs to pay any fee or buy anything at the stop, mention the *Max Purchase Budget (₹)*',

    askPurchaseBudgetStore: (itemsSummary) =>
      `💰 *Confirm Maximum Purchase Budget (₹):*\n` +
      `For *"${itemsSummary}"*, what is the *maximum purchase amount (in ₹)* you authorize the Task Boy to spend at the store?\n\n` +
      '*(This purchase budget is funded upfront along with 50% of the service fee so the Task Boy does not pay out of pocket. Unused funds are refunded/credited after bill verification.)*\n\n' +
      'Reply with the amount in ₹ (e.g., *400*):',

    askPurchaseBudgetOptional:
      '💳 *Does this task require the Task Boy to pay for any items or fees at the stop?*\n\n' +
      '• If *NO*, reply *0* or *NO*\n' +
      '• If *YES*, reply with the *Maximum Approved Purchase Budget in ₹* (e.g., *300*)',

    invalidBudget:
      '⚠️ Please enter a valid amount in ₹ (e.g., *400*), or reply *0* if no purchase is required.',

    askPickup: (requiresPurchase) =>
      requiresPurchase
        ? '📍 *Pickup / Store Location:* Where should the Task Boy buy or collect this?\n*(Include shop name, locality, and landmark in Kozhikode)*'
        : '📍 *Pickup Location:* Where should the Task Boy start or collect the item?\n*(Include building/office name, locality, and landmark in Kozhikode)*',

    askDropoff:
      '🏁 *Drop-off Location & Contact:* Where should this be delivered?\n' +
      '*(Include address, landmark, recipient name, and phone number)*',

    confirmOrder: (draft) => {
      const budgetLine =
        draft.requiresPurchase && draft.approvedPurchaseBudget > 0
          ? draft.estimatedPurchaseCost &&
            draft.estimatedPurchaseCost !== draft.approvedPurchaseBudget
            ? `₹${draft.estimatedPurchaseCost} (Purchase budget to fund upfront: up to ₹${draft.approvedPurchaseBudget})`
            : `Up to ₹${draft.approvedPurchaseBudget} (Funded upfront)`
          : '₹0 (No purchase required — Service fee only)';

      return (
        '📋 *Please confirm your errand details:*\n' +
        '─────────────────────────\n' +
        `*Category:* ${draft.category}\n` +
        `*Task / Items:* ${draft.itemsSummary}\n` +
        `*Purchase Budget:* ${budgetLine}\n` +
        `*Instructions:* ${draft.instructions || 'Standard handling'}\n` +
        `*Pickup:* ${draft.pickupAddress}${draft.pickupLandmark ? ` (${draft.pickupLandmark})` : ''}\n` +
        `*Drop-off:* ${draft.dropoffAddress}${draft.dropoffLandmark ? ` (${draft.dropoffLandmark})` : ''}\n` +
        `*Contact:* ${draft.contactName} (${draft.contactPhone})\n` +
        '─────────────────────────\n' +
        'Reply *YES* (or *1*) to post your errand to nearby Task Boys, or reply *EDIT* (or *2*) to change.'
      );
    },

    orderPosted: (order) =>
      `✅ *Errand Posted! (Order #${order.id.toUpperCase()})*\n` +
      'We have alerted nearby Task Boys in Kozhikode. You will receive service fee quotes here shortly!',

    newBidReceived: (order, thread, offer) =>
      `🛵 *New Bid Received for #${order.id.toUpperCase()}!*\n` +
      `*Task Boy:* ${thread.runnerName}\n` +
      `*Service Fee Quote:* *₹${offer.price}*\n` +
      `*Runner Note:* _"${offer.note || 'Ready to start immediately.'}"_\n\n` +
      'Reply:\n' +
      `1️⃣ *ACCEPT* (Accept ₹${offer.price})\n` +
      '2️⃣ *COUNTER <amount>* (e.g., `COUNTER 120 Need fast delivery`)\n' +
      '3️⃣ *DECLINE*',

    runnerCounterReceived: (order, thread, offer) =>
      `🔄 *Counter-Offer from ${thread.runnerName} for #${order.id.toUpperCase()}!*\n` +
      `*Proposed Service Fee:* *₹${offer.price}*\n` +
      `*Runner Note:* _"${offer.note || 'Best possible rate for this distance.'}"_\n\n` +
      'Reply:\n' +
      `1️⃣ *ACCEPT* (Accept ₹${offer.price})\n` +
      '2️⃣ *COUNTER <amount>* (Propose a different fee)\n' +
      '3️⃣ *DECLINE*',

    askCounterAmount: (runnerName) =>
      `💬 What service fee (in ₹) would you like to counter-offer to *${runnerName}*?\n` +
      '*(Reply with the amount and optional note, e.g., `120 Need it delivered quickly`)*',

    counterSent: (price, runnerName) =>
      `💬 Counter-offer of *₹${price}* sent to *${runnerName}*. Waiting for runner response...`,

    bidDeclined: (runnerName) =>
      `❌ You declined the quote from *${runnerName}*. Waiting for other Task Boys...`,

    runnerRejectedCounter: (order, thread) =>
      `⚠️ *${thread.runnerName}* could not accept your counter-offer for *#${order.id.toUpperCase()}*. You can wait for another bid or type *NEW* to post a new errand.`,

    dealAgreedAndDepositPrompt: (order) => {
      const agreedFee = order.agreedFee || 0;
      const serviceAdvance = order.advanceAmount || Math.round(agreedFee * 0.5);
      const purchaseBudget = order.approvedPurchaseBudget || 0;
      const totalAdvance =
        order.totalAdvancePayable ?? serviceAdvance + purchaseBudget;
      const upiLink = `gpay://upi/pay?pa=taskgo@okaxis&pn=TaskGo&am=${totalAdvance}&cu=INR&tn=${encodeURIComponent(`Advance_${order.id}`)}`;

      const purchaseLines =
        purchaseBudget > 0
          ? `*50% Service Fee Advance:* ₹${serviceAdvance}\n` +
            `*Approved Purchase Budget (max):* ₹${purchaseBudget}\n` +
            `*Total Advance Due:* *₹${totalAdvance}*\n` +
            `_(The purchase budget is funded upfront. ${order.assignedRunnerName} must not spend above the ₹${purchaseBudget} approved cap without your approval and an additional confirmed payment.)_\n\n`
          : `*50% Service Fee Advance:* *₹${serviceAdvance}*\n` +
            `*Purchase Budget:* ₹0 (No store purchase required)\n` +
            `*Total Advance Due:* *₹${totalAdvance}*\n\n`;

      return (
        `🎉 *Deal Agreed!*\n` +
        `Agreed Service Fee: *₹${agreedFee}*\n` +
        `Task Boy: *${order.assignedRunnerName}*\n\n` +
        `💳 *Advance Deposit Required*\n` +
        `To dispatch *${order.assignedRunnerName}*, please pay the required advance:\n\n` +
        `Agreed Service Fee: ₹${agreedFee}\n` +
        purchaseLines +
        `🔗 Pay ₹${totalAdvance} via UPI:\n` +
        `${upiLink}\n\n` +
        `Reply *PAY* (or *1*) once completed to confirm dispatch.`
      );
    },

    advanceConfirmed: (order, upiRef) => {
      const serviceAdvance = order.advanceAmount || 0;
      const purchaseBudget = order.fundedPurchaseBudget || order.approvedPurchaseBudget || 0;
      const totalAdvance = order.totalAdvancePayable || serviceAdvance + purchaseBudget;
      const pickupAddr =
        order.stops?.find((s) => s.type === 'PICKUP')?.address || 'the pickup location';

      const breakdownText =
        purchaseBudget > 0
          ? ` (₹${serviceAdvance} service-fee advance + ₹${purchaseBudget} purchase budget)`
          : ` (₹${serviceAdvance} service-fee advance)`;

      return (
        `✅ *Payment Confirmed! (Ref: ${upiRef})*\n` +
        `Advance of *₹${totalAdvance}* received${breakdownText}.\n` +
        `🛵 *${order.assignedRunnerName} is now dispatched to ${pickupAddr}!*`
      );
    },

    milestoneArrived: (order) => {
      const pickupAddr =
        order.stops?.find((s) => s.type === 'PICKUP')?.address || 'the pickup location';
      return `📍 *Update (#${order.id.toUpperCase()}):* ${order.assignedRunnerName} has arrived at ${pickupAddr}.`;
    },

    milestoneCollected: (order) => {
      const dropoffAddr =
        order.stops?.find((s) => s.type === 'DROPOFF')?.address || 'the drop-off location';
      const itemText = order.itemsSummary || order.category;
      return order.requiresPurchase
        ? `🛍️ *Update (#${order.id.toUpperCase()}):* ${itemText} purchased! ${order.assignedRunnerName} is getting ready to head to ${dropoffAddr}.`
        : `📦 *Update (#${order.id.toUpperCase()}):* ${itemText} collected! ${order.assignedRunnerName} is getting ready to head to ${dropoffAddr}.`;
    },

    milestoneOnTheWay: (order) => {
      const dropoffAddr =
        order.stops?.find((s) => s.type === 'DROPOFF')?.address || 'your drop-off location';
      return `🛵 *Update (#${order.id.toUpperCase()}):* ${order.assignedRunnerName} is on the way to ${dropoffAddr}!`;
    },

    overspendTopUpPrompt: (order) => {
      const funded = order.fundedPurchaseBudget || order.approvedPurchaseBudget || 0;
      const actualBill = order.pendingStoreBillAmount || 0;
      const extraNeeded = order.pendingTopUpAmount || Math.max(0, actualBill - funded);
      const upiLink = `gpay://upi/pay?pa=taskgo@okaxis&pn=TaskGo&am=${extraNeeded}&cu=INR&tn=${encodeURIComponent(`TopUp_${order.id}`)}`;

      return (
        `⚠️ *Purchase Budget Cap Exceeded (#${order.id.toUpperCase()})*\n` +
        `Task Boy *${order.assignedRunnerName}* uploaded a store bill of *₹${actualBill}*, which exceeds your funded purchase cap of *₹${funded}* by *₹${extraNeeded}*.\n\n` +
        `Settlement is paused until you review:\n` +
        `🔗 Top-up Link (₹${extraNeeded}): ${upiLink}\n\n` +
        `Reply:\n` +
        `1️⃣ *TOPUP* (Approve & confirm ₹${extraNeeded} top-up payment)\n` +
        `2️⃣ *REJECT* (Decline extra spend above ₹${funded} cap)`
      );
    },

    topUpConfirmed: (order, upiRef) =>
      `✅ *Top-Up of ₹${order.fundedPurchaseBudget - (order.approvedPurchaseBudget || 0)} Confirmed! (Ref: ${upiRef})*\n` +
      `Updated Funded Purchase Budget: *₹${order.fundedPurchaseBudget}*. Proceeding to proof review.`,

    topUpDeclined: (order) =>
      `🛑 *Extra Spend Declined (#${order.id.toUpperCase()}).*\n` +
      `We have notified *${order.assignedRunnerName}* that the purchase cap remains fixed at *₹${order.fundedPurchaseBudget || order.approvedPurchaseBudget || 0}*.`,

    proofSubmitted: (order) => {
      const hasBill =
        order.requiresPurchase ||
        (order.storeBillAmount && order.storeBillAmount > 0) ||
        (order.fundedPurchaseBudget && order.fundedPurchaseBudget > 0);
      const billLines = hasBill
        ? `🧾 Store Receipt: ${order.billPhotoUri ? `[Receipt Attached: ₹${order.storeBillAmount || 0}]` : `[Verified Bill: ₹${order.storeBillAmount || 0}]`}\n` +
          `Verified Store Bill Amount: *₹${order.storeBillAmount || 0}*\n\n`
        : '';

      return (
        `🏁 *Errand Completed! Please review delivery proof (#${order.id.toUpperCase()}):*\n` +
        `📷 Package / Completion Photo: ${order.completionPhotoUri || '[Photo Attached]'}\n` +
        billLines +
        `Reply *APPROVE* (or *1*) to confirm, or *ISSUE* (or *2*) if there is a problem.`
      );
    },

    issueFlagged: (order) =>
      `⚠️ *Issue Reported for #${order.id.toUpperCase()}*\n` +
      `We have paused final settlement and alerted TaskGo Kozhikode Support. You can still reply *APPROVE* once resolved.`,

    finalSettlementPrompt: (order) => {
      const agreedFee = order.agreedFee || 0;
      const advanceFee = order.advanceAmount || Math.round(agreedFee * 0.5);
      const balanceFee = order.balanceFee ?? agreedFee - advanceFee;
      const fundedBudget = order.fundedPurchaseBudget || 0;
      const actualBill = order.storeBillAmount || 0;
      const unusedRefund =
        order.unusedPurchaseRefund ?? Math.max(0, fundedBudget - actualBill);
      const finalPaymentDue = order.finalBalance ?? balanceFee;
      const netAdjustment =
        order.finalAdjustment ?? balanceFee + actualBill - fundedBudget;

      const purchaseLines =
        fundedBudget > 0 || actualBill > 0
          ? `Purchase Budget Funded Upfront: ₹${fundedBudget}\n` +
            `Actual Store Bill: ₹${actualBill}\n` +
            `Unused Purchase Funds to Return/Credit: ₹${unusedRefund}\n`
          : '';

      const refundLine =
        unusedRefund > 0
          ? `💸 *Purchase Budget Refund/Credit: ₹${unusedRefund}*\n` +
            `_(Net final adjustment: ₹${netAdjustment}. The refund/credit and final payment are recorded separately.)_\n\n`
          : `_(Net final adjustment: ₹${netAdjustment})_\n\n`;

      const upiLink = `gpay://upi/pay?pa=taskgo@okaxis&pn=TaskGo&am=${finalPaymentDue}&cu=INR&tn=${encodeURIComponent(`Final_${order.id}`)}`;

      return (
        `🧾 *Final Settlement Breakdown (#${order.id.toUpperCase()}):*\n` +
        `Agreed Service Fee: ₹${agreedFee} (₹${advanceFee} advance + ₹${balanceFee} remaining)\n` +
        purchaseLines +
        `Remaining Service Fee Due: ₹${finalPaymentDue}\n` +
        `────────────────────────\n` +
        `💰 *Final Payment Due: ₹${finalPaymentDue}*\n` +
        refundLine +
        `Choose payment method:\n` +
        `1️⃣ *Pay via UPI Link* (${upiLink})\n` +
        `2️⃣ *Pay Cash to Task Boy*`
      );
    },

    cashSelectedWaitRunner: (order) => {
      const finalPaymentDue = order.finalBalance ?? order.balanceFee ?? 0;
      const unusedRefund = order.unusedPurchaseRefund || 0;
      const refundSentence =
        unusedRefund > 0
          ? ` The *₹${unusedRefund}* unused purchase budget will be returned/credited separately after reconciliation.`
          : '';
      return (
        `💵 You chose to pay *₹${finalPaymentDue} Cash* to *${order.assignedRunnerName}* for the remaining service fee.${refundSentence}\n` +
        `Please hand over the cash upon delivery. Waiting for ${order.assignedRunnerName} to click *"Confirm Cash Received"* in the TaskGo app...`
      );
    },

    orderCompletedAskRating: (order) => {
      const unusedRefund = order.unusedPurchaseRefund || 0;
      const refundNote =
        unusedRefund > 0
          ? `\n💸 *Refund/Credit Confirmed:* ₹${unusedRefund} unused purchase funds have been credited back to you.`
          : '';
      return (
        `🎉 *Payment Confirmed! Errand #${order.id.toUpperCase()} is Complete.*${refundNote}\n` +
        `Thank you for using TaskGo Kozhikode!\n\n` +
        `⭐ How would you rate *${order.assignedRunnerName}*? (Reply *1* to *5* stars, optionally followed by your review)`
      );
    },

    ratingSaved: (stars, runnerName) =>
      `⭐ Thank you for your *${stars}-star* rating for *${runnerName}*! Have a wonderful day.\n` +
      `_(Send *Hi* or *NEW* anytime to book another errand.)_`,

    statusSummary: (order) => {
      if (!order) {
        return 'ℹ️ You do not have an active errand right now. Reply *NEW* or *Hi* to create one!';
      }
      return (
        `📊 *Active Errand Status (#${order.id.toUpperCase()}):*\n` +
        `• *Category:* ${order.category}\n` +
        `• *Status:* ${order.status}${order.progressStep ? ` (${order.progressStep})` : ''}\n` +
        `• *Task Boy:* ${order.assignedRunnerName || 'Awaiting bids'}\n` +
        `• *Agreed Fee:* ${order.agreedFee ? `₹${order.agreedFee}` : 'Pending'}\n` +
        `• *Funded Purchase Cap:* ₹${order.fundedPurchaseBudget || order.approvedPurchaseBudget || 0}`
      );
    },

    helpText:
      '🛠️ *TaskGo WhatsApp Commands:*\n' +
      '• *NEW* or *Hi* — Start a new errand\n' +
      '• *STATUS* — Check your current errand status\n' +
      '• */language* — Switch between English & മലയാളം\n' +
      '• *CANCEL* — Cancel current errand before assignment',
  },

  ml: {
    welcome:
      '👋 *ടാസ്ക്ഗോ (TaskGo) കോഴിക്കോടിലേക്ക് സ്വാഗതം!*\n' +
      'നിങ്ങളുടെ വിശ്വസ്ത ലോക്കൽ എറാൻഡ് പങ്കാളി. ഇന്ന് ഞങ്ങൾ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?\n\n' +
      '🌐 *ഭാഷ തിരഞ്ഞെടുക്കുക / Select Language:*\n' +
      '1️⃣ English\n' +
      '2️⃣ മലയാളം (Malayalam)\n\n' +
      '*1* അല്ലെങ്കിൽ *2* എന്ന് മറുപടി നൽകുക (ഭാഷ മാറ്റാൻ എപ്പോൾ വേണമെങ്കിലും */language* എന്ന് അയയ്ക്കാം)',

    languageSwitched: '🌐 ഭാഷ *മലയാളം* ആയി ക്രമീകരിച്ചിരിക്കുന്നു.',

    selectCategory:
      'വളരെ നല്ലത്! ഏത് തരത്തിലുള്ള സഹായമാണ് ഇന്ന് നിങ്ങൾക്ക് വേണ്ടത്?\n\n' +
      '1️⃣ പിക്കപ്പ് & ഡ്രോപ്പ്-ഓഫ് (Pickups & Drop-offs)\n' +
      '2️⃣ സ്റ്റോർ പർച്ചേസുകൾ (Store Purchases)\n' +
      '3️⃣ ഡോക്യുമെന്റ് ജോലികൾ (Document Work)\n' +
      '4️⃣ ഡിവൈസ് റിപ്പയർ (Device Repairs)\n' +
      '5️⃣ അടിയന്തര ബിസിനസ്സ് ആവശ്യങ്ങൾ (Urgent Business Errand)\n' +
      '6️⃣ മറ്റ് ആവശ്യങ്ങൾ (Custom Task)\n\n' +
      '*1* മുതൽ *6* വരെയുള്ള നമ്പർ മറുപടിയായി നൽകുക.',

    invalidCategory:
      '⚠️ ദയവായി *1* മുതൽ *6* വരെയുള്ള ശരിയായ നമ്പർ നൽകുക, അല്ലെങ്കിൽ പുതിയ ഓർഡറിനായി *NEW* എന്ന് അയയ്ക്കുക.',

    askStorePurchaseDetails:
      '🛒 *സ്റ്റോർ പർച്ചേസുകൾ:* കടയിൽ നിന്ന് വാങ്ങേണ്ട സാധനങ്ങളുടെ വിവരങ്ങൾ നൽകുക:\n' +
      '1. *സാധനത്തിന്റെ പേരും അളവും* (ഉദാ: 1 kg ഹൽവ, 2 പാക്കറ്റ്)\n' +
      '2. *ഉദ്ദേശിക്കുന്ന വിലയും പരമാവധി പർച്ചേസ് ബജറ്റും (₹)*\n' +
      '3. പ്രത്യേക ബ്രാൻഡ് അല്ലെങ്കിൽ മറ്റ് നിർദ്ദേശങ്ങൾ',

    askGeneralTaskDetails: (catName) =>
      `📝 *${catName}:* ചെയ്യേണ്ട കാര്യം വിശദമായി അയയ്ക്കുക:\n` +
      '1. *എന്താണ് എടുക്കേണ്ടത് / ചെയ്യേണ്ടത്*\n' +
      '2. *പ്രത്യേക നിർദ്ദേശങ്ങൾ (Instructions)*\n' +
      '3. ടാസ്ക് ബോയ് കടയിലോ ഓഫീസിലോ എന്തെങ്കിലും തുക അടയ്ക്കേണ്ടതുണ്ടെങ്കിൽ *പരമാവധി പർച്ചേസ് ബജറ്റ് (₹)* കൂടി ഉൾപ്പെടുത്തുക',

    askPurchaseBudgetStore: (itemsSummary) =>
      `💰 *പരമാവധി പർച്ചേസ് ബജറ്റ് (₹) സ്ഥിരീകരിക്കുക:*\n` +
      `*"${itemsSummary}"* വാങ്ങുന്നതിനായി ടാസ്ക് ബോയ്ക്ക് കടയിൽ ചെലവാക്കാവുന്ന *പരമാവധി തുക (₹)* എത്രയാണ്?\n\n` +
      '*(ടാസ്ക് ബോയ് സ്വന്തം കൈയിൽ നിന്ന് പണം മുടക്കാതിരിക്കാൻ ഈ പർച്ചേസ് തുക 50% സർവീസ് ഫീ അഡ്വാൻസിനൊപ്പം മുൻകൂട്ടി നൽകേണ്ടതാണ്. ബാക്കി വരുന്ന തുക ബിൽ പരിശോധിച്ച ശേഷം തിരികെ ക്രെഡിറ്റ് ചെയ്യുന്നതാണ്.)*\n\n' +
      'തുക രൂപയിൽ (₹) മറുപടി നൽകുക (ഉദാ: *400*):',

    askPurchaseBudgetOptional:
      '💳 *ഈ ആവശ്യത്തിനായി ടാസ്ക് ബോയ് എന്തെങ്കിലും സാധനങ്ങൾ വാങ്ങുകയോ ഫീസ് അടയ്ക്കുകയോ ചെയ്യേണ്ടതുണ്ടോ?*\n\n' +
      '• *ഇല്ലെങ്കിൽ*, *0* അല്ലെങ്കിൽ *NO* എന്ന് അയയ്ക്കുക\n' +
      '• *ഉണ്ടെങ്കിൽ*, *പരമാവധി പർച്ചേസ് ബജറ്റ് (₹)* മറുപടിയായി നൽകുക (ഉദാ: *300*)',

    invalidBudget:
      '⚠️ ദയവായി ശരിയായ തുക നൽകുക (ഉദാ: *400*), അല്ലെങ്കിൽ പർച്ചേസ് ഇല്ലെങ്കിൽ *0* എന്ന് അയയ്ക്കുക.',

    askPickup: (requiresPurchase) =>
      requiresPurchase
        ? '📍 *പിക്കപ്പ് ലൊക്കേഷൻ (Pickup Location):* ടാസ്ക് ബോയ് എവിടെ നിന്നാണ് ഇത് വാങ്ങേണ്ടത്?\n*(കോഴിക്കോട്ടെ കടയുടെ പേര്, സ്ഥലം, ലാൻഡ്‌മാർക്ക് എന്നിവ ഉൾപ്പെടുത്തുക)*'
        : '📍 *പിക്കപ്പ് ലൊക്കേഷൻ (Pickup Location):* ടാസ്ക് ബോയ് എവിടെ നിന്നാണ് ഇത് എടുക്കേണ്ടത്?\n*(കെട്ടിടം/സ്ഥലം, ലാൻഡ്‌മാർക്ക് എന്നിവ ഉൾപ്പെടുത്തുക)*',

    askDropoff:
      '🏁 *ഡ്രോപ്പ്-ഓഫ് ലൊക്കേഷൻ (Drop-off Location):* ഇത് എവിടെയാണ് എത്തിക്കേണ്ടത്?\n' +
      '*(വിലാസം, ലാൻഡ്‌മാർക്ക്, സ്വീകരിക്കുന്ന ആളുടെ പേര്, ഫോൺ നമ്പർ എന്നിവ ഉൾപ്പെടുത്തുക)*',

    confirmOrder: (draft) => {
      const budgetLine =
        draft.requiresPurchase && draft.approvedPurchaseBudget > 0
          ? draft.estimatedPurchaseCost &&
            draft.estimatedPurchaseCost !== draft.approvedPurchaseBudget
            ? `₹${draft.estimatedPurchaseCost} (മുൻകൂട്ടി നൽകുന്ന പരമാവധി പർച്ചേസ് ബജറ്റ്: ₹${draft.approvedPurchaseBudget} വരെ)`
            : `₹${draft.approvedPurchaseBudget} വരെ (മുൻകൂട്ടി നൽകുന്ന പർച്ചേസ് ബജറ്റ്)`
          : '₹0 (പർച്ചേസ് ആവശ്യമില്ല — സർവീസ് ഫീ മാത്രം)';

      return (
        '📋 *നിങ്ങളുടെ ഓർഡർ വിവരങ്ങൾ പരിശോധിച്ചു സ്ഥിരീകരിക്കുക:*\n' +
        '─────────────────────────\n' +
        `*വിഭാഗം:* ${draft.category}\n` +
        `*വിവരങ്ങൾ:* ${draft.itemsSummary}\n` +
        `*പർച്ചേസ് ബജറ്റ്:* ${budgetLine}\n` +
        `*നിർദ്ദേശങ്ങൾ:* ${draft.instructions || 'സാധാരണ രീതിയിൽ'}\n` +
        `*പിക്കപ്പ്:* ${draft.pickupAddress}${draft.pickupLandmark ? ` (${draft.pickupLandmark})` : ''}\n` +
        `*ഡ്രോപ്പ്-ഓഫ്:* ${draft.dropoffAddress}${draft.dropoffLandmark ? ` (${draft.dropoffLandmark})` : ''}\n` +
        `*കോൺടാക്റ്റ്:* ${draft.contactName} (${draft.contactPhone})\n` +
        '─────────────────────────\n' +
        'ഓർഡർ പോസ്റ്റ് ചെയ്യാൻ *YES* (അല്ലെങ്കിൽ *1* / *അതെ*) എന്നും, മാറ്റം വരുത്താൻ *EDIT* (അല്ലെങ്കിൽ *2* / *മാറ്റുക*) എന്നും മറുപടി നൽകുക.'
      );
    },

    orderPosted: (order) =>
      `✅ *ഓർഡർ പോസ്റ്റ് ചെയ്തു! (Order #${order.id.toUpperCase()})*\n` +
      'കോഴിക്കോടുള്ള ടാസ്ക് ബോയ്സിനെ വിവരം അറിയിച്ചിട്ടുണ്ട്. ഉടൻ തന്നെ അവരുടെ സർവീസ് ഫീ ക്വോട്ടുകൾ ഇവിടെ ലഭിക്കും!',

    newBidReceived: (order, thread, offer) =>
      `🛵 *#${order.id.toUpperCase()} ഓർഡറിന് പുതിയ ബിഡ് ലഭിച്ചിരിക്കുന്നു!*\n` +
      `*ടാസ്ക് ബോയ്:* ${thread.runnerName}\n` +
      `*സർവീസ് ഫീ ക്വോട്ട്:* *₹${offer.price}*\n` +
      `*കുറിപ്പ്:* _"${offer.note || 'ഉടൻ തന്നെ ചെയ്യാൻ തയ്യാറാണ്.'}"_\n\n` +
      'മറുപടി നൽകുക:\n' +
      `1️⃣ *ACCEPT* (₹${offer.price} അംഗീകരിക്കുക)\n` +
      '2️⃣ *COUNTER <തുക>* (മറ്റൊരു സർവീസ് ഫീ നിർദ്ദേശിക്കാൻ, ഉദാ: `COUNTER 120`)\n' +
      '3️⃣ *DECLINE* (നിരസിക്കുക)',

    runnerCounterReceived: (order, thread, offer) =>
      `🔄 *#${order.id.toUpperCase()} ഓർഡറിനായി ${thread.runnerName} കൗണ്ടർ ഓഫർ നൽകിയിരിക്കുന്നു!*\n` +
      `*നിർദ്ദേശിച്ച സർവീസ് ഫീ:* *₹${offer.price}*\n` +
      `*കുറിപ്പ്:* _"${offer.note || 'ഈ ദൂരത്തിന് സാധ്യമായ ഏറ്റവും കുറഞ്ഞ നിരക്ക്.'}"_\n\n` +
      'മറുപടി നൽകുക:\n' +
      `1️⃣ *ACCEPT* (₹${offer.price} അംഗീകരിക്കുക)\n` +
      '2️⃣ *COUNTER <തുക>* (മറ്റൊരു തുക നിർദ്ദേശിക്കാൻ)\n' +
      '3️⃣ *DECLINE* (നിരസിക്കുക)',

    askCounterAmount: (runnerName) =>
      `💬 *${runnerName}*-ന് നിങ്ങൾ നിർദ്ദേശിക്കുന്ന കൗണ്ടർ സർവീസ് ഫീ (₹) എത്രയാണ്?\n` +
      '*(തുകയും കുറിപ്പും അയയ്ക്കുക, ഉദാ: `120 വേഗം എത്തിക്കണം`)*',

    counterSent: (price, runnerName) =>
      `💬 *₹${price}* എന്ന കൗണ്ടർ ഓഫർ *${runnerName}*-ന് അയച്ചിട്ടുണ്ട്. മറുപടിക്കായി കാത്തിരിക്കുന്നു...`,

    bidDeclined: (runnerName) =>
      `❌ *${runnerName}*-ന്റെ ക്വോട്ട് നിങ്ങൾ നിരസിച്ചു. മറ്റ് ടാസ്ക് ബോയ്സിന്റെ ബിഡുകൾക്കായി കാത്തിരിക്കുന്നു...`,

    runnerRejectedCounter: (order, thread) =>
      `⚠️ *#${order.id.toUpperCase()}* ഓർഡറിലെ നിങ്ങളുടെ കൗണ്ടർ ഓഫർ *${thread.runnerName}* നിരസിച്ചു. മറ്റ് ബിഡുകൾക്കായി കാത്തിരിക്കാം അല്ലെങ്കിൽ *NEW* എന്ന് അയയ്ക്കാം.`,

    dealAgreedAndDepositPrompt: (order) => {
      const agreedFee = order.agreedFee || 0;
      const serviceAdvance = order.advanceAmount || Math.round(agreedFee * 0.5);
      const purchaseBudget = order.approvedPurchaseBudget || 0;
      const totalAdvance =
        order.totalAdvancePayable ?? serviceAdvance + purchaseBudget;
      const upiLink = `gpay://upi/pay?pa=taskgo@okaxis&pn=TaskGo&am=${totalAdvance}&cu=INR&tn=${encodeURIComponent(`Advance_${order.id}`)}`;

      const purchaseLines =
        purchaseBudget > 0
          ? `*50% സർവീസ് ഫീ അഡ്വാൻസ്:* ₹${serviceAdvance}\n` +
            `*അംഗീകരിച്ച പർച്ചേസ് ബജറ്റ് (പരമാവധി):* ₹${purchaseBudget}\n` +
            `*ആകെ നൽകേണ്ട അഡ്വാൻസ്:* *₹${totalAdvance}*\n` +
            `_(പർച്ചേസ് ബജറ്റ് മുൻകൂട്ടി നൽകുന്നു. നിങ്ങളുടെ അനുമതിയും അധിക പേയ്മെന്റും ഇല്ലാതെ ₹${purchaseBudget}-ൽ കൂടുതൽ ചെലവാക്കാൻ ടാസ്ക് ബോയ്ക്ക് അനുവാദമില്ല.)_\n\n`
          : `*50% സർവീസ് ഫീ അഡ്വാൻസ്:* *₹${serviceAdvance}*\n` +
            `*പർച്ചേസ് ബജറ്റ്:* ₹0 (പർച്ചേസ് ഇല്ല)\n` +
            `*ആകെ നൽകേണ്ട അഡ്വാൻസ്:* *₹${totalAdvance}*\n\n`;

      return (
        `🎉 *ഡീൽ ഉറപ്പിച്ചു!*\n` +
        `അംഗീകരിച്ച സർവീസ് ഫീ: *₹${agreedFee}*\n` +
        `ടാസ്ക് ബോയ്: *${order.assignedRunnerName}*\n\n` +
        `💳 *അഡ്വാൻസ് പേയ്മെന്റ് ആവശ്യമാണ്*\n` +
        `*${order.assignedRunnerName}*-നെ അയയ്ക്കുന്നതിനായി താഴെ പറയുന്ന അഡ്വാൻസ് നൽകുക:\n\n` +
        `അംഗീകരിച്ച സർവീസ് ഫീ: ₹${agreedFee}\n` +
        purchaseLines +
        `🔗 UPI വഴി ₹${totalAdvance} അടയ്ക്കാൻ:\n` +
        `${upiLink}\n\n` +
        `പേയ്മെന്റ് പൂർത്തിയാക്കാൻ *PAY* (അല്ലെങ്കിൽ *1* / *പണമടയ്ക്കുക*) എന്ന് മറുപടി നൽകുക.`
      );
    },

    advanceConfirmed: (order, upiRef) => {
      const serviceAdvance = order.advanceAmount || 0;
      const purchaseBudget = order.fundedPurchaseBudget || order.approvedPurchaseBudget || 0;
      const totalAdvance = order.totalAdvancePayable || serviceAdvance + purchaseBudget;
      const pickupAddr =
        order.stops?.find((s) => s.type === 'PICKUP')?.address || 'പിക്കപ്പ് ലൊക്കേഷൻ';

      const breakdownText =
        purchaseBudget > 0
          ? ` (₹${serviceAdvance} സർവീസ് ഫീ അഡ്വാൻസ് + ₹${purchaseBudget} പർച്ചേസ് ബജറ്റ്)`
          : ` (₹${serviceAdvance} സർവീസ് ഫീ അഡ്വാൻസ്)`;

      return (
        `✅ *പേയ്മെന്റ് സ്ഥിരീകരിച്ചു! (Ref: ${upiRef})*\n` +
        `*₹${totalAdvance}* അഡ്വാൻസ് ലഭിച്ചു${breakdownText}.\n` +
        `🛵 *${order.assignedRunnerName} ഇപ്പോൾ ${pickupAddr} എന്ന സ്ഥലത്തേക്ക് പുറപ്പെട്ടിരിക്കുന്നു!*`
      );
    },

    milestoneArrived: (order) => {
      const pickupAddr =
        order.stops?.find((s) => s.type === 'PICKUP')?.address || 'പിക്കപ്പ് ലൊക്കേഷൻ';
      return `📍 *അപ്ഡേറ്റ് (#${order.id.toUpperCase()}):* ${order.assignedRunnerName} ${pickupAddr}-ൽ എത്തിച്ചേർന്നു.`;
    },

    milestoneCollected: (order) => {
      const dropoffAddr =
        order.stops?.find((s) => s.type === 'DROPOFF')?.address || 'ഡ്രോപ്പ്-ഓഫ് ലൊക്കേഷൻ';
      const itemText = order.itemsSummary || order.category;
      return order.requiresPurchase
        ? `🛍️ *അപ്ഡേറ്റ് (#${order.id.toUpperCase()}):* ${itemText} വാങ്ങി! ${order.assignedRunnerName} ${dropoffAddr}-ലേക്ക് പുറപ്പെടുന്നു.`
        : `📦 *അപ്ഡേറ്റ് (#${order.id.toUpperCase()}):* ${itemText} കൈപ്പറ്റി! ${order.assignedRunnerName} ${dropoffAddr}-ലേക്ക് പുറപ്പെടുന്നു.`;
    },

    milestoneOnTheWay: (order) => {
      const dropoffAddr =
        order.stops?.find((s) => s.type === 'DROPOFF')?.address || 'ഡ്രോപ്പ്-ഓഫ് ലൊക്കേഷൻ';
      return `🛵 *അപ്ഡേറ്റ് (#${order.id.toUpperCase()}):* ${order.assignedRunnerName} ${dropoffAddr}-ലേക്ക് യാത്രയിലാണ്!`;
    },

    overspendTopUpPrompt: (order) => {
      const funded = order.fundedPurchaseBudget || order.approvedPurchaseBudget || 0;
      const actualBill = order.pendingStoreBillAmount || 0;
      const extraNeeded = order.pendingTopUpAmount || Math.max(0, actualBill - funded);
      const upiLink = `gpay://upi/pay?pa=taskgo@okaxis&pn=TaskGo&am=${extraNeeded}&cu=INR&tn=${encodeURIComponent(`TopUp_${order.id}`)}`;

      return (
        `⚠️ *പർച്ചേസ് ബജറ്റിനേക്കാൾ കൂടുതൽ ബിൽ തുക (#${order.id.toUpperCase()})*\n` +
        `ടാസ്ക് ബോയ് *${order.assignedRunnerName}* അപ്‌ലോഡ് ചെയ്ത കടയിലെ ബിൽ *₹${actualBill}* ആണ്. ഇത് നിങ്ങൾ അനുവദിച്ച *₹${funded}* ബജറ്റിനേക്കാൾ *₹${extraNeeded}* കൂടുതലാണ്.\n\n` +
        `നിങ്ങളുടെ അനുമതിക്കായി സെറ്റിൽമെന്റ് നിർത്തിവെച്ചിരിക്കുന്നു:\n` +
        `🔗 ടോപ്പ്-അപ്പ് ലിങ്ക് (₹${extraNeeded}): ${upiLink}\n\n` +
        `മറുപടി നൽകുക:\n` +
        `1️⃣ *TOPUP* (₹${extraNeeded} അധിക തുക അംഗീകരിച്ച് അടയ്ക്കുക)\n` +
        `2️⃣ *REJECT* (അധിക തുക നിരസിക്കുക)`
      );
    },

    topUpConfirmed: (order, upiRef) =>
      `✅ *₹${order.fundedPurchaseBudget - (order.approvedPurchaseBudget || 0)} ടോപ്പ്-അപ്പ് സ്ഥിരീകരിച്ചു! (Ref: ${upiRef})*\n` +
      `പുതുക്കിയ പർച്ചേസ് ബജറ്റ്: *₹${order.fundedPurchaseBudget}*. പ്രൂഫ് പരിശോധനയിലേക്ക് തുടരുന്നു.`,

    topUpDeclined: (order) =>
      `🛑 *അധിക തുക നിരസിച്ചു (#${order.id.toUpperCase()}).*\n` +
      `പർച്ചേസ് പരിധി *₹${order.fundedPurchaseBudget || order.approvedPurchaseBudget || 0}* ആയി തന്നെ തുടരുമെന്ന് *${order.assignedRunnerName}*-നെ അറിയിച്ചിട്ടുണ്ട്.`,

    proofSubmitted: (order) => {
      const hasBill =
        order.requiresPurchase ||
        (order.storeBillAmount && order.storeBillAmount > 0) ||
        (order.fundedPurchaseBudget && order.fundedPurchaseBudget > 0);
      const billLines = hasBill
        ? `🧾 സ്റ്റോർ ബിൽ രസീത്: ${order.billPhotoUri ? `[Receipt Attached: ₹${order.storeBillAmount || 0}]` : `[Verified Bill: ₹${order.storeBillAmount || 0}]`}\n` +
          `യഥാർത്ഥ സ്റ്റോർ ബിൽ തുക: *₹${order.storeBillAmount || 0}*\n\n`
        : '';

      return (
        `🏁 *ഓർഡർ പൂർത്തിയായി! ഡെലിവറി പ്രൂഫ് പരിശോധിക്കുക (#${order.id.toUpperCase()}):*\n` +
        `📷 ഫോട്ടോ പ്രൂഫ്: ${order.completionPhotoUri || '[Photo Attached]'}\n` +
        billLines +
        `സ്ഥിരീകരിക്കാൻ *APPROVE* (അല്ലെങ്കിൽ *1* / *അംഗീകരിക്കുക*) എന്നും, എന്തെങ്കിലും പ്രശ്നമുണ്ടെങ്കിൽ *ISSUE* (അല്ലെങ്കിൽ *2* / *പ്രശ്നം*) എന്നും മറുപടി നൽകുക.`
      );
    },

    issueFlagged: (order) =>
      `⚠️ *#${order.id.toUpperCase()} ഓർഡറിൽ പ്രശ്നം രേഖപ്പെടുത്തിയിരിക്കുന്നു*\n` +
      `ഫൈനൽ സെറ്റിൽമെന്റ് താൽക്കാലികമായി നിർത്തിവെച്ച് ടാസ്ക്ഗോ സപ്പോർട്ടിനെ അറിയിച്ചിട്ടുണ്ട്. പ്രശ്നം പരിഹരിച്ചാൽ *APPROVE* എന്ന് അയയ്ക്കാം.`,

    finalSettlementPrompt: (order) => {
      const agreedFee = order.agreedFee || 0;
      const advanceFee = order.advanceAmount || Math.round(agreedFee * 0.5);
      const balanceFee = order.balanceFee ?? agreedFee - advanceFee;
      const fundedBudget = order.fundedPurchaseBudget || 0;
      const actualBill = order.storeBillAmount || 0;
      const unusedRefund =
        order.unusedPurchaseRefund ?? Math.max(0, fundedBudget - actualBill);
      const finalPaymentDue = order.finalBalance ?? balanceFee;
      const netAdjustment =
        order.finalAdjustment ?? balanceFee + actualBill - fundedBudget;

      const purchaseLines =
        fundedBudget > 0 || actualBill > 0
          ? `മുൻകൂട്ടി നൽകിയ പർച്ചേസ് ബജറ്റ്: ₹${fundedBudget}\n` +
            `യഥാർത്ഥ സ്റ്റോർ ബിൽ: ₹${actualBill}\n` +
            `തിരികെ ലഭിക്കുന്ന ബാക്കി പർച്ചേസ് തുക: ₹${unusedRefund}\n`
          : '';

      const refundLine =
        unusedRefund > 0
          ? `💸 *പർച്ചേസ് ബജറ്റ് റീഫണ്ട്/ക്രെഡിറ്റ്: ₹${unusedRefund}*\n` +
            `_(നെറ്റ് അഡ്ജസ്റ്റ്മെന്റ്: ₹${netAdjustment}. റീഫണ്ടും ഫൈനൽ പേയ്മെന്റും പ്രത്യേകം രേഖപ്പെടുത്തുന്നു.)_\n\n`
          : `_(നെറ്റ് അഡ്ജസ്റ്റ്മെന്റ്: ₹${netAdjustment})_\n\n`;

      const upiLink = `gpay://upi/pay?pa=taskgo@okaxis&pn=TaskGo&am=${finalPaymentDue}&cu=INR&tn=${encodeURIComponent(`Final_${order.id}`)}`;

      return (
        `🧾 *ഫൈനൽ സെറ്റിൽമെന്റ് വിവരങ്ങൾ (#${order.id.toUpperCase()}):*\n` +
        `അംഗീകരിച്ച സർവീസ് ഫീ: ₹${agreedFee} (₹${advanceFee} അഡ്വാൻസ് + ₹${balanceFee} ബാക്കി)\n` +
        purchaseLines +
        `ബാക്കി നൽകേണ്ട സർവീസ് ഫീ: ₹${finalPaymentDue}\n` +
        `────────────────────────\n` +
        `💰 *അവസാനമായി നൽകേണ്ട തുക: ₹${finalPaymentDue}*\n` +
        refundLine +
        `പേയ്മെന്റ് രീതി തിരഞ്ഞെടുക്കുക:\n` +
        `1️⃣ *UPI ലിങ്ക് വഴി അടയ്ക്കുക* (${upiLink})\n` +
        `2️⃣ *ടാസ്ക് ബോയ്ക്ക് നേരിട്ട് പണം (Cash) നൽകുക*`
      );
    },

    cashSelectedWaitRunner: (order) => {
      const finalPaymentDue = order.finalBalance ?? order.balanceFee ?? 0;
      const unusedRefund = order.unusedPurchaseRefund || 0;
      const refundSentence =
        unusedRefund > 0
          ? ` ബാക്കിയുള്ള *₹${unusedRefund}* പർച്ചേസ് ബജറ്റ് തുക പ്രത്യേകം തിരികെ ക്രെഡിറ്റ് ചെയ്യുന്നതാണ്.`
          : '';
      return (
        `💵 ബാക്കി സർവീസ് ഫീ ആയ *₹${finalPaymentDue}* നേരിട്ട് *${order.assignedRunnerName}*-ന് പണമായി (Cash) നൽകാൻ നിങ്ങൾ തിരഞ്ഞെടുത്തു.${refundSentence}\n` +
        `സാധനം ലഭിക്കുമ്പോൾ മാത്രം പണം കൈമാറുക. ടാസ്ക്ഗോ ആപ്പിൽ *${order.assignedRunnerName}* *"Confirm Cash Received"* അമർത്തുന്നതിനായി കാത്തിരിക്കുന്നു...`
      );
    },

    orderCompletedAskRating: (order) => {
      const unusedRefund = order.unusedPurchaseRefund || 0;
      const refundNote =
        unusedRefund > 0
          ? `\n💸 *റീഫണ്ട്/ക്രെഡിറ്റ് സ്ഥിരീകരിച്ചു:* ബാക്കി വന്ന ₹${unusedRefund} പർച്ചേസ് തുക നിങ്ങളുടെ അക്കൗണ്ടിലേക്ക് തിരികെ ക്രെഡിറ്റ് ചെയ്തിട്ടുണ്ട്.`
          : '';
      return (
        `🎉 *പേയ്മെന്റ് സ്ഥിരീകരിച്ചു! ഓർഡർ #${order.id.toUpperCase()} പൂർത്തിയായി.*${refundNote}\n` +
        `ടാസ്ക്ഗോ കോഴിക്കോട് ഉപയോഗിച്ചതിന് നന്ദി!\n\n` +
        `⭐ *${order.assignedRunnerName}*-ന്റെ സേവനത്തിന് *1* മുതൽ *5* വരെ സ്റ്റാർ റേറ്റിംഗ് നൽകുക (ഉദാ: *5 വളരെ നല്ല സേവനം*)`
      );
    },

    ratingSaved: (stars, runnerName) =>
      `⭐ *${runnerName}*-ന് *${stars}-സ്റ്റാർ* റേറ്റിംഗ് നൽകിയതിന് നന്ദി! ശുഭദിനം നേരുന്നു.\n` +
      `_(പുതിയ ഓർഡർ ബുക്ക് ചെയ്യാൻ എപ്പോൾ വേണമെങ്കിലും *Hi* അല്ലെങ്കിൽ *NEW* എന്ന് അയയ്ക്കുക.)_`,

    statusSummary: (order) => {
      if (!order) {
        return 'ℹ️ നിങ്ങൾക്ക് ഇപ്പോൾ സജീവമായ ഓർഡറുകൾ ഒന്നും തന്നെയില്ല. പുതിയ ഓർഡറിനായി *NEW* അല്ലെങ്കിൽ *Hi* എന്ന് അയയ്ക്കുക!';
      }
      return (
        `📊 *നിലവിലെ ഓർഡർ സ്റ്റാറ്റസ് (#${order.id.toUpperCase()}):*\n` +
        `• *വിഭാഗം:* ${order.category}\n` +
        `• *സ്റ്റാറ്റസ്:* ${order.status}${order.progressStep ? ` (${order.progressStep})` : ''}\n` +
        `• *ടാസ്ക് ബോയ്:* ${order.assignedRunnerName || 'ബിഡുകൾക്കായി കാത്തിരിക്കുന്നു'}\n` +
        `• *സർവീസ് ഫീ:* ${order.agreedFee ? `₹${order.agreedFee}` : 'തീരുമാനിച്ചിട്ടില്ല'}\n` +
        `• *പർച്ചേസ് ബജറ്റ്:* ₹${order.fundedPurchaseBudget || order.approvedPurchaseBudget || 0}`
      );
    },

    helpText:
      '🛠️ *ടാസ്ക്ഗോ വാട്ട്‌സ്ആപ്പ് കമാൻഡുകൾ:*\n' +
      '• *NEW* അല്ലെങ്കിൽ *Hi* — പുതിയ ഓർഡർ തുടങ്ങാൻ\n' +
      '• *STATUS* — നിലവിലെ ഓർഡർ വിവരങ്ങൾ അറിയാൻ\n' +
      '• */language* — ഇംഗ്ലീഷ് / മലയാളം ഭാഷ മാറ്റാൻ\n' +
      '• *CANCEL* — ഓർഡർ റദ്ദാക്കാൻ',
  },
};

// ─── Parsing Helpers ──────────────────────────────────────────────────────────

function parseAmountsFromText(text) {
  const cleaned = String(text || '');
  const currencyMatches = [];

  const explicitRegex = /(?:₹|rs\.?|inr|രൂപ)\s*(\d{2,6})/gi;
  let m;
  while ((m = explicitRegex.exec(cleaned)) !== null) {
    const val = parseInt(m[1], 10);
    if (val >= 10 && val <= 100000) {
      currencyMatches.push(val);
    }
  }

  const keywordRegex =
    /(?:budget|cost|price|max|up\s*to|cap|ബജറ്റ്|വില|പരമാവധി)\s*(?:of|is|:)?\s*(?:₹|rs\.?)?\s*(\d{2,6})/gi;
  while ((m = keywordRegex.exec(cleaned)) !== null) {
    const val = parseInt(m[1], 10);
    if (val >= 10 && val <= 100000 && !currencyMatches.includes(val)) {
      currencyMatches.push(val);
    }
  }

  if (currencyMatches.length >= 2) {
    const sorted = [...currencyMatches].sort((a, b) => a - b);
    return {
      estimatedCost: sorted[0],
      maxBudget: sorted[sorted.length - 1],
    };
  }
  if (currencyMatches.length === 1) {
    return {
      estimatedCost: currencyMatches[0],
      maxBudget: currencyMatches[0],
    };
  }
  return null;
}

function splitTaskAndInstructions(rawText) {
  const text = String(rawText || '').trim();
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return { itemsSummary: text, instructions: '' };
  }

  const firstSentence = sentences[0]
    .replace(/\b(?:estimated|approx|max)\s*(?:cost|budget).*$/i, '')
    .trim();

  const remaining = sentences
    .slice(1)
    .filter((s) => !/^(?:estimated\s+cost|max\s+budget)\s*(?:₹|rs)?\s*\d+/i.test(s))
    .join(' ');

  return {
    itemsSummary: firstSentence || text,
    instructions: remaining || text,
  };
}

function parseDropoffAndContact(rawText, fallbackName = 'Customer', fallbackPhone = '') {
  const text = String(rawText || '').trim();
  const phoneMatch = text.match(/(?:\+91[-\s]?)?([6-9]\d{9})\b/);
  const contactPhone = phoneMatch
    ? phoneMatch[1]
    : fallbackPhone.replace(/\D/g, '').slice(-10) || '9876543210';

  const landmarkMatch = text.match(/\bnear\s+([^.,\n]+)/i);
  const landmark = landmarkMatch ? `Near ${landmarkMatch[1].trim()}` : undefined;

  let contactName = fallbackName;
  const nameBeforePhone = text.match(
    /([A-Za-z\u0D00-\u0D7F\s]{2,25})[,.]?\s*(?:phone|ph|mob|contact|ഫോൺ)\s*[:\-]?\s*(?:\+91[-\s]?)?[6-9]\d{9}/i,
  );
  if (nameBeforePhone && nameBeforePhone[1]) {
    const candidate = nameBeforePhone[1]
      .replace(/^[-,.\s]+|[-,.\s]+$/g, '')
      .trim();
    if (
      candidate &&
      !/near|road|street|flat|house|kozhikode|calicut/i.test(candidate)
    ) {
      contactName = candidate;
    }
  }

  const cleanAddress = text
    .replace(/(?:phone|ph|mob|contact|ഫോൺ)?\s*[:\-]?\s*(?:\+91[-\s]?)?[6-9]\d{9}/gi, '')
    .replace(/[,.]\s*$/, '')
    .trim();

  return {
    address: cleanAddress || text,
    landmark,
    contactName,
    contactPhone,
  };
}

function parsePickupLocation(rawText) {
  const text = String(rawText || '').trim();
  const landmarkMatch = text.match(/\bnear\s+([^.,\n]+)/i);
  let landmark = landmarkMatch ? `Near ${landmarkMatch[1].trim()}` : undefined;

  if (!landmark) {
    const found = KOZHIKODE_LANDMARKS.find((lm) =>
      text.toLowerCase().includes(lm.toLowerCase()),
    );
    if (found) landmark = found;
  }

  return {
    address: text,
    landmark,
  };
}

function estimateKozhikodeDistanceKm(pickupText, dropoffText) {
  const combined = `${pickupText} ${dropoffText}`.toLowerCase();
  if (combined.includes('medical college') || combined.includes('feroke')) {
    return 5.4;
  }
  if (combined.includes('sm street') && combined.includes('nadakkavu')) {
    return 2.6;
  }
  if (combined.includes('mavoor') || combined.includes('beach')) {
    return 3.2;
  }
  return 2.5;
}

// ─── Main Omnichannel Bot & Shared State Engine Class ─────────────────────────

class TaskGoOmnichannelEngine {
  constructor(options = {}) {
    this.onSendWhatsApp = options.onSendWhatsApp || (async () => {});
    this.onStateChange = options.onStateChange || (() => {});

    /** @type {Map<string, Object>} Order ID -> ErrandOrder */
    this.orders = new Map();

    /** @type {Map<string, Object>} Phone JID -> Conversation Session */
    this.sessions = new Map();

    /** @type {Array<Object>} Chat log for web console / debugging */
    this.messageHistory = [];

    this._orderSeq = 701;
    this._uidCounter = Date.now();
  }

  _uid(prefix) {
    return `${prefix}_${(++this._uidCounter).toString(36)}`;
  }

  _nextOrderId() {
    this._orderSeq += 1;
    return `ord_${this._orderSeq}`;
  }

  _iso() {
    return new Date().toISOString();
  }

  getOrdersList() {
    return Array.from(this.orders.values()).sort((a, b) => {
      const diff = Date.parse(b.createdAt) - Date.parse(a.createdAt);
      if (diff !== 0) return diff;
      return String(b.id).localeCompare(String(a.id));
    });
  }

  getOrder(orderId) {
    if (!orderId) return undefined;
    const direct = this.orders.get(orderId);
    if (direct) return direct;
    const normalized = String(orderId)
      .toLowerCase()
      .replace(/^#/, '')
      .replace('-', '_');
    for (const [k, v] of this.orders.entries()) {
      if (k.toLowerCase().replace('-', '_') === normalized) {
        return v;
      }
    }
    return undefined;
  }

  getOrCreateSession(phone, pushName = 'Customer') {
    const cleanPhone = String(phone || '919876543210').trim();
    if (!this.sessions.has(cleanPhone)) {
      this.sessions.set(cleanPhone, {
        phone: cleanPhone,
        name: pushName || 'Customer',
        lang: 'en',
        stage: 'WELCOME',
        activeOrderId: null,
        activeThreadId: null,
        draft: {},
      });
    } else if (pushName && pushName !== 'Customer') {
      this.sessions.get(cleanPhone).name = pushName;
    }
    return this.sessions.get(cleanPhone);
  }

  async _sendBotReply(phone, text, meta = {}) {
    const cleanPhone = String(phone).trim();
    const msgRecord = {
      id: this._uid('msg'),
      phone: cleanPhone,
      direction: 'OUTBOUND',
      text,
      meta,
      timestamp: this._iso(),
    };
    this.messageHistory.push(msgRecord);
    await this.onSendWhatsApp(cleanPhone, text, meta);
    this.onStateChange({ type: 'BOT_MESSAGE', message: msgRecord });
    return text;
  }

  // ── Handle Incoming Customer WhatsApp Message ──────────────────────────────

  async handleIncomingMessage(phone, rawText, pushName = 'Customer') {
    const session = this.getOrCreateSession(phone, pushName);
    const text = String(rawText || '').trim();
    const upper = text.toUpperCase();

    const inRecord = {
      id: this._uid('msg'),
      phone: session.phone,
      direction: 'INBOUND',
      text,
      timestamp: this._iso(),
    };
    this.messageHistory.push(inRecord);
    this.onStateChange({ type: 'CUSTOMER_MESSAGE', message: inRecord });

    const replies = [];
    const reply = async (msg, meta = {}) => {
      await this._sendBotReply(session.phone, msg, meta);
      replies.push(msg);
    };

    // 1. Global Language Switch Commands
    if (
      upper === '/LANGUAGE' ||
      upper === 'LANGUAGE' ||
      upper === 'LANG' ||
      text === 'ഭാഷ'
    ) {
      session.lang = session.lang === 'en' ? 'ml' : 'en';
      await reply(MESSAGES[session.lang].languageSwitched);
      return replies;
    }
    if (upper === 'MALAYALAM' || text === 'മലയാളം') {
      session.lang = 'ml';
      await reply(MESSAGES.ml.languageSwitched);
      if (session.stage === 'WELCOME' || session.stage === 'LANGUAGE_SELECT') {
        session.stage = 'SELECT_CATEGORY';
        await reply(MESSAGES.ml.selectCategory);
      }
      return replies;
    }
    if (upper === 'ENGLISH' || text === 'ഇംഗ്ലീഷ്') {
      session.lang = 'en';
      await reply(MESSAGES.en.languageSwitched);
      if (session.stage === 'WELCOME' || session.stage === 'LANGUAGE_SELECT') {
        session.stage = 'SELECT_CATEGORY';
        await reply(MESSAGES.en.selectCategory);
      }
      return replies;
    }

    // 2. Global Help & Status Commands
    if (upper === 'HELP' || upper === '/HELP' || text === 'സഹായം') {
      await reply(MESSAGES[session.lang].helpText);
      return replies;
    }
    if (upper === 'STATUS' || upper === '/STATUS' || text === 'സ്റ്റാറ്റസ്') {
      const activeOrder = session.activeOrderId
        ? this.getOrder(session.activeOrderId)
        : null;
      await reply(MESSAGES[session.lang].statusSummary(activeOrder));
      return replies;
    }

    // 3. Global Restart / New Order Command
    if (
      upper === 'NEW' ||
      upper === '/START' ||
      upper === 'START' ||
      upper === 'RESTART'
    ) {
      session.stage = 'LANGUAGE_SELECT';
      session.draft = {};
      await reply(MESSAGES[session.lang].welcome);
      return replies;
    }

    // 4. Global Cancel Command
    if (upper === 'CANCEL' || text === 'റദ്ദാക്കുക') {
      const activeOrder = session.activeOrderId
        ? this.getOrder(session.activeOrderId)
        : null;
      if (activeOrder && !['COMPLETED', 'CANCELLED'].includes(activeOrder.status)) {
        activeOrder.status = 'CANCELLED';
        activeOrder.updatedAt = this._iso();
        this.onStateChange({ type: 'ORDER_UPDATED', order: activeOrder });
      }
      session.stage = 'SELECT_CATEGORY';
      session.draft = {};
      await reply(
        session.lang === 'ml'
          ? '❌ ഓർഡർ റദ്ദാക്കിയിരിക്കുന്നു. പുതിയ ഓർഡറിനായി താഴെ നിന്ന് തിരഞ്ഞെടുക്കുക:\n\n' +
              MESSAGES.ml.selectCategory
          : '❌ Your errand has been cancelled. You can start a new one below:\n\n' +
              MESSAGES.en.selectCategory,
      );
      return replies;
    }

    // 5. Greeting Detection when idle or completed
    const isGreeting =
      /^(hi|hello|hey|namaskaram|namaste|halo|ഹായ്|ഹലോ|നമസ്കാരം)(?:\s|$|[!.,?])/i.test(
        text,
      );
    if (
      session.stage === 'WELCOME' ||
      (isGreeting &&
        ['WELCOME', 'IDLE', 'COMPLETED'].includes(session.stage))
    ) {
      session.stage = 'LANGUAGE_SELECT';
      session.draft = {};
      await reply(MESSAGES[session.lang].welcome);
      return replies;
    }

    // ── Stage 1: Language Selection ──────────────────────────────────────────
    if (session.stage === 'LANGUAGE_SELECT') {
      if (text === '1' || /^en/i.test(text)) {
        session.lang = 'en';
        session.stage = 'SELECT_CATEGORY';
        await reply(MESSAGES.en.selectCategory);
        return replies;
      }
      if (text === '2' || /^ml|mal/i.test(text) || text.includes('മലയാളം')) {
        session.lang = 'ml';
        session.stage = 'SELECT_CATEGORY';
        await reply(MESSAGES.ml.selectCategory);
        return replies;
      }
      await reply(MESSAGES[session.lang].welcome);
      return replies;
    }

    // ── Stage 2a: Select Errand Category ─────────────────────────────────────
    if (session.stage === 'SELECT_CATEGORY') {
      const matchedCat = CATEGORIES.find(
        (c) =>
          c.num === text ||
          c.id.toLowerCase() === text.toLowerCase() ||
          text.toLowerCase().includes(c.id.split(' ')[0].toLowerCase()) ||
          c.ml.includes(text),
      );

      if (!matchedCat) {
        await reply(MESSAGES[session.lang].invalidCategory);
        return replies;
      }

      session.draft = {
        category: matchedCat.id,
        requiresPurchase: matchedCat.requiresPurchaseDefault,
      };
      session.stage = 'AWAITING_TASK_DETAILS';

      if (matchedCat.id === 'Store Purchases') {
        await reply(MESSAGES[session.lang].askStorePurchaseDetails);
      } else {
        const displayCat =
          session.lang === 'ml' ? matchedCat.ml : matchedCat.en;
        await reply(MESSAGES[session.lang].askGeneralTaskDetails(displayCat));
      }
      return replies;
    }

    // ── Stage 2b: Task / Item Details & Budget Extraction ────────────────────
    if (session.stage === 'AWAITING_TASK_DETAILS') {
      const parsedAmounts = parseAmountsFromText(text);
      const { itemsSummary, instructions } = splitTaskAndInstructions(text);

      session.draft.rawTaskText = text;
      session.draft.itemsSummary = itemsSummary;
      session.draft.instructions = instructions;

      if (parsedAmounts && parsedAmounts.maxBudget > 0) {
        session.draft.requiresPurchase = true;
        session.draft.estimatedPurchaseCost = parsedAmounts.estimatedCost;
        session.draft.approvedPurchaseBudget = parsedAmounts.maxBudget;
        session.stage = 'AWAITING_PICKUP';
        await reply(
          MESSAGES[session.lang].askPickup(session.draft.requiresPurchase),
        );
        return replies;
      }

      session.stage = 'AWAITING_PURCHASE_BUDGET';
      if (session.draft.category === 'Store Purchases') {
        await reply(
          MESSAGES[session.lang].askPurchaseBudgetStore(
            session.draft.itemsSummary,
          ),
        );
      } else {
        await reply(MESSAGES[session.lang].askPurchaseBudgetOptional);
      }
      return replies;
    }

    // ── Stage 2c: Confirm Approved Purchase Budget (₹) ───────────────────────
    if (session.stage === 'AWAITING_PURCHASE_BUDGET') {
      const isNoPurchase =
        /^(0|no|none|nil|na|ഇല്ല|വേണ്ട)(?:\s|$)/i.test(text) &&
        session.draft.category !== 'Store Purchases';

      if (isNoPurchase) {
        session.draft.requiresPurchase = false;
        session.draft.estimatedPurchaseCost = 0;
        session.draft.approvedPurchaseBudget = 0;
        session.stage = 'AWAITING_PICKUP';
        await reply(MESSAGES[session.lang].askPickup(false));
        return replies;
      }

      const parsed = parseAmountsFromText(text);
      const directNum = parseInt(text.replace(/[^\d]/g, ''), 10);
      const budgetVal =
        parsed?.maxBudget ||
        (!Number.isNaN(directNum) && directNum > 0 ? directNum : 0);

      if (!budgetVal || budgetVal <= 0) {
        await reply(MESSAGES[session.lang].invalidBudget);
        return replies;
      }

      session.draft.requiresPurchase = true;
      session.draft.estimatedPurchaseCost = parsed?.estimatedCost || budgetVal;
      session.draft.approvedPurchaseBudget = budgetVal;
      session.stage = 'AWAITING_PICKUP';
      await reply(MESSAGES[session.lang].askPickup(true));
      return replies;
    }

    // ── Stage 2d: Pickup Location ────────────────────────────────────────────
    if (session.stage === 'AWAITING_PICKUP') {
      const pickup = parsePickupLocation(text);
      session.draft.pickupAddress = pickup.address;
      session.draft.pickupLandmark = pickup.landmark;
      session.stage = 'AWAITING_DROPOFF';
      await reply(MESSAGES[session.lang].askDropoff);
      return replies;
    }

    // ── Stage 2e: Drop-off Location & Contact ────────────────────────────────
    if (session.stage === 'AWAITING_DROPOFF') {
      const dropoff = parseDropoffAndContact(
        text,
        session.name || 'Customer',
        session.phone,
      );
      session.draft.dropoffAddress = dropoff.address;
      session.draft.dropoffLandmark = dropoff.landmark;
      session.draft.contactName = dropoff.contactName;
      session.draft.contactPhone = dropoff.contactPhone;

      session.stage = 'AWAITING_CONFIRMATION';
      await reply(MESSAGES[session.lang].confirmOrder(session.draft));
      return replies;
    }

    // ── Stage 2f: Confirm & Post Errand ──────────────────────────────────────
    if (session.stage === 'AWAITING_CONFIRMATION') {
      const isYes =
        /^(yes|y|1|ok|confirm|post|അതെ|ശരി)(?:\s|$)/i.test(text);
      const isEdit =
        /^(edit|e|2|no|change|മാറ്റുക|വേണ്ട)(?:\s|$)/i.test(text);

      if (isEdit) {
        session.stage = 'SELECT_CATEGORY';
        session.draft = {};
        await reply(MESSAGES[session.lang].selectCategory);
        return replies;
      }

      if (!isYes) {
        await reply(MESSAGES[session.lang].confirmOrder(session.draft));
        return replies;
      }

      const orderId = this._nextOrderId();
      const now = this._iso();
      const draft = session.draft;
      const distanceKm = estimateKozhikodeDistanceKm(
        draft.pickupAddress,
        draft.dropoffAddress,
      );

      const budgetNote =
        draft.requiresPurchase && draft.approvedPurchaseBudget > 0
          ? `Item: ${draft.itemsSummary} | Customer has funded up to ₹${draft.approvedPurchaseBudget} for the purchase (Est. ₹${draft.estimatedPurchaseCost || draft.approvedPurchaseBudget}).`
          : `Task: ${draft.itemsSummary}`;
      const combinedInstructions =
        draft.instructions && draft.instructions !== draft.itemsSummary
          ? `${budgetNote} Note: ${draft.instructions}`
          : budgetNote;

      const newOrder = {
        id: orderId,
        customerId: 'u_cust_1',
        category: draft.category,
        stops: [
          {
            id: this._uid('stp'),
            type: 'PICKUP',
            address: draft.pickupAddress,
            landmark: draft.pickupLandmark,
          },
          {
            id: this._uid('stp'),
            type: 'DROPOFF',
            address: draft.dropoffAddress,
            landmark: draft.dropoffLandmark,
            contactName: draft.contactName,
            contactPhone: draft.contactPhone,
          },
        ],
        edgeCaseInstructions: combinedInstructions,
        status: 'PLACED',
        distanceKm,
        createdAt: now,
        updatedAt: now,
        sourceChannel: 'WHATSAPP',
        whatsappPhone: session.phone,
        customerLanguage: session.lang,
        customerName: draft.contactName || session.name,
        requiresPurchase: Boolean(draft.requiresPurchase),
        itemsSummary: draft.itemsSummary,
        estimatedPurchaseCost: draft.estimatedPurchaseCost || 0,
        approvedPurchaseBudget: draft.approvedPurchaseBudget || 0,
        fundedPurchaseBudget: 0,
        refundStatus: 'NONE',
        topUpStatus: 'NONE',
        threads: [],
        payments: [],
      };

      this.orders.set(orderId, newOrder);
      session.activeOrderId = orderId;
      session.stage = 'BIDDING';

      await reply(MESSAGES[session.lang].orderPosted(newOrder));
      this.onStateChange({ type: 'ORDER_CREATED', order: newOrder });
      return replies;
    }

    // ── Active Order Context Lookup ──────────────────────────────────────────
    const activeOrder = session.activeOrderId
      ? this.getOrder(session.activeOrderId)
      : null;

    // ── Stage 3: Bidding & Negotiation ───────────────────────────────────────
    if (
      session.stage === 'BIDDING' ||
      session.stage === 'AWAITING_COUNTER_INPUT' ||
      (activeOrder && ['PLACED', 'BIDDING'].includes(activeOrder.status))
    ) {
      if (!activeOrder) {
        session.stage = 'SELECT_CATEGORY';
        await reply(MESSAGES[session.lang].selectCategory);
        return replies;
      }

      const openThreads = (activeOrder.threads || []).filter(
        (t) => t.status === 'OPEN',
      );
      const targetThread =
        openThreads.find((t) => t.id === session.activeThreadId) ||
        openThreads[openThreads.length - 1];

      if (!targetThread) {
        await reply(
          session.lang === 'ml'
            ? `⏳ നിങ്ങളുടെ *#${activeOrder.id.toUpperCase()}* ഓർഡറിനായി ടാസ്ക് ബോയ്സിന്റെ ബിഡുകൾ ഉടൻ ലഭിക്കും. ദയവായി കാത്തിരിക്കുക.`
            : `⏳ Waiting for nearby Task Boys to place a bid on *#${activeOrder.id.toUpperCase()}*...`,
        );
        return replies;
      }

      session.activeThreadId = targetThread.id;
      const latestOffer =
        targetThread.offers[targetThread.offers.length - 1];

      if (session.stage === 'AWAITING_COUNTER_INPUT') {
        const counterMatch = text.match(/(\d{2,5})\s*(.*)/);
        if (!counterMatch) {
          await reply(
            MESSAGES[session.lang].askCounterAmount(targetThread.runnerName),
          );
          return replies;
        }
        const counterPrice = parseInt(counterMatch[1], 10);
        const counterNote =
          counterMatch[2]?.trim() || 'Customer counter-offer via WhatsApp';

        this.customerCounterOrder(
          activeOrder.id,
          targetThread.id,
          counterPrice,
          counterNote,
        );
        session.stage = 'BIDDING';
        await reply(
          MESSAGES[session.lang].counterSent(
            counterPrice,
            targetThread.runnerName,
          ),
        );
        return replies;
      }

      if (
        text === '1' ||
        /^accept(?:\s|$)/i.test(text) ||
        text.includes('സ്വീകരിക്കുക') ||
        text.includes('അംഗീകരിക്കുക')
      ) {
        this.acceptBidOrder(activeOrder.id, targetThread.id);
        session.stage = 'AWAITING_DEPOSIT';
        await reply(
          MESSAGES[session.lang].dealAgreedAndDepositPrompt(activeOrder),
        );
        return replies;
      }

      const inlineCounterMatch = text.match(
        /^(?:2|counter|കൗണ്ടർ)\s+(\d{2,5})\s*(.*)/i,
      );
      if (inlineCounterMatch) {
        const counterPrice = parseInt(inlineCounterMatch[1], 10);
        const counterNote =
          inlineCounterMatch[2]?.trim() || 'Customer counter-offer via WhatsApp';

        this.customerCounterOrder(
          activeOrder.id,
          targetThread.id,
          counterPrice,
          counterNote,
        );
        session.stage = 'BIDDING';
        await reply(
          MESSAGES[session.lang].counterSent(
            counterPrice,
            targetThread.runnerName,
          ),
        );
        return replies;
      }

      if (text === '2' || /^counter$/i.test(text) || text === 'കൗണ്ടർ') {
        session.stage = 'AWAITING_COUNTER_INPUT';
        await reply(
          MESSAGES[session.lang].askCounterAmount(targetThread.runnerName),
        );
        return replies;
      }

      if (
        text === '3' ||
        /^(decline|reject)(?:\s|$)/i.test(text) ||
        text.includes('നിരസിക്കുക')
      ) {
        this.customerRejectOfferOrder(activeOrder.id, targetThread.id);
        await reply(
          MESSAGES[session.lang].bidDeclined(targetThread.runnerName),
        );
        return replies;
      }

      if (latestOffer) {
        await reply(
          MESSAGES[session.lang].newBidReceived(
            activeOrder,
            targetThread,
            latestOffer,
          ),
        );
      }
      return replies;
    }

    // ── Stage 4: Advance Deposit Payment ─────────────────────────────────────
    if (
      session.stage === 'AWAITING_DEPOSIT' ||
      (activeOrder && activeOrder.status === 'AWAITING_DEPOSIT')
    ) {
      if (
        text === '1' ||
        /^(pay|paid|upi|done|yes|പണമടയ്ക്കുക|പേ|അടച്ചു)(?:\s|$)/i.test(text)
      ) {
        const upiRef = `UPI-${Math.floor(100000 + Math.random() * 900000)}`;
        this.payAdvanceOrder(activeOrder.id, 'UPI', upiRef);
        session.stage = 'IN_PROGRESS';
        await reply(
          MESSAGES[session.lang].advanceConfirmed(activeOrder, upiRef),
        );
        return replies;
      }

      await reply(
        MESSAGES[session.lang].dealAgreedAndDepositPrompt(activeOrder),
      );
      return replies;
    }

    // ── Stage 5 & 6a: Overspend Purchase Top-Up Approval ─────────────────────
    if (
      activeOrder &&
      activeOrder.topUpStatus === 'AWAITING_CUSTOMER_APPROVAL'
    ) {
      if (
        text === '1' ||
        /^(topup|top-up|pay|approve|yes|അതെ|ടോപ്പ്അപ്പ്)(?:\s|$)/i.test(text)
      ) {
        const upiRef = `UPI-TOPUP-${Math.floor(100000 + Math.random() * 900000)}`;
        this.approvePurchaseTopUpOrder(activeOrder.id, upiRef);
        session.stage = 'PROOF_SUBMITTED';
        await reply(MESSAGES[session.lang].topUpConfirmed(activeOrder, upiRef));
        await reply(MESSAGES[session.lang].proofSubmitted(activeOrder));
        return replies;
      }

      if (
        text === '2' ||
        /^(reject|decline|no|നിരസിക്കുക|വേണ്ട)(?:\s|$)/i.test(text)
      ) {
        this.declinePurchaseTopUpOrder(activeOrder.id);
        await reply(MESSAGES[session.lang].topUpDeclined(activeOrder));
        return replies;
      }

      await reply(MESSAGES[session.lang].overspendTopUpPrompt(activeOrder));
      return replies;
    }

    // ── Stage 6b: Proof & Bill Review ────────────────────────────────────────
    if (
      session.stage === 'PROOF_SUBMITTED' ||
      (activeOrder && activeOrder.status === 'PROOF_SUBMITTED')
    ) {
      if (
        text === '1' ||
        /^(approve|approved|ok|yes|confirm|അംഗീകരിക്കുക|ശരി)(?:\s|$)/i.test(text)
      ) {
        this.approveProofOrder(activeOrder.id);
        session.stage = 'AWAITING_FINAL_PAYMENT';
        await reply(MESSAGES[session.lang].finalSettlementPrompt(activeOrder));
        return replies;
      }

      if (
        text === '2' ||
        /^(issue|problem|dispute|പ്രശ്നം)(?:\s|$)/i.test(text)
      ) {
        this.raiseIssueOrder(activeOrder.id);
        await reply(MESSAGES[session.lang].issueFlagged(activeOrder));
        return replies;
      }

      await reply(MESSAGES[session.lang].proofSubmitted(activeOrder));
      return replies;
    }

    // ── Stage 7: Final Settlement (UPI or Cash + Refund/Credit) ──────────────
    if (
      session.stage === 'AWAITING_FINAL_PAYMENT' ||
      (activeOrder && activeOrder.status === 'AWAITING_FINAL_PAYMENT')
    ) {
      if (text === '1' || /^(upi|pay|online|യുപിഐ)(?:\s|$)/i.test(text)) {
        const upiRef = `UPI-FIN-${Math.floor(100000 + Math.random() * 900000)}`;
        this.payFinalOrder(activeOrder.id, 'UPI', upiRef);
        session.stage = 'AWAITING_RATING';
        await reply(
          MESSAGES[session.lang].orderCompletedAskRating(activeOrder),
        );
        return replies;
      }

      if (text === '2' || /^(cash|ക്യാഷ്|പണം)(?:\s|$)/i.test(text)) {
        this.payFinalOrder(activeOrder.id, 'CASH');
        session.stage = 'AWAITING_CASH_CONFIRM';
        await reply(
          MESSAGES[session.lang].cashSelectedWaitRunner(activeOrder),
        );
        return replies;
      }

      await reply(MESSAGES[session.lang].finalSettlementPrompt(activeOrder));
      return replies;
    }

    // ── Stage 8: Rating & Feedback ───────────────────────────────────────────
    if (
      session.stage === 'AWAITING_RATING' ||
      (activeOrder &&
        activeOrder.status === 'COMPLETED' &&
        activeOrder.rating === undefined)
    ) {
      const ratingMatch = text.match(/^([1-5])(?:\s+(.*))?$/);
      if (ratingMatch) {
        const stars = parseInt(ratingMatch[1], 10);
        const reviewText =
          ratingMatch[2]?.trim() || `${stars}-star rating via WhatsApp`;
        this.rateCompletedOrder(activeOrder.id, stars, reviewText);
        session.stage = 'COMPLETED';
        await reply(
          MESSAGES[session.lang].ratingSaved(
            stars,
            activeOrder.assignedRunnerName || 'Task Boy',
          ),
        );
        return replies;
      }

      await reply(MESSAGES[session.lang].orderCompletedAskRating(activeOrder));
      return replies;
    }

    if (activeOrder) {
      await reply(MESSAGES[session.lang].statusSummary(activeOrder));
      return replies;
    }

    session.stage = 'LANGUAGE_SELECT';
    await reply(MESSAGES[session.lang].welcome);
    return replies;
  }

  // ── Shared Order Mutation Methods (Called by Bot OR Synced from Expo App) ──

  placeBidOrder(orderId, runnerId, runnerName, price, note) {
    const order = this.getOrder(orderId);
    if (!order || !['PLACED', 'BIDDING'].includes(order.status)) return null;

    const offer = {
      id: this._uid('off'),
      threadId: '',
      from: 'RUNNER',
      price: Math.round(Number(price) || 0),
      note: note || '',
      createdAt: this._iso(),
      status: 'PENDING',
    };
    const thread = {
      id: this._uid('thr'),
      orderId: order.id,
      runnerId,
      runnerName,
      offers: [offer],
      status: 'OPEN',
    };
    offer.threadId = thread.id;

    order.status = 'BIDDING';
    order.threads = [...(order.threads || []), thread];
    order.updatedAt = this._iso();

    this.onStateChange({ type: 'PLACE_BID', order, thread, offer });
    return { order, thread, offer };
  }

  acceptBidOrder(orderId, threadId) {
    const order = this.getOrder(orderId);
    if (!order) return null;
    const winThread = (order.threads || []).find((t) => t.id === threadId);
    if (!winThread) return null;
    const latestOffer = winThread.offers[winThread.offers.length - 1];
    if (!latestOffer) return null;

    const agreedFee = latestOffer.price;
    const purchaseCap = order.approvedPurchaseBudget || 0;
    const { advanceAmount, balanceFee, totalAdvancePayable } = calcPayments(
      agreedFee,
      0,
      purchaseCap,
    );

    order.status = 'AWAITING_DEPOSIT';
    order.agreedFee = agreedFee;
    order.advanceAmount = advanceAmount;
    order.balanceFee = balanceFee;
    order.totalAdvancePayable = totalAdvancePayable;
    order.assignedRunnerId = winThread.runnerId;
    order.assignedRunnerName = winThread.runnerName;
    order.updatedAt = this._iso();

    order.threads = order.threads.map((t) => {
      if (t.id === threadId) {
        return {
          ...t,
          status: 'AGREED',
          offers: t.offers.map((of, idx) =>
            idx === t.offers.length - 1 ? { ...of, status: 'ACCEPTED' } : of,
          ),
        };
      }
      return { ...t, status: 'LOST' };
    });

    this.onStateChange({ type: 'ACCEPT_BID', order });
    return order;
  }

  customerCounterOrder(orderId, threadId, price, note) {
    const order = this.getOrder(orderId);
    if (!order) return null;

    order.threads = (order.threads || []).map((t) => {
      if (t.id !== threadId) return t;
      const updatedOffers = t.offers.map((of, i) =>
        i === t.offers.length - 1 ? { ...of, status: 'COUNTERED' } : of,
      );
      const newOffer = {
        id: this._uid('off'),
        threadId,
        from: 'CUSTOMER',
        price: Math.round(Number(price) || 0),
        note: note || '',
        createdAt: this._iso(),
        status: 'PENDING',
      };
      return { ...t, offers: [...updatedOffers, newOffer] };
    });
    order.updatedAt = this._iso();

    this.onStateChange({ type: 'CUSTOMER_COUNTER', order, threadId, price, note });
    return order;
  }

  customerRejectOfferOrder(orderId, threadId) {
    const order = this.getOrder(orderId);
    if (!order) return null;

    order.threads = (order.threads || []).map((t) => {
      if (t.id !== threadId) return t;
      return {
        ...t,
        status: 'REJECTED',
        offers: t.offers.map((of, i) =>
          i === t.offers.length - 1 ? { ...of, status: 'REJECTED' } : of,
        ),
      };
    });
    order.updatedAt = this._iso();

    this.onStateChange({ type: 'CUSTOMER_REJECT_OFFER', order, threadId });
    return order;
  }

  runnerAcceptCounterOrder(orderId, threadId) {
    const order = this.getOrder(orderId);
    if (!order) return null;
    const thread = (order.threads || []).find((t) => t.id === threadId);
    if (!thread) return null;
    const latestOffer = thread.offers[thread.offers.length - 1];
    if (!latestOffer) return null;

    const agreedFee = latestOffer.price;
    const purchaseCap = order.approvedPurchaseBudget || 0;
    const { advanceAmount, balanceFee, totalAdvancePayable } = calcPayments(
      agreedFee,
      0,
      purchaseCap,
    );

    order.status = 'AWAITING_DEPOSIT';
    order.agreedFee = agreedFee;
    order.advanceAmount = advanceAmount;
    order.balanceFee = balanceFee;
    order.totalAdvancePayable = totalAdvancePayable;
    order.assignedRunnerId = thread.runnerId;
    order.assignedRunnerName = thread.runnerName;
    order.updatedAt = this._iso();

    order.threads = order.threads.map((t) => {
      if (t.id === threadId) {
        return {
          ...t,
          status: 'AGREED',
          offers: t.offers.map((of, i) =>
            i === t.offers.length - 1 ? { ...of, status: 'ACCEPTED' } : of,
          ),
        };
      }
      return { ...t, status: 'LOST' };
    });

    this.onStateChange({ type: 'RUNNER_ACCEPT_COUNTER', order, threadId });
    return order;
  }

  runnerCounterOrder(orderId, threadId, price, note) {
    const order = this.getOrder(orderId);
    if (!order) return null;

    let createdOffer = null;
    let updatedThread = null;
    order.threads = (order.threads || []).map((t) => {
      if (t.id !== threadId) return t;
      const updatedOffers = t.offers.map((of, i) =>
        i === t.offers.length - 1 ? { ...of, status: 'COUNTERED' } : of,
      );
      createdOffer = {
        id: this._uid('off'),
        threadId,
        from: 'RUNNER',
        price: Math.round(Number(price) || 0),
        note: note || '',
        createdAt: this._iso(),
        status: 'PENDING',
      };
      updatedThread = { ...t, offers: [...updatedOffers, createdOffer] };
      return updatedThread;
    });
    order.updatedAt = this._iso();

    this.onStateChange({
      type: 'RUNNER_COUNTER',
      order,
      thread: updatedThread,
      offer: createdOffer,
    });
    return { order, thread: updatedThread, offer: createdOffer };
  }

  payAdvanceOrder(orderId, method = 'UPI', upiRef = 'UPI-903821') {
    const order = this.getOrder(orderId);
    if (!order || order.status !== 'AWAITING_DEPOSIT') return null;

    const serviceAdvance = order.advanceAmount || 0;
    const purchaseCap = order.approvedPurchaseBudget || 0;
    const totalAdvance =
      order.totalAdvancePayable ?? serviceAdvance + purchaseCap;

    const payment = {
      id: this._uid('pay'),
      kind: 'ADVANCE',
      amount: totalAdvance,
      method,
      paidAt: this._iso(),
      upiRef,
      serviceFeePortion: serviceAdvance,
      purchaseBudgetPortion: purchaseCap,
      note:
        purchaseCap > 0
          ? `₹${serviceAdvance} service-fee advance + ₹${purchaseCap} purchase budget`
          : `₹${serviceAdvance} service-fee advance`,
    };

    order.status = 'ASSIGNED';
    order.totalAdvancePayable = totalAdvance;
    order.fundedPurchaseBudget = purchaseCap;
    order.payments = [...(order.payments || []), payment];
    order.updatedAt = this._iso();

    this.onStateChange({ type: 'PAY_ADVANCE', order, payment });
    return order;
  }

  advanceProgressOrder(orderId, step) {
    const order = this.getOrder(orderId);
    if (!order || !['ASSIGNED', 'IN_PROGRESS'].includes(order.status)) return null;

    order.status = 'IN_PROGRESS';
    order.progressStep = step;
    order.updatedAt = this._iso();

    this.onStateChange({ type: 'ADVANCE_PROGRESS', order, step });
    return order;
  }

  submitProofOrder({ orderId, completionPhotoUri, billPhotoUri, storeBillAmount }) {
    const order = this.getOrder(orderId);
    if (!order) return null;

    const bill = Math.max(0, Math.round(Number(storeBillAmount) || 0));
    const fundedBudget =
      order.fundedPurchaseBudget ?? order.approvedPurchaseBudget ?? 0;

    if (
      (order.requiresPurchase || fundedBudget > 0) &&
      fundedBudget > 0 &&
      bill > fundedBudget
    ) {
      order.pendingStoreBillAmount = bill;
      order.pendingTopUpAmount = bill - fundedBudget;
      order.pendingCompletionPhotoUri = completionPhotoUri;
      order.pendingBillPhotoUri = billPhotoUri;
      order.topUpStatus = 'AWAITING_CUSTOMER_APPROVAL';
      order.updatedAt = this._iso();

      this.onStateChange({ type: 'OVERSPEND_TOPUP_REQUIRED', order });
      return { order, overspend: true };
    }

    const {
      unusedPurchaseRefund,
      finalAdjustment,
      finalBalance,
      totalPayable,
    } = calcPayments(
      order.agreedFee || 0,
      bill,
      order.approvedPurchaseBudget || 0,
      fundedBudget,
    );

    order.status = 'PROOF_SUBMITTED';
    order.completionPhotoUri = completionPhotoUri;
    order.billPhotoUri = billPhotoUri;
    order.storeBillAmount = bill;
    order.unusedPurchaseRefund = unusedPurchaseRefund;
    order.finalAdjustment = finalAdjustment;
    order.finalBalance = finalBalance;
    order.totalPayable = totalPayable;
    order.refundStatus = unusedPurchaseRefund > 0 ? 'PENDING_CREDIT' : 'NONE';
    order.updatedAt = this._iso();

    this.onStateChange({ type: 'SUBMIT_PROOF', order });
    return { order, overspend: false };
  }

  approvePurchaseTopUpOrder(orderId, upiRef) {
    const order = this.getOrder(orderId);
    if (!order || order.topUpStatus !== 'AWAITING_CUSTOMER_APPROVAL') return null;

    const topUpAmount = order.pendingTopUpAmount || 0;
    const newFundedBudget =
      (order.fundedPurchaseBudget || order.approvedPurchaseBudget || 0) +
      topUpAmount;
    const bill = order.pendingStoreBillAmount || newFundedBudget;

    const topUpPayment = {
      id: this._uid('pay'),
      kind: 'PURCHASE_TOPUP',
      amount: topUpAmount,
      method: 'UPI',
      paidAt: this._iso(),
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
      order.agreedFee || 0,
      bill,
      order.approvedPurchaseBudget || 0,
      newFundedBudget,
    );

    order.status = 'PROOF_SUBMITTED';
    order.fundedPurchaseBudget = newFundedBudget;
    order.storeBillAmount = bill;
    order.completionPhotoUri =
      order.pendingCompletionPhotoUri || order.completionPhotoUri;
    order.billPhotoUri = order.pendingBillPhotoUri || order.billPhotoUri;
    order.unusedPurchaseRefund = unusedPurchaseRefund;
    order.finalAdjustment = finalAdjustment;
    order.finalBalance = finalBalance;
    order.totalPayable = totalPayable;
    order.refundStatus = unusedPurchaseRefund > 0 ? 'PENDING_CREDIT' : 'NONE';
    order.topUpStatus = 'APPROVED_AND_FUNDED';
    order.pendingTopUpAmount = 0;
    order.payments = [...(order.payments || []), topUpPayment];
    order.updatedAt = this._iso();

    this.onStateChange({ type: 'APPROVE_PURCHASE_TOPUP', order });
    return order;
  }

  declinePurchaseTopUpOrder(orderId) {
    const order = this.getOrder(orderId);
    if (!order) return null;
    order.topUpStatus = 'DECLINED';
    order.pendingTopUpAmount = 0;
    order.pendingStoreBillAmount = undefined;
    order.updatedAt = this._iso();

    this.onStateChange({ type: 'DECLINE_PURCHASE_TOPUP', order });
    return order;
  }

  approveProofOrder(orderId) {
    const order = this.getOrder(orderId);
    if (!order || order.status !== 'PROOF_SUBMITTED') return null;

    order.status = 'AWAITING_FINAL_PAYMENT';
    order.updatedAt = this._iso();

    this.onStateChange({ type: 'APPROVE_PROOF', order });
    return order;
  }

  raiseIssueOrder(orderId) {
    const order = this.getOrder(orderId);
    if (!order) return null;

    order.issueFlagged = true;
    order.updatedAt = this._iso();

    this.onStateChange({ type: 'RAISE_ISSUE', order });
    return order;
  }

  payFinalOrder(orderId, method = 'UPI', upiRef = undefined) {
    const order = this.getOrder(orderId);
    if (!order || order.status !== 'AWAITING_FINAL_PAYMENT') return null;

    const finalAmount = order.finalBalance ?? order.balanceFee ?? 0;
    const refundAmount = order.unusedPurchaseRefund || 0;
    const newPayments = [...(order.payments || [])];

    newPayments.push({
      id: this._uid('pay'),
      kind: 'FINAL',
      amount: finalAmount,
      method,
      paidAt: this._iso(),
      upiRef,
      serviceFeePortion: order.balanceFee ?? finalAmount,
      note: `Remaining service fee settlement (${method})`,
    });

    if (
      method === 'UPI' &&
      refundAmount > 0 &&
      !newPayments.some((p) => p.kind === 'REFUND_CREDIT')
    ) {
      newPayments.push({
        id: this._uid('ref'),
        kind: 'REFUND_CREDIT',
        amount: refundAmount,
        method: 'WALLET_CREDIT',
        paidAt: this._iso(),
        upiRef: `REFUND-${Math.floor(100000 + Math.random() * 900000)}`,
        purchaseBudgetPortion: refundAmount,
        note: `Unused purchase budget returned/credited (Funded ₹${order.fundedPurchaseBudget} - Bill ₹${order.storeBillAmount})`,
      });
    }

    order.pendingFinalPaymentMethod = method;
    if (method === 'UPI') {
      order.status = 'COMPLETED';
      if (refundAmount > 0) order.refundStatus = 'CREDITED';
    }
    order.payments = newPayments;
    order.updatedAt = this._iso();

    this.onStateChange({ type: 'PAY_FINAL', order, method });
    return order;
  }

  confirmCashReceivedOrder(orderId) {
    const order = this.getOrder(orderId);
    if (!order || order.status !== 'AWAITING_FINAL_PAYMENT') return null;

    const newPayments = [...(order.payments || [])];
    if (!newPayments.some((p) => p.kind === 'FINAL')) {
      newPayments.push({
        id: this._uid('pay'),
        kind: 'FINAL',
        amount: order.finalBalance ?? order.balanceFee ?? 0,
        method: 'CASH',
        paidAt: this._iso(),
        serviceFeePortion: order.balanceFee ?? order.finalBalance ?? 0,
        note: 'Remaining service fee paid in Cash to Task Boy',
      });
    }

    const refundAmount = order.unusedPurchaseRefund || 0;
    if (
      refundAmount > 0 &&
      !newPayments.some((p) => p.kind === 'REFUND_CREDIT')
    ) {
      newPayments.push({
        id: this._uid('ref'),
        kind: 'REFUND_CREDIT',
        amount: refundAmount,
        method: 'WALLET_CREDIT',
        paidAt: this._iso(),
        upiRef: `REFUND-${Math.floor(100000 + Math.random() * 900000)}`,
        purchaseBudgetPortion: refundAmount,
        note: `Unused purchase budget returned/credited (Funded ₹${order.fundedPurchaseBudget} - Bill ₹${order.storeBillAmount})`,
      });
    }

    order.status = 'COMPLETED';
    if (refundAmount > 0) order.refundStatus = 'CREDITED';
    order.payments = newPayments;
    order.updatedAt = this._iso();

    this.onStateChange({ type: 'CONFIRM_CASH_RECEIVED', order });
    return order;
  }

  rateCompletedOrder(orderId, rating, review) {
    const order = this.getOrder(orderId);
    if (!order) return null;

    order.rating = Number(rating) || 5;
    order.review = review || '';
    order.updatedAt = this._iso();

    this.onStateChange({ type: 'RATE_ORDER', order });
    return order;
  }

  // ── Handle Sync Event Pushed from the Expo Go Mobile App ───────────────────

  async handleSyncFromApp(payload) {
    const { action, order: incomingOrder, extra = {} } = payload || {};
    if (!incomingOrder || !incomingOrder.id) return { ok: false };

    const previous = this.orders.get(incomingOrder.id);
    this.orders.set(incomingOrder.id, incomingOrder);

    let phone = incomingOrder.whatsappPhone || previous?.whatsappPhone;
    if (!phone) {
      const firstSession = Array.from(this.sessions.values())[0];
      if (firstSession) {
        phone = firstSession.phone;
        incomingOrder.whatsappPhone = phone;
      }
    }

    if (!phone) {
      this.onStateChange({ type: 'APP_SYNC_NO_PHONE', action, order: incomingOrder });
      return { ok: true, notifiedWhatsApp: false };
    }

    const session = this.getOrCreateSession(phone, incomingOrder.customerName);
    if (incomingOrder.customerLanguage) {
      session.lang = incomingOrder.customerLanguage;
    }
    session.activeOrderId = incomingOrder.id;
    const lang = session.lang || 'en';

    switch (action) {
      case 'PLACE_BID': {
        const threads = incomingOrder.threads || [];
        const thread =
          threads.find((t) => t.id === extra.threadId) ||
          threads[threads.length - 1];
        const offer = thread?.offers?.[thread.offers.length - 1];
        if (thread && offer) {
          session.activeThreadId = thread.id;
          session.stage = 'BIDDING';
          await this._sendBotReply(
            phone,
            MESSAGES[lang].newBidReceived(incomingOrder, thread, offer),
          );
        }
        break;
      }

      case 'RUNNER_COUNTER': {
        const threads = incomingOrder.threads || [];
        const thread =
          threads.find((t) => t.id === extra.threadId) ||
          threads[threads.length - 1];
        const offer = thread?.offers?.[thread.offers.length - 1];
        if (thread && offer) {
          session.activeThreadId = thread.id;
          session.stage = 'BIDDING';
          await this._sendBotReply(
            phone,
            MESSAGES[lang].runnerCounterReceived(incomingOrder, thread, offer),
          );
        }
        break;
      }

      case 'RUNNER_ACCEPT_COUNTER': {
        session.stage = 'AWAITING_DEPOSIT';
        await this._sendBotReply(
          phone,
          MESSAGES[lang].dealAgreedAndDepositPrompt(incomingOrder),
        );
        break;
      }

      case 'RUNNER_REJECT_COUNTER': {
        const thread = (incomingOrder.threads || []).find(
          (t) => t.id === extra.threadId,
        );
        if (thread) {
          await this._sendBotReply(
            phone,
            MESSAGES[lang].runnerRejectedCounter(incomingOrder, thread),
          );
        }
        break;
      }

      case 'ADVANCE_PROGRESS': {
        const step = extra.step || incomingOrder.progressStep;
        session.stage = 'IN_PROGRESS';
        if (step === 'ARRIVED') {
          await this._sendBotReply(
            phone,
            MESSAGES[lang].milestoneArrived(incomingOrder),
          );
        } else if (step === 'ITEMS_PURCHASED_OR_COLLECTED') {
          await this._sendBotReply(
            phone,
            MESSAGES[lang].milestoneCollected(incomingOrder),
          );
        } else if (step === 'ON_THE_WAY') {
          await this._sendBotReply(
            phone,
            MESSAGES[lang].milestoneOnTheWay(incomingOrder),
          );
        }
        break;
      }

      case 'OVERSPEND_TOPUP_REQUIRED': {
        session.stage = 'OVERSPEND_TOPUP_REQUIRED';
        await this._sendBotReply(
          phone,
          MESSAGES[lang].overspendTopUpPrompt(incomingOrder),
        );
        break;
      }

      case 'SUBMIT_PROOF': {
        if (incomingOrder.topUpStatus === 'AWAITING_CUSTOMER_APPROVAL') {
          session.stage = 'OVERSPEND_TOPUP_REQUIRED';
          await this._sendBotReply(
            phone,
            MESSAGES[lang].overspendTopUpPrompt(incomingOrder),
          );
        } else {
          session.stage = 'PROOF_SUBMITTED';
          await this._sendBotReply(
            phone,
            MESSAGES[lang].proofSubmitted(incomingOrder),
            {
              completionPhotoUri: incomingOrder.completionPhotoUri,
              billPhotoUri: incomingOrder.billPhotoUri,
            },
          );
        }
        break;
      }

      case 'CONFIRM_CASH_RECEIVED': {
        session.stage = 'AWAITING_RATING';
        await this._sendBotReply(
          phone,
          MESSAGES[lang].orderCompletedAskRating(incomingOrder),
        );
        break;
      }

      default:
        break;
    }

    this.onStateChange({ type: 'APP_SYNC', action, order: incomingOrder });
    return { ok: true, notifiedWhatsApp: true };
  }
}

module.exports = {
  TaskGoOmnichannelEngine,
  calcPayments,
  CATEGORIES,
  MESSAGES,
  parseAmountsFromText,
};