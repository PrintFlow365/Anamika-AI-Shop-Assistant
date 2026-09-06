import { supabase } from '@/lib/supabase';
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

/**
 * Supabase-backed implementation of DataRepository.
 * All data is scoped to the authenticated user via RLS (user_id defaults to auth.uid()).
 * The shop record is auto-created on first access if it doesn't exist.
 */
export class SupabaseRepository implements DataRepository {
  private async ensureShop(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('shops')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created, error } = await supabase
      .from('shops')
      .insert({})
      .select('id')
      .single();

    if (error || !created) throw new Error('Failed to create shop');
    return created.id;
  }

  async getShop(): Promise<ShopProfile> {
    const shopId = await this.ensureShop();
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single();

    if (error || !data) throw new Error('Failed to load shop');
    return this.mapShop(data);
  }

  async updateShop(patch: Partial<ShopProfile>): Promise<ShopProfile> {
    const shopId = await this.ensureShop();
    const update: Record<string, unknown> = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.ownerName !== undefined) update.owner_name = patch.ownerName;
    if (patch.phone !== undefined) update.phone = patch.phone;
    if (patch.address !== undefined) update.address = patch.address;
    if (patch.inventoryMode !== undefined) update.inventory_mode = patch.inventoryMode;
    if (patch.openingCash !== undefined) update.opening_cash = patch.openingCash;

    const { data, error } = await supabase
      .from('shops')
      .update(update)
      .eq('id', shopId)
      .select('*')
      .single();

    if (error || !data) throw new Error('Failed to update shop');
    return this.mapShop(data);
  }

  async listTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('datetime', { ascending: false });

    if (error) throw new Error('Failed to load transactions');
    return (data || []).map((r) => this.mapTransaction(r));
  }

  async addTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const shopId = await this.ensureShop();
    const insert: Record<string, unknown> = {
      shop_id: shopId,
      datetime: tx.datetime,
      type: tx.type,
      amount: tx.amount,
      customer_id: tx.customerId || null,
      supplier_id: tx.supplierId || null,
      items: tx.items ? JSON.stringify(tx.items) : null,
      paid_amount: tx.paidAmount ?? null,
      due_amount: tx.dueAmount ?? null,
      source: tx.source,
      notes: tx.notes || null,
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert(insert)
      .select('*')
      .single();

    if (error || !data) throw new Error('Failed to add transaction');
    return this.mapTransaction(data);
  }

  async listCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error('Failed to load customers');
    return (data || []).map((r) => this.mapCustomer(r));
  }

  async addCustomer(c: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'due' | 'totalSales' | 'totalPaid'>): Promise<Customer> {
    const shopId = await this.ensureShop();
    const { data, error } = await supabase
      .from('customers')
      .insert({
        shop_id: shopId,
        name: c.name,
        phone: c.phone || null,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error('Failed to add customer');
    return this.mapCustomer(data);
  }

  async updateCustomer(id: string, patch: Partial<Customer>): Promise<Customer> {
    const update: Record<string, unknown> = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.phone !== undefined) update.phone = patch.phone;
    if (patch.due !== undefined) update.due = patch.due;
    if (patch.totalSales !== undefined) update.total_sales = patch.totalSales;
    if (patch.totalPaid !== undefined) update.total_paid = patch.totalPaid;

    const { data, error } = await supabase
      .from('customers')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new Error('Failed to update customer');
    return this.mapCustomer(data);
  }

  async listSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error('Failed to load suppliers');
    return (data || []).map((r) => this.mapSupplier(r));
  }

  async addSupplier(s: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'payable' | 'totalPurchases' | 'totalPaid'>): Promise<Supplier> {
    const shopId = await this.ensureShop();
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        shop_id: shopId,
        name: s.name,
        phone: s.phone || null,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error('Failed to add supplier');
    return this.mapSupplier(data);
  }

  async updateSupplier(id: string, patch: Partial<Supplier>): Promise<Supplier> {
    const update: Record<string, unknown> = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.phone !== undefined) update.phone = patch.phone;
    if (patch.payable !== undefined) update.payable = patch.payable;
    if (patch.totalPurchases !== undefined) update.total_purchases = patch.totalPurchases;
    if (patch.totalPaid !== undefined) update.total_paid = patch.totalPaid;

    const { data, error } = await supabase
      .from('suppliers')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new Error('Failed to update supplier');
    return this.mapSupplier(data);
  }

  async listProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error('Failed to load products');
    return (data || []).map((r) => this.mapProduct(r));
  }

  async addProduct(p: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const shopId = await this.ensureShop();
    const { data, error } = await supabase
      .from('products')
      .insert({
        shop_id: shopId,
        name: p.name,
        aliases: p.aliases || [],
        unit: p.unit || null,
        unit_size: p.unitSize ?? null,
        base_unit_name: p.baseUnitName ?? null,
        stock_qty: p.stockQty ?? null,
        cost_price: p.costPrice ?? null,
        sale_price: p.salePrice ?? null,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error('Failed to add product');
    return this.mapProduct(data);
  }

  async updateProduct(id: string, patch: Partial<Product>): Promise<Product> {
    const update: Record<string, unknown> = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.aliases !== undefined) update.aliases = patch.aliases;
    if (patch.unit !== undefined) update.unit = patch.unit;
    if (patch.unitSize !== undefined) update.unit_size = patch.unitSize;
    if (patch.baseUnitName !== undefined) update.base_unit_name = patch.baseUnitName;
    if (patch.stockQty !== undefined) update.stock_qty = patch.stockQty;
    if (patch.costPrice !== undefined) update.cost_price = patch.costPrice;
    if (patch.salePrice !== undefined) update.sale_price = patch.salePrice;

    const { data, error } = await supabase
      .from('products')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new Error('Failed to update product');
    return this.mapProduct(data);
  }

  async listReminders(): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) throw new Error('Failed to load reminders');
    return (data || []).map((r) => this.mapReminder(r));
  }

  async addReminder(r: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reminder> {
    const shopId = await this.ensureShop();
    const { data, error } = await supabase
      .from('reminders')
      .insert({
        shop_id: shopId,
        title: r.title,
        due_date: r.dueDate,
        done: r.done,
        customer_id: r.customerId || null,
        supplier_id: r.supplierId || null,
        amount: r.amount ?? null,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error('Failed to add reminder');
    return this.mapReminder(data);
  }

  async toggleReminder(id: string, done: boolean): Promise<Reminder> {
    const { data, error } = await supabase
      .from('reminders')
      .update({ done })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new Error('Failed to toggle reminder');
    return this.mapReminder(data);
  }

  async listVocabulary(): Promise<VocabularyEntry[]> {
    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error('Failed to load vocabulary');
    return (data || []).map((r) => this.mapVocabulary(r));
  }

  async addVocabulary(v: Omit<VocabularyEntry, 'id' | 'createdAt'>): Promise<VocabularyEntry> {
    const shopId = await this.ensureShop();
    const { data, error } = await supabase
      .from('vocabulary')
      .insert({
        shop_id: shopId,
        term: v.term,
        meaning: v.meaning,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error('Failed to add vocabulary');
    return this.mapVocabulary(data);
  }

  async deleteVocabulary(id: string): Promise<void> {
    const { error } = await supabase.from('vocabulary').delete().eq('id', id);
    if (error) throw new Error('Failed to delete vocabulary');
  }

  async listUnits(): Promise<UnitDefinition[]> {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error('Failed to load units');
    return (data || []).map((r) => this.mapUnit(r));
  }

  async addUnit(u: Omit<UnitDefinition, 'id' | 'createdAt'>): Promise<UnitDefinition> {
    const shopId = await this.ensureShop();
    const { data, error } = await supabase
      .from('units')
      .insert({
        shop_id: shopId,
        unit_name: u.unitName,
        pieces_per_unit: u.piecesPerUnit,
        base_unit_name: u.baseUnitName ?? null,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error('Failed to add unit');
    return this.mapUnit(data);
  }

  async deleteUnit(id: string): Promise<void> {
    const { error } = await supabase.from('units').delete().eq('id', id);
    if (error) throw new Error('Failed to delete unit');
  }

  async listCashEntries(): Promise<CashEntry[]> {
    const { data, error } = await supabase
      .from('cash_entries')
      .select('*')
      .order('datetime', { ascending: false });

    if (error) throw new Error('Failed to load cash entries');
    return (data || []).map((r) => this.mapCashEntry(r));
  }

  async addCashEntry(c: Omit<CashEntry, 'id' | 'createdAt'>): Promise<CashEntry> {
    const shopId = await this.ensureShop();
    const { data, error } = await supabase
      .from('cash_entries')
      .insert({
        shop_id: shopId,
        datetime: c.datetime,
        type: c.type,
        amount: c.amount,
        description: c.description,
        transaction_id: c.transactionId || null,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error('Failed to add cash entry');
    return this.mapCashEntry(data);
  }

  async listDailyCloses(): Promise<DailyClose[]> {
    const { data, error } = await supabase
      .from('daily_closes')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw new Error('Failed to load daily closes');
    return (data || []).map((r) => this.mapDailyClose(r));
  }

  async addDailyClose(dc: Omit<DailyClose, 'id' | 'createdAt'>): Promise<DailyClose> {
    const shopId = await this.ensureShop();
    const { data, error } = await supabase
      .from('daily_closes')
      .insert({
        shop_id: shopId,
        date: dc.date,
        expected_cash: dc.expectedCash,
        counted_cash: dc.countedCash,
        difference: dc.difference,
        total_sales: dc.totalSales,
        total_purchases: dc.totalPurchases,
        total_expenses: dc.totalExpenses,
        total_withdrawals: dc.totalWithdrawals,
        notes: dc.notes || null,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error('Failed to add daily close');
    return this.mapDailyClose(data);
  }

  // --- Mappers: DB row → domain type ---

  private mapShop(r: Record<string, unknown>): ShopProfile {
    return {
      id: r.id as string,
      name: r.name as string,
      ownerName: r.owner_name as string,
      phone: (r.phone as string) || undefined,
      address: (r.address as string) || undefined,
      inventoryMode: r.inventory_mode as ShopProfile['inventoryMode'],
      openingCash: Number(r.opening_cash),
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  private mapTransaction(r: Record<string, unknown>): Transaction {
    let items: Transaction['items'];
    if (r.items && typeof r.items === 'string') {
      try { items = JSON.parse(r.items as string); } catch { items = undefined; }
    } else if (r.items && typeof r.items === 'object') {
      items = r.items as Transaction['items'];
    }
    return {
      id: r.id as string,
      shopId: r.shop_id as string,
      datetime: r.datetime as string,
      type: r.type as Transaction['type'],
      amount: Number(r.amount),
      customerId: (r.customer_id as string) || undefined,
      supplierId: (r.supplier_id as string) || undefined,
      items,
      paidAmount: r.paid_amount != null ? Number(r.paid_amount) : undefined,
      dueAmount: r.due_amount != null ? Number(r.due_amount) : undefined,
      source: r.source as Transaction['source'],
      notes: (r.notes as string) || undefined,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  private mapCustomer(r: Record<string, unknown>): Customer {
    return {
      id: r.id as string,
      shopId: r.shop_id as string,
      name: r.name as string,
      phone: (r.phone as string) || undefined,
      due: Number(r.due),
      totalSales: Number(r.total_sales),
      totalPaid: Number(r.total_paid),
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  private mapSupplier(r: Record<string, unknown>): Supplier {
    return {
      id: r.id as string,
      shopId: r.shop_id as string,
      name: r.name as string,
      phone: (r.phone as string) || undefined,
      payable: Number(r.payable),
      totalPurchases: Number(r.total_purchases),
      totalPaid: Number(r.total_paid),
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  private mapProduct(r: Record<string, unknown>): Product {
    return {
      id: r.id as string,
      shopId: r.shop_id as string,
      name: r.name as string,
      aliases: (r.aliases as string[]) || [],
      unit: (r.unit as string) || undefined,
      unitSize: r.unit_size != null ? Number(r.unit_size) : undefined,
      baseUnitName: (r.base_unit_name as string) || undefined,
      stockQty: r.stock_qty != null ? Number(r.stock_qty) : undefined,
      costPrice: r.cost_price != null ? Number(r.cost_price) : undefined,
      salePrice: r.sale_price != null ? Number(r.sale_price) : undefined,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  private mapReminder(r: Record<string, unknown>): Reminder {
    return {
      id: r.id as string,
      shopId: r.shop_id as string,
      title: r.title as string,
      dueDate: r.due_date as string,
      done: r.done as boolean,
      customerId: (r.customer_id as string) || undefined,
      supplierId: (r.supplier_id as string) || undefined,
      amount: r.amount != null ? Number(r.amount) : undefined,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  private mapVocabulary(r: Record<string, unknown>): VocabularyEntry {
    return {
      id: r.id as string,
      shopId: r.shop_id as string,
      term: r.term as string,
      meaning: r.meaning as string,
      createdAt: r.created_at as string,
    };
  }

  private mapUnit(r: Record<string, unknown>): UnitDefinition {
    return {
      id: r.id as string,
      shopId: r.shop_id as string,
      unitName: r.unit_name as string,
      piecesPerUnit: Number(r.pieces_per_unit),
      baseUnitName: (r.base_unit_name as string) || undefined,
      createdAt: r.created_at as string,
    };
  }

  private mapCashEntry(r: Record<string, unknown>): CashEntry {
    return {
      id: r.id as string,
      shopId: r.shop_id as string,
      datetime: r.datetime as string,
      type: r.type as CashEntry['type'],
      amount: Number(r.amount),
      description: r.description as string,
      transactionId: (r.transaction_id as string) || undefined,
      createdAt: r.created_at as string,
    };
  }

  private mapDailyClose(r: Record<string, unknown>): DailyClose {
    return {
      id: r.id as string,
      shopId: r.shop_id as string,
      date: r.date as string,
      expectedCash: Number(r.expected_cash),
      countedCash: Number(r.counted_cash),
      difference: Number(r.difference),
      totalSales: Number(r.total_sales),
      totalPurchases: Number(r.total_purchases),
      totalExpenses: Number(r.total_expenses),
      totalWithdrawals: Number(r.total_withdrawals),
      notes: (r.notes as string) || undefined,
      createdAt: r.created_at as string,
    };
  }
}

export const supabaseRepo = new SupabaseRepository();
