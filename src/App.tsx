import { useState } from 'react';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { AuthScreen } from '@/auth/AuthScreen';
import { StoreProvider } from '@/store/StoreContext';
import { BottomNav, DrawerNav, type Route } from '@/components/Navigation';
import { AppHeader } from '@/components/AppHeader';
import { HomeScreen } from '@/screens/HomeScreen';
import { SpeakScreen } from '@/screens/SpeakScreen';
import { TodayScreen } from '@/screens/TodayScreen';
import { CustomersScreen } from '@/screens/CustomersScreen';
import { SuppliersScreen } from '@/screens/SuppliersScreen';
import { CashScreen } from '@/screens/CashScreen';
import { InventoryScreen } from '@/screens/InventoryScreen';
import { RemindersScreen } from '@/screens/RemindersScreen';
import { ReportsScreen } from '@/screens/ReportsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { useAppStore } from '@/store/StoreContext';
import { Mic, Loader2 } from 'lucide-react';

const ROUTE_TITLES: Record<Route, { title: string; subtitle?: string }> = {
  home: { title: 'হোম' },
  speak: { title: 'কথা বলুন', subtitle: 'ভয়েস দিয়ে এন্ট্রি' },
  today: { title: 'আজকের ব্যবসা' },
  customers: { title: 'কাস্টমার' },
  suppliers: { title: 'সাপ্লায়ার' },
  cash: { title: 'নগদ' },
  inventory: { title: 'স্টক' },
  reminders: { title: 'রিমাইন্ডার' },
  reports: { title: 'রিপোর্ট' },
  settings: { title: 'সেটিংস' },
};

function AppContent() {
  const [route, setRoute] = useState<Route>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const shop = useAppStore((s) => s.shop);
  const loading = useAppStore((s) => s.loading);

  const navigate = (r: Route) => {
    setRoute(r);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showHeader = route !== 'home' && route !== 'speak';
  const showMicButton = route !== 'speak';
  const meta = ROUTE_TITLES[route];

  if (loading && !shop) {
    return (
      <div className="min-h-screen bg-ink-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-100">
      {showHeader && (
        <AppHeader
          title={meta.title}
          subtitle={meta.subtitle}
          onMenu={() => setDrawerOpen(true)}
          right={
            showMicButton ? (
              <button
                onClick={() => navigate('speak')}
                className="w-10 h-10 rounded-full bg-primary-700 grid place-items-center btn-press shadow-float"
              >
                <Mic className="w-5 h-5 text-white" />
              </button>
            ) : undefined
          }
        />
      )}

      <main className={`pb-24 ${route === 'home' ? 'pt-0' : 'pt-2'}`}>
        {route === 'home' && <HomeScreen onNavigate={navigate} />}
        {route === 'speak' && <SpeakScreen onDone={() => navigate('today')} />}
        {route === 'today' && <TodayScreen />}
        {route === 'customers' && <CustomersScreen />}
        {route === 'suppliers' && <SuppliersScreen />}
        {route === 'cash' && <CashScreen />}
        {route === 'inventory' && <InventoryScreen />}
        {route === 'reminders' && <RemindersScreen />}
        {route === 'reports' && <ReportsScreen />}
        {route === 'settings' && <SettingsScreen />}
      </main>

      <DrawerNav
        current={route}
        onNavigate={navigate}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        shopName={shop?.name}
        ownerName={shop?.ownerName}
      />
      <BottomNav current={route} onNavigate={navigate} />
    </div>
  );
}

function AuthedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthedApp />
    </AuthProvider>
  );
}
