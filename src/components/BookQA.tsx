import React, { useState, useRef, useEffect } from "react";
import { ActiveBook, QAMessage } from "../types/book.ts";
import { marked } from "marked";
import { Send, Sparkles, MessageSquare, Trash2, Copy, Check, Quote, BookOpen, ChevronLeft } from "lucide-react";

interface BookQAProps {
  book: ActiveBook;
  initialQuestion?: string | null;
  onClearInitialQuestion?: () => void;
}

export const BookQA: React.FC<BookQAProps> = ({ book, initialQuestion, onClearInitialQuestion }) => {
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = book.inspectedMetadata?.suggestedDeepQuestions || [
    "ما هي الأطروحة المركزية التي يدور حولها هذا الكتاب؟",
    "ما هي أهم ثلاث أفكار عملية يقدمها المؤلف؟",
    "اذكر لي اقتباسين نصيين جوهريين من صلب الكتاب مع شرحهما.",
    "ما هي الحجج والأدلة التي استند إليها الكاتب في فصوله الأولى؟",
  ];

  useEffect(() => {
    if (initialQuestion && initialQuestion.trim()) {
      handleAskQuestion(initialQuestion);
      if (onClearInitialQuestion) onClearInitialQuestion();
    }
  }, [initialQuestion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleAskQuestion = async (qText: string) => {
    const trimmed = qText.trim();
    if (!trimmed || isLoading) return;

    const userMessage: QAMessage = {
      id: "msg_" + Date.now(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/query-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: book.fileBase64,
          fileType: book.fileType,
          textContent: book.fullText,
          mode: "ask_question",
          question: trimmed,
        }),
      });

      if (!response.ok) {
        throw new Error("تعذر جلب الإجابة من نموذج فحص الكتاب.");
      }

      const data = await response.json();

      const assistantMessage: QAMessage = {
        id: "msg_" + (Date.now() + 1),
        role: "assistant",
        content: data.content || "لم يتم العثور على محتوى إضافي.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("QA error:", err);
      const errorMessage: QAMessage = {
        id: "msg_err_" + Date.now(),
        role: "assistant",
        content: `حدث خطأ أثناء فحص صفحات الكتاب: ${err.message || "يرجى المحاولة مجدداً."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm("هل تريد مسح سجل الأسئلة والإجابات الحالية؟")) {
      setMessages([]);
    }
  };

  return (
    <div id="book-qa-container" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Informative Banner */}
      <div className="mb-6 p-4 rounded-xl bg-white border border-stone-200 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
            <Quote className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-stone-900">
              استجواب دقيق موثق بالاقتباسات والصفحات
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500">
              كل إجابة تعتمد 100% على صفحات <strong>"{book.inspectedMetadata?.title || book.fileName}"</strong> وتورد نصوص الكاتب الحرفية.
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-stone-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            title="مسح المحادثة"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggested Questions (Pills) */}
      {messages.length === 0 && (
        <div className="mb-8 bg-stone-50/70 border border-stone-200 p-5 rounded-2xl">
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>أسئلة مقترحة مستنبطة خصيصاً من فصول هذا الكتاب:</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleAskQuestion(q)}
                disabled={isLoading}
                className="p-3 rounded-xl bg-white hover:bg-amber-50/50 border border-stone-200 hover:border-amber-300 text-xs font-medium text-stone-800 text-right transition-all flex items-start justify-between gap-2 group cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <span>{q}</span>
                <ChevronLeft className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700 shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Feed */}
      <div className="space-y-6 mb-8 min-h-[260px]">
        {messages.length === 0 ? (
          <div className="py-12 text-center text-stone-400 space-y-2">
            <MessageSquare className="w-10 h-10 mx-auto text-stone-300" />
            <p className="text-sm font-semibold text-stone-700">لم تطرح أي سؤال بعد حول هذا الكتاب</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              اكتب أي استفسار في مربع النص أدناه، أو اختر أحد الأسئلة المقترحة أعلاه.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === "user" ? "items-start" : "items-stretch"}`}
            >
              <div
                className={`rounded-2xl p-5 sm:p-6 transition-all ${
                  msg.role === "user"
                    ? "bg-stone-900 text-white max-w-2xl text-xs sm:text-sm font-medium self-end rounded-tl-xs shadow-xs"
                    : "bg-white border border-stone-200 text-stone-800 shadow-xs rounded-tr-xs"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100 text-xs text-stone-500">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <BookOpen className="w-4 h-4 text-amber-700" />
                      <span>إجابة موثقة من صفحات الكتاب</span>
                    </div>
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-800 bg-stone-50 hover:bg-stone-100 px-2 py-1 rounded border border-stone-200 cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {msg.role === "user" ? (
                  <p className="leading-relaxed">{msg.content}</p>
                ) : (
                  <div
                    className="prose prose-stone max-w-none text-xs sm:text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }}
                  />
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex items-center gap-4">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-stone-900">
                جاري فحص وتدقيق صفحات الكتاب للعثور على الإجابة الحقيقية والاقتباسات...
              </p>
              <p className="text-[11px] text-stone-500">
                يتم استبعاد أي معلومات خارج صفحات الكتاب المرفق.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Question Input Box */}
      <div className="sticky bottom-4 z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion(inputQuestion);
          }}
          className="bg-white p-2 rounded-2xl border border-stone-300 shadow-lg flex items-center gap-2"
        >
          <input
            id="book-question-input"
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isLoading}
            placeholder="اسأل عن أي تفصيلة أو مفهوم أو حجة أو رقم في الكتاب..."
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-transparent text-stone-900 placeholder:text-stone-400 focus:outline-none"
          />
          <button
            id="send-question-btn"
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-40 disabled:hover:bg-amber-700 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
          >
            <Send className="w-4 h-4 rtl:rotate-180" />
            <span className="hidden sm:inline">إرسال السؤال</span>
          </button>
        </form>
      </div>
    </div>
  );
};
