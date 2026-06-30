import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/api-auth';
import { Role, NewsStatus } from '@prisma/client';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest();
    if (!user || user.role === Role.VIEWER) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإجراء هذه العملية' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const existingNews = await prisma.news.findUnique({
      where: { id },
    });

    if (!existingNews) {
      return NextResponse.json(
        { error: 'الخبر غير موجود' },
        { status: 404 }
      );
    }

    // Role-based authorization check
    if (user.role === Role.EDITOR) {
      // Editor can only edit his own news
      if (existingNews.authorId !== user.id) {
        return NextResponse.json(
          { error: 'غير مصرح لك بتعديل أخبار الصحفيين الآخرين' },
          { status: 403 }
        );
      }
    } else if (user.role === Role.JOURNALIST) {
      // Journalist can only edit his own news
      if (existingNews.authorId !== user.id) {
        return NextResponse.json(
          { error: 'غير مصرح لك بتعديل أخبار المحررين الآخرين' },
          { status: 403 }
        );
      }
      // Journalist can only edit draft or submitted news (cannot edit already published news without approval workflow)
      if (existingNews.status === NewsStatus.PUBLISHED) {
        return NextResponse.json(
          { error: 'لا يمكن تعديل الخبر بعد نشره. يرجى التواصل مع الإدارة.' },
          { status: 403 }
        );
      }
    }

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

    // Build update data
    const updateData: any = {};
    if (titleAr) updateData.titleAr = titleAr;
    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (contentAr) updateData.contentAr = contentAr;
    if (contentEn !== undefined) updateData.contentEn = contentEn;
    if (summaryAr) updateData.summaryAr = summaryAr;
    if (summaryEn !== undefined) updateData.summaryEn = summaryEn;
    if (categoryId) updateData.categoryId = categoryId;
    if (image !== undefined) updateData.image = image;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    if (tags !== undefined) updateData.tags = tags;

    // Date
    if (publishDate) {
      updateData.publishDate = new Date(publishDate);
    }

    // Role specific restrictions on metadata
    if (user.role === Role.SUPER_ADMIN) {
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
      if (isBreaking !== undefined) updateData.isBreaking = isBreaking;
      if (status) updateData.status = status;
    } else if (user.role === Role.EDITOR) {
      if (isBreaking !== undefined) updateData.isBreaking = isBreaking;
      if (status) updateData.status = status; // Editor can set status to PUBLISHED or DRAFT
    } else if (user.role === Role.JOURNALIST) {
      // Journalists cannot publish. They can only set DRAFT or SUBMITTED
      if (status === NewsStatus.SUBMITTED || status === NewsStatus.DRAFT) {
        updateData.status = status;
      } else if (status === NewsStatus.PUBLISHED) {
        return NextResponse.json(
          { error: 'لا يملك الصحفي صلاحية نشر الأخبار مباشرة' },
          { status: 403 }
        );
      }
    }

    const updatedNews = await prisma.news.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    // Write activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'تعديل خبر',
        details: `تم تعديل الخبر: ${updatedNews.titleAr} (المعرف: ${id})`,
      },
    });

    try {
      const { revalidatePath } = require('next/cache');
      revalidatePath('/ar');
      revalidatePath('/', 'layout');
    } catch (e) {
      console.error('Failed to revalidate path', e);
    }

    return NextResponse.json(updatedNews);
  } catch (error) {
    console.error('Error updating news:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تعديل الخبر' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest();
    if (!user || user.role === Role.VIEWER || user.role === Role.JOURNALIST) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإجراء هذه العملية' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existingNews = await prisma.news.findUnique({
      where: { id },
    });

    if (!existingNews) {
      return NextResponse.json(
        { error: 'الخبر غير موجود' },
        { status: 404 }
      );
    }

    // Role checks
    if (user.role === Role.EDITOR && existingNews.authorId !== user.id) {
      return NextResponse.json(
        { error: 'لا يمكن للمحرر حذف أخبار الآخرين' },
        { status: 403 }
      );
    }

    await prisma.news.delete({
      where: { id },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'حذف خبر',
        details: `تم حذف الخبر: ${existingNews.titleAr} (المعرف: ${id})`,
      },
    });

    return NextResponse.json({ success: true, message: 'تم حذف الخبر بنجاح' });
  } catch (error) {
    console.error('Error deleting news:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الخبر' },
      { status: 500 }
    );
  }
}
