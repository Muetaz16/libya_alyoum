import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getTranslations } from '@/lib/translations';
import { Clock, Eye } from 'lucide-react';
import { NewsStatus } from '@prisma/client';

interface CategoryPageProps {
  params: {
    lang: string;
    slug: string;
  };
  searchParams: {
    page?: string;
  };
}

export const revalidate = 60;

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { lang, slug } = await params;
  const { page = '1' } = await searchParams;
  const t = getTranslations(lang);
  const isRtl = lang === 'ar';

  const currentPage = parseInt(page, 10) || 1;
  const limit = 9;
  const skip = (currentPage - 1) * limit;

  // Fetch category
  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    return (
      <div className="py-20 text-center text-gray-500 font-cairo">
        <h1 className="text-xl font-bold">{isRtl ? 'التصنيف غير موجود' : 'Category not found.'}</h1>
        <Link href={`/${lang}`} className="text-xs hover:underline text-red-600 mt-2 block">
          {isRtl ? 'العودة للرئيسية' : 'Back to Home'}
        </Link>
      </div>
    );
  }

  // Fetch news belonging to this category
  const [newsList, total] = await prisma.$transaction([
    prisma.news.findMany({
      where: {
        categoryId: category.id,
        status: NewsStatus.PUBLISHED,
      },
      orderBy: { publishDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.news.count({
      where: {
        categoryId: category.id,
        status: NewsStatus.PUBLISHED,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-8 font-cairo py-4">
      {/* Category header */}
      <div
        className={`p-8 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden ${
          category.color && !category.color.startsWith('#') ? category.color : 'bg-gray-50 dark:bg-darkgray-lighter'
        }`}
        style={
          category.color && category.color.startsWith('#')
            ? { backgroundColor: category.color }
            : {}
        }
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 rounded-full filter blur-xl -mr-10 -mt-10"></div>
        <div className="relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
            {isRtl ? 'تصنيف أخبار' : 'Category'}
          </span>
          <h1 className="text-2xl md:text-4xl font-black mt-2 text-gray-900 dark:text-white drop-shadow-sm">
            {isRtl ? category.nameAr : category.nameEn}
          </h1>
        </div>
      </div>

      {/* Category news grid */}
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
                    href={`/${lang}/category/${slug}?page=${pageNum}`}
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
          {isRtl ? 'لا توجد أخبار منشورة في هذا القسم حالياً.' : 'No articles published in this category yet.'}
        </div>
      )}
    </div>
  );
}
