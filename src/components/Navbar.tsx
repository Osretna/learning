import React from 'react';
import { 
  GraduationCap, 
  Flame, 
  Trophy, 
  Moon, 
  Sun, 
  Download, 
  MessageSquare, 
  BookOpen, 
  BarChart3,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { StudentProfile } from '../types';

interface NavbarProps {
  profile: StudentProfile;
  activeTab: 'chat' | 'library' | 'progress';
  setActiveTab: (tab: 'chat' | 'library' | 'progress') => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  fontScale: number;
  setFontScale: (scale: number | ((prev: number) => number)) => void;
  onOpenDownload: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  fontScale,
  setFontScale,
  onOpenDownload,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div 
          onClick={() => setActiveTab('chat')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                مذاكرتي AI
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                مجاني 100%
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              معلمك الذكي لجميع المناهج واللغات
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Center) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>المعلم الذكي</span>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'library'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>بنك المناهج</span>
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'progress'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>إنجازاتي</span>
          </button>
        </nav>

        {/* Student Stats & Controls (Right) */}
        <div className="flex items-center gap-2">
          {/* Trophy Points Badge */}
          <div 
            title="مجموع نقاطك التعليمية" 
            className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1.5 rounded-xl text-xs font-black shadow-2xs"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>{profile.points}</span>
          </div>

          {/* Streak Badge */}
          <div 
            title="أيام الدراسة المتتالية" 
            className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 px-2.5 py-1.5 rounded-xl text-xs font-black shadow-2xs"
          >
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <span>{profile.streak} د</span>
          </div>

          {/* Font scale adjustment */}
          <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setFontScale(prev => Math.max(0.85, prev - 0.1))}
              title="تصغير الخط"
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFontScale(prev => Math.min(1.3, prev + 0.1))}
              title="تكبير الخط"
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? 'الوضع المضيء' : 'الوضع الليلي'}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Download App File Button */}
          <button
            onClick={onOpenDownload}
            title="تحميل التطبيق كملف مستقل بدون نت"
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 hover:scale-102 active:scale-98 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">تحميل الملف 📥</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar (Bottom of Header) */}
      <div className="flex md:hidden border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'chat'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>المعلم الذكي</span>
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'library'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>المناهج</span>
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'progress'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>إنجازاتي</span>
        </button>
      </div>
    </header>
  );
};
