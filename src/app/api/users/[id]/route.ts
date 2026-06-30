import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/api-auth';
import { Role } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const adminUser = await getUserFromRequest();
    if (!adminUser || adminUser.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإجراء هذه العملية' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { name, email, role, password } = await req.json();

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) {
      // Check if email already used by someone else
      const dup = await prisma.user.findFirst({
        where: { email, NOT: { id } },
      });
      if (dup) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مستخدم بالفعل' },
          { status: 400 }
        );
      }
      updateData.email = email;
    }

    if (role) {
      if (!Object.values(Role).includes(role as Role)) {
        return NextResponse.json(
          { error: 'الصلاحية المحددة غير صالحة' },
          { status: 400 }
        );
      }
      // Prevent self-demotion from SUPER_ADMIN to avoid getting locked out
      if (existingUser.id === adminUser.id && role !== Role.SUPER_ADMIN) {
        return NextResponse.json(
          { error: 'لا يمكنك تغيير رتبة المشرف الخاص بك لتجنب إقفال النظام' },
          { status: 400 }
        );
      }
      updateData.role = role as Role;
    }

    if (password && password.trim() !== '') {
      updateData.passwordHash = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: adminUser.id,
        action: 'تعديل مستخدم',
        details: `تم تعديل بيانات المستخدم: ${updated.name} (الرتبة: ${updated.role})`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تعديل بيانات المستخدم' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const adminUser = await getUserFromRequest();
    if (!adminUser || adminUser.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإجراء هذه العملية' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === adminUser.id) {
      return NextResponse.json(
        { error: 'لا يمكنك حذف حساب المشرف الذي تستخدمه حالياً لتسجيل الدخول' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: adminUser.id,
        action: 'حذف مستخدم',
        details: `تم حذف حساب المستخدم: ${existingUser.name} (${existingUser.email})`,
      },
    });

    return NextResponse.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المستخدم' },
      { status: 500 }
    );
  }
}
