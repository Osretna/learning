import React, { useState } from "react";
import { ActiveBook } from "../types/book.ts";
import { marked } from "marked";
import { Sparkles, Layers, BookOpen, ChevronLeft, Copy, Check, FileDown, Bookmark } from "lucide-react";

interface DeepStudyProps {
  book: ActiveBook;
  onAskQuestion: (q: string) => void;
}

export const DeepStudy: React.FC<DeepStudyProps> = ({ book, onAskQuestion }) => {
  const meta = book.inspectedMetadata;
  const [studyContent, setStudyContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChapterTitle, setActiveChapterTitle] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate full comprehensive book study
  const handleGenerateFullStudy = async () => {
    setIsLoading(true);
    setActiveChapterTitle(null);
    try {
      const response = await fetch("/api/query-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: book.fileBase64,
          fileType: book.fileType,
          textContent: book.fullText,
          mode: "full_comprehensive_study",
        }),
      });

      const data = await response.json();
      if (data.content) {
        setStudyContent(data.content);
      }
    } catch (err) {
      console.error("Error generating full study:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate deep dive for a specific chapter
  const handleChapterDeepDive = async (chapterTitle: string) => {
    setIsLoading(true);
    setActiveChapterTitle(chapterTitle);
    try {
      const response = await fetch("/api/query-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: book.fileBase64,
          fileType: book.fileType,
          textContent: book.fullText,
          mode: "chapter_deep_dive",
          chapterTitle,
        }),
      });

      const data = await response.json();
      if (data.content) {
        setStudyContent(data.content);
      }
    } catch (err) {
      console.error("Error in chapter deep dive:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!studyContent) return;
    navigator.clipboard.writeText(studyContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="deep-study-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chapters & Quick Concepts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Action to trigger comprehensive study */}
          <div className="bg-gradient-to-br from-amber-800 to-stone-900 text-white p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="text-base font-bold">الدراسة التحليلية الشاملة</h3>
            </div>
            <p className="text-xs text-amber-100/90 leading-relaxed mb-4">
              اطلب فحصاً تحليلياً شاملاً لكل فصول الكتاب مع استخراج الأطروحة المركزية، الحجج، النظريات، والدروس المستفادة.
            </p>
            <button
              id="generate-full-study-btn"
              onClick={handleGenerateFullStudy}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isLoading && !activeChapterTitle ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>جاري فحص الكتاب كاملاً...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>توليد دراسة شاملة للكتاب</span>
                </>
              )}
            </button>
          </div>

          {/* Table of Contents from Metadata */}
          {meta?.tableOfContents && meta.tableOfContents.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-amber-700" />
                  <span>فهرس فصول الكتاب</span>
                </h3>
                <span className="text-[11px] text-stone-500 font-medium">
                  {meta.tableOfContents.length} فصول
                </span>
              </div>
              <p className="text-xs text-stone-500 mb-3">
                اضغط على أي فصل لإجراء تفكيك تحليلي عميق لمحتواه وأدلته:
              </p>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {meta.tableOfContents.map((ch, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all ${
                      activeChapterTitle === ch.title
                        ? "bg-amber-50 border-amber-300 shadow-xs"
                        : "bg-stone-50/70 hover:bg-stone-100/80 border-stone-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-xs font-bold text-stone-900">
                        {ch.title || `الفصل ${ch.chapterNumber}`}
                      </h4>
                      <button
                        onClick={() => handleChapterDeepDive(ch.title || `الفصل ${ch.chapterNumber}`)}
                        disabled={isLoading}
                        className="shrink-0 text-[11px] font-semibold text-amber-800 hover:text-amber-900 bg-white border border-amber-200 px-2 py-0.5 rounded-md hover:bg-amber-50 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        تفصيل
                      </button>
                    </div>
                    {ch.brief && (
                      <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                        {ch.brief}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Concepts List */}
          {meta?.keyConcepts && meta.keyConcepts.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
                أبرز المفاهيم والمصطلحات المحورية
              </h3>
              <div className="flex flex-wrap gap-2">
                {meta.keyConcepts.map((concept, idx) => (
                  <button
                    key={idx}
                    onClick={() => onAskQuestion(`اشرح لي بالتفصيل كيف تناول الكتاب مفهوم: "${concept}" وما هي أدلة الكاتب حوله؟`)}
                    className="text-xs bg-stone-100 hover:bg-amber-100 text-stone-800 hover:text-amber-900 px-2.5 py-1.5 rounded-lg border border-stone-200 transition-colors text-right cursor-pointer"
                  >
                    {concept}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Executive Summary and Generated In-Depth Study */}
        <div className="lg:col-span-8 space-y-6">
          {/* Executive Summary Card */}
          {meta?.detailedExecutiveSummary && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-amber-700" />
                <h3 className="text-lg font-bold text-stone-900">
                  الملخص التنفيذي والفكرة العامة للكتاب
                </h3>
              </div>
              <div className="text-xs sm:text-sm text-stone-700 leading-relaxed space-y-3">
                {meta.detailedExecutiveSummary.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          )}

          {/* Generated Deep Study Output */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs min-h-[300px]">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100 mb-6">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-700" />
                <h3 className="text-base sm:text-lg font-bold text-stone-900">
                  {activeChapterTitle
                    ? `التفكيك التحليلي لـ: ${activeChapterTitle}`
                    : "التقرير التحليلي المفصل"}
                </h3>
              </div>

              {studyContent && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "تم النسخ" : "نسخ التقرير"}</span>
                  </button>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold text-stone-900">
                  {activeChapterTitle
                    ? `جاري فحص وتفكيك نصوص "${activeChapterTitle}"...`
                    : "جاري تحليل نصوص وصفحات الكتاب وإعداد الدراسة الموسعة..."}
                </p>
                <p className="text-xs text-stone-500 max-w-sm">
                  يتم استخراج الاقتباسات والأدلة الحقيقية من صلب صفحات الكتاب بدقة تامة.
                </p>
              </div>
            ) : studyContent ? (
              <div
                className="prose prose-stone max-w-none text-xs sm:text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: marked.parse(studyContent) as string }}
              />
            ) : (
              <div className="py-12 text-center text-stone-500 space-y-3">
                <Layers className="w-12 h-12 text-stone-300 mx-auto" />
                <h4 className="text-base font-bold text-stone-800">
                  لم تقم بتوليد التقرير التحليلي بعد
                </h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  اضغط على زر "توليد دراسة شاملة للكتاب" أعلاه للحصول على تشريح كامل للأطروحة، أو اختر أي فصل من الفهرس لفحصه بشكل مستقل.
                </p>
                <button
                  onClick={handleGenerateFullStudy}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>ابدأ التحليل الشامل الآن</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
