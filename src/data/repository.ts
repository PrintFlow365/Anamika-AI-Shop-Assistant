import type {
  Transaction,
  Customer,
  Supplier,
  Product,
  Reminder,
  ShopProfile,
  VocabularyEntry,
  UnitDefinition,
  CashEntry,
  DailyClose,
} from '@/types';

/**
 * Repository interface — the single seam where mock data is swapped for a real backend.
 * A Firestore/Supabase implementation can implement this same interface without touching UI.
 */
export interface DataRepository {
  getShop(): Promise<ShopProfile>;
  updateShop(patch: Partial<ShopProfile>): Promise<ShopProfile>;

  listTransactions(): Promise<Transaction[]>;
  addTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction>;

  listCustomers(): Promise<Customer[]>;
  addCustomer(c: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'due' | 'totalSales' | 'totalPaid'>): Promise<Customer>;
  updateCustomer(id: string, patch: Partial<Customer>): Promise<Customer>;

  listSuppliers(): Promise<Supplier[]>;
  addSupplier(s: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'payable' | 'totalPurchases' | 'totalPaid'>): Promise<Supplier>;
  updateSupplier(id: string, patch: Partial<Supplier>): Promise<Supplier>;

  listProducts(): Promise<Product[]>;
  addProduct(p: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  updateProduct(id: string, patch: Partial<Product>): Promise<Product>;

  listReminders(): Promise<Reminder[]>;
  addReminder(r: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reminder>;
  toggleReminder(id: string, done: boolean): Promise<Reminder>;

  listVocabulary(): Promise<VocabularyEntry[]>;
  addVocabulary(v: Omit<VocabularyEntry, 'id' | 'createdAt'>): Promise<VocabularyEntry>;
  deleteVocabulary(id: string): Promise<void>;

  listUnits(): Promise<UnitDefinition[]>;
  addUnit(u: Omit<UnitDefinition, 'id' | 'createdAt'>): Promise<UnitDefinition>;
  deleteUnit(id: string): Promise<void>;

  listCashEntries(): Promise<CashEntry[]>;
  addCashEntry(c: Omit<CashEntry, 'id' | 'createdAt'>): Promise<CashEntry>;

  listDailyCloses(): Promise<DailyClose[]>;
  addDailyClose(dc: Omit<DailyClose, 'id' | 'createdAt'>): Promise<DailyClose>;
}
