import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/api-auth';

export async function GET() {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح بالدخول' },
        { status: 401 }
      );
    }

    // 1. Fetch total counts
    const totalNews = await prisma.news.count();
    const totalUsers = await prisma.user.count();
    const totalCategories = await prisma.category.count();

    // 2. Fetch sum of views
    const viewsAggregate = await prisma.news.aggregate({
      _sum: {
        views: true,
      },
    });
    const totalViews = viewsAggregate._sum.views || 0;

    // 3. Fetch recent activity logs
    const recentActivity = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { name: true, role: true },
        },
      },
    });

    // 4. Fetch news count and views by category
    const categoriesStats = await prisma.category.findMany({
      select: {
        nameAr: true,
        nameEn: true,
        slug: true,
        color: true,
        _count: {
          select: { news: true },
        },
        news: {
          select: { views: true },
        },
      },
    });

    const categoryChartData = categoriesStats.map((cat) => {
      const catTotalViews = cat.news.reduce((acc, curr) => acc + curr.views, 0);
      return {
        name: cat.nameAr,
        nameEn: cat.nameEn,
        newsCount: cat._count.news,
        views: catTotalViews,
        color: cat.color,
      };
    });

    // 5. Fetch daily publishing count for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentNews = await prisma.news.findMany({
      where: {
        publishDate: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        publishDate: true,
      },
    });

    // Aggregate by date
    const dailyPublishMap: { [dateStr: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('ar-LY', { weekday: 'short', month: 'numeric', day: 'numeric' });
      dailyPublishMap[label] = 0;
    }

    recentNews.forEach((news) => {
      const label = new Date(news.publishDate).toLocaleDateString('ar-LY', {
        weekday: 'short',
        month: 'numeric',
        day: 'numeric',
      });
      if (dailyPublishMap[label] !== undefined) {
        dailyPublishMap[label]++;
      }
    });

    const dailyPublishData = Object.entries(dailyPublishMap).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json({
      stats: {
        totalNews,
        totalUsers,
        totalCategories,
        totalViews,
      },
      recentActivity: recentActivity.map((log) => ({
        id: log.id,
        userName: log.user.name,
        userRole: log.user.role,
        action: log.action,
        details: log.details,
        createdAt: log.createdAt,
      })),
      categoryChartData,
      dailyPublishData,
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحميل بيانات الإحصائيات' },
      { status: 500 }
    );
  }
}
