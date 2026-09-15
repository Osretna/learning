import React from "react";
import { ActiveBook } from "../types/book.ts";
import { FileText, User, Tag, HelpCircle, Layers, CheckSquare, Search, Award } from "lucide-react";

export type ActiveTab = "viewer" | "study" | "qa" | "data" | "verifier" | "quiz";

interface BookOverviewProps {
  book: ActiveBook;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const BookOverview: React.FC<BookOverviewProps> = ({ book, activeTab, onTabChange }) => {
  const meta = book.inspectedMetadata;

  const tabs: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "viewer", label: "متصفح صفحات ونصوص الكتاب", icon: FileText },
    { id: "study", label: "الدراسة الشاملة وتفكيك الفصول", icon: Layers },
    { id: "qa", label: "اسأل في أدق تفاصيل الكتاب", icon: HelpCircle },
    { id: "data", label: "استخراج البيانات والأرقام", icon: Award },
    { id: "verifier", label: "التحقق من صحة مقولة أو معلومة", icon: Search },
    { id: "quiz", label: "اختبار استيعاب الكتاب", icon: CheckSquare },
  ];

  return (
    <div id="book-overview-card" className="bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        {/* Book Header Information */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-md border border-stone-200">
                <Tag className="w-3 h-3 text-amber-700" />
                {meta?.mainGenre || "كتاب معتمد"}
              </span>
              {meta?.language && (
                <span className="text-[11px] font-medium text-stone-500 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200">
                  اللغة: {meta.language}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {meta?.title || book.fileName}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-600">
              {meta?.author && (
                <div className="flex items-center gap-1.5 font-medium text-amber-900">
                  <User className="w-4 h-4 text-amber-700" />
                  <span>المؤلف: {meta.author}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-stone-500">
                <span>الحجم الفعلي:</span>
                <strong className="text-stone-800 font-semibold">{book.numPages} صفحة</strong>
                <span className="text-stone-300">|</span>
                <strong className="text-stone-800 font-semibold">{book.totalWords.toLocaleString("ar-EG")} كلمة</strong>
              </div>
            </div>

            {meta?.oneSentenceThesis && (
              <p className="text-xs sm:text-sm text-stone-700 bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-xl font-medium mt-2 leading-relaxed">
                <span className="font-bold text-amber-900">الفكرة الجوهرية: </span>
                {meta.oneSentenceThesis}
              </p>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 space-x-reverse overflow-x-auto py-2 -mb-px no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                  isActive
                    ? "border-amber-700 text-amber-900 bg-amber-50/50"
                    : "border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-700" : "text-stone-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
