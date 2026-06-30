import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/api-auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const user = await getUserFromRequest();
    if (!user || (user.role !== Role.SUPER_ADMIN && user.role !== Role.EDITOR)) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإجراء هذه العملية' },
        { status: 403 }
      );
    }

    const breakingNews = await prisma.breakingNews.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(breakingNews);
  } catch (error) {
    console.error('Error fetching breaking news for manage:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الأخبار العاجلة' },
      { status: 500 }
    );
  }
}
