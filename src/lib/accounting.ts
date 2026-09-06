import type { Transaction, Customer, Supplier, DailyClose, CashEntry } from '@/types';
import { isToday } from './format';

export interface DaySummary {
  sales: number;
  purchases: number;
  customerPayments: number;
  supplierPayments: number;
  expenses: number;
  withdrawals: number;
  loansGiven: number;
  loansRepaid: number;
  damageLoss: number;
  netCashIn: number;
  netCashOut: number;
  transactionCount: number;
}

export function summarizeDay(transactions: Transaction[], dateIso: string): DaySummary {
  const day = transactions.filter((t) => t.datetime.slice(0, 10) === dateIso);
  return summarizeTransactions(day);
}

export function summarizeToday(transactions: Transaction[]): DaySummary {
  const today = transactions.filter((t) => isToday(t.datetime));
  return summarizeTransactions(today);
}

export function summarizeTransactions(list: Transaction[]): DaySummary {
  const s: DaySummary = {
    sales: 0,
    purchases: 0,
    customerPayments: 0,
    supplierPayments: 0,
    expenses: 0,
    withdrawals: 0,
    loansGiven: 0,
    loansRepaid: 0,
    damageLoss: 0,
    netCashIn: 0,
    netCashOut: 0,
    transactionCount: list.length,
  };
  for (const t of list) {
    switch (t.type) {
      case 'SALE':
        s.sales += t.amount;
        s.netCashIn += t.paidAmount ?? 0;
        break;
      case 'CUSTOMER_PAYMENT':
        s.customerPayments += t.amount;
        s.netCashIn += t.amount;
        break;
      case 'LOAN_REPAID':
        s.loansRepaid += t.amount;
        s.netCashIn += t.amount;
        break;
      case 'PURCHASE':
        s.purchases += t.amount;
        s.netCashOut += t.paidAmount ?? 0;
        break;
      case 'SUPPLIER_PAYMENT':
        s.supplierPayments += t.amount;
        s.netCashOut += t.amount;
        break;
      case 'EXPENSE':
        s.expenses += t.amount;
        s.netCashOut += t.amount;
        break;
      case 'OWNER_WITHDRAWAL':
        s.withdrawals += t.amount;
        s.netCashOut += t.amount;
        break;
      case 'LOAN_GIVEN':
        s.loansGiven += t.amount;
        s.netCashOut += t.amount;
        break;
      case 'DAMAGE_LOSS':
        s.damageLoss += t.amount;
        break;
      default:
        break;
    }
  }
  return s;
}

export function totalCustomerDue(customers: Customer[]): number {
  return customers.reduce((sum, c) => sum + c.due, 0);
}

export function totalSupplierPayable(suppliers: Supplier[]): number {
  return suppliers.reduce((sum, s) => sum + s.payable, 0);
}

export type ProfitTier = 'confirmed' | 'estimated' | 'unknown';

export interface ProfitBreakdown {
  /** Total sales revenue across all tiers */
  revenue: number;
  /** Revenue from sales where every item has a known cost price */
  confirmedRevenue: number;
  /** Cost of goods for confirmed sales */
  confirmedCost: number;
  /** Confirmed profit = confirmedRevenue - confirmedCost */
  confirmedProfit: number;
  /** Revenue from sales where some cost info exists but is incomplete */
  estimatedRevenue: number;
  /** Partial cost for estimated sales */
  estimatedCost: number;
  /** Estimated profit = estimatedRevenue - estimatedCost (clearly labeled as estimate) */
  estimatedProfit: number;
  /** Revenue from sales with no cost data at all — profit cannot be calculated */
  unknownRevenue: number;
  /** Count of sales in each tier */
  confirmedCount: number;
  estimatedCount: number;
  unknownCount: number;
  /** Business expenses (always known) */
  expenses: number;
  /** Damage/loss (always known) */
  damage: number;
  /** Net profit = confirmedProfit + estimatedProfit - expenses - damage. Unknown tier excluded. */
  netProfit: number;
}

/**
 * Profit analysis that NEVER assumes a margin when cost data is missing.
 * Each sale is classified:
 *   - confirmed:  all items have known cost price → reliable profit
 *   - estimated:  some items have cost, others don't → labeled estimate
 *   - unknown:    no cost info at all → profit not calculated, shown as "জানা নেই"
 * Owner withdrawals and loans are NOT expenses and are excluded.
 */
export function analyzeProfit(
  transactions: Transaction[],
  products: { name: string; costPrice?: number; salePrice?: number }[],
): ProfitBreakdown {
  const costMap = new Map<string, number | undefined>();
  for (const p of products) {
    costMap.set(p.name.toLowerCase(), p.costPrice);
    for (const alias of (p as { aliases?: string[] }).aliases ?? []) {
      costMap.set(alias.toLowerCase(), p.costPrice);
    }
  }

  let confirmedRevenue = 0;
  let confirmedCost = 0;
  let confirmedCount = 0;
  let estimatedRevenue = 0;
  let estimatedCost = 0;
  let estimatedCount = 0;
  let unknownRevenue = 0;
  let unknownCount = 0;
  let expenses = 0;
  let damage = 0;

  for (const t of transactions) {
    if (t.type === 'SALE') {
      const items = t.items ?? [];
      if (items.length === 0) {
        // No item detail at all — cost is unknown
        unknownRevenue += t.amount;
        unknownCount++;
        continue;
      }
      let allKnown = true;
      let anyKnown = false;
      let saleCost = 0;
      for (const item of items) {
        const cp = costMap.get(item.name.toLowerCase());
        if (cp !== undefined && cp > 0) {
          const qty = item.quantity ?? 1;
          saleCost += cp * qty;
          anyKnown = true;
        } else {
          allKnown = false;
        }
      }
      if (allKnown) {
        confirmedRevenue += t.amount;
        confirmedCost += saleCost;
        confirmedCount++;
      } else if (anyKnown) {
        estimatedRevenue += t.amount;
        estimatedCost += saleCost;
        estimatedCount++;
      } else {
        unknownRevenue += t.amount;
        unknownCount++;
      }
    } else if (t.type === 'EXPENSE') {
      expenses += t.amount;
    } else if (t.type === 'DAMAGE_LOSS') {
      damage += t.amount;
    }
  }

  const confirmedProfit = confirmedRevenue - confirmedCost;
  const estimatedProfit = estimatedRevenue - estimatedCost;
  const revenue = confirmedRevenue + estimatedRevenue + unknownRevenue;
  const netProfit = confirmedProfit + estimatedProfit - expenses - damage;

  return {
    revenue,
    confirmedRevenue,
    confirmedCost,
    confirmedProfit,
    estimatedRevenue,
    estimatedCost,
    estimatedProfit,
    unknownRevenue,
    confirmedCount,
    estimatedCount,
    unknownCount,
    expenses,
    damage,
    netProfit,
  };
}

export function computeExpectedCash(
  openingCash: number,
  transactions: Transaction[],
  upToIso: string,
): number {
  let cash = openingCash;
  for (const t of transactions) {
    if (t.datetime.slice(0, 10) > upToIso) continue;
    switch (t.type) {
      case 'SALE':
        cash += t.paidAmount ?? 0;
        break;
      case 'CUSTOMER_PAYMENT':
      case 'LOAN_REPAID':
        cash += t.amount;
        break;
      case 'PURCHASE':
        cash -= t.paidAmount ?? 0;
        break;
      case 'SUPPLIER_PAYMENT':
      case 'EXPENSE':
      case 'OWNER_WITHDRAWAL':
      case 'LOAN_GIVEN':
        cash -= t.amount;
        break;
      default:
        break;
    }
  }
  return cash;
}

export function cashBalanceFromEntries(entries: CashEntry[]): number {
  return entries.reduce((sum, e) => {
    if (e.type === 'CASH_IN' || e.type === 'ADJUSTMENT') return sum + e.amount;
    return sum - e.amount;
  }, 0);
}

export interface MonthSummary {
  month: string;
  sales: number;
  purchases: number;
  expenses: number;
  withdrawals: number;
  profit: number;
  closing: DailyClose | null;
}

export function summarizeMonth(transactions: Transaction[], yearMonth: string): MonthSummary {
  const monthTx = transactions.filter((t) => t.datetime.slice(0, 7) === yearMonth);
  const s = summarizeTransactions(monthTx);
  return {
    month: yearMonth,
    sales: s.sales,
    purchases: s.purchases,
    expenses: s.expenses,
    withdrawals: s.withdrawals,
    profit: 0,
    closing: null,
  };
}
