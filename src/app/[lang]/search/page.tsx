import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getTranslations } from '@/lib/translations';
import { Clock, Eye, Search } from 'lucide-react';
import { NewsStatus } from '@prisma/client';

interface SearchProps {
  params: { lang: string };
  searchParams: { q?: string; page?: string };
}

export default async function SearchPage({ params, searchParams }: SearchProps) {
  const { lang } = await params;
  const { q = '', page = '1' } = await searchParams;
  const t = getTranslations(lang);
  const isRtl = lang === 'ar';

  const currentPage = parseInt(page, 10) || 1;
  const limit = 9;
  const skip = (currentPage - 1) * limit;

  // Build prisma query condition
  const where: any = {
    status: NewsStatus.PUBLISHED,
    publishDate: { lte: new Date() },
  };

  if (q.trim()) {
    where.OR = [
      { titleAr: { contains: q, mode: 'insensitive' } },
      { titleEn: { contains: q, mode: 'insensitive' } },
      { contentAr: { contains: q, mode: 'insensitive' } },
      { contentEn: { contains: q, mode: 'insensitive' } },
      { summaryAr: { contains: q, mode: 'insensitive' } },
      { summaryEn: { contains: q, mode: 'insensitive' } },
      { tags: { has: q } },
    ];
  }

  // Fetch count and news in a transaction
  const [newsList, total] = await prisma.$transaction([
    prisma.news.findMany({
      where,
      orderBy: { publishDate: 'desc' },
      skip,
      take: limit,
      include: {
        category: { select: { nameAr: true, nameEn: true, slug: true, color: true } },
      },
    }),
    prisma.news.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-8 font-cairo py-4">
      {/* Header Title */}
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-darkgray-lighter pb-4">
        <Search className="text-red-600" size={24} />
        <h1 className="text-xl md:text-2xl font-black">
          {t.searchResults} &quot;<span className="text-red-600">{q}</span>&quot; ({total})
        </h1>
      </div>

      {/* Grid Results */}
      {newsList.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsList.map((item) => (
              <Link
                key={item.id}
                href={`/${lang}/news/${item.slug}`}
                className="bg-white dark:bg-darkgray-lighter border border-gray-100 dark:border-darkgray-lighter rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
              >
                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.titleAr}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : null}
                </div>

                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span
                      className="text-[10px] font-bold text-red-600 dark:text-red-500"
                    >
                      {isRtl ? item.category.nameAr : item.category.nameEn}
                    </span>
                    <h2 className="text-sm font-bold line-clamp-2 text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">
                      {isRtl ? item.titleAr : (item.titleEn || item.titleAr)}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {isRtl ? item.summaryAr : (item.summaryEn || item.summaryAr)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-100 dark:border-darkgray-lighter pt-3">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      <span>{new Date(item.publishDate).toLocaleDateString(isRtl ? 'ar-LY' : 'en-US')}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={10} />
                      <span>{item.views}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Simple Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const active = pageNum === currentPage;
                return (
                  <Link
                    key={pageNum}
                    href={`/${lang}/search?q=${encodeURIComponent(q)}&page=${pageNum}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      active
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-white dark:bg-darkgray-lighter border-gray-200 dark:border-darkgray-lighter text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-500">
          {t.noResults}
        </div>
      )}
    </div>
  );
}
