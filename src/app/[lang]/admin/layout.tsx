'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  FolderTree, 
  Users, 
  AlertTriangle, 
  Database, 
  LogOut, 
  Menu, 
  X, 
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Radio
} from 'lucide-react';
import { getTranslations } from '@/lib/translations';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const lang = (params?.lang as string) || 'ar';
  const t = getTranslations(lang);
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch logged in admin details
  useEffect(() => {
    if (pathname.includes('/admin/login')) return;

    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setAdminUser(data.user);
        } else {
          router.push(`/${lang}/admin/login`);
        }
      } catch (err) {
        console.error('Error fetching admin profile:', err);
      }
    };
    fetchMe();
  }, [pathname, lang, router]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push(`/${lang}/admin/login`);
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (!mounted) return null;

  // If we are on the login page, don't show the dashboard shell
  if (pathname.includes('/admin/login')) {
    return <div className="min-h-screen bg-gray-100 dark:bg-darkgray-darker transition-colors duration-300">{children}</div>;
  }

  const menuItems = [
    { href: `/${lang}/admin`, label: t.adminMenu.overview, icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'EDITOR', 'JOURNALIST', 'VIEWER'] },
    { href: `/${lang}/admin/news`, label: t.adminMenu.news, icon: FileText, roles: ['SUPER_ADMIN', 'EDITOR', 'JOURNALIST'] },
    { href: `/${lang}/admin/categories`, label: t.adminMenu.categories, icon: FolderTree, roles: ['SUPER_ADMIN'] },
    { href: `/${lang}/admin/users`, label: t.adminMenu.users, icon: Users, roles: ['SUPER_ADMIN'] },
    { href: `/${lang}/admin/breaking`, label: t.adminMenu.breaking, icon: AlertTriangle, roles: ['SUPER_ADMIN', 'EDITOR'] },
    { href: `/${lang}/admin/live`, label: lang === 'ar' ? 'البث المباشر' : 'Live Stream', icon: Radio, roles: ['SUPER_ADMIN', 'EDITOR'] },
    { href: `/${lang}/admin/backup`, label: t.adminMenu.backup, icon: Database, roles: ['SUPER_ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !adminUser || item.roles.includes(adminUser.role)
  );

  const isRtl = lang === 'ar';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-darkgray dark:bg-black text-white w-64 shrink-0 transition-colors duration-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <Link href={`/${lang}`} className="flex items-center space-x-2 space-x-reverse" target="_blank">
          <div className="w-8 h-8 bg-red-600 flex items-center justify-center rounded-lg shadow-md">
            <span className="text-white font-extrabold text-lg">ل</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white font-cairo">
              {t.siteName}
            </span>
            <span className="text-[8px] text-gray-400 -mt-1 flex items-center gap-0.5">
              <span>{t.adminDashboard}</span>
              <ExternalLink size={8} />
            </span>
          </div>
        </Link>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 font-cairo text-sm overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== `/${lang}/admin` && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                isActive
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      {adminUser && (
        <div className="p-4 border-t border-gray-800 space-y-3 font-cairo bg-black/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-500 border border-red-500/20 flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{adminUser.name}</p>
              <p className="text-[10px] text-gray-400 font-semibold truncate uppercase">
                {t.roles[adminUser.role as keyof typeof t.roles]}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-950/20 text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-900/60 rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            <LogOut size={13} />
            <span>{t.logoutBtn}</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-darkgray-darker transition-colors duration-300 overflow-x-hidden">
      
      {/* Desktop Sidebar (Toggled) */}
      <div className={`hidden md:block transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        {sidebarContent}
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)}></div>
          <div className="relative flex flex-col w-64 h-full animate-slide-in-rtl">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-[-44px] ltr:right-auto ltr:left-[-44px] p-2 bg-darkgray text-white rounded"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Admin Bar Header */}
        <div className="bg-white dark:bg-darkgray-lighter border-b border-gray-200 dark:border-darkgray-lighter h-16 px-4 md:px-8 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden text-gray-700 dark:text-gray-300"
            >
              <Menu size={24} />
            </button>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:block p-1.5 bg-gray-100 dark:bg-darkgray text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-darkgray-lighter transition-colors cursor-pointer"
            >
              {sidebarOpen ? (
                isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />
              ) : (
                isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />
              )}
            </button>

            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 font-cairo">
              {t.adminDashboard}
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold font-cairo">
            <Link
              href={`/${lang}`}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-500 hover:underline"
            >
              <span>{isRtl ? 'عرض الموقع العام' : 'View Public Site'}</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        {/* Dashboard Pages */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-gray-50 dark:bg-darkgray-darker">
          {children}
        </div>
      </div>
    </div>
  );
}
