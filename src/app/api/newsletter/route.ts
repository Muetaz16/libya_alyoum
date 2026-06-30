import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/api-auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const user = await getUserFromRequest();
    if (!user || (user.role !== Role.SUPER_ADMIN && user.role !== Role.EDITOR)) {
      return NextResponse.json(
        { error: 'غير مصرح لك بمشاهدة الاشتراكات' },
        { status: 403 }
      );
    }

    const subscribers = await prisma.newsletter.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(subscribers);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المشتركين' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'الرجاء إدخال بريد إلكتروني صالح' },
        { status: 400 }
      );
    }

    const existing = await prisma.newsletter.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === 'SUBSCRIBED') {
        return NextResponse.json(
          { message: 'أنت مشترك بالفعل في القائمة البريدية' },
          { status: 200 }
        );
      } else {
        await prisma.newsletter.update({
          where: { email },
          data: { status: 'SUBSCRIBED' },
        });
        return NextResponse.json({ success: true, message: 'تم إعادة الاشتراك بنجاح' });
      }
    }

    await prisma.newsletter.create({
      data: { email },
    });

    return NextResponse.json({ success: true, message: 'تم الاشتراك بنجاح في القائمة البريدية' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء الاشتراك' },
      { status: 500 }
    );
  }
}
