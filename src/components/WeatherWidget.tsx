'use client';

import React, { useEffect, useState } from 'react';
import { Cloud, CloudRain, Sun, CloudLightning, CloudSnow } from 'lucide-react';

interface WeatherData {
  cityAr: string;
  cityEn: string;
  temp: number;
  code: number;
}

const CITIES = [
  { nameAr: 'طرابلس', nameEn: 'Tripoli', lat: 32.8752, lon: 13.1875 },
  { nameAr: 'بنغازي', nameEn: 'Benghazi', lat: 32.1167, lon: 20.0667 },
  { nameAr: 'مصراتة', nameEn: 'Misrata', lat: 32.3754, lon: 15.0925 },
  { nameAr: 'سبها', nameEn: 'Sabha', lat: 27.0377, lon: 14.4283 },
  { nameAr: 'سرت', nameEn: 'Sirte', lat: 31.2089, lon: 16.5887 }
];

export default function WeatherWidget({ lang }: { lang: string }) {
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const promises = CITIES.map(async (city) => {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true`);
          if (!res.ok) return null;
          const data = await res.json();
          return {
            cityAr: city.nameAr,
            cityEn: city.nameEn,
            temp: data.current_weather?.temperature || 0,
            code: data.current_weather?.weathercode || 0
          };
        });
        
        const results = await Promise.all(promises);
        setWeather(results.filter(Boolean) as WeatherData[]);
      } catch (err) {
        console.error("Failed to fetch weather", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <Sun className="text-yellow-500" size={18} />;
    if (code <= 48) return <Cloud className="text-gray-400" size={18} />;
    if (code <= 67 || code >= 80) return <CloudRain className="text-blue-400" size={18} />;
    if (code <= 77) return <CloudSnow className="text-blue-200" size={18} />;
    if (code >= 95) return <CloudLightning className="text-purple-500" size={18} />;
    return <Sun className="text-yellow-500" size={18} />;
  };

  const isRtl = lang === 'ar';

  return (
    <div className="bg-gradient-to-br from-blue-900 to-blue-950 text-white rounded-2xl shadow-xl border border-blue-800 p-5 md:p-6 font-cairo h-full flex flex-col relative overflow-hidden group">
      {/* Decorative Background Icon */}
      <div className="absolute -top-10 -right-10 rtl:-left-10 rtl:right-auto opacity-5 pointer-events-none transition-transform group-hover:scale-110 duration-700">
        <Sun size={200} />
      </div>

      <h3 className="text-lg font-bold text-white border-b border-blue-800/50 pb-3 mb-4 flex items-center gap-2 relative z-10">
        <Sun size={20} className="text-yellow-400" />
        {isRtl ? 'حالة الطقس' : 'Weather'}
      </h3>
      
      {loading ? (
        <div className="flex justify-center py-8 relative z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="space-y-2 relative z-10 flex-1 flex flex-col justify-between">
          {weather.map((w, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-4 py-2.5 shadow-sm">
              <span className="text-sm font-semibold text-white/90">
                {isRtl ? w.cityAr : w.cityEn}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-white" dir="ltr">
                  {Math.round(w.temp)}°C
                </span>
                {getWeatherIcon(w.code)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
