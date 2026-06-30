'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Settings, 
  Check, 
  AlertCircle, 
  Loader2, 
  Save 
} from 'lucide-react';
import { getTranslations } from '@/lib/translations';

interface AdminUser {
  id: string;
  role: string;
}

export default function AdminSettingsPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'ar';
  const t = getTranslations(lang);
  const isRtl = lang === 'ar';

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Setting Fields
  const [siteName, setSiteName] = useState('');
  const [siteDesc, setSiteDesc] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setAdminUser(data.user))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSiteName(data.siteName || '');
          setSiteDesc(data.siteDesc || '');
          setContactEmail(data.contactEmail || '');
          setContactPhone(data.contactPhone || '');
          setContactAddress(data.contactAddress || '');
          setMaintenanceMode(data.maintenanceMode === 'true');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName,
          siteDesc,
          contactEmail,
          contactPhone,
          contactAddress,
          maintenanceMode: maintenanceMode.toString(),
        }),
      });

      if (res.ok) {
        setSuccess(isRtl ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'فشل حفظ الإعدادات');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ في الاتصال بالشبكة');
    } finally {
      setActionLoading(false);
    }
  };

  if (!adminUser) return null;

  if (adminUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="py-20 text-center text-red-600 font-cairo">
        {isRtl ? 'غير مصرح لك بالوصول لهذه الصفحة.' : 'Access Denied.'}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-red-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-cairo max-w-2xl transition-opacity">
      <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
        <Settings className="text-red-600" size={24} />
        <span>{t.adminMenu.settings}</span>
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

      <form onSubmit={handleSubmit} className="bg-white dark:bg-darkgray-lighter p-6 md:p-8 rounded-xl shadow-sm border border-gray-150 dark:border-gray-800 space-y-6">
        
        {/* Site Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
            {isRtl ? 'اسم الموقع الإخباري' : 'Site Branding Title'}
          </label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-darkgray-darker text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
          />
        </div>

        {/* Site Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
            {isRtl ? 'الوصف العام للموقع (SEO)' : 'Meta Description (SEO)'}
          </label>
          <textarea
            value={siteDesc}
            onChange={(e) => setSiteDesc(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-darkgray-darker text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
          />
        </div>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
              {isRtl ? 'البريد الإلكتروني للتواصل' : 'Contact Support Email'}
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-darkgray-darker text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
              {isRtl ? 'رقم الهاتف للتواصل' : 'Contact Phone Number'}
            </label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-darkgray-darker text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
            {isRtl ? 'العنوان' : 'Office Address'}
          </label>
          <input
            type="text"
            value={contactAddress}
            onChange={(e) => setContactAddress(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-darkgray-darker text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
          />
        </div>

        {/* Maintenance Switch */}
        <div className="pt-4 border-t border-gray-150 dark:border-gray-800">
          <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="w-4.5 h-4.5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
            />
            <span>{isRtl ? 'تفعيل وضع الصيانة للموقع العام' : 'Activate Public Maintenance Mode'}</span>
          </label>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-gray-150 dark:border-gray-800">
          <button
            type="submit"
            disabled={actionLoading}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
          >
            {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            <span>{isRtl ? 'حفظ التعديلات' : 'Save Changes'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
