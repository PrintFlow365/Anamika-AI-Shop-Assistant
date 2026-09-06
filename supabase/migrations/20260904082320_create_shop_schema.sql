/*
# Create Anamika AI Shop Assistant database schema

## Overview
Creates the complete database schema for the Anamika AI Shop Assistant app.
Each user owns exactly one shop. All data is user-scoped via user_id columns
with DEFAULT auth.uid() for automatic ownership on insert.

## New Tables (10 total)
1. shops — Shop profile (1:1 with auth user via UNIQUE user_id)
   - id, user_id, name, owner_name, phone, address, inventory_mode, opening_cash, created_at, updated_at
2. customers — Customer records with running due balance
   - id, user_id, shop_id, name, phone, due, total_sales, total_paid, created_at, updated_at
3. suppliers — Supplier records with running payable balance
   - id, user_id, shop_id, name, phone, payable, total_purchases, total_paid, created_at, updated_at
4. products — Product/inventory items with aliases and pricing
   - id, user_id, shop_id, name, aliases(text[]), unit, unit_size, base_unit_name, stock_qty, cost_price, sale_price, created_at, updated_at
5. transactions — All financial transactions (sales, purchases, payments, expenses, etc.)
   - id, user_id, shop_id, datetime, type, amount, customer_id, supplier_id, items(jsonb), paid_amount, due_amount, source, notes, created_at, updated_at
6. reminders — Task/payment reminders linked to customers/suppliers
   - id, user_id, shop_id, title, due_date, done, customer_id, supplier_id, amount, created_at, updated_at
7. vocabulary — Custom word-to-meaning mappings for Bangla shopkeeper language
   - id, user_id, shop_id, term, meaning, created_at
8. units — Custom business unit definitions (e.g. 1 বিড়া = 20 পিস)
   - id, user_id, shop_id, unit_name, pieces_per_unit, base_unit_name, created_at
9. cash_entries — Manual cash adjustments (cash in/out/reconciliation)
   - id, user_id, shop_id, datetime, type, amount, description, transaction_id, created_at
10. daily_closes — End-of-day cash reconciliation records
    - id, user_id, shop_id, date, expected_cash, counted_cash, difference, total_sales, total_purchases, total_expenses, total_withdrawals, notes, created_at

## Triggers
- update_updated_at(): Auto-updates updated_at on UPDATE for all tables with that column
- update_balances_on_transaction(): Auto-updates customer/supplier running balances
  (due, total_sales, total_paid, payable, total_purchases) after a transaction INSERT.
  This keeps balances atomic with the transaction insert — no application code needed.

## Security
- RLS enabled on all 10 tables (policies applied in separate migration)
- user_id columns default to auth.uid() so inserts work even when client omits user_id
- All foreign keys use ON DELETE CASCADE for shop deletion, ON DELETE SET NULL for optional references

## Important Notes
1. Each user gets exactly one shop record, linked via shops.user_id (UNIQUE constraint)
2. Customer/supplier running balances are maintained by database triggers, not application code
3. Transaction items stored as JSONB for flexibility (array of LineItem objects)
4. Product aliases stored as text[] for efficient querying
5. All money columns use numeric(12,2) for precise taka amounts
*/

-- Updated_at trigger function (reusable across all tables)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Balance update trigger: maintains customer/supplier running balances atomically on transaction insert
CREATE OR REPLACE FUNCTION update_balances_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'SALE' AND NEW.customer_id IS NOT NULL THEN
    UPDATE customers SET
      total_sales = total_sales + NEW.amount,
      total_paid = total_paid + COALESCE(NEW.paid_amount, 0),
      due = due + COALESCE(NEW.due_amount, 0),
      updated_at = now()
    WHERE id = NEW.customer_id;
  ELSIF NEW.type = 'CUSTOMER_PAYMENT' AND NEW.customer_id IS NOT NULL THEN
    UPDATE customers SET
      total_paid = total_paid + NEW.amount,
      due = GREATEST(0, due - NEW.amount),
      updated_at = now()
    WHERE id = NEW.customer_id;
  ELSIF NEW.type = 'PURCHASE' AND NEW.supplier_id IS NOT NULL THEN
    UPDATE suppliers SET
      total_purchases = total_purchases + NEW.amount,
      total_paid = total_paid + COALESCE(NEW.paid_amount, 0),
      payable = payable + COALESCE(NEW.due_amount, 0),
      updated_at = now()
    WHERE id = NEW.supplier_id;
  ELSIF NEW.type = 'SUPPLIER_PAYMENT' AND NEW.supplier_id IS NOT NULL THEN
    UPDATE suppliers SET
      total_paid = total_paid + NEW.amount,
      payable = GREATEST(0, payable - NEW.amount),
      updated_at = now()
    WHERE id = NEW.supplier_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. shops
CREATE TABLE IF NOT EXISTS shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'আমার দোকান',
  owner_name text NOT NULL DEFAULT 'মালিক',
  phone text,
  address text,
  inventory_mode text NOT NULL DEFAULT 'approximate',
  opening_cash numeric(12,2) NOT NULL DEFAULT 5000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS shops_updated_at ON shops;
CREATE TRIGGER shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. customers
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  due numeric(12,2) NOT NULL DEFAULT 0,
  total_sales numeric(12,2) NOT NULL DEFAULT 0,
  total_paid numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);

-- 3. suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  payable numeric(12,2) NOT NULL DEFAULT 0,
  total_purchases numeric(12,2) NOT NULL DEFAULT 0,
  total_paid numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS suppliers_updated_at ON suppliers;
CREATE TRIGGER suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX IF NOT EXISTS idx_suppliers_shop_id ON suppliers(shop_id);

-- 4. products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  unit text,
  unit_size integer,
  base_unit_name text,
  stock_qty numeric(12,2),
  cost_price numeric(12,2),
  sale_price numeric(12,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);

-- 5. transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  datetime timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  items jsonb,
  paid_amount numeric(12,2),
  due_amount numeric(12,2),
  source text NOT NULL DEFAULT 'manual',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS transactions_updated_at ON transactions;
CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS transactions_balance_update ON transactions;
CREATE TRIGGER transactions_balance_update AFTER INSERT ON transactions FOR EACH ROW EXECUTE FUNCTION update_balances_on_transaction();
CREATE INDEX IF NOT EXISTS idx_transactions_shop_id ON transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_transactions_datetime ON transactions(datetime DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_supplier_id ON transactions(supplier_id);

-- 6. reminders
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date NOT NULL,
  done boolean NOT NULL DEFAULT false,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  amount numeric(12,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS reminders_updated_at ON reminders;
CREATE TRIGGER reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX IF NOT EXISTS idx_reminders_shop_id ON reminders(shop_id);

-- 7. vocabulary
CREATE TABLE IF NOT EXISTS vocabulary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  term text NOT NULL,
  meaning text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_vocabulary_shop_id ON vocabulary(shop_id);

-- 8. units
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  unit_name text NOT NULL,
  pieces_per_unit integer NOT NULL,
  base_unit_name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_units_shop_id ON units(shop_id);

-- 9. cash_entries
CREATE TABLE IF NOT EXISTS cash_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  datetime timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE cash_entries ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cash_entries_shop_id ON cash_entries(shop_id);

-- 10. daily_closes
CREATE TABLE IF NOT EXISTS daily_closes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  date date NOT NULL,
  expected_cash numeric(12,2) NOT NULL DEFAULT 0,
  counted_cash numeric(12,2) NOT NULL DEFAULT 0,
  difference numeric(12,2) NOT NULL DEFAULT 0,
  total_sales numeric(12,2) NOT NULL DEFAULT 0,
  total_purchases numeric(12,2) NOT NULL DEFAULT 0,
  total_expenses numeric(12,2) NOT NULL DEFAULT 0,
  total_withdrawals numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE daily_closes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_daily_closes_shop_id ON daily_closes(shop_id);
