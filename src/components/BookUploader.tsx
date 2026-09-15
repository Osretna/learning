import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, Sparkles, BookOpen, AlertCircle, ArrowLeft } from "lucide-react";
import { extractTextFromPDF, fileToBase64 } from "../utils/pdfExtractor.ts";
import { ActiveBook } from "../types/book.ts";
import { SAMPLE_BOOKS, SampleBook } from "../data/sampleBooks.ts";

interface BookUploaderProps {
  onBookLoaded: (book: ActiveBook) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingStatus: string;
  setLoadingStatus: (status: string) => void;
}

export const BookUploader: React.FC<BookUploaderProps> = ({
  onBookLoaded,
  isLoading,
  setIsLoading,
  loadingStatus,
  setLoadingStatus,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractionProgress, setExtractionProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setIsLoading(true);
    setExtractionProgress(null);

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isText =
      file.type.startsWith("text/") ||
      file.name.toLowerCase().endsWith(".txt") ||
      file.name.toLowerCase().endsWith(".md");

    if (!isPdf && !isText) {
      setError("صيغة الملف غير مدعومة حالياً. يرجى رفع كتاب بصيغة PDF أو مستند نصي (TXT / Markdown).");
      setIsLoading(false);
      return;
    }

    try {
      let pages: { pageNumber: number; text: string }[] = [];
      let fullText = "";
      let totalWords = 0;
      let numPages = 1;
      let base64: string | undefined = undefined;

      if (isPdf) {
        setLoadingStatus("جاري استخراج صفحات الكتاب ونصوصه بدقة...");
        base64 = await fileToBase64(file);

        try {
          const pdfResult = await extractTextFromPDF(file, (current, total) => {
            setExtractionProgress({ current, total });
            setLoadingStatus(`جاري قراءة الصفحة ${current} من أصل ${total}...`);
          });

          pages = pdfResult.pages;
          fullText = pdfResult.fullText;
          totalWords = pdfResult.totalWords;
          numPages = pdfResult.numPages;
        } catch (pdfErr) {
          console.warn("Could not extract local text, will rely on Gemini multimodal PDF reader", pdfErr);
          pages = [{ pageNumber: 1, text: "سيتم قراءة وفحص صفحات الكتاب بصرياً عبر محرك المستندات الذكي." }];
          fullText = "كتاب بصيغة PDF تم رفعه للقراءة المتكاملة.";
          numPages = 1;
        }
      } else {
        setLoadingStatus("جاري قراءة نص الكتاب...");
        const text = await file.text();
        fullText = text;
        const words = text.trim().split(/\s+/).filter(Boolean);
        totalWords = words.length;

        // Split text into virtual pages (~400 words per page)
        const chunkSize = 2500;
        const chunks: string[] = [];
        for (let i = 0; i < text.length; i += chunkSize) {
          chunks.push(text.slice(i, i + chunkSize));
        }

        pages = chunks.map((chunk, idx) => ({
          pageNumber: idx + 1,
          text: chunk,
        }));
        numPages = pages.length;
      }

      setLoadingStatus("جاري فحص هيكلية الكتاب وفهرسه وأطروحته بالذكاء الاصطناعي...");

      // Call inspect-book API
      const response = await fetch("/api/inspect-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: base64,
          fileType: file.type || (isPdf ? "application/pdf" : "text/plain"),
          textContent: fullText,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "فشل الاتصال بخدمة فحص الكتاب.");
      }

      const inspectResult = await response.json();

      const activeBook: ActiveBook = {
        id: "book_" + Date.now(),
        fileName: file.name,
        fileType: file.type || (isPdf ? "application/pdf" : "text/plain"),
        fileSize: file.size,
        fileBase64: base64,
        pages,
        fullText,
        totalWords,
        numPages,
        inspectedMetadata: inspectResult.data,
      };

      onBookLoaded(activeBook);
    } catch (err: any) {
      console.error("File processing error:", err);
      setError(err.message || "تعذر قراءة الكتاب. يرجى التأكد من سلامة الملف والمحاولة مجدداً.");
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
      setExtractionProgress(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const loadSampleBook = async (sample: SampleBook) => {
    setError(null);
    setIsLoading(true);
    setLoadingStatus(`جاري فحص محتوى "${sample.title}" وتحليل تفاصيله...`);

    try {
      const response = await fetch("/api/inspect-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileType: "text/plain",
          textContent: sample.fullText,
          fileName: sample.title + ".txt",
        }),
      });

      const inspectResult = await response.json();

      const words = sample.fullText.trim().split(/\s+/).filter(Boolean).length;

      const activeBook: ActiveBook = {
        id: sample.id,
        fileName: sample.title + ".txt",
        fileType: "text/plain",
        fileSize: sample.fullText.length * 2,
        pages: sample.pages,
        fullText: sample.fullText,
        totalWords: words,
        numPages: sample.pages.length,
        inspectedMetadata: inspectResult.data,
      };

      onBookLoaded(activeBook);
    } catch (err: any) {
      console.error("Error loading sample book:", err);
      setError(err.message || "تعذر تحميل الكتاب النموذجي.");
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  };

  return (
    <div id="book-uploader-container" className="max-w-4xl mx-auto py-8 px-4">
      {/* Title & Introduction */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          محلل وقارئ المحتوى الحقيقي للكتب
        </span>
        <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight mb-3">
          ارفع أي كتاب واستخرج كل تفاصيله الحقيقية
        </h2>
        <p className="text-stone-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          نظام مخصص لقراءة صفحات الكتاب قراءة فعلية كاملة بدون أي اختلاق، مع القدرة على الإجابة عن أدق الأسئلة، واستخراج البيانات، واقتباس النصوص الحرفية.
        </p>
      </div>

      {/* Upload Box */}
      <div
        id="drag-drop-zone"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          dragActive
            ? "border-amber-600 bg-amber-50/70 scale-[1.01]"
            : "border-stone-300 hover:border-amber-600/70 bg-white hover:bg-stone-50/80 shadow-xs"
        } ${isLoading ? "pointer-events-none opacity-80" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center mb-4 shadow-xs">
            {isLoading ? (
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3 max-w-md w-full">
              <h3 className="text-base font-bold text-stone-900">{loadingStatus}</h3>
              {extractionProgress && (
                <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-600 h-2 transition-all duration-300 rounded-full"
                    style={{
                      width: `${Math.round((extractionProgress.current / extractionProgress.total) * 100)}%`,
                    }}
                  />
                </div>
              )}
              <p className="text-xs text-stone-500">
                نقوم بفحص كل صفحة وكلمة في الكتاب لضمان أعلى درجات الدقة الواقعية...
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold text-stone-900 mb-1">
                اسحب وأفلت ملف الكتاب هنا، أو اضغط للاختيار من جهازك
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 mb-4">
                يدعم ملفات الكتب بصيغة <strong>PDF</strong> أو <strong>TXT / Markdown</strong> حتى أحجام الكتب الكاملة
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors">
                <FileText className="w-4 h-4" />
                <span>اختر ملف الكتاب من جهازك</span>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div id="upload-error-alert" className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">تنبيه أثناء معالجة الكتاب</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white p-4 rounded-xl border border-stone-200">
          <div className="flex items-center gap-2 mb-1.5 text-stone-900 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>قراءة صفحات حقيقية</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            يتم فحص النص الداخلي لكل صفحة، ويمكنك تصفح صفحات الكتاب والبحث داخل نصوصها المباشرة.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200">
          <div className="flex items-center gap-2 mb-1.5 text-stone-900 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>توثيق دقيق باقتباسات</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            كل إجابة ترفق باقتباسات نصية حرفية من الكتاب مع الإشارة إلى الفصل وسياق الفكرة.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200">
          <div className="flex items-center gap-2 mb-1.5 text-stone-900 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>استخراج البيانات والأرقام</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            استخراج كل الإحصائيات، الدراسات، الشخصيات، والقواعد المذكورة في الكتاب بصورة منظمة.
          </p>
        </div>
      </div>

      {/* Sample Books for instant testing */}
      <div className="mt-10 pt-8 border-t border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-stone-900">أو جرّب فحص أحد الكتب النموذجية بضغطة واحدة:</h4>
            <p className="text-xs text-stone-500">كتب حقيقية بمحتواها وفصولها الكاملة لاختبار دقة الفحص مباشرة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SAMPLE_BOOKS.map((sample) => (
            <div
              key={sample.id}
              id={`sample-book-${sample.id}`}
              onClick={() => !isLoading && loadSampleBook(sample)}
              className="p-4 rounded-xl border border-stone-200 bg-white hover:border-amber-600/60 hover:bg-amber-50/30 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h5 className="text-sm font-bold text-stone-900 group-hover:text-amber-900">
                    {sample.title}
                  </h5>
                  <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full shrink-0">
                    {sample.category}
                  </span>
                </div>
                <p className="text-xs text-amber-800 font-medium mb-1">المؤلف: {sample.author}</p>
                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-amber-700 font-semibold">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {sample.pages.length} فصول كاملة
                </span>
                <span className="flex items-center gap-1 group-hover:-translate-x-1 transition-transform">
                  فحص هذا الكتاب
                  <ArrowLeft className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
