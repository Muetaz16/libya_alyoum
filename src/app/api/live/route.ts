import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/api-auth';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const SETTING_KEY = 'LIVE_STREAM';

// Default live stream settings
const DEFAULT_SETTINGS = {
  isActive: false,
  url: ''
};

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY }
    });

    if (!setting) {
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    return NextResponse.json(JSON.parse(setting.value));
  } catch (error) {
    console.error('Error fetching live stream settings:', error);
    return NextResponse.json(DEFAULT_SETTINGS, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user || (user.role !== Role.SUPER_ADMIN && user.role !== Role.EDITOR)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    
    // Validate the incoming data
    if (typeof data.isActive !== 'boolean' || typeof data.url !== 'string') {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Upsert the setting
    const setting = await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(data) },
      create: { key: SETTING_KEY, value: JSON.stringify(data) }
    });

    // Revalidate the homepage to immediately reflect the changes on the frontend
    revalidatePath('/ar');
    revalidatePath('/en');
    revalidatePath('/', 'layout');

    return NextResponse.json(JSON.parse(setting.value));
  } catch (error) {
    console.error('Error updating live stream settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
