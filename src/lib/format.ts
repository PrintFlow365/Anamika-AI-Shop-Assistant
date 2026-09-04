// Formatting helpers — Bangla numerals, currency, dates.

const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBnDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => bnDigits[Number(d)]);
}

export function formatTaka(amount: number): string {
  const rounded = Math.round(amount);
  return `৳${toBnDigits(rounded.toLocaleString('en-US'))}`;
}

export function formatTakaSigned(amount: number): string {
  const sign = amount < 0 ? '−' : '';
  return `${sign}${formatTaka(Math.abs(amount))}`;
}

export function formatNumber(n: number): string {
  return toBnDigits(n.toLocaleString('en-US'));
}

const bnMonths = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
];

const bnDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

export function formatBnDate(iso: string): string {
  const d = new Date(iso);
  return `${bnDays[d.getDay()]}, ${toBnDigits(d.getDate())} ${bnMonths[d.getMonth()]} ${toBnDigits(d.getFullYear())}`;
}

export function formatBnDateShort(iso: string): string {
  const d = new Date(iso);
  return `${toBnDigits(d.getDate())} ${bnMonths[d.getMonth()]}`;
}

export function formatBnTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${toBnDigits(h)}:${toBnDigits(min)} ${ampm}`;
}

export function isToday(iso: string): boolean {
  return iso.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function relativeDay(iso: string): string {
  const today = todayISODate();
  const yesterday = daysAgoISO(1);
  if (iso.slice(0, 10) === today) return 'আজ';
  if (iso.slice(0, 10) === yesterday) return 'গতকাল';
  return formatBnDateShort(iso);
}
