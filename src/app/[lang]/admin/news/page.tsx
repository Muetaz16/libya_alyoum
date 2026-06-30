'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  Loader2, 
  Search, 
  EyeOff, 
  Calendar 
} from 'lucide-react';
import { getTranslations } from '@/lib/translations';
import RichTextEditor from '@/components/RichTextEditor';

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
}

interface NewsItem {
  id: string;
  titleAr: string;
  titleEn: string | null;
  summaryAr: string;
  summaryEn: string | null;
  contentAr: string;
  contentEn: string | null;
  slug: string;
  image: string | null;
  videoUrl: string | null;
  isFeatured: boolean;
  isBreaking: boolean;
  status: string;
  publishDate: string;
  views: number;
  tags: string[];
  categoryId: string;
  authorId: string;
  category: Category;
  author: { name: string };
}

interface AdminUser {
  id: string;
  name: string;
  role: string;
}

export default function AdminNewsPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'ar';
  const t = getTranslations(lang);
  const isRtl = lang === 'ar';

  // State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtering state
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Editing state
  const [editId, setEditId] = useState<string | null>(null);

  // Form Fields
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [summaryAr, setSummaryAr] = useState('');
  const [summaryEn, setSummaryEn] = useState('');
  const [contentAr, setContentAr] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [image, setImage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [status, setStatus] = useState('DRAFT');
  const [publishDate, setPublishDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Fetch admin user profile
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setAdminUser(data.user))
      .catch((err) => console.error(err));
  }, []);

  // Fetch Categories
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error(err));
  }, []);

  // Fetch News with filters
  const fetchNews = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filterSearch) queryParams.set('search', filterSearch);
      if (filterCategory) queryParams.set('category', filterCategory);
      if (filterStatus) queryParams.set('status', filterStatus);
      
      const res = await fetch(`/api/news?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNews(data.news);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [filterSearch, filterCategory, filterStatus]);

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setActionLoading(true);
    setError('');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setImage(data.url);
        setSuccess(isRtl ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'فشل رفع الصورة');
      }
    } catch (err) {
      console.error(err);
      setError('خطأ في الاتصال بالشبكة');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleAr || !contentAr || !categoryId) {
      setError(isRtl ? 'يرجى ملء كافة الحقول الأساسية بالعربية' : 'Please fill all required fields in Arabic');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      titleAr,
      titleEn: titleEn || null,
      summaryAr: titleAr, // Auto-fill summary with title to satisfy backend
      summaryEn: summaryEn || null,
      contentAr,
      contentEn: contentEn || null,
      categoryId,
      image: image || null,
      videoUrl: videoUrl || null,
      isFeatured,
      isBreaking,
      status,
      publishDate: publishDate ? new Date(publishDate).toISOString() : new Date().toISOString(),
      tags: tagsInput.split(',').map((t) => t.trim()).filter((t) => t !== ''),
    };

    try {
      const url = editId ? `/api/news/${editId}` : '/api/news';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(editId ? t.newsForm.updateSuccess : t.newsForm.createSuccess);
        closeForm();
        fetchNews();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.error || 'حدث خطأ أثناء حفظ الخبر');
      }
    } catch (err) {
      console.error(err);
      setError('فشل الاتصال بالشبكة');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Article
  const handleDelete = async (id: string) => {
    if (!confirm(isRtl ? 'هل أنت متأكد من حذف هذا الخبر نهائياً؟' : 'Are you sure you want to delete this article?')) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/news/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess(isRtl ? 'تم حذف الخبر بنجاح' : 'Article deleted successfully');
        fetchNews();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'فشل حذف الخبر');
      }
    } catch (err) {
      console.error(err);
      setError('فشل الاتصال بالشبكة');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Form for creation
  const openCreateForm = () => {
    setEditId(null);
    setTitleAr('');
    setTitleEn('');
    setSummaryAr('');
    setSummaryEn('');
    setContentAr('');
    setContentEn('');
    setCategoryId('');
    setImage('');
    setVideoUrl('');
    setIsFeatured(false);
    setIsBreaking(false);
    setStatus('DRAFT');
    
    // Get local ISO time for datetime-local input
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60 * 1000;
    const localISOTime = new Date(now.getTime() - offsetMs).toISOString().substring(0, 16);
    setPublishDate(localISOTime);
    
    setTagsInput('');
    setFormOpen(true);
  };

  // Open Form for Edit
  const openEditForm = (item: NewsItem) => {
    setEditId(item.id);
    setTitleAr(item.titleAr);
    setTitleEn(item.titleEn || '');
    setSummaryAr(item.summaryAr);
    setSummaryEn(item.summaryEn || '');
    setContentAr(item.contentAr);
    setContentEn(item.contentEn || '');
    setCategoryId(item.categoryId);
    setImage(item.image || '');
    setVideoUrl(item.videoUrl || '');
    setIsFeatured(item.isFeatured);
    setIsBreaking(item.isBreaking);
    setStatus(item.status);

    // Convert saved UTC publishDate to local time for datetime-local input
    const date = new Date(item.publishDate);
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    const localISOTime = new Date(date.getTime() - offsetMs).toISOString().substring(0, 16);
    setPublishDate(localISOTime);

    setTagsInput(item.tags.join(', '));
    setFormOpen(true);
  };

  // Close Form
  const closeForm = () => {
    setFormOpen(false);
    setError('');
  };

  if (!adminUser) return null;

  return (
    <div className="space-y-6 font-cairo transition-opacity">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="text-red-600" size={24} />
          <span>{t.adminMenu.news}</span>
        </h1>

        <button
          onClick={openCreateForm}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          <Plus size={16} />
          <span>{isRtl ? 'إضافة خبر جديد' : 'Create Article'}</span>
        </button>
      </div>

      {/* Alerts */}
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

      {/* 2. Filters Row */}
      <div className="bg-white dark:bg-darkgray-lighter p-4 rounded-xl shadow-sm border border-gray-150 dark:border-gray-800 flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 ltr:right-auto ltr:left-3">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder={isRtl ? 'البحث في العناوين...' : 'Search titles...'}
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="w-full pr-10 pl-4 ltr:pl-10 ltr:pr-4 py-2 bg-gray-50 dark:bg-darkgray-darker text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-red-600"
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 bg-gray-50 dark:bg-darkgray-darker text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none"
        >
          <option value="">{isRtl ? 'جميع التصنيفات' : 'All Categories'}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {isRtl ? cat.nameAr : cat.nameEn}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-gray-50 dark:bg-darkgray-darker text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none"
        >
          <option value="">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
          <option value="DRAFT">{isRtl ? 'مسودة' : 'Draft'}</option>
          <option value="SUBMITTED">{isRtl ? 'مراجعة' : 'Submitted'}</option>
          <option value="PUBLISHED">{isRtl ? 'منشور' : 'Published'}</option>
        </select>
      </div>

      {/* 3. News list Table */}
      <div className="bg-white dark:bg-darkgray-lighter rounded-xl shadow-sm border border-gray-150 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-red-600" size={32} />
          </div>
        ) : news.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-darkgray-lighter text-gray-500 uppercase font-semibold bg-gray-50/50 dark:bg-black/10">
                  <th className="py-3 px-4">{isRtl ? 'العنوان' : 'Title'}</th>
                  <th className="py-3 px-4">{isRtl ? 'التصنيف' : 'Category'}</th>
                  <th className="py-3 px-4">{isRtl ? 'الكاتب' : 'Author'}</th>
                  <th className="py-3 px-4">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4">{isRtl ? 'تاريخ النشر' : 'Publish Date'}</th>
                  <th className="py-3 px-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-darkgray-lighter text-gray-700 dark:text-gray-300">
                {news.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-darkgray/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold max-w-[280px]">
                      <div className="truncate" title={item.titleAr}>
                        {isRtl ? item.titleAr : (item.titleEn || item.titleAr)}
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        {item.isFeatured && (
                          <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[9px] font-bold">
                            {isRtl ? 'رئيسي' : 'Featured'}
                          </span>
                        )}
                        {item.isBreaking && (
                          <span className="px-1.5 py-0.5 bg-red-600/10 text-red-600 rounded text-[9px] font-bold">
                            {isRtl ? 'عاجل' : 'Breaking'}
                          </span>
                        )}
                        {item.videoUrl && (
                          <span className="px-1.5 py-0.5 bg-blue-600/10 text-blue-600 rounded text-[9px] font-bold">
                            {isRtl ? 'فيديو' : 'Video'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-red-600 dark:text-red-500">
                      {isRtl ? item.category.nameAr : item.category.nameEn}
                    </td>
                    <td className="py-3.5 px-4">{item.author.name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        item.status === 'PUBLISHED'
                          ? 'bg-green-500/15 text-green-600'
                          : item.status === 'SUBMITTED'
                          ? 'bg-amber-500/15 text-amber-500'
                          : 'bg-gray-400/15 text-gray-500'
                      }`}>
                        {t.status[item.status as keyof typeof t.status]}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">
                      {new Date(item.publishDate).toLocaleDateString(lang === 'ar' ? 'ar-LY' : 'en-US')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        {/* Edit Guard: Journalists/Editors own only */}
                        {((adminUser.role === 'SUPER_ADMIN') || 
                          (adminUser.role === 'EDITOR' && item.authorId === adminUser.id) ||
                          (adminUser.role === 'JOURNALIST' && item.authorId === adminUser.id && item.status !== 'PUBLISHED')) && (
                          <button
                            onClick={() => openEditForm(item)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-darkgray/50 rounded transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        
                        {/* Delete Guard: Super Admin, or Editor own only */}
                        {((adminUser.role === 'SUPER_ADMIN') || 
                          (adminUser.role === 'EDITOR' && item.authorId === adminUser.id)) && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-darkgray/50 rounded transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-gray-500">
            {isRtl ? 'لم يتم العثور على أي أخبار مطابقة.' : 'No articles found matching filters.'}
          </div>
        )}
      </div>

      {/* 4. Form Drawer Overlay */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeForm}></div>
          <div className="relative w-full max-w-4xl bg-white dark:bg-darkgray-darker h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-in-rtl border-l border-gray-200 dark:border-gray-800">
            
            {/* Form Header */}
            <div className="bg-gray-50 dark:bg-darkgray-lighter px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-md font-bold flex items-center gap-2">
                <FileText className="text-red-600" size={18} />
                <span>{editId ? (isRtl ? 'تعديل الخبر الحالي' : 'Edit Article') : (isRtl ? 'إنشاء خبر جديد' : 'New Article')}</span>
              </h2>
              <button onClick={closeForm} className="p-1.5 text-gray-500 hover:text-black dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-darkgray/50 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Form Fields Body */}
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 flex-1">
              
              {/* Language Fields Tabs */}
              <div className="space-y-6">
                
                {/* ARABIC COLUMN */}
                <div className="space-y-4">
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500">{t.newsForm.titleAr}</label>
                    <input
                      type="text"
                      value={titleAr}
                      onChange={(e) => setTitleAr(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
                    />
                  </div>



                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500">{t.newsForm.contentAr}</label>
                    <RichTextEditor value={contentAr} onChange={setContentAr} lang="ar" placeholder="اكتب الخبر بصيغة HTML أو استخدم المحرر..." />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-150 dark:border-darkgray-lighter pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Meta Inputs */}
                <div className="space-y-4">
                  
                  {/* Category Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500">{t.newsForm.category}</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none"
                    >
                      <option value="">{isRtl ? 'اختر القسم...' : 'Select category...'}</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {isRtl ? cat.nameAr : cat.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Image Path & Upload */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500">{t.newsForm.image}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-3 py-2 bg-gray-50 dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
                      />
                      <label className="px-3 py-2 bg-gray-100 hover:bg-gray-250 dark:bg-darkgray dark:hover:bg-darkgray-lighter border border-gray-200 dark:border-gray-700 rounded-lg text-xs cursor-pointer flex items-center gap-1.5">
                        <Upload size={14} />
                        <span>{t.newsForm.uploadBtn}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>

                  {/* Youtube Link */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500">{t.newsForm.videoUrl}</label>
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
                    />
                  </div>



                </div>

                {/* Scheduling & Publish switches */}
                <div className="space-y-5 bg-gray-50 dark:bg-darkgray/30 p-5 rounded-xl border border-gray-150 dark:border-gray-800">
                  
                  {/* Status Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500">{t.newsForm.status}</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none font-bold"
                    >
                      <option value="DRAFT">{t.status.DRAFT}</option>
                      <option value="SUBMITTED">{t.status.SUBMITTED}</option>
                      
                      {/* Publication Guard: only Editor and Super Admin */}
                      {adminUser.role !== 'JOURNALIST' && (
                        <option value="PUBLISHED">{t.status.PUBLISHED}</option>
                      )}
                    </select>
                  </div>

                  {/* Publish / Schedule date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                      <Calendar size={13} />
                      <span>{t.newsForm.publishDate}</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-darkgray-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-red-600"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      {isRtl ? 'اختر تاريخاً قديماً لنشر الخبر بأثر رجعي (تاريخ رجعي)، أو تاريخاً مستقبلياً لجدولته.' : 'Select an older date to publish retroactively (backdate), or a future date to schedule publication.'}
                    </p>
                  </div>

                  {/* Featured / Breaking Switches */}
                  <div className="space-y-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    
                    {/* Featured (Super Admin only) */}
                    {adminUser.role === 'SUPER_ADMIN' && (
                      <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                          className="w-4.5 h-4.5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span>{t.newsForm.isFeatured}</span>
                      </label>
                    )}

                    {/* Breaking (Super Admin / Editor) */}
                    {adminUser.role !== 'JOURNALIST' && (
                      <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={isBreaking}
                          onChange={(e) => setIsBreaking(e.target.checked)}
                          className="w-4.5 h-4.5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span>{t.newsForm.isBreaking}</span>
                      </label>
                    )}

                  </div>

                </div>

              </div>

              {/* Submit Buttons */}
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
                  <span>{t.newsForm.saveBtn}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
