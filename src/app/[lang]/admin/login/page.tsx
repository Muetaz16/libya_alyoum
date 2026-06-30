'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { getTranslations } from '@/lib/translations';

export default function AdminLoginPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'ar';
  const t = getTranslations(lang);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to admin overview page
        router.push(`/${lang}/admin`);
      } else {
        setError(data.error || 'فشلت عملية تسجيل الدخول. يرجى مراجعة البيانات.');
      }
    } catch (err) {
      console.error('Login request error:', err);
      setError('حدث خطأ في الشبكة. تعذر الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-darkgray-darker px-4 transition-colors duration-300 font-cairo">
      <div className="w-full max-w-md bg-white dark:bg-darkgray-lighter rounded-2xl shadow-xl border border-gray-150 dark:border-gray-800 overflow-hidden">
        
        {/* Top Header branding */}
        <div className="bg-red-600 p-8 text-center text-white space-y-2">
          <div className="w-12 h-12 bg-white text-red-600 mx-auto flex items-center justify-center rounded-xl shadow-lg transform rotate-3">
            <span className="font-black text-2xl">ل</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">{t.siteName}</h1>
          <p className="text-xs text-red-100">{t.adminLoginTitle}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg text-xs font-semibold">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
              {t.emailLabel}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 ltr:right-auto ltr:left-3">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@libyaalyoum.ly"
                required
                className="w-full pr-10 pl-4 ltr:pl-10 ltr:pr-4 py-2.5 bg-gray-50 dark:bg-darkgray-darker text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-sm transition-all"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 ltr:right-auto ltr:left-3">
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pr-10 pl-4 ltr:pl-10 ltr:pr-4 py-2.5 bg-gray-50 dark:bg-darkgray-darker text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-sm transition-all"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-md cursor-pointer transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            <span>{t.loginBtn}</span>
          </button>
        </form>


      </div>
    </div>
  );
}
