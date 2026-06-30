'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  AlertCircle, 
  Loader2, 
  X, 
  Key 
} from 'lucide-react';
import { getTranslations } from '@/lib/translations';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AdminUser {
  id: string;
  role: string;
}

export default function AdminUsersPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'ar';
  const t = getTranslations(lang);
  const isRtl = lang === 'ar';

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('JOURNALIST');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setAdminUser(data.user))
      .catch((err) => console.error(err));
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || (!editId && (!email || !password))) {
      setError(isRtl ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    const payload: any = { name, email, role };
    if (!editId) {
      payload.password = password;
    } else if (password && password.trim() !== '') {
      payload.password = password;
    }

    try {
      const url = editId ? `/api/users/${editId}` : '/api/users';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(editId ? 'تم تعديل المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح');
        closeForm();
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'حدث خطأ أثناء حفظ المستخدم');
      }
    } catch (err) {
      console.error(err);
      setError('فشل الاتصال بالشبكة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.userForm.deleteConfirm)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('تم حذف المستخدم بنجاح');
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'فشل حذف المستخدم');
      }
    } catch (err) {
      console.error(err);
      setError('فشل الاتصال بالشبكة');
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('JOURNALIST');
    setFormOpen(true);
  };

  const openEditForm = (u: UserItem) => {
    setEditId(u.id);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setError('');
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
    <div className="space-y-6 font-cairo transition-opacity">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="text-red-600" size={24} />
          <span>{t.adminMenu.users}</span>
        </h1>

        <button
          onClick={openCreateForm}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          <Plus size={16} />
          <span>{t.userForm.addBtn}</span>
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

      {/* Table list */}
      <div className="bg-white dark:bg-darkgray-lighter rounded-xl shadow-sm border border-gray-150 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-red-600" size={32} />
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-darkgray-lighter text-gray-500 uppercase font-semibold bg-gray-50/50 dark:bg-black/10">
                  <th className="py-3 px-4">{t.userForm.name}</th>
                  <th className="py-3 px-4">{t.emailLabel}</th>
                  <th className="py-3 px-4">{t.userForm.role}</th>
                  <th className="py-3 px-4">{isRtl ? 'تاريخ الإنشاء' : 'Created Date'}</th>
                  <th className="py-3 px-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-darkgray-lighter text-gray-700 dark:text-gray-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-darkgray/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold">{u.name}</td>
                    <td className="py-3.5 px-4 font-mono">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-purple-500/15 text-purple-600'
                          : u.role === 'EDITOR'
                          ? 'bg-blue-500/15 text-blue-600'
                          : u.role === 'JOURNALIST'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-gray-500/15 text-gray-600'
                      }`}>
                        {t.roles[u.role as keyof typeof t.roles]}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-LY' : 'en-US')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => openEditForm(u)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-darkgray/50 rounded transition-colors cursor-pointer"
                          title="تعديل"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-darkgray/50 rounded transition-colors cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-gray-500">
            {isRtl ? 'لا توجد مستخدمين معرفين حالياً.' : 'No users available.'}
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
                <Users className="text-red-600" size={18} />
                <span>{editId ? t.userForm.editBtn : t.userForm.addBtn}</span>
              </h2>
              <button onClick={closeForm} className="p-1.5 text-gray-500 hover:text-black dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-darkgray/50 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">{t.userForm.name}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="محمد أحمد"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
                />
              </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500">{t.emailLabel}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="name@libyaalyoum.ly"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500">
                      {editId ? (isRtl ? 'كلمة المرور الجديدة (اختياري)' : 'New Password (Optional)') : t.passwordLabel}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!editId}
                      placeholder={editId ? (isRtl ? 'اترك الحقل فارغاً للاحتفاظ بكلمة المرور الحالية' : 'Leave blank to keep current password') : '••••••••'}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
                    />
                  </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">{t.userForm.role}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none"
                >
                  <option value="SUPER_ADMIN">{t.roles.SUPER_ADMIN}</option>
                  <option value="EDITOR">{t.roles.EDITOR}</option>
                  <option value="JOURNALIST">{t.roles.JOURNALIST}</option>
                  <option value="VIEWER">{t.roles.VIEWER}</option>
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
                  <span>{editId ? t.userForm.editBtn : t.userForm.addBtn}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
