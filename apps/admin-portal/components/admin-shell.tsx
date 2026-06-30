'use client';

import { Button } from '@aahar/ui';
import {
  ArrowRightLeft,
  Bell,
  Boxes,
  CalendarClock,
  ChefHat,
  ChevronRight,
  ClipboardList,
  CookingPot,
  CreditCard,
  IndianRupee,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MapPin,
  PackageOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Store,
  Tags,
  Utensils,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BrandMark, MaxHealthcareMark } from '@/components/design-system';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/components/auth-provider';
import { Input, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

interface NavigationItem {
  href: string;
  icon: LucideIcon;
  label: string;
  permissions?: string[];
}

const navigationGroups: Array<{ items: NavigationItem[]; label: string }> = [
  {
    label: 'Workspace',
    items: [{ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Organization',
    items: [
      { href: '/masters/stores', icon: Store, label: 'Stores', permissions: ['STORE_VIEW'] },
      {
        href: '/masters/kitchens',
        icon: ChefHat,
        label: 'Kitchens',
        permissions: ['KITCHEN_VIEW'],
      },
      {
        href: '/masters/restaurants',
        icon: Utensils,
        label: 'Restaurants',
        permissions: ['RESTAURANT_VIEW'],
      },
      {
        href: '/masters/pos',
        icon: CreditCard,
        label: 'POS',
        permissions: ['POS_DEVICE_VIEW', 'PAYMENT_MACHINE_VIEW'],
      },
    ],
  },
  {
    label: 'Masters',
    items: [
      {
        href: '/masters/locations',
        icon: MapPin,
        label: 'Locations',
        permissions: ['HOSPITAL_VIEW'],
      },
      {
        href: '/masters/item-categories',
        icon: Tags,
        label: 'Item Categories',
        permissions: ['ITEM_CATEGORY_VIEW'],
      },
      { href: '/masters/items', icon: PackageOpen, label: 'Items', permissions: ['ITEM_VIEW'] },
      {
        href: '/masters/item-prices',
        icon: IndianRupee,
        label: 'Item Prices',
        permissions: ['ITEM_PRICE_VIEW'],
      },
      {
        href: '/masters/employees',
        icon: UsersRound,
        label: 'Employees',
        permissions: ['EMPLOYEE_VIEW'],
      },
      {
        href: '/masters/time-slots',
        icon: CalendarClock,
        label: 'Time Slots',
        permissions: ['TIME_SLOT_VIEW'],
      },
    ],
  },
  {
    label: 'Mappings',
    items: [
      {
        href: '/masters/store-items',
        icon: Store,
        label: 'Store Items',
        permissions: ['STORE_ITEM_VIEW'],
      },
      {
        href: '/masters/kitchen-items',
        icon: ChefHat,
        label: 'Kitchen Items',
        permissions: ['KITCHEN_ITEM_VIEW'],
      },
      {
        href: '/masters/restaurant-menus',
        icon: Utensils,
        label: 'Restaurant Menus',
        permissions: ['RESTAURANT_MENU_VIEW'],
      },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { href: '/inventory/grns', icon: ClipboardList, label: 'GRNs', permissions: ['GRN_VIEW'] },
      {
        href: '/inventory/store-stock',
        icon: Boxes,
        label: 'Store Stock',
        permissions: ['STOCK_VIEW'],
      },
      {
        href: '/inventory/stock-ledgers',
        icon: ListChecks,
        label: 'Stock Ledgers',
        permissions: ['STOCK_VIEW'],
      },
      {
        href: '/inventory/transfers',
        icon: ArrowRightLeft,
        label: 'Transfers',
        permissions: ['TRANSFER_VIEW', 'KITCHEN_TRANSFER_VIEW'],
      },
      {
        href: '/inventory/restaurant-stock',
        icon: Utensils,
        label: 'Restaurant Stock',
        permissions: ['RESTAURANT_STOCK_VIEW'],
      },
    ],
  },
  {
    label: 'Kitchen',
    items: [
      {
        href: '/kitchen/productions',
        icon: CookingPot,
        label: 'Kitchen Production',
        permissions: ['KITCHEN_PRODUCTION_VIEW'],
      },
      {
        href: '/kitchen/stock',
        icon: ChefHat,
        label: 'Kitchen Stock',
        permissions: ['KITCHEN_STOCK_VIEW'],
      },
    ],
  },
];

const breadcrumbLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  grns: 'GRNs',
  hospitals: 'Locations',
  inventory: 'Inventory',
  kitchen: 'Kitchen',
  locations: 'Locations',
  masters: 'Masters',
  new: 'New',
  pos: 'POS',
  stock: 'Stock',
};

function formatBreadcrumbSegment(segment: string): string {
  return (
    breadcrumbLabels[segment] ??
    segment
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

function getBreadcrumbs(pathname: string): string[] {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return ['Dashboard'];
  }

  return segments.map(formatBreadcrumbSegment);
}

function SidebarContent({
  collapsed,
  hasPermission,
  onNavigate,
}: Readonly<{
  collapsed?: boolean;
  hasPermission: (permission: string | string[]) => boolean;
  onNavigate?: () => void;
}>) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col">
      <Link
        aria-label="AAHAR dashboard"
        className={cn('flex rounded-xl px-1 py-1', collapsed && 'justify-center')}
        href="/dashboard"
        onClick={onNavigate}
      >
        <BrandMark collapsed={collapsed} />
      </Link>

      <nav className="mt-7 flex flex-1 flex-col gap-5">
        {navigationGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.permissions || hasPermission(item.permissions),
          );

          if (visibleItems.length === 0) {
            return null;
          }

          return (
            <div key={group.label}>
              {!collapsed ? (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-normal text-slate-400 dark:text-slate-500">
                  {group.label}
                </p>
              ) : null}
              <div className="flex flex-col gap-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      className={cn(
                        'group flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 transition hover:bg-brand-mint hover:text-brand-teal dark:text-slate-300 dark:hover:bg-teal-950 dark:hover:text-teal-200',
                        collapsed && 'justify-center px-2',
                        isActive &&
                          'bg-brand-blue text-white shadow-sm shadow-brand-blue/20 hover:bg-brand-blue hover:text-white dark:bg-sky-600 dark:text-white',
                      )}
                      href={item.href}
                      key={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="mt-6 rounded-lg border border-emerald-100 bg-brand-mint p-4 text-sm text-brand-navy dark:border-teal-900 dark:bg-teal-950 dark:text-teal-100">
          <MaxHealthcareMark className="mb-3 w-full justify-center bg-white/85 dark:bg-slate-950/75" />
          <p className="font-semibold">AAHAR</p>
          <p className="mt-1 text-xs text-brand-teal dark:text-teal-300">
            Food & Cafeteria Management Platform
          </p>
        </div>
      ) : null}
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const { currentUser, hasPermission, isAuthenticated, isReady, logout, roles } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const breadcrumbs = useMemo(() => getBreadcrumbs(pathname), [pathname]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const storedPreference = window.localStorage.getItem('aahar-sidebar-collapsed');

    setIsCollapsed(storedPreference === 'true');
  }, []);

  useEffect(() => {
    window.localStorage.setItem('aahar-sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isReady, router]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (!isReady || !isAuthenticated) {
    return <LoadingShell />;
  }

  const displayName = currentUser?.email ?? currentUser?.mobile ?? 'AAHAR User';
  const initials = displayName
    .split(/[.@\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  const roleLabel = roles[0] ?? 'Active user';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 hidden overflow-y-auto border-r border-slate-200 bg-white/95 px-4 py-5 shadow-sm shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:block',
          isCollapsed ? 'w-24' : 'w-72',
        )}
      >
        <div className="mb-5 flex items-center justify-end">
          <Button
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setIsCollapsed((current) => !current)}
            size="icon"
            type="button"
            variant="ghost"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
        <SidebarContent collapsed={isCollapsed} hasPermission={hasPermission} />
      </aside>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            type="button"
          />
          <aside className="relative h-full w-[min(22rem,86vw)] overflow-y-auto border-r border-slate-200 bg-white px-5 py-6 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-6 flex items-center justify-between">
              <BrandMark />
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
            <SidebarContent
              hasPermission={hasPermission}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div
        className={cn('transition-[padding] duration-200', isCollapsed ? 'lg:pl-24' : 'lg:pl-72')}
      >
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 lg:px-6">
          <div className="flex min-h-12 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
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
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {breadcrumbs.map((crumb, index) => (
                    <span className="inline-flex items-center gap-1" key={`${crumb}-${index}`}>
                      {index > 0 ? <ChevronRight className="h-3 w-3" /> : null}
                      <span
                        className={
                          index === breadcrumbs.length - 1
                            ? 'text-brand-blue dark:text-sky-300'
                            : ''
                        }
                      >
                        {crumb}
                      </span>
                    </span>
                  ))}
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-brand-navy dark:text-white">
                  Max Healthcare
                </p>
              </div>
            </div>

            <div className="hidden min-w-48 max-w-sm flex-1 lg:block">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  aria-label="Search workspace"
                  className="border-slate-200 bg-slate-50/80 pl-9 focus:bg-white dark:bg-slate-900/70"
                  placeholder="Search locations, items, transfers..."
                  type="search"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden xl:block">
                <MaxHealthcareMark />
              </div>
              <Button
                aria-label="Notifications"
                className="relative"
                size="icon"
                type="button"
                variant="outline"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-warning" />
              </Button>
              <ThemeToggle />
              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm shadow-slate-900/5 transition hover:border-brand-blue/30 hover:bg-brand-mint dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 [&::-webkit-details-marker]:hidden">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-sm font-semibold text-brand-blue dark:bg-sky-950 dark:text-sky-300">
                    {initials || 'AU'}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-semibold leading-4 text-slate-900 dark:text-white">
                      {displayName}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {roleLabel}
                    </span>
                  </span>
                </summary>
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {displayName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
                  </div>
                  <Link
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                    href="/dashboard"
                  >
                    <Settings className="h-4 w-4" />
                    Preferences
                  </Link>
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950"
                    onClick={() => {
                      void logout().then(() => router.replace('/auth/login'));
                    }}
                    type="button"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </details>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
