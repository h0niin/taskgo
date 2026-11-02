// ─── Pricing & Purchase Budget Reconciliation Helper ─────────────────────────
// Implements Section 3 of the TaskGo Omnichannel Specification:
// 1. Service-fee advance = Math.round(agreedFee * 0.5)
// 2. Remaining service fee (balanceFee) = agreedFee - advanceAmount
// 3. Purchase budget portion = 100% of customer-approved max purchase budget funded upfront
// 4. totalAdvancePayable = advanceAmount + approvedPurchaseBudget
// 5. finalAdjustment = balanceFee + actualStoreBill - fundedPurchaseBudget
// 6. unusedPurchaseRefund = Math.max(0, fundedPurchaseBudget - actualStoreBill)

export interface PaymentCalculationResult {
  /** 50% of agreed runner service fee */
  advanceAmount: number;
  /** Remaining 50% of agreed runner service fee */
  balanceFee: number;
  /** Customer-approved max purchase budget (0 for non-purchase errands) */
  approvedPurchaseBudget: number;
  /** Total upfront advance payable = advanceAmount + approvedPurchaseBudget */
  totalAdvancePayable: number;
  /** Purchase funds actually funded upfront (including any confirmed top-up) */
  fundedPurchaseBudget: number;
  /** Verified store receipt amount (0 if non-purchase) */
  actualStoreBill: number;
  /** Unused purchase funds to return/credit to customer */
  unusedPurchaseRefund: number;
  /** Extra top-up required if actualStoreBill > fundedPurchaseBudget */
  extraPurchaseTopUpNeeded: number;
  /** Net reconciliation: balanceFee + actualStoreBill - fundedPurchaseBudget */
  finalAdjustment: number;
  /** Final payment due from customer at settlement (remaining service fee + any unfunded bill) */
  finalBalance: number;
  /** Customer's net total spend across the errand (agreedFee + actualStoreBill) */
  totalPayable: number;
}

export function calcPayments(
  agreedFee: number,
  storeBillAmount: number = 0,
  approvedPurchaseBudget: number = 0,
  fundedPurchaseBudget?: number,
): PaymentCalculationResult {
  const safeFee = Math.max(0, Math.round(agreedFee || 0));
  const safeBill = Math.max(0, Math.round(storeBillAmount || 0));
  const safeApprovedBudget = Math.max(0, Math.round(approvedPurchaseBudget || 0));

  const advanceAmount = Math.round(safeFee * 0.5);
  const balanceFee = safeFee - advanceAmount;

  const totalAdvancePayable = advanceAmount + safeApprovedBudget;

  // If fundedPurchaseBudget is explicitly passed, use it; otherwise default to safeApprovedBudget
  const effectiveFundedBudget =
    fundedPurchaseBudget !== undefined
      ? Math.max(0, Math.round(fundedPurchaseBudget))
      : safeApprovedBudget;

  const unusedPurchaseRefund = Math.max(0, effectiveFundedBudget - safeBill);
  const extraPurchaseTopUpNeeded = Math.max(0, safeBill - effectiveFundedBudget);

  // Spec formula: finalAdjustment = balanceFee + actualStoreBill - fundedPurchaseBudget
  const finalAdjustment = balanceFee + safeBill - effectiveFundedBudget;

  // When purchase budget was funded upfront (effectiveFundedBudget > 0):
  // - Remaining service fee due is balanceFee (plus any unfunded bill if not yet topped up)
  // - Unused purchase budget is recorded & refunded/credited separately
  // When no purchase budget was funded upfront (legacy/non-purchase order with a bill):
  // - finalBalance includes balanceFee + safeBill
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