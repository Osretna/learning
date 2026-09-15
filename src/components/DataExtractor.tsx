import React, { useState } from "react";
import { ActiveBook } from "../types/book.ts";
import { marked } from "marked";
import { Database, Sparkles, Copy, Check, Quote, BarChart3, Hash, Users, ShieldCheck } from "lucide-react";

interface DataExtractorProps {
  book: ActiveBook;
}

export const DataExtractor: React.FC<DataExtractorProps> = ({ book }) => {
  const [extractedData, setExtractedData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExtract = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/query-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: book.fileBase64,
          fileType: book.fileType,
          textContent: book.fullText,
          mode: "extract_data_and_quotes",
        }),
      });

      const data = await response.json();
      if (data.content) {
        setExtractedData(data.content);
      }
    } catch (err) {
      console.error("Error extracting data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!extractedData) return;
    navigator.clipboard.writeText(extractedData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="data-extractor-container" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Intro Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-700" />
            <h3 className="text-lg font-bold text-stone-900">
              بنك البيانات الحقيقية والأرقام والاقتباسات
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
            استخراج دقيق ومفلتر لجميع الأرقام، النسب المئوية، التجارب العلمية، القوانين العملية، والشخصيات المذكورة في صلب صفحات كتاب <strong>"{book.inspectedMetadata?.title || book.fileName}"</strong>.
          </p>
        </div>

        <button
          id="extract-data-btn"
          onClick={handleExtract}
          disabled={isLoading}
          className="py-3 px-5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>جاري استخراج البيانات...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{extractedData ? "إعادة استخراج وتحديث البيانات" : "استخراج بنك البيانات الآن"}</span>
            </>
          )}
        </button>
      </div>

      {/* Highlights Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
          <Quote className="w-5 h-5 text-amber-700 mb-2" />
          <h4 className="text-xs font-bold text-stone-900 mb-1">اقتباسات حرفية</h4>
          <p className="text-[11px] text-stone-500">نصوص أصلية بالنص والتشكيل والصفحة</p>
        </div>

        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
          <Hash className="w-5 h-5 text-amber-700 mb-2" />
          <h4 className="text-xs font-bold text-stone-900 mb-1">أرقام وإحصائيات</h4>
          <p className="text-[11px] text-stone-500">البيانات الكمية والنسب المذكورة</p>
        </div>

        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
          <Users className="w-5 h-5 text-amber-700 mb-2" />
          <h4 className="text-xs font-bold text-stone-900 mb-1">الشخصيات والمصادر</h4>
          <p className="text-[11px] text-stone-500">الأعلام والدراسات التي استند إليها الكاتب</p>
        </div>

        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
          <ShieldCheck className="w-5 h-5 text-amber-700 mb-2" />
          <h4 className="text-xs font-bold text-stone-900 mb-1">القوانين والقواعد</h4>
          <p className="text-[11px] text-stone-500">النماذج والمبادئ السلوكية أو النظرية</p>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 sm:p-8 min-h-[350px]">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-stone-900">
              جاري فحص جميع صفحات الكتاب لاستخلاص الأرقام والجداول والاقتباسات...
            </p>
            <p className="text-xs text-stone-500">
              نضمن استخراج البيانات الحقيقية فقط دون إدخال أي أرقام تقريبية من خارج الكتاب.
            </p>
          </div>
        ) : extractedData ? (
          <div>
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                تم استخراج البيانات وتوثيقها بنجاح
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "تم النسخ" : "نسخ البيانات"}</span>
              </button>
            </div>

            <div
              className="prose prose-stone max-w-none text-xs sm:text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: marked.parse(extractedData) as string }}
            />
          </div>
        ) : (
          <div className="py-16 text-center text-stone-400 space-y-3">
            <BarChart3 className="w-12 h-12 mx-auto text-stone-300" />
            <h4 className="text-base font-bold text-stone-800">
              لم يتم استخراج بنك البيانات بعد
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              اضغط على زر "استخراج بنك البيانات الآن" ليقوم المحرك الذكي بمسح صفحات الكتاب واستخراج الأرقام الحقيقية والاقتباسات الموثقة.
            </p>
            <button
              onClick={handleExtract}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>بدء الاستخراج الفعلي للبيانات</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
