'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Eye, ChevronRight, ChevronLeft } from 'lucide-react';

interface NewsItem {
  id: string;
  slug: string;
  titleAr: string;
  titleEn?: string | null;
  summaryAr: string;
  summaryEn?: string | null;
  image?: string | null;
  publishDate: Date;
  views: number;
  category: {
    nameAr: string;
    nameEn: string;
    color?: string | null;
  };
}

interface FeaturedCarouselProps {
  news: NewsItem[];
  lang: string;
  isRtl: boolean;
  t: any;
}

export default function FeaturedCarousel({ news, lang, isRtl, t }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (news.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 5000); // Rotate every 5 seconds
    
    return () => clearInterval(interval);
  }, [news.length]);

  if (!news || news.length === 0) {
    return (
      <div className="h-96 bg-gray-100 dark:bg-darkgray-lighter rounded-2xl flex items-center justify-center text-gray-500">
        {isRtl ? 'لا توجد أخبار رئيسية مميزة حالياً' : 'No featured news available.'}
      </div>
    );
  }

  const featuredNews = news[currentIndex];

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % news.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + news.length) % news.length);
  };

  return (
    <div className="relative group overflow-hidden rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 h-[460px]">
      <Link href={`/${lang}/news/${featuredNews.slug}`} className="block w-full h-full relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
        {featuredNews.image ? (
          <img
            src={featuredNews.image}
            alt={featuredNews.titleAr}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 dark:bg-gray-800"></div>
        )}

        <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 z-20 space-y-3 transition-opacity duration-300">
          <span 
            className="inline-block px-3 py-1 text-xs font-bold text-white uppercase rounded-md shadow-sm transition-colors"
            style={{ backgroundColor: featuredNews.category.color || '#dc2626' }}
          >
            {isRtl ? featuredNews.category.nameAr : featuredNews.category.nameEn}
          </span>

          <h1 className="text-xl md:text-3xl font-black text-white leading-tight font-cairo hover:text-red-500 transition-colors line-clamp-2">
            {isRtl ? featuredNews.titleAr : (featuredNews.titleEn || featuredNews.titleAr)}
          </h1>

          <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed max-w-2xl font-light">
            {isRtl ? featuredNews.summaryAr : (featuredNews.summaryEn || featuredNews.summaryAr)}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-white/10">
            <span className="flex items-center gap-1">
              <Clock size={13} />
              <span>{new Date(featuredNews.publishDate).toLocaleDateString(lang === 'ar' ? 'ar-LY' : 'en-US')}</span>
            </span>
          </div>
        </div>
      </Link>

      {/* Navigation Buttons */}
      {news.length > 1 && (
        <div className="absolute top-1/2 -translate-y-1/2 inset-x-4 z-30 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={isRtl ? nextSlide : prevSlide}
            className="w-10 h-10 rounded-full bg-black/50 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ChevronRight size={24} />
          </button>
          <button 
            onClick={isRtl ? prevSlide : nextSlide}
            className="w-10 h-10 rounded-full bg-black/50 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
      )}

      {/* Indicators */}
      {news.length > 1 && (
        <div className="absolute bottom-4 right-4 z-30 flex gap-1.5">
          {news.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-red-600' : 'w-1.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
