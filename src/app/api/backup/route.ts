import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/api-auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const user = await getUserFromRequest();
    if (!user || user.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإجراء هذه العملية' },
        { status: 403 }
      );
    }

    // Export all data
    const users = await prisma.user.findMany();
    const categories = await prisma.category.findMany();
    const news = await prisma.news.findMany();
    const breakingNews = await prisma.breakingNews.findMany();
    const ads = await prisma.ad.findMany();
    const newsletter = await prisma.newsletter.findMany();
    const settings = await prisma.setting.findMany();

    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        users,
        categories,
        news,
        breakingNews,
        ads,
        newsletter,
        settings,
      },
    };

    return NextResponse.json(backupData, {
      headers: {
        'Content-Disposition': `attachment; filename=backup-libyaalyoum-${Date.now()}.json`,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تصدير النسخة الاحتياطية' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user || user.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإجراء هذه العملية' },
        { status: 403 }
      );
    }

    const { data } = await req.json();

    if (!data || !data.users || !data.categories || !data.news) {
      return NextResponse.json(
        { error: 'ملف النسخة الاحتياطية غير صالح أو تالف' },
        { status: 400 }
      );
    }

    // Perform database restore inside a transaction
    await prisma.$transaction(async (tx) => {
      // Clear current data in reverse order of relationships
      await tx.activityLog.deleteMany();
      await tx.news.deleteMany();
      await tx.category.deleteMany();
      await tx.user.deleteMany();
      await tx.breakingNews.deleteMany();
      await tx.ad.deleteMany();
      await tx.newsletter.deleteMany();
      await tx.setting.deleteMany();

      // Restore settings
      if (Array.isArray(data.settings)) {
        await tx.setting.createMany({ data: data.settings });
      }
      
      // Restore users
      if (Array.isArray(data.users)) {
        await tx.user.createMany({ data: data.users });
      }

      // Restore categories
      if (Array.isArray(data.categories)) {
        await tx.category.createMany({ data: data.categories });
      }

      // Restore news
      if (Array.isArray(data.news)) {
        await tx.news.createMany({ data: data.news });
      }

      // Restore breakingNews
      if (Array.isArray(data.breakingNews)) {
        await tx.breakingNews.createMany({ data: data.breakingNews });
      }

      // Restore ads
      if (Array.isArray(data.ads)) {
        await tx.ad.createMany({ data: data.ads });
      }

      // Restore newsletter
      if (Array.isArray(data.newsletter)) {
        await tx.newsletter.createMany({ data: data.newsletter });
      }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'استعادة نسخة احتياطية',
        details: `تم استعادة النسخة الاحتياطية بنجاح بنسخة من تاريخ: ${data.timestamp || 'غير محدد'}`,
      },
    });

    return NextResponse.json({ success: true, message: 'تم استعادة النسخة الاحتياطية بنجاح' });
  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { error: `حدث خطأ أثناء استعادة البيانات: ${error.message}` },
      { status: 500 }
    );
  }
}
