import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/api-auth';
import { Role, NewsStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const isFeatured = searchParams.get('isFeatured') === 'true';
    const isBreaking = searchParams.get('isBreaking') === 'true';
    const trending = searchParams.get('trending') === 'true';
    const videoOnly = searchParams.get('video') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const statusParam = searchParams.get('status');

    // Authentication checking for non-published news
    const user = await getUserFromRequest();
    let statusFilter: NewsStatus = NewsStatus.PUBLISHED;

    if (user && (user.role === Role.SUPER_ADMIN || user.role === Role.EDITOR || user.role === Role.JOURNALIST)) {
      if (statusParam && Object.values(NewsStatus).includes(statusParam as NewsStatus)) {
        statusFilter = statusParam as NewsStatus;
      } else {
        // If no specific status is requested by admin, let them see all, or default
        // We will default to public behavior (published only) unless they ask otherwise
      }
    }

    const skip = (page - 1) * limit;

    // Build Prisma query condition
    const where: any = {};

    // If status filter is PUBLISHED, we only show items where publishDate is <= now
    if (statusParam && user) {
      where.status = statusFilter;
      // If journalist, restrict drafts/submitted news to their own unless they are Editor/SuperAdmin
      if (user.role === Role.JOURNALIST && statusFilter !== NewsStatus.PUBLISHED) {
        where.authorId = user.id;
      }
    } else {
      where.status = NewsStatus.PUBLISHED;
    }

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (isFeatured) {
      where.isFeatured = true;
    }

    if (isBreaking) {
      where.isBreaking = true;
    }

    if (videoOnly) {
      where.videoUrl = { not: null, notIn: [''] };
    }

    if (search) {
      where.OR = [
        { titleAr: { contains: search, mode: 'insensitive' } },
        { titleEn: { contains: search, mode: 'insensitive' } },
        { contentAr: { contains: search, mode: 'insensitive' } },
        { contentEn: { contains: search, mode: 'insensitive' } },
        { summaryAr: { contains: search, mode: 'insensitive' } },
        { summaryEn: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    // Determine ordering
    let orderBy: any = { publishDate: 'desc' };
    if (trending) {
      orderBy = { views: 'desc' };
    }

    // Fetch news and total count
    const [news, total] = await prisma.$transaction([
      prisma.news.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: {
            select: { id: true, nameAr: true, nameEn: true, slug: true, color: true },
          },
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
      prisma.news.count({ where }),
    ]);

    return NextResponse.json({
      news,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الأخبار' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user || user.role === Role.VIEWER) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإجراء هذه العملية' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      titleAr,
      titleEn,
      contentAr,
      contentEn,
      summaryAr,
      summaryEn,
      categoryId,
      image,
      videoUrl,
      isFeatured,
      isBreaking,
      status,
      publishDate,
      tags,
    } = body;

    if (!titleAr || !contentAr || !summaryAr || !categoryId) {
      return NextResponse.json(
        { error: 'الحقول الأساسية (العنوان بالعربية، المحتوى بالعربية، الملخص بالعربية، والتصنيف) مطلوبة' },
        { status: 400 }
      );
    }

    // Generate unique slug from Arabic title (or random suffix if needed)
    // Next.js standard slugification
    const cleanedTitle = titleAr
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, '') // Keep Arabic, alphanumeric, spaces, hyphens
      .trim()
      .replace(/\s+/g, '-');
    const slugSuffix = Math.random().toString(36).substring(2, 7);
    const slug = `${cleanedTitle}-${slugSuffix}`;

    // Handle role restrictions for status
    let finalStatus: NewsStatus = NewsStatus.DRAFT;

    if (user.role === Role.SUPER_ADMIN || user.role === Role.EDITOR) {
      // Admins and Editors can publish directly
      finalStatus = status && Object.values(NewsStatus).includes(status) ? status : NewsStatus.PUBLISHED;
    } else if (user.role === Role.JOURNALIST) {
      // Journalists can only save as DRAFT or SUBMITTED for review
      if (status === NewsStatus.SUBMITTED) {
        finalStatus = NewsStatus.SUBMITTED;
      } else {
        finalStatus = NewsStatus.DRAFT;
      }
    }

    // Parse publish date
    let parsedPublishDate = new Date();
    if (publishDate) {
      parsedPublishDate = new Date(publishDate);
    }

    const newsItem = await prisma.news.create({
      data: {
        titleAr,
        titleEn: titleEn || null,
        contentAr,
        contentEn: contentEn || null,
        summaryAr,
        summaryEn: summaryEn || null,
        slug,
        image: image || null,
        videoUrl: videoUrl || null,
        isFeatured: user.role === Role.SUPER_ADMIN ? (isFeatured || false) : false, // Only Super Admin can mark featured
        isBreaking: (user.role === Role.SUPER_ADMIN || user.role === Role.EDITOR) ? (isBreaking || false) : false,
        status: finalStatus,
        publishDate: parsedPublishDate,
        categoryId,
        authorId: user.id,
        tags: Array.isArray(tags) ? tags : [],
      },
      include: {
        category: true,
      },
    });

    // Write to Activity Log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'إضافة خبر',
        details: `تم إضافة خبر جديد: ${titleAr} (الحالة: ${finalStatus})`,
      },
    });

    try {
      const { revalidatePath } = require('next/cache');
      revalidatePath('/ar');
      revalidatePath('/', 'layout');
    } catch (e) {
      console.error('Failed to revalidate path', e);
    }

    return NextResponse.json(newsItem);
  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة الخبر' },
      { status: 500 }
    );
  }
}
