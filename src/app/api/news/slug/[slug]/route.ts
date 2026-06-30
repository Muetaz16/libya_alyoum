import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'الرابط الفريد مطلوب' },
        { status: 400 }
      );
    }

    // Find the news item
    const newsItem = await prisma.news.findUnique({
      where: { slug },
      include: {
        category: {
          select: { id: true, nameAr: true, nameEn: true, slug: true, color: true },
        },
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    if (!newsItem) {
      return NextResponse.json(
        { error: 'الخبر غير موجود' },
        { status: 404 }
      );
    }

    // Increment views counter asynchronously (or synchronously for accuracy)
    const updatedNewsItem = await prisma.news.update({
      where: { id: newsItem.id },
      data: {
        views: {
          increment: 1,
        },
      },
      include: {
        category: {
          select: { id: true, nameAr: true, nameEn: true, slug: true, color: true },
        },
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json(updatedNewsItem);
  } catch (error) {
    console.error('Error fetching news by slug:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب تفاصيل الخبر' },
      { status: 500 }
    );
  }
}
