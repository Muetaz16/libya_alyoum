import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getTranslations } from '@/lib/translations';
import { Play, Calendar, Video, Clock } from 'lucide-react';
import { NewsStatus } from '@prisma/client';

export const revalidate = 60;

export default async function VideosPage({ params }: { params: { lang: string } }) {
  const { lang } = await params;
  const t = getTranslations(lang);
  const isRtl = lang === 'ar';

  const videoNews = await prisma.news.findMany({
    where: {
      status: NewsStatus.PUBLISHED,
      videoUrl: { not: null, notIn: [''] },
      publishDate: { lte: new Date() },
    },
    orderBy: { publishDate: 'desc' },
    include: {
      category: { select: { nameAr: true, nameEn: true } },
    },
  });

  const getYoutubeEmbedUrl = (url: string | null) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : '';
  };

  return (
    <div className="space-y-8 font-cairo py-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white p-8 rounded-2xl flex items-center gap-4 shadow-md">
        <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
          <Video size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-black">{t.videosSection}</h1>
          <p className="text-xs text-gray-400 mt-1">
            {isRtl ? 'التغطيات والتقارير المصورة لآخر الأحداث الجارية في ليبيا والمنطقة.' : 'Visual reporting and coverages of the latest events in Libya and the region.'}
          </p>
        </div>
      </div>

      {/* Videos Grid */}
      {videoNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videoNews.map((item) => {
            const embed = getYoutubeEmbedUrl(item.videoUrl);
            return (
              <div key={item.id} className="bg-white dark:bg-darkgray-lighter border border-gray-100 dark:border-darkgray-lighter rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between">
                <div className="aspect-video bg-black relative">
                  {embed ? (
                    <iframe
                      src={embed}
                      title={item.titleAr}
                      className="w-full h-full border-none"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={40} className="text-gray-700" />
                    </div>
                  )}
                </div>

                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-500">
                      {isRtl ? item.category.nameAr : item.category.nameEn}
                    </span>
                    <Link href={`/${lang}/news/${item.slug}`} className="block">
                      <h2 className="text-sm font-bold line-clamp-2 hover:text-red-600 dark:hover:text-red-500 transition-colors text-gray-900 dark:text-white">
                        {isRtl ? item.titleAr : (item.titleEn || item.titleAr)}
                      </h2>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 border-t border-gray-100 dark:border-darkgray-lighter pt-3">
                    <Clock size={10} />
                    <span>{new Date(item.publishDate).toLocaleDateString(isRtl ? 'ar-LY' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-500">
          {isRtl ? 'لا توجد تغطيات مرئية منشورة حالياً.' : 'No videos found.'}
        </div>
      )}
    </div>
  );
}
