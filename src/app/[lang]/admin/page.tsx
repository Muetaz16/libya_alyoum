'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  FileText, 
  Eye, 
  Users, 
  FolderTree, 
  Activity, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { getTranslations } from '@/lib/translations';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  CartesianGrid
} from 'recharts';

interface Stats {
  totalNews: number;
  totalUsers: number;
  totalCategories: number;
  totalViews: number;
}

interface ActivityLog {
  id: string;
  userName: string;
  userRole: string;
  action: string;
  details: string | null;
  createdAt: string;
}

interface ChartCategory {
  name: string;
  nameEn: string;
  newsCount: number;
  views: number;
  color: string;
}

interface ChartDaily {
  date: string;
  count: number;
}

export default function AdminOverviewPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'ar';
  const t = getTranslations(lang);
  const isRtl = lang === 'ar';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [categoryData, setCategoryData] = useState<ChartCategory[]>([]);
  const [dailyData, setDailyData] = useState<ChartDaily[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentLogs(data.recentActivity);
          setCategoryData(data.categoryChartData);
          setDailyData(data.dailyPublishData);
        } else {
          setError(lang === 'ar' ? 'تعذر تحميل الإحصائيات' : 'Failed to load statistics.');
        }
      } catch (err) {
        console.error('Error fetching dashboard analytics:', err);
        setError(lang === 'ar' ? 'حدث خطأ بالاتصال بالشبكة' : 'Network error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [lang]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-red-600" size={32} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg flex items-center gap-2 font-cairo">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  const statCards = [
    { label: t.adminStats.totalNews, value: stats.totalNews, icon: FileText, color: 'bg-blue-500' },
    { label: t.adminStats.totalUsers, value: stats.totalUsers, icon: Users, color: 'bg-purple-500' },
    { label: t.adminStats.totalCategories, value: stats.totalCategories, icon: FolderTree, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8 font-cairo transition-opacity duration-300">
      {/* 1. Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className="bg-white dark:bg-darkgray-lighter border border-gray-150 dark:border-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-between"
            >
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">{card.label}</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{card.value.toLocaleString()}</p>
              </div>
              <div className={`w-12 h-12 ${card.color} text-white rounded-xl flex items-center justify-center shadow-md`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Daily publishing frequency */}
        <div className="bg-white dark:bg-darkgray-lighter p-6 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-800 space-y-4">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-darkgray-lighter pb-3">
            {isRtl ? 'وتيرة النشر اليومية (آخر 7 أيام)' : 'Daily publishing frequency (Last 7 Days)'}
          </h3>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#888888" tickLine={false} />
                <YAxis stroke="#888888" tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="count" stroke="#D50000" fill="rgba(213, 0, 0, 0.15)" strokeWidth={2} name={isRtl ? 'الأخبار' : 'News'} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Activity log table */}
      <div className="bg-white dark:bg-darkgray-lighter p-6 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-darkgray-lighter pb-3">
          <Activity className="text-red-600" size={18} />
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            {t.adminStats.recentActivity}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-darkgray-lighter text-gray-500 uppercase font-semibold">
                <th className="py-3 px-4">{isRtl ? 'المسؤول' : 'User'}</th>
                <th className="py-3 px-4">{isRtl ? 'العملية' : 'Action'}</th>
                <th className="py-3 px-4">{isRtl ? 'التفاصيل' : 'Details'}</th>
                <th className="py-3 px-4">{isRtl ? 'التاريخ والوقت' : 'Date & Time'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-darkgray-lighter text-gray-700 dark:text-gray-300">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-darkgray/30 transition-colors">
                  <td className="py-3 px-4 font-bold">
                    {log.userName}
                    <span className="block text-[9px] text-gray-400 font-normal uppercase">
                      {t.roles[log.userRole as keyof typeof t.roles]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-md font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-light">{log.details}</td>
                  <td className="py-3 px-4 text-gray-400">
                    {new Date(log.createdAt).toLocaleString(lang === 'ar' ? 'ar-LY' : 'en-US')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
