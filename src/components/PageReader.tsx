import React, { useState, useMemo } from "react";
import { ActiveBook } from "../types/book.ts";
import { Search, ChevronRight, ChevronLeft, Copy, Check, MessageSquare, BookOpen, AlertCircle } from "lucide-react";

interface PageReaderProps {
  book: ActiveBook;
  onAskAboutPage: (pageNumber: number, pageExcerpt: string) => void;
}

export const PageReader: React.FC<PageReaderProps> = ({ book, onAskAboutPage }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");

  const totalPages = book.pages.length || 1;
  const currentExtractedPage = book.pages.find((p) => p.pageNumber === currentPage) || {
    pageNumber: currentPage,
    text: "لا يوجد نص متاح لهذه الصفحة مباشرة.",
  };

  // Search matches across all pages
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return book.pages
      .map((p) => {
        const matchesCount = (p.text.toLowerCase().match(new RegExp(query, "g")) || []).length;
        return {
          pageNumber: p.pageNumber,
          matchesCount,
          snippet: p.text.slice(0, 140) + "...",
        };
      })
      .filter((r) => r.matchesCount > 0);
  }, [book.pages, searchQuery]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentExtractedPage.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={index} className="bg-amber-300 text-stone-900 rounded-xs px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div id="page-reader-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner explaining transparent reading */}
      <div className="mb-6 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-amber-700 shrink-0" />
          <span>
            <strong>فحص حي لنصوص الكتاب:</strong> هذه النصوص تم استخراجها مباشرة من أسطر وصفحات ملفك الفعلي، ويتم تمريرها لمحرك الفحص الذكي للإجابة الموثقة.
          </span>
        </div>
        <span className="text-xs font-semibold bg-white text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
          إجمالي الصفحات: {totalPages}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar: Navigation & In-Book Search */}
        <div className="lg:col-span-4 space-y-4">
          {/* Search in Book */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>البحث الدقيق داخل الكتاب</span>
              {searchResults.length > 0 && (
                <span className="text-amber-800 text-[11px] font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                  {searchResults.length} صفحات مطابقة
                </span>
              )}
            </h3>

            <div className="relative mb-3">
              <input
                id="in-book-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن كلمة، مفهوم، أو رقم..."
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg pl-8 pr-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5" />
            </div>

            {searchQuery && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {searchResults.length === 0 ? (
                  <p className="text-xs text-stone-500 py-3 text-center">
                    لا توجد مطابقة لكلمة "{searchQuery}" في صفحات الكتاب.
                  </p>
                ) : (
                  searchResults.map((res) => (
                    <button
                      key={res.pageNumber}
                      onClick={() => setCurrentPage(res.pageNumber)}
                      className={`w-full text-right p-2 rounded-lg text-xs transition-colors cursor-pointer border ${
                        currentPage === res.pageNumber
                          ? "bg-amber-100/60 border-amber-300 text-amber-900 font-bold"
                          : "bg-stone-50 hover:bg-stone-100 border-stone-100 text-stone-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">الصفحة {res.pageNumber}</span>
                        <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-stone-200 text-stone-600">
                          {res.matchesCount} تكرار
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 line-clamp-2 font-normal">
                        {res.snippet}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Page Picker Grid */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                انتقال سريع للصفحات
              </h3>
              <span className="text-xs text-stone-500">
                صفحة {currentPage} من {totalPages}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  id={`goto-page-${pNum}`}
                  onClick={() => setCurrentPage(pNum)}
                  className={`py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                    currentPage === pNum
                      ? "bg-amber-700 text-white border-amber-700 shadow-xs"
                      : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                  }`}
                >
                  {pNum}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content: Actual Page Text Display */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            {/* Page Header Bar */}
            <div className="p-3.5 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  id="prev-page-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-stone-700 cursor-pointer"
                  title="الصفحة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <span className="text-xs sm:text-sm font-bold text-stone-900 px-2">
                  الصفحة {currentPage} من {totalPages}
                </span>

                <button
                  id="next-page-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-stone-700 cursor-pointer"
                  title="الصفحة التالية"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Font Sizing and Actions */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5 text-xs">
                  <button
                    onClick={() => setFontSize("sm")}
                    className={`px-2 py-1 rounded font-medium cursor-pointer ${
                      fontSize === "sm" ? "bg-stone-200 text-stone-900 font-bold" : "text-stone-500"
                    }`}
                  >
                    A-
                  </button>
                  <button
                    onClick={() => setFontSize("base")}
                    className={`px-2 py-1 rounded font-medium cursor-pointer ${
                      fontSize === "base" ? "bg-stone-200 text-stone-900 font-bold" : "text-stone-500"
                    }`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setFontSize("lg")}
                    className={`px-2 py-1 rounded font-medium cursor-pointer ${
                      fontSize === "lg" ? "bg-stone-200 text-stone-900 font-bold" : "text-stone-500"
                    }`}
                  >
                    A+
                  </button>
                </div>

                <button
                  id="copy-page-btn"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  title="نسخ نص الصفحة"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                  <span>{copied ? "تم النسخ" : "نسخ"}</span>
                </button>

                <button
                  id="ask-about-page-btn"
                  onClick={() => onAskAboutPage(currentPage, currentExtractedPage.text)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>اسأل عن هذه الصفحة</span>
                </button>
              </div>
            </div>

            {/* Actual Extracted Text Body */}
            <div className="p-6 sm:p-8 min-h-[420px] bg-stone-50/30">
              {currentExtractedPage.text ? (
                <div
                  className={`leading-loose text-stone-800 font-normal whitespace-pre-wrap ${
                    fontSize === "sm" ? "text-sm" : fontSize === "lg" ? "text-lg" : "text-base"
                  }`}
                >
                  {highlightText(currentExtractedPage.text, searchQuery)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-stone-400">
                  <AlertCircle className="w-8 h-8 mb-2" />
                  <p className="text-sm font-medium">لم يتم استخراج نص مباشر لهذه الصفحة.</p>
                  <p className="text-xs text-stone-500 mt-1">
                    إذا كانت الصفحة صورة أو مسحاً ضوئياً، فإن محرك Gemini Multimodal يقرؤها تلقائياً عند إجراء الاستفسارات.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Page Footer */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
              <span>
                عدد كلمات هذه الصفحة:{" "}
                <strong className="text-stone-700 font-semibold">
                  {currentExtractedPage.text.trim().split(/\s+/).filter(Boolean).length} كلمة
                </strong>
              </span>
              <span>الملف: {book.fileName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
