import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'token',
      value: '',
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الخروج' },
      { status: 500 }
    );
  }
}
