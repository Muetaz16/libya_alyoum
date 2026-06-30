import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { getTranslations } from '@/lib/translations';
import { Clock, Eye, Share2, Calendar, User, Tag, ArrowRight, ArrowLeft } from 'lucide-react';
import ShareButtons from '@/components/ShareButtons';
import { NewsStatus } from '@prisma/client';

export const revalidate = 10; // short cache revalidation for news details

interface PageProps {
  params: {
    lang: string;
    slug: string;
  };
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  
  const newsItem = await prisma.news.findUnique({
    where: { slug },
  });

  if (!newsItem) {
    return {
      title: 'الخبر غير موجود - ليبيا اليوم',
    };
  }

  const isAr = lang === 'ar';
  const title = isAr ? newsItem.titleAr : (newsItem.titleEn || newsItem.titleAr);
  const description = isAr ? newsItem.summaryAr : (newsItem.summaryEn || newsItem.summaryAr);

  return {
    title: `${title} - ${isAr ? 'ليبيا اليوم' : 'Libya Today'}`,
    description,
    openGraph: {
      title,
      description,
      images: newsItem.image ? [{ url: newsItem.image }] : [],
      type: 'article',
    },
  };
}

export default async function NewsDetailsPage({ params }: PageProps) {
  const { lang, slug } = await params;
  const t = getTranslations(lang);
  const isRtl = lang === 'ar';

  // Increment views and fetch news details
  let newsItem;
  try {
    newsItem = await prisma.news.update({
      where: { slug },
      data: {
        views: {
          increment: 1,
        },
      },
      include: {
        category: true,
        author: {
          select: { name: true },
        },
      },
    });
  } catch (err) {
    // If update fails (e.g. key doesn't exist yet or concurrency), fallback to select
    newsItem = await prisma.news.findUnique({
      where: { slug },
      include: {
        category: true,
        author: {
          select: { name: true },
        },
      },
    });
  }

  if (!newsItem || newsItem.status !== NewsStatus.PUBLISHED) {
    return (
      <div className="py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold font-cairo text-red-600">
          {isRtl ? 'الخبر غير موجود أو لم يتم نشره بعد' : 'Article not found or not published.'}
        </h1>
        <Link href={`/${lang}`} className="text-sm hover:underline text-gray-500">
          {isRtl ? 'العودة للرئيسية' : 'Back to Home'}
        </Link>
      </div>
    );
  }

  // Fetch related news (same category, excluding current, take 3)
  const relatedNews = await prisma.news.findMany({
    where: {
      categoryId: newsItem.categoryId,
      status: NewsStatus.PUBLISHED,
      NOT: { id: newsItem.id },
      publishDate: { lte: new Date() },
    },
    take: 3,
    orderBy: { publishDate: 'desc' },
    include: {
      category: true,
    },
  });

  const getYoutubeEmbedUrl = (url: string | null) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : '';
  };

  const videoEmbed = getYoutubeEmbedUrl(newsItem.videoUrl);
  const displayTitle = isRtl ? newsItem.titleAr : (newsItem.titleEn || newsItem.titleAr);
  const displaySummary = isRtl ? newsItem.summaryAr : (newsItem.summaryEn || newsItem.summaryAr);
  const displayContent = isRtl ? newsItem.contentAr : (newsItem.contentEn || newsItem.contentAr);

  return (
    <article className="space-y-8 font-cairo max-w-4xl mx-auto py-4">
      {/* Category Badge & Back Nav */}
      <div className="flex justify-between items-center">
        <Link
          href={`/${lang}/category/${newsItem.category.slug}`}
          className="px-3 py-1 text-xs font-bold text-black dark:text-white rounded uppercase shadow-sm border border-gray-200 dark:border-gray-700"
          style={{ backgroundColor: newsItem.category.color || '#f3f4f6' }}
        >
          {isRtl ? newsItem.category.nameAr : newsItem.category.nameEn}
        </Link>

        <Link
          href={`/${lang}`}
          className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"
        >
          {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{isRtl ? 'العودة للرئيسية' : 'Back to Home'}</span>
        </Link>
      </div>

      {/* Header Info */}
      <div className="space-y-4">
        <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight">
          {displayTitle}
        </h1>

        <p className="text-md md:text-lg text-black dark:text-gray-300 border-r-4 border-red-600 pr-4 ltr:border-r-0 ltr:border-l-4 ltr:pl-4 font-semibold leading-relaxed">
          {displaySummary}
        </p>

        {/* Meta Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-gray-150 dark:border-darkgray-lighter text-xs text-gray-500">
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-1.5">
              <User size={14} />
              <span>{newsItem.author.name}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>{new Date(newsItem.publishDate).toLocaleDateString(isRtl ? 'ar-LY' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </span>
          </div>

          {/* Client Share Buttons */}
          <ShareButtons title={displayTitle} />
        </div>
      </div>

      {/* Main Image */}
      {newsItem.image && (
        <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-darkgray-lighter aspect-video w-full bg-gray-200">
          <img
            src={newsItem.image}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Embedded Video */}
      {videoEmbed && (
        <div className="rounded-2xl overflow-hidden bg-black aspect-video w-full border border-gray-800 shadow-lg">
          <iframe
            src={videoEmbed}
            title={displayTitle}
            className="w-full h-full border-none"
            allowFullScreen
          ></iframe>
        </div>
      )}

      {/* Rich Text Body Content */}
      <div 
        className="prose dark:prose-invert max-w-none prose-custom text-gray-800 dark:text-gray-200"
        dangerouslySetInnerHTML={{ __html: displayContent }}
      />

      {/* Tags Section */}
      {newsItem.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-gray-100 dark:border-darkgray-lighter">
          <Tag size={14} className="text-gray-400" />
          <span className="text-xs text-gray-400 font-bold">{isRtl ? 'الوسوم:' : 'Tags:'}</span>
          {newsItem.tags.map((tag, idx) => (
            <Link
              key={idx}
              href={`/${lang}/search?q=${encodeURIComponent(tag)}`}
              className="px-2.5 py-1 bg-gray-100 dark:bg-darkgray-lighter text-gray-700 dark:text-gray-300 rounded-md text-xs hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Related News Widget */}
      {relatedNews.length > 0 && (
        <div className="pt-10 space-y-6">
          <h2 className="text-lg font-bold border-b border-gray-200 dark:border-darkgray-lighter pb-3 font-cairo">
            {t.relatedNews}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedNews.map((item) => (
              <Link
                key={item.id}
                href={`/${lang}/news/${item.slug}`}
                className="group block space-y-2"
              >
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-200 relative shadow-sm border border-gray-100 dark:border-darkgray-lighter">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.titleAr}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : null}
                </div>
                <h3 className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-red-600 transition-colors line-clamp-2">
                  {isRtl ? item.titleAr : (item.titleEn || item.titleAr)}
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <Clock size={10} />
                  <span>{new Date(item.publishDate).toLocaleDateString(isRtl ? 'ar-LY' : 'en-US')}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
