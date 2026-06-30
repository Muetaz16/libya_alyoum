'use client';

import React, { useEffect, useState } from 'react';
import { Moon } from 'lucide-react';

interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

const PRAYER_NAMES_AR: Record<string, string> = {
  Fajr: 'الفجر',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء'
};

export default function PrayerTimesWidget({ lang }: { lang: string }) {
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrayers = async () => {
      try {
        const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Benghazi&country=Libya&method=3');
        if (!res.ok) return;
        const data = await res.json();
        setTimes({
          Fajr: data.data.timings.Fajr,
          Dhuhr: data.data.timings.Dhuhr,
          Asr: data.data.timings.Asr,
          Maghrib: data.data.timings.Maghrib,
          Isha: data.data.timings.Isha
        });
      } catch (err) {
        console.error("Failed to fetch prayer times", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrayers();
  }, []);

  const formatTime = (time24: string) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const isRtl = lang === 'ar';

  return (
    <div className="bg-gradient-to-br from-[#1091ed] to-[#0b65a6] text-white rounded-2xl shadow-xl p-5 md:p-6 font-cairo border-t-4 border-red-600 h-full flex flex-col relative overflow-hidden group">
      {/* Decorative Background Icon */}
      <div className="absolute -bottom-10 -left-10 rtl:-right-10 rtl:left-auto opacity-10 pointer-events-none transition-transform group-hover:rotate-12 duration-700">
        <Moon size={200} />
      </div>

      <div className="flex items-center gap-2 border-b border-white/20 pb-3 mb-4 relative z-10">
        <Moon size={20} className="text-yellow-300" />
        <h3 className="text-lg font-bold text-white drop-shadow-sm">
          {isRtl ? 'مواقيت الصلاة' : 'Prayer Times'} <span className="text-sm opacity-80 font-normal ml-1">({isRtl ? 'بنغازي' : 'Benghazi'})</span>
        </h3>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8 relative z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : times ? (
        <div className="space-y-2 relative z-10 flex-1 flex flex-col justify-between">
          {Object.entries(times).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm bg-black/10 hover:bg-black/20 transition-colors rounded-xl px-4 py-2.5 shadow-sm">
              <span className="font-semibold text-white/95">
                {isRtl ? PRAYER_NAMES_AR[key] : key}
              </span>
              <span className="font-bold tracking-wider drop-shadow-md text-white" dir="ltr">
                {formatTime(value)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/80 relative z-10">{isRtl ? 'تعذر تحميل المواقيت' : 'Failed to load times'}</p>
      )}
    </div>
  );
}
