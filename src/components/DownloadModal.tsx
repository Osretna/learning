import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Check, 
  FileCode, 
  ShieldCheck, 
  Sparkles, 
  Smartphone, 
  WifiOff, 
  KeyRound,
  Copy
} from 'lucide-react';
import { generateStandaloneHtml } from '../data/standaloneHtml';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const htmlContent = generateStandaloneHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'مذاكرتي_AI_المعلم_الذكي.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleCopy = () => {
    const htmlContent = generateStandaloneHtml();
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                تحميل التطبيق كملف مستقل (HTML)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                يعمل مجاناً 100% بدون إنترنت وبدون أي مفتاح أو اشتراك
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2.5">
              <WifiOff className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">يعمل بدون نت</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">محرك المعرفة والمناهج مدمجة بالكامل بالملف</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2.5">
              <KeyRound className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">بدون API Key</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">لا يحتاج أي مفتاح أو حساب، مجاني للأبد</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2.5">
              <Smartphone className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">للهاتف والكمبيوتر</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">يفتح بضغطة واحدة في أي متصفح</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">ملف واحد مستقل</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">كل الأكواد والتصميم والمناهج بملف واحد</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
            <span className="font-black flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-4 h-4" />
              كيف تشغّل الملف بعد تحميله؟
            </span>
            <p className="leading-relaxed">
              1. اضغط على زر التحميل الأخضر بالأسفل.<br />
              2. سيتم تنزيل ملف باسم <b>مذاكرتي_AI_المعلم_الذكي.html</b>.<br />
              3. افتح الملف مباشرة على جهازك (أو أرسله للواتساب / تيليجرام وافتحه بالهاتف) واستمتع بالمذاكرة التفاعلية بالصوت والكتابة دون الحاجة لنت!
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98"
            >
              {downloaded ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>تم تنزيل الملف بنجاح! 🎉</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>تنزيل ملف التطبيق (HTML) 📥</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopy}
              className="py-3.5 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span className="text-xs">{copied ? 'تم النسخ' : 'نسخ الكود'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
