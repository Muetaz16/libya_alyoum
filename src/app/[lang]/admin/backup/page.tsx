'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Database, 
  Download, 
  Upload, 
  Check, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { getTranslations } from '@/lib/translations';

interface AdminUser {
  id: string;
  role: string;
}

export default function AdminBackupPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'ar';
  const t = getTranslations(lang);
  const isRtl = lang === 'ar';

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setAdminUser(data.user))
      .catch((err) => console.error(err));
  }, []);

  const handleExportBackup = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/backup');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-libyaalyoum-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        setSuccess(isRtl ? 'تم تصدير النسخة الاحتياطية بنجاح' : 'Backup exported successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'فشلت عملية التصدير');
      }
    } catch (err) {
      console.error(err);
      setError('خطأ في الشبكة أثناء التصدير');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(isRtl 
      ? 'تحذير: استعادة النسخة الاحتياطية ستمحو كافة البيانات الحالية بالكامل وتستبدلها ببيانات الملف. هل تريد المتابعة؟' 
      : 'WARNING: Restoring will overwrite all existing data. Do you want to proceed?')) {
      e.target.value = '';
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target?.result as string);
        
        const res = await fetch('/api/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backupData),
        });

        const data = await res.json();

        if (res.ok) {
          setSuccess(isRtl ? 'تم استعادة البيانات والملفات بنجاح' : 'Database restored successfully');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(data.error || 'فشلت عملية الاستعادة');
        }
      } catch (err) {
        console.error(err);
        setError('تنسيق ملف النسخة الاحتياطية غير صالح');
      } finally {
        setActionLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  if (!adminUser) return null;

  if (adminUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="py-20 text-center text-red-600 font-cairo">
        {isRtl ? 'غير مصرح لك بالوصول لهذه الصفحة.' : 'Access Denied.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 font-cairo max-w-2xl transition-opacity">
      <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
        <Database className="text-red-600" size={24} />
        <span>{t.adminMenu.backup}</span>
      </h1>

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/30 rounded-lg text-xs font-semibold">
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg text-xs font-semibold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-darkgray-lighter p-6 md:p-8 rounded-xl shadow-sm border border-gray-150 dark:border-gray-800 space-y-8">
        
        {/* Export Backup Card */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <Download className="text-red-600" size={16} />
            <span>{isRtl ? 'تصدير نسخة احتياطية من قاعدة البيانات' : 'Export Full JSON Backup'}</span>
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            {isRtl ? 'حمل ملفاً محلياً يحتوي على جميع المستخدمين، الأخبار، التصنيفات، التنبيهات العاجلة، وإعدادات الموقع بصيغة JSON مضغوطة وآمنة.' : 'Download a local backup containing all database records including users, news, and site settings.'}
          </p>
          <button
            onClick={handleExportBackup}
            disabled={actionLoading}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="animate-spin" size={14} /> : null}
            <span>{isRtl ? 'تصدير وتحميل النسخة' : 'Export & Download'}</span>
          </button>
        </div>

        {/* Import Backup Card */}
        <div className="pt-6 border-t border-gray-150 dark:border-gray-800 space-y-3">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <Upload className="text-red-600" size={16} />
            <span>{isRtl ? 'استعادة قاعدة البيانات من ملف' : 'Restore from JSON Backup File'}</span>
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            {isRtl ? 'حدد ملف النسخة الاحتياطية (.json) الذي قمت بتصديره سابقاً لإستعادة قاعدة البيانات بالكامل. ملاحظة: سيتم حذف كافة البيانات الحالية!' : 'Select a previously exported JSON backup file. This action will overwrite existing records.'}
          </p>
          
          <label className="inline-block">
            <span className="px-5 py-2.5 bg-gray-150 hover:bg-gray-200 dark:bg-darkgray dark:hover:bg-darkgray-lighter text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5">
              <Upload size={14} />
              <span>{isRtl ? 'اختر ملف النسخة واستعادتها' : 'Select File & Restore'}</span>
            </span>
            <input
              type="file"
              accept=".json"
              disabled={actionLoading}
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>

      </div>
    </div>
  );
}
