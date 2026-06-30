import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/api-auth';
import { Role } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserFromRequest();
    if (!user || user.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإجراء هذه العملية' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المستخدمين' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = await getUserFromRequest();
    if (!adminUser || adminUser.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإجراء هذه العملية' },
        { status: 403 }
      );
    }

    const { name, email, role, password } = await req.json();

    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    if (!Object.values(Role).includes(role as Role)) {
      return NextResponse.json(
        { error: 'الصلاحية المحددة غير صالحة' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role: role as Role,
        passwordHash,
      },
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
        action: 'إضافة مستخدم',
        details: `تم إضافة مستخدم جديد: ${name} (${role})`,
      },
    });

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المستخدم' },
      { status: 500 }
    );
  }
}
