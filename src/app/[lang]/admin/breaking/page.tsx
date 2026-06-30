'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Loader2, 
  X,
  Radio
} from 'lucide-react';
import { getTranslations } from '@/lib/translations';

interface BreakingNewsItem {
  id: string;
  textAr: string;
  textEn: string | null;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
}

interface AdminUser {
  id: string;
  role: string;
}

export default function AdminBreakingPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'ar';
  const t = getTranslations(lang);
  const isRtl = lang === 'ar';

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [breaking, setBreaking] = useState<BreakingNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
  const [textAr, setTextAr] = useState('');
  const [textEn, setTextEn] = useState('');
  const [expiryHours, setExpiryHours] = useState('2');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setAdminUser(data.user))
      .catch((err) => console.error(err));
  }, []);

  const fetchBreaking = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/breaking/manage');
      if (res.ok) {
        const data = await res.json();
        setBreaking(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBreaking();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!textAr) {
      setError(isRtl ? 'يرجى كتابة نص الخبر العاجل بالعربية' : 'Please type the Arabic text');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + parseInt(expiryHours, 10));

      const res = await fetch('/api/breaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textAr,
          textEn: textEn || null,
          expiryTime: expiryDate.toISOString(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('تم إضافة الخبر العاجل بنجاح');
        closeForm();
        fetchBreaking();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'حدث خطأ أثناء إضافة الخبر العاجل');
      }
    } catch (err) {
      console.error(err);
      setError('فشل الاتصال بالشبكة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, activeState: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/breaking/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !activeState }),
      });

      if (res.ok) {
        setSuccess(isRtl ? 'تم تحديث حالة الخبر العاجل' : 'Status updated successfully');
        fetchBreaking();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isRtl ? 'هل تريد حذف هذا الخبر العاجل نهائياً؟' : 'Delete this alert?')) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/breaking/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('تم حذف الخبر العاجل');
        fetchBreaking();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateForm = () => {
    setTextAr('');
    setTextEn('');
    setExpiryHours('2');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setError('');
  };

  if (!adminUser) return null;

  if (adminUser.role !== 'SUPER_ADMIN' && adminUser.role !== 'EDITOR') {
    return (
      <div className="py-20 text-center text-red-600 font-cairo">
        {isRtl ? 'غير مصرح لك بالوصول لهذه الصفحة.' : 'Access Denied.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 font-cairo transition-opacity">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="text-red-600" size={24} />
          <span>{t.adminMenu.breaking}</span>
        </h1>

        <button
          onClick={openCreateForm}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          <Plus size={16} />
          <span>{t.breakingForm.addBtn}</span>
        </button>
      </div>

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

      {/* Ticker list */}
      <div className="bg-white dark:bg-darkgray-lighter rounded-xl shadow-sm border border-gray-150 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-red-600" size={32} />
          </div>
        ) : breaking.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-darkgray-lighter text-gray-500 uppercase font-semibold bg-gray-50/50 dark:bg-black/10">
                  <th className="py-3 px-4">{isRtl ? 'نص الخبر' : 'Alert Text'}</th>
                  <th className="py-3 px-4">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4">{isRtl ? 'وقت الانتهاء' : 'Expires At'}</th>
                  <th className="py-3 px-4">{isRtl ? 'تاريخ الإضافة' : 'Created At'}</th>
                  <th className="py-3 px-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-darkgray-lighter text-gray-700 dark:text-gray-300">
                {breaking.map((item) => {
                  const hasExpired = new Date(item.expiresAt) < new Date();
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-darkgray/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold max-w-[300px]">
                        <div className="truncate" title={item.textAr}>
                          {item.textAr}
                        </div>
                        {item.textEn && (
                          <div className="text-[10px] text-gray-400 font-normal truncate mt-0.5">
                            {item.textEn}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {hasExpired ? (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded font-bold text-[9px]">
                            {isRtl ? 'منتهي الصلاحية' : 'Expired'}
                          </span>
                        ) : item.isActive ? (
                          <span className="px-2 py-0.5 bg-red-600/10 text-red-600 rounded font-bold text-[9px] flex items-center gap-1 w-max">
                            <Radio size={10} className="animate-pulse" />
                            <span>{isRtl ? 'نشط' : 'Active'}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded font-bold text-[9px]">
                            {isRtl ? 'غير نشط' : 'Inactive'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {new Date(item.expiresAt).toLocaleString(lang === 'ar' ? 'ar-LY' : 'en-US')}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {new Date(item.createdAt).toLocaleString(lang === 'ar' ? 'ar-LY' : 'en-US')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center items-center gap-3">
                          {!hasExpired && (
                            <button
                              onClick={() => handleToggleStatus(item.id, item.isActive)}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-darkgray dark:hover:bg-darkgray-lighter rounded text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              {item.isActive ? (isRtl ? 'إيقاف' : 'Deactivate') : (isRtl ? 'تفعيل' : 'Activate')}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-darkgray/50 rounded transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-gray-500">
            {isRtl ? 'لا توجد تنبيهات عاجلة حالياً.' : 'No breaking news alerts.'}
          </div>
        )}
      </div>

      {/* Form Drawer */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeForm}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-darkgray-darker h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-in-rtl border-l border-gray-200 dark:border-gray-800">
            
            <div className="bg-gray-50 dark:bg-darkgray-lighter px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-md font-bold flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={18} />
                <span>{t.breakingForm.addBtn}</span>
              </h2>
              <button onClick={closeForm} className="p-1.5 text-gray-500 hover:text-black dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-darkgray/50 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">{t.breakingForm.textAr}</label>
                <textarea
                  value={textAr}
                  onChange={(e) => setTextAr(e.target.value)}
                  required
                  rows={4}
                  placeholder="عاجل: إعلان حظر التجول في بعض المدن الليبية..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
                />
              </div>


              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">{t.breakingForm.expiry}</label>
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none"
                >
                  <option value="1">1 {isRtl ? 'ساعة واحدة' : 'Hour'}</option>
                  <option value="2">2 {isRtl ? 'ساعتين' : 'Hours'}</option>
                  <option value="4">4 {isRtl ? 'أربع ساعات' : 'Hours'}</option>
                  <option value="8">8 {isRtl ? 'ثماني ساعات' : 'Hours'}</option>
                  <option value="24">24 {isRtl ? 'يوم كامل' : 'Day'}</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-150 dark:border-darkgray-lighter">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-darkgray dark:hover:bg-darkgray-lighter dark:text-gray-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  {t.newsForm.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={13} /> : null}
                  <span>{t.breakingForm.addBtn}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
