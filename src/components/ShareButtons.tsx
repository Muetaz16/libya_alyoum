'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Link as LinkIcon, Check } from 'lucide-react';

interface ShareButtonsProps {
  title: string;
}

export default function ShareButtons({ title }: ShareButtonsProps) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex items-center gap-2">
      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-darkgray-lighter text-gray-500 hover:text-blue-600 transition-colors"
        title="مشاركة على فيسبوك"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </a>

      {/* Twitter */}
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-darkgray-lighter text-gray-500 hover:text-black dark:hover:text-white transition-colors"
        title="مشاركة على إكس (تويتر)"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      </a>

      {/* WhatsApp */}
      <a
        href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-darkgray-lighter text-gray-500 hover:text-green-600 transition-colors"
        title="مشاركة عبر واتساب"
      >
        <MessageSquare size={16} />
      </a>

      {/* Telegram */}
      <a
        href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-darkgray-lighter text-gray-500 hover:text-blue-500 transition-colors"
        title="مشاركة عبر تيليجرام"
      >
        <Send size={16} />
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-darkgray-lighter text-gray-500 hover:text-red-600 transition-colors relative cursor-pointer"
        title="نسخ الرابط"
      >
        {copied ? (
          <Check size={16} className="text-green-600" />
        ) : (
          <LinkIcon size={16} />
        )}
        {copied && (
          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap animate-fade-in font-cairo">
            تم النسخ!
          </span>
        )}
      </button>
    </div>
  );
}
