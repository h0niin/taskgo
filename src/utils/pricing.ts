// ─── Pricing Helpers ──────────────────────────────────────────────────────────
// Section 6 of SPEC.md.
// Single configurable constant; all values round to whole ₹.

/** Percentage of the agreed fee charged as an advance (50%). */
export const ADVANCE_PCT = 50;

/** Platform commission percentage (0% — runner keeps 100% of the fee). */
export const PLATFORM_COMMISSION_PCT = 0;

/**
 * Round a number to the nearest whole rupee.
 * Uses Math.round (standard rounding, not ceiling).
 */
export const toRupees = (n: number): number => Math.round(n);

/**
 * Calculate all derived payment amounts from the agreed fee and store bill.
 *
 * @param agreedFee       - locked service fee after negotiation (₹)
 * @param storeBillAmount - actual shop receipt amount fronted by runner (₹, 0 if none)
 */
export function calcPayments(agreedFee: number, storeBillAmount = 0) {
  const advanceAmount  = toRupees((agreedFee * ADVANCE_PCT) / 100);
  const balanceFee     = agreedFee - advanceAmount;
  const finalBalance   = balanceFee + storeBillAmount;
  const totalPayable   = agreedFee + storeBillAmount;

  return {
    advanceAmount,
    balanceFee,
    finalBalance,
    totalPayable,
  };
}

/**
 * Quick helper: just the advance amount.
 */
export const calcAdvance = (agreedFee: number): number =>
  toRupees((agreedFee * ADVANCE_PCT) / 100);

