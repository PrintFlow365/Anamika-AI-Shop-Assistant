// Core data models for the AI Shop Assistant.
// These types are backend-agnostic and map cleanly to Firestore/Supabase later.

export type TransactionType =
  | 'SALE'
  | 'PURCHASE'
  | 'CUSTOMER_PAYMENT'
  | 'SUPPLIER_PAYMENT'
  | 'EXPENSE'
  | 'OWNER_WITHDRAWAL'
  | 'LOAN_GIVEN'
  | 'LOAN_REPAID'
  | 'STOCK_ADJUSTMENT'
  | 'DAMAGE_LOSS'
  | 'REMINDER';

export type EntrySource = 'voice' | 'text' | 'manual';

export type InventoryMode = 'none' | 'approximate' | 'full';

export interface LineItem {
  id: string;
  name: string;
  /** Local/alias name the shopkeeper may have used, e.g. "পেজ" for "পিয়াজ". */
  alias?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  amount: number;
}

export interface Transaction {
  id: string;
  shopId: string;
  /** ISO timestamp string */
  datetime: string;
  type: TransactionType;
  amount: number;
  /** Customer id for SALE / CUSTOMER_PAYMENT / LOAN_GIVEN */
  customerId?: string;
  /** Supplier id for PURCHASE / SUPPLIER_PAYMENT */
  supplierId?: string;
  items?: LineItem[];
  /** Amount paid at the time of transaction */
  paidAmount?: number;
  /** Outstanding due (sale) or payable (purchase) created by this transaction */
  dueAmount?: number;
  source: EntrySource;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone?: string;
  /** Running balance the customer currently owes (positive = customer owes shop) */
  due: number;
  totalSales: number;
  totalPaid: number;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  shopId: string;
  name: string;
  phone?: string;
  /** Running balance the shop owes the supplier (positive = shop owes supplier) */
  payable: number;
  totalPurchases: number;
  totalPaid: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  aliases: string[];
  unit?: string;
  /** pieces that make one business unit, e.g. "১ বিড়া পান = ২০ পিস" */
  unitSize?: number;
  /** name of the base unit, e.g. "পিস" */
  baseUnitName?: string;
  stockQty?: number;
  costPrice?: number;
  salePrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  shopId: string;
  title: string;
  /** ISO date string (YYYY-MM-DD) */
  dueDate: string;
  done: boolean;
  /** Optional linked customer/supplier */
  customerId?: string;
  supplierId?: string;
  amount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShopProfile {
  id: string;
  name: string;
  ownerName: string;
  phone?: string;
  address?: string;
  inventoryMode: InventoryMode;
  /** Opening cash balance used as the reconciliation baseline */
  openingCash: number;
  createdAt: string;
  updatedAt: string;
}

/** Custom vocabulary mapping a local/short word to a canonical product name. */
export interface VocabularyEntry {
  id: string;
  shopId: string;
  /** The local/short word the shopkeeper uses, e.g. "পেজ" */
  term: string;
  /** The canonical meaning, e.g. "পিয়াজ" */
  meaning: string;
  createdAt: string;
}

/** Custom unit definition, e.g. "বিড়া" = 20 pieces. */
export interface UnitDefinition {
  id: string;
  shopId: string;
  unitName: string;
  /** How many base pieces make one unit */
  piecesPerUnit: number;
  baseUnitName?: string;
  createdAt: string;
}

export interface CashEntry {
  id: string;
  shopId: string;
  /** ISO timestamp */
  datetime: string;
  type: 'CASH_IN' | 'CASH_OUT' | 'ADJUSTMENT';
  amount: number;
  description: string;
  transactionId?: string;
  createdAt: string;
}

export interface DailyClose {
  id: string;
  shopId: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  expectedCash: number;
  countedCash: number;
  difference: number;
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  totalWithdrawals: number;
  notes?: string;
  createdAt: string;
}

export const TRANSACTION_TYPE_META: Record<
  TransactionType,
  { labelBn: string; labelEn: string; icon: string; tone: 'success' | 'danger' | 'warning' | 'neutral' }
> = {
  SALE: { labelBn: 'বিক্রি', labelEn: 'Sale', icon: 'shopping-bag', tone: 'success' },
  PURCHASE: { labelBn: 'ক্রয়', labelEn: 'Purchase', icon: 'truck', tone: 'warning' },
  CUSTOMER_PAYMENT: { labelBn: 'বকেয়া আদায়', labelEn: 'Customer Payment', icon: 'hand-coins', tone: 'success' },
  SUPPLIER_PAYMENT: { labelBn: 'পাওনা পরিশোধ', labelEn: 'Supplier Payment', icon: 'banknote', tone: 'danger' },
  EXPENSE: { labelBn: 'খরচ', labelEn: 'Expense', icon: 'receipt', tone: 'danger' },
  OWNER_WITHDRAWAL: { labelBn: 'মালিক তোলা', labelEn: 'Owner Withdrawal', icon: 'wallet', tone: 'warning' },
  LOAN_GIVEN: { labelBn: 'ধার দেওয়া', labelEn: 'Loan Given', icon: 'handshake', tone: 'neutral' },
  LOAN_REPAID: { labelBn: 'ধার ফেরত', labelEn: 'Loan Repaid', icon: 'rotate-ccw', tone: 'success' },
  STOCK_ADJUSTMENT: { labelBn: 'স্টক ঠিক', labelEn: 'Stock Adjustment', icon: 'package', tone: 'neutral' },
  DAMAGE_LOSS: { labelBn: 'ক্ষতি/নষ্ট', labelEn: 'Damage/Loss', icon: 'alert-triangle', tone: 'danger' },
  REMINDER: { labelBn: 'রিমাইন্ডার', labelEn: 'Reminder', icon: 'bell', tone: 'neutral' },
};
