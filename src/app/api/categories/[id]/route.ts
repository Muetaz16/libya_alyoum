import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/api-auth';
import { Role } from '@prisma/client';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest();
    if (!user || user.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإجراء هذه العملية' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { nameAr, nameEn, slug, icon, color, parentId, order } = await req.json();

    if (!nameAr || !slug) {
      return NextResponse.json(
        { error: 'الاسم والرمز الفريد مطلوبان' },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        slug: slug.toLowerCase(),
        NOT: { id },
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'التصنيف موجود بالفعل بنفس الرابط الفريد (Slug)' },
        { status: 400 }
      );
    }

    // Prevent circular dependency: parentId cannot be itself
    if (parentId === id) {
       return NextResponse.json({ error: 'لا يمكن للتصنيف أن يكون أباً لنفسه' }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id },
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

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'تعديل تصنيف',
        details: `تم تعديل تصنيف: ${nameAr}`,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تعديل التصنيف' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest();
    if (!user || user.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإجراء هذه العملية' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if category is used by any news
    const newsCount = await prisma.news.count({
      where: { categoryId: id },
    });

    if (newsCount > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف التصنيف لأنه يحتوي على أخبار منشورة. يرجى نقل الأخبار أو حذفها أولاً.' },
        { status: 400 }
      );
    }

    const category = await prisma.category.delete({
      where: { id },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'حذف تصنيف',
        details: `تم حذف تصنيف: ${category.nameAr}`,
      },
    });

    return NextResponse.json({ success: true, message: 'تم حذف التصنيف بنجاح' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف التصنيف' },
      { status: 500 }
    );
  }
}
