import { Home, Mic, CalendarDays, Users, Building2, Banknote, Package, Bell, BarChart3, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Route =
  | 'home'
  | 'speak'
  | 'today'
  | 'customers'
  | 'suppliers'
  | 'cash'
  | 'inventory'
  | 'reminders'
  | 'reports'
  | 'settings';

interface NavItem {
  route: Route;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { route: 'home', label: 'হোম', icon: Home },
  { route: 'speak', label: 'কথা বলুন', icon: Mic },
  { route: 'today', label: 'আজকের ব্যবসা', icon: CalendarDays },
  { route: 'customers', label: 'কাস্টমার', icon: Users },
  { route: 'suppliers', label: 'সাপ্লায়ার', icon: Building2 },
  { route: 'cash', label: 'নগদ', icon: Banknote },
  { route: 'inventory', label: 'স্টক', icon: Package },
  { route: 'reminders', label: 'রিমাইন্ডার', icon: Bell },
  { route: 'reports', label: 'রিপোর্ট', icon: BarChart3 },
  { route: 'settings', label: 'সেটিংস', icon: Settings },
];

interface BottomNavProps {
  current: Route;
  onNavigate: (route: Route) => void;
}

const PRIMARY_ROUTES: Route[] = ['home', 'speak', 'today', 'reports'];

export function BottomNav({ current, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-ink-100 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-stretch justify-around px-1 py-1">
        {PRIMARY_ROUTES.map((route) => {
          const item = NAV_ITEMS.find((n) => n.route === route)!;
          const active = current === route;
          const Icon = item.icon;
          const isSpeak = route === 'speak';
          if (isSpeak) {
            return (
              <button
                key={route}
                onClick={() => onNavigate(route)}
                className="flex flex-col items-center justify-center gap-0.5 px-3 -mt-4 btn-press"
              >
                <div className={`w-14 h-14 rounded-full grid place-items-center shadow-float transition-colors ${active ? 'bg-primary-800' : 'bg-primary-700'}`}>
                  <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <span className={`text-[10px] font-semibold ${active ? 'text-primary-700' : 'text-ink-500'}`}>{item.label}</span>
              </button>
            );
          }
          return (
            <button
              key={route}
              onClick={() => onNavigate(route)}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 btn-press flex-1"
            >
              <Icon className={`w-5 h-5 ${active ? 'text-primary-700' : 'text-ink-400'}`} strokeWidth={active ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${active ? 'text-primary-700' : 'text-ink-400'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

interface DrawerNavProps {
  current: Route;
  onNavigate: (route: Route) => void;
  open: boolean;
  onClose: () => void;
  shopName?: string;
  ownerName?: string;
}

export function DrawerNav({ current, onNavigate, open, onClose, shopName, ownerName }: DrawerNavProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-float animate-slide-up flex flex-col">
        <div className="bg-primary-700 px-5 py-6 text-white">
          <p className="text-xs text-primary-100">দোকান</p>
          <p className="text-lg font-bold">{shopName ?? '—'}</p>
          <p className="text-sm text-primary-200">{ownerName ?? '—'}</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map((item) => {
            const active = current === item.route;
            const Icon = item.icon;
            return (
              <button
                key={item.route}
                onClick={() => { onNavigate(item.route); onClose(); }}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left btn-press ${active ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-ink-700'}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
