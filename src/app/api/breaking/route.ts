import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/api-auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    // Fetch breaking news that hasn't expired yet
    const now = new Date();
    const breakingNews = await prisma.breakingNews.findMany({
      where: {
        OR: [
          { expiryTime: null },
          { expiryTime: { gt: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(breakingNews);
  } catch (error) {
    console.error('Error fetching breaking news:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الأخبار العاجلة' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user || (user.role !== Role.SUPER_ADMIN && user.role !== Role.EDITOR)) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإجراء هذه العملية' },
        { status: 403 }
      );
    }

    const { textAr, textEn, isTicker, expiryTime } = await req.json();

    if (!textAr) {
      return NextResponse.json(
        { error: 'النص بالعربية مطلوب' },
        { status: 400 }
      );
    }

    const breaking = await prisma.breakingNews.create({
      data: {
        textAr,
        textEn: textEn || null,
        isTicker: isTicker !== undefined ? isTicker : true,
        expiryTime: expiryTime ? new Date(expiryTime) : null,
      },
    });

    // Write to Activity Log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'إضافة خبر عاجل',
        details: `تم إضافة خبر عاجل: ${textAr.substring(0, 50)}...`,
      },
    });

    return NextResponse.json(breaking);
  } catch (error) {
    console.error('Error creating breaking news:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة الخبر العاجل' },
      { status: 500 }
    );
  }
}
