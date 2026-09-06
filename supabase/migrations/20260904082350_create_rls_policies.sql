/*
# Create RLS policies for all tables

## Overview
Applies Row Level Security policies to all 10 tables in the Anamika schema.
Each user can only access rows where user_id matches their auth.uid().
This ensures complete data isolation between shops/users.

## Tables Covered
1. shops — user can CRUD only their own shop profile
2. customers — user can CRUD only their own customers
3. suppliers — user can CRUD only their own suppliers
4. products — user can CRUD only their own products
5. transactions — user can CRUD only their own transactions
6. reminders — user can CRUD only their own reminders
7. vocabulary — user can CRUD only their own vocabulary entries
8. units — user can CRUD only their own unit definitions
9. cash_entries — user can CRUD only their own cash entries
10. daily_closes — user can CRUD only their own daily closes

## Policy Pattern
Each table gets 4 policies (SELECT, INSERT, UPDATE, DELETE), all scoped TO authenticated
with ownership check auth.uid() = user_id. The user_id column defaults to auth.uid() so
inserts that omit user_id still satisfy the WITH CHECK constraint.

## Security Notes
- No anon access — all policies require authentication
- No USING(true) shortcuts — every policy has a real ownership predicate
- UPDATE policies have both USING and WITH CHECK for ownership verification
- DELETE policies have USING only (no WITH CHECK needed)
*/

-- 1. shops
DROP POLICY IF EXISTS "select_own_shop" ON shops;
CREATE POLICY "select_own_shop" ON shops FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_shop" ON shops;
CREATE POLICY "insert_own_shop" ON shops FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_shop" ON shops;
CREATE POLICY "update_own_shop" ON shops FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_shop" ON shops;
CREATE POLICY "delete_own_shop" ON shops FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. customers
DROP POLICY IF EXISTS "select_own_customers" ON customers;
CREATE POLICY "select_own_customers" ON customers FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_customers" ON customers;
CREATE POLICY "insert_own_customers" ON customers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_customers" ON customers;
CREATE POLICY "update_own_customers" ON customers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_customers" ON customers;
CREATE POLICY "delete_own_customers" ON customers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. suppliers
DROP POLICY IF EXISTS "select_own_suppliers" ON suppliers;
CREATE POLICY "select_own_suppliers" ON suppliers FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_suppliers" ON suppliers;
CREATE POLICY "insert_own_suppliers" ON suppliers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_suppliers" ON suppliers;
CREATE POLICY "update_own_suppliers" ON suppliers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_suppliers" ON suppliers;
CREATE POLICY "delete_own_suppliers" ON suppliers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. products
DROP POLICY IF EXISTS "select_own_products" ON products;
CREATE POLICY "select_own_products" ON products FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_products" ON products;
CREATE POLICY "insert_own_products" ON products FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_products" ON products;
CREATE POLICY "update_own_products" ON products FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_products" ON products;
CREATE POLICY "delete_own_products" ON products FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. transactions
DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions" ON transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_transactions" ON transactions;
CREATE POLICY "delete_own_transactions" ON transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. reminders
DROP POLICY IF EXISTS "select_own_reminders" ON reminders;
CREATE POLICY "select_own_reminders" ON reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_reminders" ON reminders;
CREATE POLICY "insert_own_reminders" ON reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_reminders" ON reminders;
CREATE POLICY "update_own_reminders" ON reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_reminders" ON reminders;
CREATE POLICY "delete_own_reminders" ON reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. vocabulary
DROP POLICY IF EXISTS "select_own_vocabulary" ON vocabulary;
CREATE POLICY "select_own_vocabulary" ON vocabulary FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_vocabulary" ON vocabulary;
CREATE POLICY "insert_own_vocabulary" ON vocabulary FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_vocabulary" ON vocabulary;
CREATE POLICY "update_own_vocabulary" ON vocabulary FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_vocabulary" ON vocabulary;
CREATE POLICY "delete_own_vocabulary" ON vocabulary FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 8. units
DROP POLICY IF EXISTS "select_own_units" ON units;
CREATE POLICY "select_own_units" ON units FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_units" ON units;
CREATE POLICY "insert_own_units" ON units FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_units" ON units;
CREATE POLICY "update_own_units" ON units FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_units" ON units;
CREATE POLICY "delete_own_units" ON units FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 9. cash_entries
DROP POLICY IF EXISTS "select_own_cash_entries" ON cash_entries;
CREATE POLICY "select_own_cash_entries" ON cash_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_cash_entries" ON cash_entries;
CREATE POLICY "insert_own_cash_entries" ON cash_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_cash_entries" ON cash_entries;
CREATE POLICY "update_own_cash_entries" ON cash_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_cash_entries" ON cash_entries;
CREATE POLICY "delete_own_cash_entries" ON cash_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 10. daily_closes
DROP POLICY IF EXISTS "select_own_daily_closes" ON daily_closes;
CREATE POLICY "select_own_daily_closes" ON daily_closes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_daily_closes" ON daily_closes;
CREATE POLICY "insert_own_daily_closes" ON daily_closes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_daily_closes" ON daily_closes;
CREATE POLICY "update_own_daily_closes" ON daily_closes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_daily_closes" ON daily_closes;
CREATE POLICY "delete_own_daily_closes" ON daily_closes FOR DELETE TO authenticated USING (auth.uid() = user_id);
