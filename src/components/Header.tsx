import React from "react";
import { BookOpen, RefreshCw, Layers, FileText } from "lucide-react";
import { ActiveBook } from "../types/book.ts";

interface HeaderProps {
  activeBook: ActiveBook | null;
  onResetBook: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeBook, onResetBook, isLoading }) => {
  return (
    <header id="main-header" className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-700/10 text-amber-800 flex items-center justify-center border border-amber-800/15">
            <BookOpen className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-stone-900 tracking-tight">
                قارئ ومحلل الكتب الذكي
              </h1>
              <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                قراءة حقيقية وفعلية
              </span>
            </div>
            <p className="text-xs text-stone-500 font-normal">
              فحص صفحات وأسطر الكتاب واستخراج البيانات بدقة وتوثيق كامل
            </p>
          </div>
        </div>

        {activeBook && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-stone-600 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              <span className="font-medium truncate max-w-[180px]">{activeBook.fileName}</span>
              <span className="text-stone-400">|</span>
              <span className="font-semibold text-stone-800">{activeBook.numPages} صفحة</span>
              <span className="text-stone-400">|</span>
              <span className="text-stone-600">{activeBook.totalWords.toLocaleString("ar-EG")} كلمة</span>
            </div>

            <button
              id="change-book-btn"
              onClick={onResetBook}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-300 px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
              <span>تغيير الكتاب</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
