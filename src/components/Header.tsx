'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Search, Menu, X, Sun, Moon, Globe, Volume2, VolumeX, Radio } from 'lucide-react';
import { getTranslations } from '@/lib/translations';

interface BreakingNewsItem {
  id: string;
  textAr: string;
  textEn: string | null;
}

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  parentId: string | null;
  children?: Category[];
}

export default function Header() {
  const params = useParams();
  const lang = (params?.lang as string) || 'ar';
  const t = getTranslations(lang);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [breakingNews, setBreakingNews] = useState<BreakingNewsItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tickerPlaying, setTickerPlaying] = useState(true);
  const [liveDate, setLiveDate] = useState('');

  // Hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch breaking news
  useEffect(() => {
    const fetchBreaking = async () => {
      try {
        const res = await fetch('/api/breaking');
        if (res.ok) {
          const data = await res.json();
          setBreakingNews(data);
        }
      } catch (err) {
        console.error('Error fetching breaking news:', err);
      }
    };
    fetchBreaking();
    // Refresh every 5 minutes
    const interval = setInterval(fetchBreaking, 5 * 60 * 1000);

    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          // Filter to only main categories, children are inside .children
          const mainCats = data.filter((c: Category) => !c.parentId);
          setCategories(mainCats);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();

    return () => clearInterval(interval);
  }, []);

  // Live Date Effect
  useEffect(() => {
    const updateDate = () => {
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        calendar: lang === 'ar' ? 'islamic-umalqura' : 'gregory',
      };
      
      const gregOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };

      const now = new Date();
      if (lang === 'ar') {
        const hijri = now.toLocaleDateString('ar-SA', options);
        const greg = now.toLocaleDateString('ar-LY', gregOptions);
        setLiveDate(`${greg} | الموافق ${hijri}`);
      } else {
        setLiveDate(now.toLocaleDateString('en-US', gregOptions));
      }
    };

    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, [lang]);

  // Language Switcher
  const toggleLanguage = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar';
    const newPath = pathname.replace(`/${lang}`, `/${newLang}`);
    router.push(newPath);
  };

  // Search Submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${lang}/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Categories are now fetched dynamically from the database.

  if (!mounted) return null;

  const isRtl = lang === 'ar';

  return (
    <header className="w-full bg-[#1091ed] sticky top-0 z-50 transition-colors duration-300 shadow-md border-b-4 border-red-600">
      {/* Top Utility Bar */}
      <div className="bg-gray-900 text-white text-xs py-2 px-4 md:px-8 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
          <span className="opacity-90">{liveDate}</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hover:text-red-400 transition-colors cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>


        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white hover:text-gray-200"
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Branding Logo */}
        <Link href={`/${lang}`} className="flex items-center shrink-0">
          <img 
            src="/logo-white.png" 
            alt="Libya Alyoum" 
            className="h-12 md:h-14 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform" 
          />
        </Link>

        {/* Desktop Navbar Categories */}
        <nav className="hidden md:flex items-center space-x-8 space-x-reverse font-cairo font-semibold flex-1 justify-center">
          {categories.map((cat) => (
            <div key={cat.slug} className="relative group">
              <Link
                href={`/${lang}/category/${cat.slug}`}
                className={`transition-colors block py-2 text-[15px] ${
                  pathname.includes(`/category/${cat.slug}`)
                    ? 'text-white font-black drop-shadow-md border-b-2 border-white'
                    : 'text-white/90 hover:text-white hover:drop-shadow-sm'
                }`}
              >
                {isRtl ? cat.nameAr : cat.nameEn}
              </Link>

              {cat.children && cat.children.length > 0 && (
                <div className="absolute hidden group-hover:flex flex-col bg-white dark:bg-darkgray-lighter shadow-2xl border-t-4 border-[#1091ed] rounded-b-lg py-2 min-w-[180px] z-50 top-full pt-1 right-0">
                  {cat.children.map(child => (
                    <Link 
                      key={child.slug} 
                      href={`/${lang}/category/${child.slug}`} 
                      className={`px-5 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-darkgray transition-colors ${
                        pathname.includes(`/category/${child.slug}`)
                          ? 'text-[#1091ed] font-bold border-r-4 border-[#1091ed]'
                          : 'text-gray-800 dark:text-gray-200 hover:text-[#1091ed]'
                      }`}
                    >
                      {isRtl ? child.nameAr : child.nameEn}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Search Toggle */}
        <div className="flex items-center justify-end w-12 shrink-0">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Toggle Search"
          >
            <Search size={22} />
          </button>
        </div>
      </div>

      {/* Floating search overlay */}
      {searchOpen && (
        <div className="bg-gray-50 dark:bg-darkgray-lighter border-b border-gray-200 dark:border-gray-700 px-4 py-3 transition-all duration-300">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              autoFocus
              className="flex-1 px-4 py-2 bg-white dark:bg-darkgray-darker text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-cairo"
            >
              {t.searchButton}
            </button>
          </form>
        </div>
      )}

      {/* Breaking News Ticker */}
      {breakingNews.length > 0 && (
        <div className="bg-red-600 text-white flex items-stretch h-10 border-t border-red-700 select-none overflow-hidden relative">
          <div className="bg-black text-white px-4 md:px-6 flex items-center justify-center font-bold text-xs uppercase tracking-wider relative z-10 gap-2 shrink-0 animate-pulse font-cairo shadow-lg">
            <Radio size={14} className="text-red-500 animate-ping" />
            <span>{t.breakingNews}</span>
          </div>

          <div
            className="flex-1 overflow-hidden relative h-full flex items-center"
            onMouseEnter={() => setTickerPlaying(false)}
            onMouseLeave={() => setTickerPlaying(true)}
          >
            <div
              className={`flex whitespace-nowrap gap-16 absolute ${
                isRtl ? 'right-0' : 'left-0'
              } transition-all duration-300`}
              style={{
                animation: tickerPlaying
                  ? `${isRtl ? 'ticker-rtl' : 'ticker-ltr'} ${breakingNews.length * 15}s linear infinite`
                  : 'none',
              }}
            >
              {breakingNews.map((item, idx) => (
                <div key={item.id || idx} className="text-xs md:text-sm font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  <span>{isRtl ? item.textAr : (item.textEn || item.textAr)}</span>
                </div>
              ))}
              {/* Duplicate list to enable infinite loop */}
              {breakingNews.map((item, idx) => (
                <div key={`dup-${item.id || idx}`} className="text-xs md:text-sm font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  <span>{isRtl ? item.textAr : (item.textEn || item.textAr)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Open */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-darkgray-darker border-t border-gray-200 dark:border-gray-700 px-4 py-4 space-y-3 font-cairo">
          {categories.map((cat) => (
            <div key={cat.slug}>
              <Link
                href={`/${lang}/category/${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-800 dark:text-gray-200 py-2 border-b border-gray-100 dark:border-gray-800"
              >
                {isRtl ? cat.nameAr : cat.nameEn}
              </Link>
              {cat.children && cat.children.length > 0 && (
                <div className="pl-4 pr-4 bg-gray-50 dark:bg-darkgray/30 rounded-md mt-1 mb-2">
                  {cat.children.map(child => (
                    <Link
                      key={child.slug}
                      href={`/${lang}/category/${child.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-gray-600 dark:text-gray-400 py-2 border-b border-gray-100/50 dark:border-gray-800/50 text-sm last:border-0"
                    >
                      - {isRtl ? child.nameAr : child.nameEn}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Marquee Ticker Styles */}
      <style jsx global>{`
        @keyframes ticker-rtl {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(50%);
          }
        }
        @keyframes ticker-ltr {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </header>
  );
}
