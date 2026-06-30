import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const news = await prisma.news.findMany();
  return NextResponse.json(news);
}
