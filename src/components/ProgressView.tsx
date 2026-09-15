import React from 'react';
import { 
  Trophy, 
  Flame, 
  CheckCircle2, 
  HelpCircle, 
  Target, 
  Award, 
  Sparkles,
  BookOpen,
  Share2
} from 'lucide-react';
import { StudentProfile } from '../types';

interface ProgressViewProps {
  profile: StudentProfile;
  onExploreLessons: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ profile, onExploreLessons }) => {
  const accuracy = profile.totalQuizAnswers > 0 
    ? Math.round((profile.correctQuizAnswers / profile.totalQuizAnswers) * 100) 
    : 0;

  const badges = [
    {
      id: 'first_q',
      title: 'مستكشف المعرفة',
      desc: 'سألت أول سؤال للمعلم الذكي',
      icon: '🌱',
      unlocked: profile.totalQuestionsAsked >= 1,
    },
    {
      id: 'quiz_master',
      title: 'بطل الاختبارات',
      desc: 'أجبت على 5 أسئلة أو أكثر بشكل صحيح',
      icon: '🎯',
      unlocked: profile.correctQuizAnswers >= 5,
    },
    {
      id: 'streak_master',
      title: 'شعلة الاستمرار',
      desc: 'واصلت المذاكرة لأيام متتالية',
      icon: '🔥',
      unlocked: profile.streak >= 1,
    },
    {
      id: 'scholar',
      title: 'العالم الصغير',
      desc: 'جمعت أكثر من 100 نقطة تميز',
      icon: '🏆',
      unlocked: profile.points >= 100,
    },
    {
      id: 'curriculum_explorer',
      title: 'متقن المناهج',
      desc: 'أتممت 3 دروس دراسية بنجاح',
      icon: '📚',
      unlocked: profile.completedLessons.length >= 3,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <span>📊</span>
          <span>لوحة تقدم وإنجازات الطالب</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          تابع رحلتك التعليمية ونقاط تفوقك وأوسمتك في جميع المواد الدراسية.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {profile.points}
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
            مجموع النقاط 🏆
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs text-center">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-2">
            <Flame className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {profile.streak}
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
            أيام الاستمرارية 🔥
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <Target className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {accuracy}%
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
            دقة الإجابات 🎯
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs text-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {profile.completedLessons.length}
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
            دروس مكتملة ✔
          </div>
        </div>
      </div>

      {/* Motivational Card */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-right">
          <h3 className="text-lg font-black flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>استمر في شغف التعلم يا بطل!</span>
          </h3>
          <p className="text-xs text-indigo-100 leading-relaxed max-w-xl">
            كل سؤال تسأله للمعلم الذكي وكل مسألة تحلها تقربك خطوة إضافية من التفوق والدرجات النهائية.
          </p>
        </div>
        <button
          onClick={onExploreLessons}
          className="shrink-0 bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
        >
          استكشاف المزيد من الدروس 📚
        </button>
      </div>

      {/* Badges Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <span>أوسمة وجوائز التميز الأكاديمي</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {badges.map(badge => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                badge.unlocked
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                  : 'opacity-50 grayscale border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30'
              }`}
            >
              <span className="text-3xl shrink-0">{badge.icon}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {badge.title}
                  </h4>
                  {badge.unlocked && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {badge.desc}
                </p>
                <span className="text-[10px] font-bold mt-2 inline-block text-slate-400">
                  {badge.unlocked ? 'تم فتح الوسام ✔' : 'قيد الإنجاز 🔒'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
