"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Gamepad2,
  LayoutDashboard,
  Package,
  BarChart3,
  Users,
  LogOut,
  Coffee,
  Monitor,
  Globe,
  ChevronRight,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { logout, getCurrentUser } from '@/app/actions';
import { toast } from 'sonner';
import { useLang } from '@/lib/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const Sidebar = ({ 
  isOpen, 
  onClose 
}: { 
  isOpen?: boolean; 
  onClose?: () => void 
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const { t, toggleLanguage, lang, isRTL } = useLang();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await getCurrentUser();
        setUser(u);
      } catch (err) {
        console.error('Sidebar Auth Error:', err);
      }
    };
    fetchUser();
  }, [pathname]);

  const handleLogout = async () => {
    if (!confirm(t('nav.signOutConfirm'))) return;
    await logout();
  };

  const menuItems = [
    { icon: LayoutDashboard, labelKey: 'nav.dashboard' as const, href: '/', colorActive: 'text-blue-400' },
    { icon: Monitor,         labelKey: 'nav.devices'   as const, href: '/devices', colorActive: 'text-violet-400' },
    { icon: Coffee,          labelKey: 'nav.cafeteria' as const, href: '/cafetria', colorActive: 'text-amber-400' },
    { icon: Package,         labelKey: 'nav.inventory' as const, href: '/inventory', colorActive: 'text-teal-400' },
    { icon: BarChart3,       labelKey: 'nav.reports'   as const, href: '/reports', colorActive: 'text-blue-400' },
    { icon: Users,           labelKey: 'nav.staff'     as const, href: '/staff', colorActive: 'text-violet-400' },
    { icon: Settings,        labelKey: 'nav.settings'  as const, href: '/settings', colorActive: 'text-fuchsia-400' },
  ];

  return (
    <>
      {/* Overlay - Mobile Only */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed inset-y-0 z-[70] w-72 flex flex-col p-5 h-screen transition-all duration-300 transform shrink-0',
          'bg-background border-r border-border',
          isRTL ? 'right-0 border-r-0 border-l' : 'left-0',
          isOpen ? 'translate-x-0' : (isRTL ? 'translate-x-[100%]' : 'translate-x-[-100%]'),
          'lg:relative lg:translate-x-0 lg:flex lg:w-64'
        )}
      >
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 text-muted-foreground hover:bg-muted rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      {/* Logo */}
      <div className={cn('flex items-center gap-3 mb-8 px-2', isRTL && 'flex-row-reverse')}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
          <Gamepad2 className="text-white w-5 h-5" />
        </div>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h1 className="text-muted-foreground/90se font-black tracking-tight text-white leading-tight">
            PS CAFE <span className="text-blue-400">PRO</span>
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{t('nav.managementSuite')}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.labelKey === 'nav.devices' && user?.role !== 'ADMIN') return null;
          if (item.labelKey === 'nav.inventory' && user?.role !== 'ADMIN') return null;
          if (item.labelKey === 'nav.reports' && user?.role !== 'ADMIN') return null;
          if (item.labelKey === 'nav.staff' && user?.role !== 'ADMIN') return null;
          if (item.labelKey === 'nav.settings' && user?.role !== 'ADMIN') return null;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative',
                isRTL && 'flex-row-reverse',
                isActive
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted'
              )}
            >
              {isActive && (
                <div className={cn(
                  'nav-active-bar',
                  isRTL ? 'right-0 left-auto rounded-r-none rounded-l-[4px]' : 'left-0'
                )} />
              )}
              <Icon className={cn('w-[18px] h-[18px] shrink-0', isActive && item.colorActive)} />
              <span className={cn('font-semibold text-base', isRTL && 'text-right')}>{t(item.labelKey)}</span>
              {isActive && (
                <ChevronRight className={cn(
                  'w-3 h-3 ms-auto text-blue-400/60',
                  isRTL && 'rotate-180'
                )} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-auto pt-4 border-t border-border space-y-1">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className={cn(
            'flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-muted-foreground hover:text-muted-foreground hover:bg-muted transition-all',
            isRTL && 'flex-row-reverse'
          )}
        >
          <Globe className="w-[18px] h-[18px] shrink-0" />
          <span className="text-base font-semibold">{t('common.language')}</span>
          <span className={cn(
            'ms-auto badge badge-blue text-[9px]',
            lang === 'ar' ? '' : ''
          )}>
            {lang === 'ar' ? 'AR' : 'EN'}
          </span>
        </button>

        {/* User */}
        <div className={cn('flex items-center gap-3 px-4 py-2', isRTL && 'flex-row-reverse')}>
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"
            style={{ background: 'rgba(59,130,246,0.15)' }}>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className={cn('flex-1 min-w-0', isRTL && 'text-right')}>
            <p className="text-sm font-bold truncate text-muted-foreground">{user?.username || 'Guest'}</p>
            <p className="text-xs text-muted-foreground">{t('nav.role')}: {user?.role || 'User'}</p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all',
            isRTL && 'flex-row-reverse'
          )}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          <span className="text-base font-semibold">{t('nav.signOut')}</span>
        </button>
      </div>
    </aside>
    </>
  );
};
