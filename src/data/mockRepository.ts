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
import type { DataRepository } from './repository';
import {
  mockShop,
  mockCustomers,
  mockSuppliers,
  mockProducts,
  mockTransactions,
  mockReminders,
  mockVocabulary,
  mockUnits,
  mockCashEntries,
  mockDailyCloses,
} from './mockData';

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * In-memory mock repository. Data lives only for the session and is seeded from mockData.
 * A real Firestore/Supabase repository would implement the same DataRepository interface.
 */
export class MockRepository implements DataRepository {
  private shop: ShopProfile = { ...mockShop };
  private transactions: Transaction[] = [...mockTransactions];
  private customers: Customer[] = [...mockCustomers];
  private suppliers: Supplier[] = [...mockSuppliers];
  private products: Product[] = [...mockProducts];
  private reminders: Reminder[] = [...mockReminders];
  private vocabulary: VocabularyEntry[] = [...mockVocabulary];
  private units: UnitDefinition[] = [...mockUnits];
  private cashEntries: CashEntry[] = [...mockCashEntries];
  private dailyCloses: DailyClose[] = [...mockDailyCloses];

  async getShop(): Promise<ShopProfile> {
    return { ...this.shop };
  }
  async updateShop(patch: Partial<ShopProfile>): Promise<ShopProfile> {
    this.shop = { ...this.shop, ...patch, updatedAt: new Date().toISOString() };
    return { ...this.shop };
  }

  async listTransactions(): Promise<Transaction[]> {
    return [...this.transactions].sort((a, b) => b.datetime.localeCompare(a.datetime));
  }
  async addTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const ts = new Date().toISOString();
    const full: Transaction = { ...tx, id: uid('t'), createdAt: ts, updatedAt: ts };
    this.transactions.push(full);
    if (tx.type === 'SALE' && tx.customerId) {
      const c = this.customers.find((x) => x.id === tx.customerId);
      if (c) {
        c.totalSales += tx.amount;
        c.totalPaid += tx.paidAmount ?? 0;
        c.due += tx.dueAmount ?? 0;
        c.updatedAt = ts;
      }
    } else if (tx.type === 'CUSTOMER_PAYMENT' && tx.customerId) {
      const c = this.customers.find((x) => x.id === tx.customerId);
      if (c) {
        c.totalPaid += tx.amount;
        c.due = Math.max(0, c.due - tx.amount);
        c.updatedAt = ts;
      }
    } else if (tx.type === 'PURCHASE' && tx.supplierId) {
      const s = this.suppliers.find((x) => x.id === tx.supplierId);
      if (s) {
        s.totalPurchases += tx.amount;
        s.totalPaid += tx.paidAmount ?? 0;
        s.payable += tx.dueAmount ?? 0;
        s.updatedAt = ts;
      }
    } else if (tx.type === 'SUPPLIER_PAYMENT' && tx.supplierId) {
      const s = this.suppliers.find((x) => x.id === tx.supplierId);
      if (s) {
        s.totalPaid += tx.amount;
        s.payable = Math.max(0, s.payable - tx.amount);
        s.updatedAt = ts;
      }
    }
    return { ...full };
  }

  async listCustomers(): Promise<Customer[]> {
    return [...this.customers].sort((a, b) => a.name.localeCompare(b.name, 'bn'));
  }
  async addCustomer(c: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'due' | 'totalSales' | 'totalPaid'>): Promise<Customer> {
    const ts = new Date().toISOString();
    const full: Customer = { ...c, id: uid('c'), due: 0, totalSales: 0, totalPaid: 0, createdAt: ts, updatedAt: ts };
    this.customers.push(full);
    return { ...full };
  }
  async updateCustomer(id: string, patch: Partial<Customer>): Promise<Customer> {
    const c = this.customers.find((x) => x.id === id);
    if (!c) throw new Error('Customer not found');
    Object.assign(c, patch, { updatedAt: new Date().toISOString() });
    return { ...c };
  }

  async listSuppliers(): Promise<Supplier[]> {
    return [...this.suppliers].sort((a, b) => a.name.localeCompare(b.name, 'bn'));
  }
  async addSupplier(s: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'payable' | 'totalPurchases' | 'totalPaid'>): Promise<Supplier> {
    const ts = new Date().toISOString();
    const full: Supplier = { ...s, id: uid('s'), payable: 0, totalPurchases: 0, totalPaid: 0, createdAt: ts, updatedAt: ts };
    this.suppliers.push(full);
    return { ...full };
  }
  async updateSupplier(id: string, patch: Partial<Supplier>): Promise<Supplier> {
    const s = this.suppliers.find((x) => x.id === id);
    if (!s) throw new Error('Supplier not found');
    Object.assign(s, patch, { updatedAt: new Date().toISOString() });
    return { ...s };
  }

  async listProducts(): Promise<Product[]> {
    return [...this.products].sort((a, b) => a.name.localeCompare(b.name, 'bn'));
  }
  async addProduct(p: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const ts = new Date().toISOString();
    const full: Product = { ...p, id: uid('p'), createdAt: ts, updatedAt: ts };
    this.products.push(full);
    return { ...full };
  }
  async updateProduct(id: string, patch: Partial<Product>): Promise<Product> {
    const p = this.products.find((x) => x.id === id);
    if (!p) throw new Error('Product not found');
    Object.assign(p, patch, { updatedAt: new Date().toISOString() });
    return { ...p };
  }

  async listReminders(): Promise<Reminder[]> {
    return [...this.reminders].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }
  async addReminder(r: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reminder> {
    const ts = new Date().toISOString();
    const full: Reminder = { ...r, id: uid('r'), createdAt: ts, updatedAt: ts };
    this.reminders.push(full);
    return { ...full };
  }
  async toggleReminder(id: string, done: boolean): Promise<Reminder> {
    const r = this.reminders.find((x) => x.id === id);
    if (!r) throw new Error('Reminder not found');
    r.done = done;
    r.updatedAt = new Date().toISOString();
    return { ...r };
  }

  async listVocabulary(): Promise<VocabularyEntry[]> {
    return [...this.vocabulary];
  }
  async addVocabulary(v: Omit<VocabularyEntry, 'id' | 'createdAt'>): Promise<VocabularyEntry> {
    const full: VocabularyEntry = { ...v, id: uid('v'), createdAt: new Date().toISOString() };
    this.vocabulary.push(full);
    return { ...full };
  }
  async deleteVocabulary(id: string): Promise<void> {
    this.vocabulary = this.vocabulary.filter((x) => x.id !== id);
  }

  async listUnits(): Promise<UnitDefinition[]> {
    return [...this.units];
  }
  async addUnit(u: Omit<UnitDefinition, 'id' | 'createdAt'>): Promise<UnitDefinition> {
    const full: UnitDefinition = { ...u, id: uid('u'), createdAt: new Date().toISOString() };
    this.units.push(full);
    return { ...full };
  }
  async deleteUnit(id: string): Promise<void> {
    this.units = this.units.filter((x) => x.id !== id);
  }

  async listCashEntries(): Promise<CashEntry[]> {
    return [...this.cashEntries].sort((a, b) => b.datetime.localeCompare(a.datetime));
  }
  async addCashEntry(c: Omit<CashEntry, 'id' | 'createdAt'>): Promise<CashEntry> {
    const full: CashEntry = { ...c, id: uid('ce'), createdAt: new Date().toISOString() };
    this.cashEntries.push(full);
    return { ...full };
  }

  async listDailyCloses(): Promise<DailyClose[]> {
    return [...this.dailyCloses].sort((a, b) => b.date.localeCompare(a.date));
  }
  async addDailyClose(dc: Omit<DailyClose, 'id' | 'createdAt'>): Promise<DailyClose> {
    const full: DailyClose = { ...dc, id: uid('dc'), createdAt: new Date().toISOString() };
    this.dailyCloses.push(full);
    return { ...full };
  }
}

export const mockRepo = new MockRepository();
