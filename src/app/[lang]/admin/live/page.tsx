'use client';

import React, { useState, useEffect } from 'react';
import { Radio, Save, AlertCircle, Play, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function LiveStreamAdminPage() {
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'ar';
  const isRtl = lang === 'ar';

  const [isActive, setIsActive] = useState(false);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [embedUrl, setEmbedUrl] = useState('');

  // Helper to extract YouTube embed URL
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : '';
  };

  useEffect(() => {
    // Fetch initial data
    const fetchLiveStreamSettings = async () => {
      try {
        const res = await fetch('/api/live');
        if (res.ok) {
          const data = await res.json();
          setIsActive(data.isActive);
          setUrl(data.url);
          setEmbedUrl(getYoutubeEmbedUrl(data.url));
        }
      } catch (error) {
        console.error('Error fetching live stream:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveStreamSettings();
  }, []);

  // Update embed preview when URL changes
  useEffect(() => {
    setEmbedUrl(getYoutubeEmbedUrl(url));
  }, [url]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive, url }),
      });

      if (res.ok) {
        setMessage({ 
          text: isRtl ? 'تم حفظ إعدادات البث المباشر بنجاح' : 'Live stream settings saved successfully', 
          type: 'success' 
        });
        router.refresh();
      } else {
        const data = await res.json();
        setMessage({ text: data.error || 'حدث خطأ أثناء الحفظ', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'حدث خطأ في الاتصال', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-red-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Radio className="text-red-600" size={28} />
          {isRtl ? 'إدارة البث المباشر' : 'Live Stream Management'}
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-8">
          
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900">
                {isRtl ? 'حالة البث المباشر' : 'Live Stream Status'}
              </h3>
              <p className="text-sm text-gray-500">
                {isRtl ? 'تفعيل أو إيقاف ظهور البث المباشر في الصفحة الرئيسية' : 'Enable or disable the live stream on the homepage'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              {isRtl ? 'رابط يوتيوب (YouTube URL)' : 'YouTube URL'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Play className="text-gray-400" size={18} />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors text-left"
                dir="ltr"
              />
            </div>
            <p className="text-xs text-gray-500">
              {isRtl ? 'ضع رابط البث المباشر الخاص بقناتك على يوتيوب هنا.' : 'Paste your YouTube Live URL here.'}
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              {isRtl ? 'معاينة البث' : 'Stream Preview'}
            </label>
            <div className="aspect-video w-full max-w-2xl bg-gray-900 rounded-xl overflow-hidden border border-gray-200 shadow-inner flex items-center justify-center">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title="YouTube video player"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="text-gray-500 flex flex-col items-center gap-2">
                  <Play size={48} className="opacity-20" />
                  <span>{isRtl ? 'لا يوجد رابط صالح للمعاينة' : 'No valid URL for preview'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <AlertCircle size={20} />
              <span className="font-semibold">{message.text}</span>
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              {isRtl ? 'حفظ الإعدادات' : 'Save Settings'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
