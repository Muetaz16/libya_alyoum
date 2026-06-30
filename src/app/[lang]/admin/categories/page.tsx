'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  FolderTree, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  AlertCircle, 
  Loader2, 
  X 
} from 'lucide-react';
import { getTranslations } from '@/lib/translations';

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  order: number;
}

interface AdminUser {
  id: string;
  role: string;
}

export default function AdminCategoriesPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'ar';
  const t = getTranslations(lang);
  const isRtl = lang === 'ar';

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
  const [editId, setEditId] = useState<string | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#D50000');
  const [parentId, setParentId] = useState('');
  const [order, setOrder] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setAdminUser(data.user))
      .catch((err) => console.error(err));
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameAr) {
      setError(isRtl ? 'الاسم مطلوب' : 'Name is required');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    const generatedSlug = editId ? slug : `${nameAr.trim().replace(/[^a-zA-Z0-9\u0600-\u06FF]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const payload = {
      nameAr,
      nameEn: nameAr,
      slug: generatedSlug,
      icon: icon || null,
      color: color || null,
      parentId: parentId || null,
      order: order,
    };

    try {
      const url = editId ? `/api/categories/${editId}` : '/api/categories';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(editId ? 'تم تعديل التصنيف بنجاح' : 'تم إضافة التصنيف بنجاح');
        closeForm();
        fetchCategories();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'حدث خطأ أثناء حفظ التصنيف');
      }
    } catch (err) {
      console.error(err);
      setError('فشل الاتصال بالشبكة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.categoryForm.deleteConfirm)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('تم حذف التصنيف بنجاح');
        fetchCategories();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'فشل حذف التصنيف');
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
    setNameAr('');
    setNameEn('');
    setSlug('');
    setIcon('');
    setColor('#D50000');
    setParentId('');
    setOrder(0);
    setFormOpen(true);
  };

  const openEditForm = (cat: Category) => {
    setEditId(cat.id);
    setNameAr(cat.nameAr);
    setNameEn(cat.nameEn);
    setSlug(cat.slug);
    setIcon(cat.icon || '');
    setColor(cat.color || '#D50000');
    setParentId(cat.parentId || '');
    setOrder(cat.order || 0);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setError('');
  };

  if (!adminUser) return null;

  // Authorization check
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
          <FolderTree className="text-red-600" size={24} />
          <span>{t.adminMenu.categories}</span>
        </h1>

        <button
          onClick={openCreateForm}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          <Plus size={16} />
          <span>{isRtl ? 'إضافة تصنيف جديد' : 'Add Category'}</span>
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
        ) : categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-darkgray-lighter text-gray-500 uppercase font-semibold bg-gray-50/50 dark:bg-black/10">
                  <th className="py-3 px-4">{isRtl ? 'الاسم' : 'Name'}</th>
                  <th className="py-3 px-4">{isRtl ? 'اللون المميز' : 'Color theme'}</th>
                  <th className="py-3 px-4">{isRtl ? 'الترتيب' : 'Order'}</th>
                  <th className="py-3 px-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-darkgray-lighter text-gray-700 dark:text-gray-300">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-darkgray/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold">{cat.nameAr}</td>
                    <td className="py-3.5 px-4 flex items-center gap-2">
                      <span className="w-4 h-4 rounded shadow-sm inline-block" style={{ backgroundColor: cat.color || '#D50000' }}></span>
                      <span>{cat.color}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold">{cat.order}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => openEditForm(cat)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-darkgray/50 rounded transition-colors cursor-pointer"
                          title="تعديل"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
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
            {isRtl ? 'لا توجد تصنيفات معرفة حالياً.' : 'No categories available.'}
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
                <FolderTree className="text-red-600" size={18} />
                <span>{editId ? t.categoryForm.editBtn : t.categoryForm.addBtn}</span>
              </h2>
              <button onClick={closeForm} className="p-1.5 text-gray-500 hover:text-black dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-darkgray/50 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">{isRtl ? 'اسم التصنيف' : 'Category Name'}</label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  required
                  placeholder="السياسة"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">{t.categoryForm.icon}</label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="Globe"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">{t.categoryForm.color}</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 border-0 bg-transparent rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">{isRtl ? 'التصنيف الأب' : 'Parent Category'}</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600 focus:outline-none"
                >
                  <option value="">{isRtl ? 'لا يوجد (تصنيف رئيسي)' : 'None (Main Category)'}</option>
                  {categories.filter(c => c.id !== editId).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {isRtl ? cat.nameAr : cat.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">{isRtl ? 'الترتيب' : 'Order'}</label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value, 10))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
                />
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
                  <span>{editId ? t.categoryForm.editBtn : t.categoryForm.addBtn}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
