'use client';

import { Button } from '@aahar/ui';
import {
  ArrowRightLeft,
  CalendarClock,
  ChefHat,
  ClipboardList,
  CookingPot,
  CreditCard,
  Boxes,
  Hospital,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageOpen,
  Store,
  Tags,
  Utensils,
  UsersRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

const navigation = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/masters/hospitals', icon: Hospital, label: 'Hospitals' },
  { href: '/masters/stores', icon: Store, label: 'Stores' },
  { href: '/masters/kitchens', icon: ChefHat, label: 'Kitchens' },
  { href: '/masters/restaurants', icon: Utensils, label: 'Restaurants' },
  { href: '/masters/counters', icon: CreditCard, label: 'Counters' },
  { href: '/masters/item-categories', icon: Tags, label: 'Item Categories' },
  { href: '/masters/items', icon: PackageOpen, label: 'Items' },
  { href: '/masters/employees', icon: UsersRound, label: 'Employees' },
  { href: '/masters/time-slots', icon: CalendarClock, label: 'Time Slots' },
  { href: '/masters/store-items', icon: Store, label: 'Store Items' },
  { href: '/masters/kitchen-items', icon: ChefHat, label: 'Kitchen Items' },
  { href: '/masters/restaurant-menus', icon: Utensils, label: 'Restaurant Menus' },
  { href: '/inventory/grns', icon: ClipboardList, label: 'GRNs' },
  { href: '/inventory/store-stock', icon: Boxes, label: 'Store Stock' },
  { href: '/inventory/transfers', icon: ArrowRightLeft, label: 'Transfers' },
  { href: '/inventory/restaurant-stock', icon: Utensils, label: 'Restaurant Stock' },
  { href: '/kitchen/productions', icon: CookingPot, label: 'Kitchen Production' },
  { href: '/kitchen/stock', icon: ChefHat, label: 'Kitchen Stock' },
];

function SidebarContent({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
  const pathname = usePathname();

  return (
    <>
      <Link className="flex items-center gap-3 px-2" href="/dashboard" onClick={onNavigate}>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-600 text-white shadow-sm">
          <Utensils className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-lg font-semibold leading-5 text-slate-950">AAHAR</span>
          <span className="text-xs font-medium text-slate-500">Admin Portal</span>
        </span>
      </Link>
      <nav className="mt-8 flex flex-col gap-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                'flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 transition hover:bg-teal-50 hover:text-teal-800',
                isActive && 'bg-teal-50 text-teal-800 shadow-sm shadow-teal-900/5',
              )}
              href={item.href}
              key={item.href}
              onClick={onNavigate}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function LoadingShell() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const { accessToken, isReady, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isReady && !accessToken) {
      router.replace('/auth/login');
    }
  }, [accessToken, isReady, router]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (!isReady || !accessToken) {
    return <LoadingShell />;
  }

  return (
    <div className="min-h-screen bg-[#f5faf8] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 overflow-y-auto border-r bg-white px-5 py-6 shadow-sm shadow-slate-900/5 lg:block">
        <SidebarContent />
      </aside>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/30"
            onClick={() => setIsMobileMenuOpen(false)}
            type="button"
          />
          <aside className="relative h-full w-72 overflow-y-auto bg-white px-5 py-6 shadow-xl">
            <div className="mb-6 flex justify-end">
              <Button
                aria-label="Close navigation"
                onClick={() => setIsMobileMenuOpen(false)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarContent onNavigate={() => setIsMobileMenuOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b bg-white/95 px-4 py-3 shadow-sm shadow-slate-900/5 backdrop-blur lg:px-8">
          <div className="flex min-h-12 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                aria-label="Open navigation"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-teal-700">
                  Max Healthcare
                </p>
                <p className="text-sm font-medium text-slate-500">Food operations workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">Super Admin</p>
                <p className="text-xs text-slate-500">Active session</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
                SA
              </span>
              <Button
                aria-label="Log out"
                onClick={() => {
                  void logout().then(() => router.replace('/auth/login'));
                }}
                size="icon"
                type="button"
                variant="outline"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
