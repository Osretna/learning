import React, { useState } from "react";
import { ActiveBook } from "../types/book.ts";
import { marked } from "marked";
import { Search, CheckCircle2, XCircle, HelpCircle, Sparkles, Copy, Check, ShieldAlert } from "lucide-react";

interface ClaimVerifierProps {
  book: ActiveBook;
}

export const ClaimVerifier: React.FC<ClaimVerifierProps> = ({ book }) => {
  const [claim, setClaim] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const sampleClaims = [
    "هل ذكر الكاتب أي قواعد أو خطوات محددة للتنفيذ العملي؟",
    "هل يؤيد الكاتب أن الدافع الذاتي وحده كافٍ لتحقيق النتائج دون بيئة داعمة؟",
    "ما هو الموقف الصريح للمؤلف في مسألة الاستبداد أو فرض الرأي؟",
  ];

  const handleVerify = async (queryClaim: string) => {
    const trimmed = queryClaim.trim();
    if (!trimmed || isLoading) return;

    setClaim(trimmed);
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/query-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: book.fileBase64,
          fileType: book.fileType,
          textContent: book.fullText,
          mode: "verify_claim",
          question: trimmed,
        }),
      });

      const data = await response.json();
      if (data.content) {
        setResult(data.content);
      }
    } catch (err) {
      console.error("Verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="claim-verifier-container" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Intro Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs mb-8">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5 text-amber-700" />
          <h3 className="text-lg font-bold text-stone-900">
            متحقق صحة المقولات والمعلومات في الكتاب
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-6">
          اكتب أي مقولة، فكرة، أو ادعاء متداول لتتحقق مما إذا كان الكاتب قد ذكرها فعلاً في صفحات <strong>"{book.inspectedMetadata?.title || book.fileName}"</strong>، وما هو موقفه الحقيقي منها مدعوماً بالنص الصريح.
        </p>

        {/* Input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify(claim);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            id="claim-input"
            type="text"
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            disabled={isLoading}
            placeholder="مثال: هل ذكر المؤلف أن قوة الإرادة وحدها تكفي لتغيير السلوك؟"
            className="flex-1 px-4 py-3 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 bg-stone-50 text-stone-900"
          />
          <button
            id="verify-claim-btn"
            type="submit"
            disabled={!claim.trim() || isLoading}
            className="px-6 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري التدقيق في الصفحات...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>تحقق من صحة الادعاء</span>
              </>
            )}
          </button>
        </form>

        {/* Sample claims */}
        <div className="mt-4 pt-4 border-t border-stone-100">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
            أو اختر أحد الادعاءات للتجربة:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleClaims.map((sc, idx) => (
              <button
                key={idx}
                onClick={() => handleVerify(sc)}
                disabled={isLoading}
                className="text-xs bg-stone-100 hover:bg-amber-50 hover:border-amber-200 text-stone-700 hover:text-amber-900 px-3 py-1.5 rounded-lg border border-stone-200 transition-colors cursor-pointer text-right"
              >
                {sc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result Card */}
      {(isLoading || result) && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>نتيجة فحص الادعاء في صفحات الكتاب</span>
            </h4>

            {result && (
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "تم النسخ" : "نسخ النتيجة"}</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs sm:text-sm font-semibold text-stone-800">
                جاري البحث في سياق جميع الفصول للتحقق من المقولة بدقة...
              </p>
            </div>
          ) : result ? (
            <div
              className="prose prose-stone max-w-none text-xs sm:text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: marked.parse(result) as string }}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};
