import React, { useState } from 'react';
import { 
  BookOpen, 
  ArrowRight, 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  Play,
  GraduationCap,
  FolderArchive,
  Layers,
  UploadCloud
} from 'lucide-react';
import { CURRICULUM_DATA } from '../data/curriculum';
import { CurriculumStage, CurriculumSubject, LessonItem, UploadedBook } from '../types';

interface LibraryViewProps {
  completedLessons: string[];
  onAskLesson: (prompt: string, stage: string, subject: string) => void;
  onStartQuiz: (title: string, questions: any[]) => void;
  uploadedBooks?: UploadedBook[];
  activeBook?: UploadedBook | null;
  onSelectBook?: (book: UploadedBook) => void;
  onOpenUpload?: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  completedLessons,
  onAskLesson,
  onStartQuiz,
  uploadedBooks = [],
  activeBook = null,
  onSelectBook,
  onOpenUpload,
}) => {
  const [selectedStage, setSelectedStage] = useState<CurriculumStage | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<CurriculumSubject | null>(null);

  // Reset to root
  const handleBackToStages = () => {
    setSelectedStage(null);
    setSelectedSubject(null);
  };

  // Reset to subjects of current stage
  const handleBackToSubjects = () => {
    setSelectedSubject(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* View Title & Breadcrumbs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <button 
              onClick={handleBackToStages}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              المراحل التعليمية
            </button>
            {selectedStage && (
              <>
                <span>/</span>
                <button 
                  onClick={handleBackToSubjects}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {selectedStage.name}
                </button>
              </>
            )}
            {selectedSubject && (
              <>
                <span>/</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {selectedSubject.name}
                </span>
              </>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>📚</span>
            <span>
              {!selectedStage
                ? 'بنك المناهج والمقررات المدرسية'
                : !selectedSubject
                ? `مواد ${selectedStage.name}`
                : `دروس مادة ${selectedSubject.name}`}
            </span>
          </h2>
        </div>

        {(selectedStage || selectedSubject) && (
          <button
            onClick={selectedSubject ? handleBackToSubjects : handleBackToStages}
            className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>رجوع للخلف</span>
          </button>
        )}
      </div>

      {/* Uploaded Books Section (When at Root View) */}
      {!selectedStage && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                <FolderArchive className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  كتبي الدراسية المرفوعة (ZIP / PDF)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  الكتب والمقررات التي تم رفعها وقراءتها وفهرسة فصولها عبر الذكاء الاصطناعي
                </p>
              </div>
            </div>

            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <UploadCloud className="w-4 h-4" />
                <span>رفع كتاب جديد</span>
              </button>
            )}
          </div>

          {uploadedBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {uploadedBooks.map(book => {
                const isCurrent = activeBook?.id === book.id || activeBook?.name === book.name;
                return (
                  <div
                    key={book.id || book.name}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isCurrent
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                            مفعّل حالياً
                          </span>
                        )}
                      </div>

                      <h4 className="font-black text-sm text-slate-900 dark:text-white line-clamp-1">
                        {book.realTitle || book.name}
                      </h4>

                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5 text-[10px] font-bold">
                        {book.subject && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                            {book.subject}
                          </span>
                        )}
                        {book.grade && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300">
                            {book.grade}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {book.pageCount} صفحة
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                          {book.chapters.length} فصول
                        </span>
                      </div>

                      {book.summary && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                          {book.summary}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => onSelectBook && onSelectBook(book)}
                      className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
                        isCurrent
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isCurrent ? 'متابعة المذاكرة في الشات 🎙️' : 'تفعيل ومذاكرة هذا الكتاب 🎙️'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  لم تقم برفع كتب دراسية مخصصة بعد
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ارفع أي ملف PDF أو أرشيف ZIP وسيقوم المعلم الذكي بقراءة المنهج بالكامل وشرح أي درس صوتياً وكتابياً!
                </p>
              </div>
              {onOpenUpload && (
                <button
                  onClick={onOpenUpload}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-2xs transition-colors"
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>ارفع كتابك الآن 📚</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Level 1: Stages Selection */}
      {!selectedStage && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CURRICULUM_DATA.map(stage => {
            const totalLessons = stage.subjects.reduce((acc, s) => acc + s.lessons.length, 0);
            return (
              <div
                key={stage.id}
                onClick={() => setSelectedStage(stage)}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 overflow-hidden"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${stage.color} text-white text-2xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform`}>
                  {stage.icon}
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {stage.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">
                  {stage.nameEn}
                </p>

                <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500">{stage.subjects.length} مواد دراسية • {totalLessons} درساً</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                    استعراض المناهج ←
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Level 2: Subjects Selection */}
      {selectedStage && !selectedSubject && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {selectedStage.subjects.map(subject => (
            <div
              key={subject.id}
              onClick={() => setSelectedSubject(subject)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-400 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                  {subject.icon}
                </div>
                <h4 className="font-black text-base text-slate-900 dark:text-white mb-1">
                  {subject.name}
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                  {subject.nameEn}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span>{subject.lessons.length} دروس نموذجية</span>
                <span className="text-indigo-600 font-bold">دخول ←</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Level 3: Lessons List */}
      {selectedStage && selectedSubject && (
        <div className="space-y-4">
          {selectedSubject.lessons.map((lesson: LessonItem, idx: number) => {
            const isCompleted = completedLessons.includes(lesson.id);

            return (
              <div
                key={lesson.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Lesson Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {lesson.title}
                      </h4>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>مكتمل ومُتقن</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {lesson.summary}
                    </p>

                    {/* Key points tags */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {lesson.keyPoints.map((point, pIdx) => (
                        <span
                          key={pIdx}
                          className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md font-medium"
                        >
                          • {point}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() =>
                        onAskLesson(
                          `اشرح لي بالتفصيل وبأمثلة مبسطة درس: "${lesson.title}" في مادة ${selectedSubject.name} للمرحلة ${selectedStage.name}. واطرح عليّ سؤالاً للتأكد من فهمي.`,
                          selectedStage.name,
                          selectedSubject.name
                        )
                      }
                      className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span>اشرح لي الدرس 📖</span>
                    </button>

                    {lesson.sampleQuestions.length > 0 && (
                      <button
                        onClick={() =>
                          onStartQuiz(
                            `اختبار درس: ${lesson.title}`,
                            lesson.sampleQuestions
                          )
                        }
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>ابدأ الاختبار 📝</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
