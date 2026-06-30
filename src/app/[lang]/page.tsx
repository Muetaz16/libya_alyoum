import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from '@/lib/translations';
import prisma from '@/lib/prisma';
import { Play, TrendingUp, Clock, Eye, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import WeatherWidget from '@/components/WeatherWidget';
import PrayerTimesWidget from '@/components/PrayerTimesWidget';
import { NewsStatus } from '@prisma/client';

export const revalidate = 60; // Revalidate every minute

export default async function HomePage({ params }: { params: { lang: string } }) {
  const { lang } = await params;
  const t = getTranslations(lang);
  const isRtl = lang === 'ar';

  // 1. Fetch Featured Hero News (Top 5)
  const featuredNewsList = await prisma.news.findMany({
    where: {
      status: NewsStatus.PUBLISHED,
      isFeatured: true,
    },
    take: 5,
    orderBy: { publishDate: 'desc' },
    include: {
      category: true,
      author: { select: { name: true } },
    },
  });

  const featuredIds = featuredNewsList.map(n => n.id);

  // 2. Fetch Latest News (excluding the featured ones if they exist)
  const latestNews = await prisma.news.findMany({
    where: {
      status: NewsStatus.PUBLISHED,
      ...(featuredIds.length > 0 ? { id: { notIn: featuredIds } } : {}),
    },
    take: 4,
    orderBy: { publishDate: 'desc' },
    include: {
      category: true,
      author: { select: { name: true } },
    },
  });

  // 3. Fetch Trending News (Most Viewed)
  const trendingNews = await prisma.news.findMany({
    where: {
      status: NewsStatus.PUBLISHED,
    },
    take: 5,
    orderBy: { views: 'desc' },
    include: {
      category: true,
    },
  });

  // 4. Fetch Video Articles
  const videoNews = await prisma.news.findMany({
    where: {
      status: NewsStatus.PUBLISHED,
      videoUrl: { not: null, notIn: [''] },
    },
    take: 4,
    orderBy: { publishDate: 'desc' },
    include: {
      category: true,
    },
  });

  // 5. Fetch Categories and their latest 4 articles
  const categories = await prisma.category.findMany({
    include: {
      news: {
        where: {
          status: NewsStatus.PUBLISHED,
        },
        take: 1,
        orderBy: { publishDate: 'desc' },
      },
    },
  });

  // 6. Fetch Live Stream settings
  const liveStreamSetting = await prisma.setting.findUnique({
    where: { key: 'LIVE_STREAM' },
  });
  const liveStream: { isActive: boolean; url: string } = liveStreamSetting
    ? JSON.parse(liveStreamSetting.value)
    : { isActive: false, url: '' };

  // Helper for Youtube ID extraction
  const getYoutubeEmbedUrl = (url: string | null) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : '';
  };

  return (
    <div className="space-y-12">



      {/* 1. Hero & Latest Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Featured News Hero Banner */}
        <div className="lg:col-span-2 space-y-6">
          <FeaturedCarousel news={featuredNewsList as any} lang={lang} isRtl={isRtl} t={t} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WeatherWidget lang={lang} />
            <PrayerTimesWidget lang={lang} />
          </div>
        </div>

        {/* Live News Feed Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-darkgray-lighter pb-3">
            <h2 className="text-lg font-black text-red-600 dark:text-red-500 flex items-center gap-2 font-cairo">
              <Clock className="animate-spin" size={18} />
              <span>{t.latestNews}</span>
            </h2>
          </div>

          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
            {latestNews.length > 0 ? (
              latestNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/${lang}/news/${item.slug}`}
                  className="flex gap-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-darkgray-lighter transition-colors group"
                >
                  <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-200 relative">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={isRtl ? item.titleAr : (item.titleEn || item.titleAr)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-500">
                      {isRtl ? item.category.nameAr : item.category.nameEn}
                    </span>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-red-600 transition-colors">
                      {isRtl ? item.titleAr : (item.titleEn || item.titleAr)}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <Clock size={10} />
                      <span>{new Date(item.publishDate).toLocaleTimeString(lang === 'ar' ? 'ar-LY' : 'en-US', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500">{isRtl ? 'لا توجد أخبار جديدة' : 'No news found.'}</p>
            )}
          </div>
        </div>
      </div>



      {/* 2. Live Stream Section (shown only when active) */}
      {liveStream.isActive && liveStream.url && (() => {
        const embedUrl = getYoutubeEmbedUrl(liveStream.url);
        if (!embedUrl) return null;
        return (
          <div className="relative pt-8 pb-4 max-w-4xl mx-auto">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-red-600/10 blur-[40px] rounded-[3rem] -z-10" />
            
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl border border-red-900/40 ring-1 ring-white/5 transform transition-all duration-300 hover:shadow-[0_0_30px_rgba(220,38,38,0.2)] hover:border-red-600/50">
              {/* Compact Glassmorphism Header */}
              <div className="flex items-center justify-between px-5 py-2.5 bg-black/80 backdrop-blur-sm border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]"></span>
                  </span>
                  <h2 className="text-white font-bold text-sm tracking-widest uppercase font-cairo">
                    {isRtl ? 'بث مباشر' : 'LIVE'}
                  </h2>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 rounded-full border border-red-500/20">
                  <Play size={12} className="text-red-500" fill="currentColor" />
                  <span className="text-red-200 text-xs font-semibold">
                    {isRtl ? 'ليبيا اليوم' : 'Libya Today'}
                  </span>
                </div>
              </div>
              
              {/* Video Player */}
              <div className="aspect-video w-full relative bg-gray-900">
                <iframe
                  src={`${embedUrl}?autoplay=0&rel=0`}
                  title={isRtl ? 'البث المباشر - ليبيا اليوم' : 'Live Stream - Libya Today'}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. Category Sections Grid */}
      <div className="space-y-8 pt-6">
        <div className="border-b border-gray-200 dark:border-darkgray-lighter pb-3">
          <h2 className="text-xl font-black font-cairo">
            {isRtl ? 'أخبار الأقسام والتصنيفات' : 'Categories Highlights'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories
            .filter((cat) => cat.slug !== 'videos' && cat.news.length > 0)
            .map((cat) => (
              <div key={cat.id} className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-red-600 pb-2">
                  <h3 className="text-md font-bold text-gray-900 dark:text-white font-cairo">
                    {isRtl ? cat.nameAr : cat.nameEn}
                  </h3>
                  <Link
                    href={`/${lang}/category/${cat.slug}`}
                    className="text-xs text-red-600 dark:text-red-500 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>{isRtl ? 'المزيد' : 'See all'}</span>
                    {isRtl ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
                  </Link>
                </div>

                {/* Latest Article In Category (With Image) */}
                {cat.news[0] && (
                  <Link
                    href={`/${lang}/news/${cat.news[0].slug}`}
                    className="block group space-y-2"
                  >
                    <div className="aspect-video rounded-xl overflow-hidden bg-gray-200 relative shadow-sm">
                      {cat.news[0].image ? (
                        <img
                          src={cat.news[0].image}
                          alt={cat.news[0].titleAr}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : null}
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-red-600 transition-colors line-clamp-2">
                      {isRtl ? cat.news[0].titleAr : (cat.news[0].titleEn || cat.news[0].titleAr)}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {isRtl ? cat.news[0].summaryAr : (cat.news[0].summaryEn || cat.news[0].summaryAr)}
                    </p>
                  </Link>
                )}

              </div>
            ))}
        </div>
      </div>

      {/* 4. Dedicated Video Gallery Section */}
      {videoNews.length > 0 && (
        <div className="bg-gray-900 dark:bg-black text-white p-8 rounded-2xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h2 className="text-lg font-black text-red-500 font-cairo flex items-center gap-2">
              <Play size={18} fill="currentColor" />
              <span>{t.videosSection}</span>
            </h2>
            <Link
              href={`/${lang}/videos`}
              className="text-xs text-gray-400 hover:text-white hover:underline flex items-center gap-1"
            >
              <span>{isRtl ? 'كل التغطيات المرئية' : 'All Videos'}</span>
              {isRtl ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {videoNews.map((item) => {
              const embed = getYoutubeEmbedUrl(item.videoUrl);
              return (
                <div key={item.id} className="space-y-3 group">
                  <div className="aspect-video rounded-xl overflow-hidden bg-black relative border border-gray-800 shadow-lg">
                    {embed ? (
                      <iframe
                        src={embed}
                        title={item.titleAr}
                        className="w-full h-full border-none"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play size={32} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                  <Link href={`/${lang}/news/${item.slug}`} className="block">
                    <h3 className="text-xs font-bold line-clamp-2 hover:text-red-500 transition-colors">
                      {isRtl ? item.titleAr : (item.titleEn || item.titleAr)}
                    </h3>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
