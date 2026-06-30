'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { getTranslations } from '@/lib/translations';

export default function Footer() {
  const params = useParams();
  const lang = (params?.lang as string) || 'ar';
  const t = getTranslations(lang);

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage('');
    setStatus('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setEmail('');
        setStatus('success');
        setMessage(data.message || 'تم الاشتراك بنجاح!');
      } else {
        setStatus('error');
        setMessage(data.error || 'حدث خطأ ما. يرجى المحاولة مرة أخرى.');
      }
    } catch (err) {
      console.error('Newsletter error:', err);
      setStatus('error');
      setMessage('تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { slug: 'politics', nameAr: 'السياسة', nameEn: 'Politics' },
    { slug: 'libya', nameAr: 'أخبار ليبيا', nameEn: 'Libya' },
    { slug: 'economy', nameAr: 'الاقتصاد', nameEn: 'Economy' },
    { slug: 'sports', nameAr: 'الرياضة', nameEn: 'Sports' },
    { slug: 'technology', nameAr: 'التكنولوجيا', nameEn: 'Technology' },
    { slug: 'health', nameAr: 'الصحة', nameEn: 'Health' },
    { slug: 'world-news', nameAr: 'أخبار العالم', nameEn: 'World' },
    { slug: 'culture', nameAr: 'الثقافة وفنون', nameEn: 'Culture' },
  ];

  if (!mounted) return null;

  const isRtl = lang === 'ar';

  return (
    <footer className="bg-[#1091ed] text-white border-t-4 border-red-600 transition-colors duration-300 font-cairo">
      {/* Top Footer Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Info Column */}
        <div className="space-y-4">
          <div className="flex items-center shrink-0 mb-4">
            <img 
              src="/logo-white.png" 
              alt="Libya Alyoum" 
              className="h-14 w-auto object-contain drop-shadow-md" 
            />
          </div>
          <p className="text-sm text-white/90 leading-relaxed">
            {t.tagline}. {isRtl ? 'نغطي الأخبار الليبية والدولية بكل مصداقية وموضوعية، من قلب الحدث.' : 'Covering Libyan and international news with credibility and objectivity, straight from the heart of events.'}
          </p>
          <div className="flex space-x-4 space-x-reverse pt-2">
            <a href="https://www.facebook.com/share/1DDaj41mfd/?mibextid=wwXIfr" target="_blank" rel="noreferrer" className="text-white/90 hover:text-white transition-transform hover:scale-110" aria-label="Facebook">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://www.instagram.com/libya.alyoum.channel?igsh=Z3RycGhrczkydTgy" target="_blank" rel="noreferrer" className="text-white/90 hover:text-white transition-transform hover:scale-110" aria-label="Instagram">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.905a1.44 1.44 0 11-2.881 0 1.44 1.44 0 012.881 0z"/>
              </svg>
            </a>
            <a href="https://www.tiktok.com/@libya.today.channel?_r=1&_t=ZS-97OughqglkH" target="_blank" rel="noreferrer" className="text-white/90 hover:text-white transition-transform hover:scale-110" aria-label="TikTok">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.23-1.15 4.37-2.92 5.74-1.74 1.34-4.04 1.94-6.21 1.5-2.15-.42-4.06-1.69-5.2-3.49-1.13-1.78-1.5-3.94-1-6.02.48-2.07 1.83-3.83 3.66-4.83 1.81-.99 3.96-1.23 5.92-.68.1.03.2.06.31.09v4.24c-1.07-.46-2.33-.42-3.37.11-.97.48-1.71 1.35-2.01 2.39-.28 1.01-.11 2.13.46 3.02.53.85 1.45 1.44 2.45 1.63.98.2 2.01.07 2.87-.41.87-.49 1.52-1.28 1.8-2.25.13-.42.18-.86.19-1.31.02-3.79.02-7.58.02-11.37h.03z"/>
              </svg>
            </a>
            <a href="https://youtube.com/@libyaalyoumchannel?si=764DTnbhcWfOnVsW" target="_blank" rel="noreferrer" className="text-white/90 hover:text-white transition-transform hover:scale-110" aria-label="YouTube">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="space-y-4 col-span-1 md:col-span-2">
          <h3 className="text-md font-bold text-white border-b border-white/20 pb-2 drop-shadow-sm">
            {isRtl ? 'أقسام الموقع' : 'Sections'}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-white/90">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${lang}/category/${cat.slug}`}
                className="hover:text-white hover:translate-x-1 rtl:hover:-translate-x-1 transition-all flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full shrink-0 shadow-sm"></span>
                <span>{isRtl ? cat.nameAr : cat.nameEn}</span>
              </Link>
            ))}
            <Link
              href={`/${lang}/videos`}
              className="hover:text-white hover:translate-x-1 rtl:hover:-translate-x-1 transition-all flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 bg-white rounded-full shrink-0 shadow-sm"></span>
              <span>{t.navVideos}</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Bottom Copyright Bar */}
      <div className="bg-[#0b65a6] py-4 text-xs text-white/80 text-center px-4 shadow-[inset_0_4px_10px_rgba(0,0,0,0.1)]">
        <p>&copy; {new Date().getFullYear()} {t.allRightsReserved}.</p>
      </div>
    </footer>
  );
}
