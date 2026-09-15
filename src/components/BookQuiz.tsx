import React, { useState } from "react";
import { ActiveBook, QuizQuestion } from "../types/book.ts";
import { CheckSquare, Sparkles, CheckCircle2, XCircle, RefreshCw, Award, HelpCircle } from "lucide-react";

interface BookQuizProps {
  book: ActiveBook;
}

export const BookQuiz: React.FC<BookQuizProps> = ({ book }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIndex: number]: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleGenerateQuiz = async () => {
    setIsLoading(true);
    setSubmitted(false);
    setSelectedAnswers({});
    try {
      const response = await fetch("/api/query-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: book.fileBase64,
          fileType: book.fileType,
          textContent: book.fullText,
          mode: "subtle_quiz",
        }),
      });

      const data = await response.json();
      if (data.quiz && Array.isArray(data.quiz)) {
        setQuestions(data.quiz);
      }
    } catch (err) {
      console.error("Quiz error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  return (
    <div id="book-quiz-container" className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Intro Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <CheckSquare className="w-5 h-5 text-amber-700" />
            <h3 className="text-lg font-bold text-stone-900">
              اختبار استيعاب تفاصيل الكتاب
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl">
            يتم توليد 5 أسئلة استيعابية عميقة من صلب صفحات <strong>"{book.inspectedMetadata?.title || book.fileName}"</strong> لقياس مدى فهمك للحقائق والتفاصيل الدقيقة.
          </p>
        </div>

        <button
          id="start-quiz-btn"
          onClick={handleGenerateQuiz}
          disabled={isLoading}
          className="py-3 px-5 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>جاري استخراج الأسئلة...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{questions.length > 0 ? "توليد أسئلة جديدة" : "بدء الاختبار الآن"}</span>
            </>
          )}
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h4 className="text-sm font-bold text-stone-900">
            جاري قراءة فصول الكتاب وتصميم أسئلة تقيس الاستيعاب الحقيقي...
          </h4>
          <p className="text-xs text-stone-500">
            نركز على تفاصيل وأمثلة وأرقام ذكرها الكاتب تحديداً.
          </p>
        </div>
      )}

      {/* Questions list */}
      {!isLoading && questions.length > 0 && (
        <div className="space-y-6">
          {/* Score card when submitted */}
          {submitted && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 text-center space-y-2">
              <Award className="w-10 h-10 text-amber-700 mx-auto" />
              <h4 className="text-lg font-extrabold text-stone-900">
                نتيجتك في الاختبار: {calculateScore()} من {questions.length}
              </h4>
              <p className="text-xs text-stone-600">
                {calculateScore() === questions.length
                  ? "أحسنت صنعاً! قراءتك لتفاصيل وأفكار الكتاب دقيقة ومتميزة للغاية."
                  : calculateScore() >= questions.length / 2
                  ? "أداء جيد جداً! لديك إلمام ممتاز بجوهر الكتاب، يمكنك مراجعة الشروح أدناه لمزيد من الدقة."
                  : "ينصح بمراجعة فصول الكتاب في تبويب 'متصفح صفحات الكتاب' لتعزيز الإلمام بالتفاصيل."}
              </p>
            </div>
          )}

          {questions.map((q, qIdx) => {
            const isAnswered = selectedAnswers[qIdx] !== undefined;
            const isCorrect = selectedAnswers[qIdx] === q.correctIndex;

            return (
              <div
                key={qIdx}
                className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-stone-900 leading-snug">
                      {q.question}
                    </h4>
                  </div>

                  {submitted && (
                    <span className="shrink-0">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600" />
                      )}
                    </span>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-2 pr-8">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[qIdx] === optIdx;
                    let optStyle = "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200";

                    if (submitted) {
                      if (optIdx === q.correctIndex) {
                        optStyle = "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold";
                      } else if (isSelected && !isCorrect) {
                        optStyle = "bg-rose-50 border-rose-300 text-rose-900 line-through";
                      } else {
                        optStyle = "opacity-50 bg-stone-50 border-stone-200";
                      }
                    } else if (isSelected) {
                      optStyle = "bg-amber-100 border-amber-400 text-amber-950 font-bold";
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        disabled={submitted}
                        className={`w-full text-right p-3 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between ${optStyle}`}
                      >
                        <span>{opt}</span>
                        {submitted && optIdx === q.correctIndex && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded">
                            الإجابة الصحيحة
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation when submitted */}
                {submitted && q.explanation && (
                  <div className="mt-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 leading-relaxed">
                    <span className="font-bold text-amber-900 block mb-1">
                      التوثيق والشرح من الكتاب:
                    </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit action */}
          <div className="pt-4 flex justify-center">
            {!submitted ? (
              <button
                id="submit-quiz-btn"
                onClick={() => setSubmitted(true)}
                disabled={Object.keys(selectedAnswers).length === 0}
                className="py-3 px-8 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
              >
                اعتماد الإجابات ورؤية التقييم والشرح
              </button>
            ) : (
              <button
                onClick={handleGenerateQuiz}
                className="py-3 px-6 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إجراء اختبار جديد بأسئلة أخرى</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && questions.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3 shadow-xs">
          <HelpCircle className="w-12 h-12 text-stone-300 mx-auto" />
          <h4 className="text-base font-bold text-stone-800">
            جاهز لاختبار فهمك للكتاب؟
          </h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            اضغط على "بدء الاختبار الآن" ليقوم النظام بتحليل صفحات الكتاب وتجهيز 5 أسئلة استيعاب تقيس الإلمام بالتفاصيل الحقيقية.
          </p>
          <button
            onClick={handleGenerateQuiz}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>بدء الاختبار الآن</span>
          </button>
        </div>
      )}
    </div>
  );
};
