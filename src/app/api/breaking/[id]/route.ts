import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/api-auth';
import { Role } from '@prisma/client';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest();
    if (!user || (user.role !== Role.SUPER_ADMIN && user.role !== Role.EDITOR)) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإجراء هذه العملية' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { textAr, textEn, isTicker, expiryTime } = await req.json();

    if (!textAr) {
      return NextResponse.json(
        { error: 'النص بالعربية مطلوب' },
        { status: 400 }
      );
    }

    const breaking = await prisma.breakingNews.update({
      where: { id },
      data: {
        textAr,
        textEn: textEn || null,
        isTicker: isTicker !== undefined ? isTicker : true,
        expiryTime: expiryTime ? new Date(expiryTime) : null,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'تعديل خبر عاجل',
        details: `تم تعديل خبر عاجل: ${textAr.substring(0, 50)}...`,
      },
    });

    return NextResponse.json(breaking);
  } catch (error) {
    console.error('Error updating breaking news:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تعديل الخبر العاجل' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest();
    if (!user || (user.role !== Role.SUPER_ADMIN && user.role !== Role.EDITOR)) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإجراء هذه العملية' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const breaking = await prisma.breakingNews.delete({
      where: { id },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'حذف خبر عاجل',
        details: `تم حذف خبر عاجل: ${breaking.textAr.substring(0, 50)}...`,
      },
    });

    return NextResponse.json({ success: true, message: 'تم حذف الخبر العاجل بنجاح' });
  } catch (error) {
    console.error('Error deleting breaking news:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الخبر العاجل' },
      { status: 500 }
    );
  }
}
