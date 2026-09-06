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

const SHOP_ID = 'shop-1';
const now = new Date();
const todayISO = now.toISOString().slice(0, 10);

function iso(daysAgo: number, hour = 12, min = 0): string {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

export const mockShop: ShopProfile = {
  id: SHOP_ID,
  name: 'মোবারক স্টোর',
  ownerName: 'মোবারক হোসেন',
  phone: '০১৭xxxxxxxx',
  address: 'গ্রাম: রামপুর, উপজেলা: সাভার',
  inventoryMode: 'approximate',
  openingCash: 5000,
  createdAt: iso(120),
  updatedAt: iso(0),
};

export const mockCustomers: Customer[] = [
  { id: 'c1', shopId: SHOP_ID, name: 'রহিম মিয়া', phone: '০১৭১১১১১১১', due: 100, totalSales: 5200, totalPaid: 5100, createdAt: iso(90), updatedAt: iso(0) },
  { id: 'c2', shopId: SHOP_ID, name: 'করিম শেখ', phone: '০১৭২২২২২২২', due: 0, totalSales: 3400, totalPaid: 3400, createdAt: iso(80), updatedAt: iso(5) },
  { id: 'c3', shopId: SHOP_ID, name: 'সালমা বেগম', phone: '০১৭৩৩৩৩৩৩৩', due: 250, totalSales: 1800, totalPaid: 1550, createdAt: iso(60), updatedAt: iso(2) },
  { id: 'c4', shopId: SHOP_ID, name: 'জাহাঙ্গীর', due: 0, totalSales: 900, totalPaid: 900, createdAt: iso(40), updatedAt: iso(10) },
  { id: 'c5', shopId: SHOP_ID, name: 'ফাতেমা', phone: '০১৭৫৫৫৫৫৫৫', due: 50, totalSales: 600, totalPaid: 550, createdAt: iso(30), updatedAt: iso(1) },
];

export const mockSuppliers: Supplier[] = [
  { id: 's1', shopId: SHOP_ID, name: 'আনোয়ার পাইকারি', phone: '০১৮১১১১১১১', payable: 1200, totalPurchases: 12000, totalPaid: 10800, createdAt: iso(100), updatedAt: iso(3) },
  { id: 's2', shopId: SHOP_ID, name: 'মেসার্স রহমান ট্রেডার্স', phone: '০১৮২২২২২২২', payable: 0, totalPurchases: 8500, totalPaid: 8500, createdAt: iso(95), updatedAt: iso(8) },
  { id: 's3', shopId: SHOP_ID, name: 'সোহেল মিয়া', phone: '০১৮৩৩৩৩৩৩৩', payable: 500, totalPurchases: 4200, totalPaid: 3700, createdAt: iso(50), updatedAt: iso(1) },
];

export const mockProducts: Product[] = [
  { id: 'p1', shopId: SHOP_ID, name: 'পিয়াজ', aliases: ['পেজ', 'পেঁয়াজ'], unit: 'কেজি', stockQty: 30, costPrice: 40, salePrice: 50, createdAt: iso(90), updatedAt: iso(2) },
  { id: 'p2', shopId: SHOP_ID, name: 'চাল', aliases: ['ডালি'], unit: 'কেজি', stockQty: 120, costPrice: 65, salePrice: 72, createdAt: iso(90), updatedAt: iso(5) },
  { id: 'p3', shopId: SHOP_ID, name: 'পান', aliases: [], unit: 'বিড়া', unitSize: 20, baseUnitName: 'পিস', stockQty: 15, costPrice: 15, salePrice: 20, createdAt: iso(60), updatedAt: iso(1) },
  { id: 'p4', shopId: SHOP_ID, name: 'তেল', aliases: ['সয়াবিন'], unit: 'লিটার', stockQty: 8, costPrice: 160, salePrice: 175, createdAt: iso(70), updatedAt: iso(7) },
  { id: 'p5', shopId: SHOP_ID, name: 'লবণ', aliases: ['নুন'], unit: 'কেজি', stockQty: undefined, costPrice: 25, salePrice: 30, createdAt: iso(50), updatedAt: iso(20) },
];

export const mockVocabulary: VocabularyEntry[] = [
  { id: 'v1', shopId: SHOP_ID, term: 'পেজ', meaning: 'পিয়াজ', createdAt: iso(40) },
  { id: 'v2', shopId: SHOP_ID, term: 'নুন', meaning: 'লবণ', createdAt: iso(40) },
  { id: 'v3', shopId: SHOP_ID, term: 'ডালি', meaning: 'চাল', createdAt: iso(35) },
];

export const mockUnits: UnitDefinition[] = [
  { id: 'u1', shopId: SHOP_ID, unitName: 'বিড়া', piecesPerUnit: 20, baseUnitName: 'পিস', createdAt: iso(40) },
  { id: 'u2', shopId: SHOP_ID, unitName: 'বস্তা', piecesPerUnit: 50, baseUnitName: 'কেজি', createdAt: iso(40) },
];

export const mockTransactions: Transaction[] = [
  { id: 't1', shopId: SHOP_ID, datetime: iso(0, 8, 30), type: 'SALE', amount: 400, customerId: 'c1', paidAmount: 300, dueAmount: 100, source: 'voice', notes: 'রহিম ৪০০ টাকার মাল নিল, ৩০০ টাকা দিল', createdAt: iso(0, 8, 30), updatedAt: iso(0, 8, 30) },
  { id: 't2', shopId: SHOP_ID, datetime: iso(0, 9, 15), type: 'SALE', amount: 150, customerId: 'c2', paidAmount: 150, dueAmount: 0, source: 'manual', createdAt: iso(0, 9, 15), updatedAt: iso(0, 9, 15) },
  { id: 't3', shopId: SHOP_ID, datetime: iso(0, 10, 0), type: 'PURCHASE', amount: 2000, supplierId: 's1', paidAmount: 800, dueAmount: 1200, source: 'voice', notes: 'আনোয়ার থেকে ২০০০ টাকার মাল, ৮০০ দিল', createdAt: iso(0, 10, 0), updatedAt: iso(0, 10, 0) },
  { id: 't4', shopId: SHOP_ID, datetime: iso(0, 11, 0), type: 'EXPENSE', amount: 120, source: 'manual', notes: 'রিকশা ভাড়া', createdAt: iso(0, 11, 0), updatedAt: iso(0, 11, 0) },
  { id: 't5', shopId: SHOP_ID, datetime: iso(0, 12, 30), type: 'OWNER_WITHDRAWAL', amount: 500, source: 'voice', notes: 'বাড়িতে নিয়ে গেলাম', createdAt: iso(0, 12, 30), updatedAt: iso(0, 12, 30) },
  { id: 't6', shopId: SHOP_ID, datetime: iso(0, 14, 0), type: 'CUSTOMER_PAYMENT', amount: 50, customerId: 'c5', paidAmount: 50, source: 'manual', notes: 'ফাতেমা বাকি পরিশোধ', createdAt: iso(0, 14, 0), updatedAt: iso(0, 14, 0) },
  { id: 't7', shopId: SHOP_ID, datetime: iso(0, 15, 30), type: 'SALE', amount: 220, customerId: 'c3', paidAmount: 0, dueAmount: 220, source: 'voice', notes: 'সালমা ২২০ টাকার মাল নিল, পরে দিবে', createdAt: iso(0, 15, 30), updatedAt: iso(0, 15, 30) },
  { id: 't8', shopId: SHOP_ID, datetime: iso(0, 16, 0), type: 'LOAN_GIVEN', amount: 300, customerId: 'c4', paidAmount: 0, source: 'manual', notes: 'জাহাঙ্গীরকে ধার দিলাম', createdAt: iso(0, 16, 0), updatedAt: iso(0, 16, 0) },
  { id: 't9', shopId: SHOP_ID, datetime: iso(1, 9, 0), type: 'SALE', amount: 1800, paidAmount: 1800, dueAmount: 0, source: 'manual', createdAt: iso(1, 9, 0), updatedAt: iso(1, 9, 0) },
  { id: 't10', shopId: SHOP_ID, datetime: iso(1, 10, 0), type: 'PURCHASE', amount: 1500, supplierId: 's2', paidAmount: 1500, dueAmount: 0, source: 'manual', createdAt: iso(1, 10, 0), updatedAt: iso(1, 10, 0) },
  { id: 't11', shopId: SHOP_ID, datetime: iso(1, 11, 0), type: 'EXPENSE', amount: 80, source: 'manual', notes: 'বিদ্যুৎ বিল', createdAt: iso(1, 11, 0), updatedAt: iso(1, 11, 0) },
  { id: 't12', shopId: SHOP_ID, datetime: iso(2, 9, 0), type: 'SALE', amount: 2200, paidAmount: 2000, dueAmount: 200, customerId: 'c2', source: 'manual', createdAt: iso(2, 9, 0), updatedAt: iso(2, 9, 0) },
  { id: 't13', shopId: SHOP_ID, datetime: iso(2, 13, 0), type: 'SUPPLIER_PAYMENT', amount: 500, supplierId: 's3', paidAmount: 500, source: 'manual', createdAt: iso(2, 13, 0), updatedAt: iso(2, 13, 0) },
  { id: 't14', shopId: SHOP_ID, datetime: iso(2, 15, 0), type: 'OWNER_WITHDRAWAL', amount: 300, source: 'manual', notes: 'ব্যক্তিগত', createdAt: iso(2, 15, 0), updatedAt: iso(2, 15, 0) },
  { id: 't15', shopId: SHOP_ID, datetime: iso(3, 9, 0), type: 'SALE', amount: 1600, paidAmount: 1600, dueAmount: 0, source: 'manual', createdAt: iso(3, 9, 0), updatedAt: iso(3, 9, 0) },
  { id: 't16', shopId: SHOP_ID, datetime: iso(3, 10, 0), type: 'EXPENSE', amount: 200, source: 'manual', notes: 'পলিথিন কেনা', createdAt: iso(3, 10, 0), updatedAt: iso(3, 10, 0) },
  { id: 't17', shopId: SHOP_ID, datetime: iso(3, 12, 0), type: 'DAMAGE_LOSS', amount: 60, source: 'manual', notes: 'চাল পচে গেছে', createdAt: iso(3, 12, 0), updatedAt: iso(3, 12, 0) },
];

export const mockReminders: Reminder[] = [
  { id: 'r1', shopId: SHOP_ID, title: 'রহিমের কাছ থেকে ১০০ টাকা আদায়', dueDate: todayISO, done: false, customerId: 'c1', amount: 100, createdAt: iso(0), updatedAt: iso(0) },
  { id: 'r2', shopId: SHOP_ID, title: 'আনোয়ার পাইকারিকে ১২০০ টাকা দিতে হবে', dueDate: new Date(now.getTime() + 86400000).toISOString().slice(0, 10), done: false, supplierId: 's1', amount: 1200, createdAt: iso(0), updatedAt: iso(0) },
  { id: 'r3', shopId: SHOP_ID, title: 'বিদ্যুৎ বিল পরিশোধ', dueDate: new Date(now.getTime() + 2 * 86400000).toISOString().slice(0, 10), done: false, amount: 350, createdAt: iso(1), updatedAt: iso(1) },
  { id: 'r4', shopId: SHOP_ID, title: 'সালমার বাকি ২৫০ টাকা', dueDate: new Date(now.getTime() - 86400000).toISOString().slice(0, 10), done: true, customerId: 'c3', amount: 250, createdAt: iso(3), updatedAt: iso(1) },
];

export const mockCashEntries: CashEntry[] = [
  { id: 'ce1', shopId: SHOP_ID, datetime: iso(0, 6, 0), type: 'ADJUSTMENT', amount: 5000, description: 'আজকের শুরুর নগদ', createdAt: iso(0, 6, 0) },
];

export const mockDailyCloses: DailyClose[] = [
  { id: 'dc1', shopId: SHOP_ID, date: iso(1).slice(0, 10), expectedCash: 6420, countedCash: 6400, difference: -20, totalSales: 1800, totalPurchases: 1500, totalExpenses: 80, totalWithdrawals: 0, notes: '২০ টাকা কম', createdAt: iso(1, 21, 0) },
  { id: 'dc2', shopId: SHOP_ID, date: iso(2).slice(0, 10), expectedCash: 5900, countedCash: 5900, difference: 0, totalSales: 2200, totalPurchases: 0, totalExpenses: 0, totalWithdrawals: 300, createdAt: iso(2, 21, 0) },
  { id: 'dc3', shopId: SHOP_ID, date: iso(3).slice(0, 10), expectedCash: 4700, countedCash: 4650, difference: -50, totalSales: 1600, totalPurchases: 0, totalExpenses: 200, totalWithdrawals: 0, notes: '৫০ টাকা ঘাটতি', createdAt: iso(3, 21, 0) },
];
