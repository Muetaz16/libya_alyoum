import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/api-auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        { order: 'asc' },
        { nameAr: 'asc' }
      ],
      include: {
        children: true,
      }
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب التصنيفات' },
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

    const { nameAr, nameEn, slug, icon, color, parentId, order } = await req.json();

    if (!nameAr || !slug) {
      return NextResponse.json(
        { error: 'الاسم بالعربية والرمز الفريد مطلوبان' },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'التصنيف موجود بالفعل بنفس الرابط الفريد (Slug)' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        nameAr,
        nameEn: nameEn || nameAr,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        icon: icon || 'BookOpen',
        color: color || 'red-600',
        parentId: parentId || null,
        order: order !== undefined ? parseInt(order.toString(), 10) : 0,
      },
    });

    // Write to Activity Log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'إضافة تصنيف',
        details: `تم إضافة تصنيف جديد: ${nameAr} (${slug})`,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء التصنيف' },
      { status: 500 }
    );
  }
}
