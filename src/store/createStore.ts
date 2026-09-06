import { create } from './tinyStore';
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
import type { DataRepository } from '@/data/repository';
import { supabaseRepo } from '@/data/supabaseRepository';

export interface AppData {
  shop: ShopProfile | null;
  transactions: Transaction[];
  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
  reminders: Reminder[];
  vocabulary: VocabularyEntry[];
  units: UnitDefinition[];
  cashEntries: CashEntry[];
  dailyCloses: DailyClose[];
  loading: boolean;
}

const initialState: AppData = {
  shop: null,
  transactions: [],
  customers: [],
  suppliers: [],
  products: [],
  reminders: [],
  vocabulary: [],
  units: [],
  cashEntries: [],
  dailyCloses: [],
  loading: true,
};

export interface AppStore extends AppData {
  repo: DataRepository;
  refresh: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'due' | 'totalSales' | 'totalPaid'>) => Promise<Customer>;
  addSupplier: (s: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'payable' | 'totalPurchases' | 'totalPaid'>) => Promise<Supplier>;
  addProduct: (p: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<Product>;
  updateShop: (patch: Partial<ShopProfile>) => Promise<ShopProfile>;
  addReminder: (r: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Reminder>;
  toggleReminder: (id: string, done: boolean) => Promise<Reminder>;
  addVocabulary: (v: Omit<VocabularyEntry, 'id' | 'createdAt'>) => Promise<VocabularyEntry>;
  deleteVocabulary: (id: string) => Promise<void>;
  addUnit: (u: Omit<UnitDefinition, 'id' | 'createdAt'>) => Promise<UnitDefinition>;
  deleteUnit: (id: string) => Promise<void>;
  addCashEntry: (c: Omit<CashEntry, 'id' | 'createdAt'>) => Promise<CashEntry>;
  addDailyClose: (dc: Omit<DailyClose, 'id' | 'createdAt'>) => Promise<DailyClose>;
}

async function loadAll(repo: DataRepository): Promise<Partial<AppData>> {
  const [shop, transactions, customers, suppliers, products, reminders, vocabulary, units, cashEntries, dailyCloses] =
    await Promise.all([
      repo.getShop(),
      repo.listTransactions(),
      repo.listCustomers(),
      repo.listSuppliers(),
      repo.listProducts(),
      repo.listReminders(),
      repo.listVocabulary(),
      repo.listUnits(),
      repo.listCashEntries(),
      repo.listDailyCloses(),
    ]);
  return { shop, transactions, customers, suppliers, products, reminders, vocabulary, units, cashEntries, dailyCloses };
}

export function createStore(repo: DataRepository = supabaseRepo) {
  return create<AppStore>((set, get) => ({
    ...initialState,
    repo,
    refresh: async () => {
      set({ loading: true });
      const data = await loadAll(repo);
      set({ ...data, loading: false });
    },
    addTransaction: async (tx) => {
      const created = await repo.addTransaction(tx);
      const transactions = await repo.listTransactions();
      const customers = await repo.listCustomers();
      const suppliers = await repo.listSuppliers();
      set({ transactions, customers, suppliers });
      return created;
    },
    addCustomer: async (c) => {
      const created = await repo.addCustomer(c);
      set({ customers: await repo.listCustomers() });
      return created;
    },
    addSupplier: async (s) => {
      const created = await repo.addSupplier(s);
      set({ suppliers: await repo.listSuppliers() });
      return created;
    },
    addProduct: async (p) => {
      const created = await repo.addProduct(p);
      set({ products: await repo.listProducts() });
      return created;
    },
    updateProduct: async (id, patch) => {
      const updated = await repo.updateProduct(id, patch);
      set({ products: await repo.listProducts() });
      return updated;
    },
    updateShop: async (patch) => {
      const updated = await repo.updateShop(patch);
      set({ shop: updated });
      return updated;
    },
    addReminder: async (r) => {
      const created = await repo.addReminder(r);
      set({ reminders: await repo.listReminders() });
      return created;
    },
    toggleReminder: async (id, done) => {
      const updated = await repo.toggleReminder(id, done);
      set({ reminders: await repo.listReminders() });
      return updated;
    },
    addVocabulary: async (v) => {
      const created = await repo.addVocabulary(v);
      set({ vocabulary: await repo.listVocabulary() });
      return created;
    },
    deleteVocabulary: async (id) => {
      await repo.deleteVocabulary(id);
      set({ vocabulary: await repo.listVocabulary() });
    },
    addUnit: async (u) => {
      const created = await repo.addUnit(u);
      set({ units: await repo.listUnits() });
      return created;
    },
    deleteUnit: async (id) => {
      await repo.deleteUnit(id);
      set({ units: await repo.listUnits() });
    },
    addCashEntry: async (c) => {
      const created = await repo.addCashEntry(c);
      set({ cashEntries: await repo.listCashEntries() });
      return created;
    },
    addDailyClose: async (dc) => {
      const created = await repo.addDailyClose(dc);
      set({ dailyCloses: await repo.listDailyCloses() });
      return created;
    },
  }));
}

export type StoreApi = ReturnType<typeof createStore>;
