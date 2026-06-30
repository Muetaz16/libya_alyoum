'use client';

import React, { useState, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Heading2, 
  Heading3, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Play, 
  Eye, 
  Edit3,
  Heading1,
  List
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  lang?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = '', lang = 'ar' }: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    const replacement = before + selectedText + after;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    
    onChange(newValue);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const handleLink = () => {
    const url = prompt(lang === 'ar' ? 'أدخل رابط URL:' : 'Enter URL:');
    if (url) {
      insertTag(`<a href="${url}" target="_blank" rel="noopener noreferrer">`, '</a>');
    }
  };

  const handleImage = () => {
    const url = prompt(lang === 'ar' ? 'أدخل رابط الصورة:' : 'Enter Image URL:');
    if (url) {
      insertTag(`<img src="${url}" alt="image" className="rounded-xl my-4" />`);
    }
  };

  const handleYoutube = () => {
    const url = prompt(lang === 'ar' ? 'أدخل رابط فيديو يوتيوب:' : 'Enter YouTube URL:');
    if (url) {
      insertTag(`<iframe src="${url}" className="w-full aspect-video rounded-xl my-4" allowfullscreen></iframe>`);
    }
  };

  const isRtl = lang === 'ar';

  const toolbarButtons = [
    { label: 'عريض', icon: Bold, action: () => insertTag('<b>', '</b>') },
    { label: 'مائل', icon: Italic, action: () => insertTag('<i>', '</i>') },
    { label: 'عنوان رئيسي', icon: Heading2, action: () => insertTag('<h2>', '</h2>') },
    { label: 'عنوان فرعي', icon: Heading3, action: () => insertTag('<h3>', '</h3>') },
    { label: 'فقرة', icon: Heading1, action: () => insertTag('<p>', '</p>') },
    { label: 'رابط', icon: LinkIcon, action: handleLink },
    { label: 'صورة', icon: ImageIcon, action: handleImage },
    { label: 'فيديو يوتيوب', icon: Play, action: handleYoutube },
  ];

  return (
    <div className="border border-gray-200 dark:border-darkgray-lighter rounded-xl overflow-hidden bg-white dark:bg-darkgray-darker shadow-sm font-cairo">
      
      {/* Editor Header / Tab Switchers */}
      <div className="bg-gray-50 dark:bg-darkgray-lighter border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'write'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-darkgray/30'
            }`}
          >
            <Edit3 size={13} />
            <span>{isRtl ? 'كتابة' : 'Write'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-darkgray/30'
            }`}
          >
            <Eye size={13} />
            <span>{isRtl ? 'معاينة' : 'Preview'}</span>
          </button>
        </div>

        {activeTab === 'write' && (
          <div className="flex items-center gap-1">
            {toolbarButtons.map((btn, idx) => {
              const Icon = btn.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={btn.action}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-darkgray/50 rounded transition-colors cursor-pointer"
                  title={btn.label}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor Content Area */}
      <div className="p-4 min-h-[300px]">
        {activeTab === 'write' ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full min-h-[300px] border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 focus:outline-none font-mono text-sm leading-relaxed"
          />
        ) : (
          <div 
            className="prose dark:prose-invert max-w-none prose-custom text-gray-800 dark:text-gray-200 min-h-[300px]"
            dangerouslySetInnerHTML={{ __html: value || (isRtl ? '<p class="text-gray-400">لا يوجد محتوى للمعاينة...</p>' : '<p class="text-gray-400">Nothing to preview...</p>') }}
          />
        )}
      </div>
    </div>
  );
}
