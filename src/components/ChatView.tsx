import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  HelpCircle, 
  Copy, 
  Check, 
  Bot, 
  User, 
  Lightbulb, 
  Calculator, 
  Baby, 
  FolderArchive, 
  BookOpen, 
  Layers, 
  Play, 
  Pause, 
  X, 
  ChevronDown, 
  UploadCloud, 
  Loader2, 
  Headphones, 
  FileText,
  Eye,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Message, ExplanationMode, UploadedBook } from '../types';
import { speakText, stopSpeaking, sound } from '../utils/audio';
import { parseBookFileLocally } from '../utils/clientBookParser';

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (
    text: string, 
    mode: ExplanationMode, 
    grade: string, 
    subject: string, 
    bookToUse?: UploadedBook | null, 
    wantsAudio?: boolean
  ) => void;
  onRequestQuiz: (topic: string) => void;
  onSimplify: (originalText: string) => void;
  uploadedBooks: UploadedBook[];
  setUploadedBooks: React.Dispatch<React.SetStateAction<UploadedBook[]>>;
  activeBook: UploadedBook | null;
  setActiveBook: React.Dispatch<React.SetStateAction<UploadedBook | null>>;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onRequestQuiz,
  onSimplify,
  uploadedBooks,
  setUploadedBooks,
  activeBook,
  setActiveBook,
}) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ExplanationMode>('detailed');
  const [selectedGrade, setSelectedGrade] = useState('جميع المراحل');
  const [selectedSubject, setSelectedSubject] = useState('عام');
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Book uploading & Audio narration state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadInfo, setUploadInfo] = useState<{
    fileName: string;
    fileSizeStr: string;
    stage: 'reading' | 'analyzing' | 'done' | 'error';
    statusText: string;
    progressPercent: number;
    errorText?: string;
    book?: UploadedBook;
  } | null>(null);
  const [autoVoice, setAutoVoice] = useState(false);
  const [showChaptersDrawer, setShowChaptersDrawer] = useState(false);
  const [showBookOverviewModal, setShowBookOverviewModal] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [isDragOver, setIsDragOver] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isUploading, uploadInfo]);

  // Handle Speech-To-Text (Microphone)
  const toggleSpeechRecognition = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'ar-SA';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  // Process uploaded book file (ZIP, PDF, Word, etc.) using Chunked Upload (bypasses 413 limits)
  const handleProcessFile = async (file: File) => {
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isZip = lowerName.endsWith('.zip');
    const isPdf = lowerName.endsWith('.pdf');
    const isDocx = lowerName.endsWith('.docx');
    const isPptx = lowerName.endsWith('.pptx');
    const isTxt = lowerName.endsWith('.txt') || lowerName.endsWith('.md');
    const isImage = Boolean(lowerName.match(/\.(png|jpe?g|webp)$/i));
    const isSupported = isZip || isPdf || isDocx || isPptx || isTxt || isImage;

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const fileSizeStr = `${fileSizeMB} ميجابايت`;

    // Validate format before starting
    if (!isSupported) {
      sound.playIncorrect();
      setUploadInfo({
        fileName: file.name,
        fileSizeStr,
        stage: 'error',
        statusText: 'صيغة الملف غير مدعومة',
        progressPercent: 0,
        errorText: 'يدعم التطبيق ملفات الكتب والمناهج بصيغة PDF مباشرة، أو ملفات مضغوطة ZIP، أو مستندات Word/PowerPoint/نصوص وصور.',
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus(`جارٍ تجهيز ملف "${file.name}"...`);
    setUploadInfo({
      fileName: file.name,
      fileSizeStr,
      stage: 'reading',
      statusText: `جارٍ تجهيز وقراءة أجزاء الكتاب "${file.name}" (${fileSizeStr})...`,
      progressPercent: 5,
    });

    try {
      // Chunk size: 2.5 MB (Base64 payload is ~3.3 MB, optimal speed and reliability)
      const CHUNK_SIZE = 2.5 * 1024 * 1024;
      const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
      const uploadId = 'up_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

      let finalResult: any = null;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const chunkBlob = file.slice(start, end);

        // Convert slice to Base64
        const chunkBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = (reader.result as string) || '';
            resolve(res.split(',')[1] || '');
          };
          reader.onerror = reject;
          reader.readAsDataURL(chunkBlob);
        });

        const isLastChunk = chunkIndex === totalChunks - 1;

        // Visual progress update
        const uploadProgress = Math.min(85, Math.round(((chunkIndex + 1) / totalChunks) * 85));
        setUploadInfo(prev => prev ? {
          ...prev,
          progressPercent: uploadProgress,
          statusText: isLastChunk
            ? `المعلم الذكي يربط صفحات وفصول الكتاب ويستخرج المفاهيم والقوانين... 🧠`
            : `جارٍ رفع وتجهيز أجزاء الكتاب (${chunkIndex + 1} من ${totalChunks})...`,
          stage: isLastChunk ? 'analyzing' : 'reading',
        } : null);

        if (isLastChunk) {
          setUploadStatus(`المعلم الذكي يحلل صفحات وفصول الكتاب ويستخرج القوانين والمفاهيم... 🧠`);
        }

        // Send chunk to server with retry support
        let res: Response | null = null;
        let attempt = 0;
        let lastErrorMsg = '';

        while (attempt < 3 && !res) {
          try {
            attempt++;
            res = await fetch('/api/books/upload-chunk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                uploadId,
                chunkIndex,
                totalChunks,
                fileName: file.name,
                fileType: file.type || (isZip ? 'application/zip' : 'application/pdf'),
                totalSize: file.size,
                chunkBase64,
              }),
            });

            if (!res.ok) {
              if (res.status === 404) {
                // Backend endpoint is not accessible (e.g. static host or server restart)
                // Break to trigger in-browser local book parser immediately
                res = null;
                break;
              }
              const contentType = res.headers.get('content-type') || '';
              let errMsg = '';
              if (contentType.includes('application/json')) {
                const errBody = await res.json().catch(() => ({}));
                errMsg = errBody?.error || '';
              }
              lastErrorMsg = errMsg || `تعذر استقبال الجزء ${chunkIndex + 1} (رمز الخطأ: ${res.status})`;
              res = null;
              if (attempt < 3) {
                await new Promise(r => setTimeout(r, 600));
              }
            }
          } catch (netErr: any) {
            lastErrorMsg = netErr.message || 'انقطع الاتصال مؤقتاً أثناء رفع الجزء';
            res = null;
            if (attempt < 3) {
              await new Promise(r => setTimeout(r, 600));
            }
          }
        }

        if (!res) {
          // If server returned 404 or failed, parse book directly in-browser using JSZip / PDF parser
          try {
            setUploadInfo(prev => prev ? {
              ...prev,
              stage: 'analyzing',
              progressPercent: 88,
              statusText: 'المعلم الذكي يقوم باستخراج وفهرسة ملفات وفصول الكتاب محلياً في المتصفح... 🧠',
            } : null);

            const localResult = await parseBookFileLocally(file);
            if (localResult.success && localResult.books.length > 0) {
              finalResult = localResult;
              break;
            }
          } catch (localErr) {
            console.warn('Direct local parsing attempt failed:', localErr);
          }

          // If the last chunk failed due to network or timeout, check if the server already assembled the book
          if (isLastChunk) {
            try {
              const checkRes = await fetch('/api/books');
              if (checkRes.ok) {
                const checkData = await checkRes.json();
                if (checkData && Array.isArray(checkData.books) && checkData.books.length > 0) {
                  const matched = checkData.books.find((b: any) =>
                    b.originalFileName === file.name ||
                    b.name.includes(file.name.replace(/\.[^.]+$/, '')) ||
                    file.name.includes(b.name)
                  ) || checkData.books[0];
                  finalResult = { success: true, books: [matched] };
                  break;
                }
              }
            } catch (ignore) {}
          }
          throw new Error(lastErrorMsg || `تعذر إتمام رفع الجزء ${chunkIndex + 1}`);
        }

        // Safe JSON parsing without crashing on HTML
        let data: any = null;
        try {
          const rawText = await res.text();
          data = JSON.parse(rawText);
        } catch (jsonErr) {
          // If server response was not JSON on last chunk, check /api/books for recovery
          if (isLastChunk) {
            try {
              const checkRes = await fetch('/api/books');
              if (checkRes.ok) {
                const checkData = await checkRes.json();
                if (checkData && Array.isArray(checkData.books) && checkData.books.length > 0) {
                  const matched = checkData.books.find((b: any) =>
                    b.originalFileName === file.name ||
                    b.name.includes(file.name.replace(/\.[^.]+$/, '')) ||
                    file.name.includes(b.name)
                  ) || checkData.books[0];
                  data = { success: true, books: [matched] };
                }
              }
            } catch (ignore) {}
          }
          if (!data) {
            throw new Error('استجاب الخادم بتنسيق غير متوقع، يرجى المحاولة مرة أخرى.');
          }
        }

        if (isLastChunk) {
          finalResult = data;
        }
      }

      if (finalResult && finalResult.books && finalResult.books.length > 0) {
        sound.playCorrect();
        const newBooks = finalResult.books;
        setUploadedBooks(prev => {
          const filtered = prev.filter(b => !newBooks.some((nb: any) => nb.name === b.name));
          return [...newBooks, ...filtered];
        });

        const primaryBook: UploadedBook = newBooks[0];
        setActiveBook(primaryBook);

        setUploadInfo({
          fileName: file.name,
          fileSizeStr,
          stage: 'done',
          statusText: `تم قراءة وفهرسة كتاب "${primaryBook.realTitle || primaryBook.name}" بنجاح! (${primaryBook.pageCount} صفحة، ${primaryBook.chapters.length} فصول مكتشفة)`,
          progressPercent: 100,
          book: primaryBook,
        });

        // Automatically ask the AI to introduce the book with voice & writing
        const bookDisplayName = primaryBook.realTitle || primaryBook.name;
        onSendMessage(
          `لقد قمت برفع كتاب "${bookDisplayName}". يرجى تأكيد استيعابك الكامل لمحتوى صفحات وفصول الكتاب، وإعطائي نظرة عامة شاملة، وفهرس الدروس وأهم المفاهيم والقوانين الموجودة فيه، واشرح لي كيفية البدء في مذاكرته بالصوت والكتابة.`,
          mode,
          selectedGrade,
          selectedSubject,
          primaryBook,
          true
        );
      } else {
        throw new Error('لم يتم العثور على فصول أو نصوص صالحة داخل الكتاب المرفوع.');
      }
    } catch (error: any) {
      // Last-mile recovery: verify if the server registered the book despite any network interruption
      let recovered = false;
      try {
        const checkRes = await fetch('/api/books');
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData && Array.isArray(checkData.books) && checkData.books.length > 0) {
            const matched = checkData.books.find((b: any) =>
              b.originalFileName === file.name ||
              b.name.includes(file.name.replace(/\.[^.]+$/, '')) ||
              file.name.includes(b.name)
            ) || checkData.books[0];

            if (matched) {
              recovered = true;
              sound.playCorrect();
              setUploadedBooks(prev => {
                const filtered = prev.filter(b => b.id !== matched.id);
                return [matched, ...filtered];
              });
              setActiveBook(matched);
              setUploadInfo({
                fileName: file.name,
                fileSizeStr,
                stage: 'done',
                statusText: `تم قراءة وفهرسة كتاب "${matched.realTitle || matched.name}" بنجاح! (${matched.pageCount} صفحة)`,
                progressPercent: 100,
                book: matched,
              });
            }
          }
        }
      } catch (recoveryErr) {
        console.warn('Last-mile book recovery check error:', recoveryErr);
      }

      if (!recovered) {
        // Fallback: Direct in-browser local parsing
        try {
          const localParsed = await parseBookFileLocally(file);
          if (localParsed.success && localParsed.books.length > 0) {
            recovered = true;
            sound.playCorrect();
            const newBooks = localParsed.books;
            setUploadedBooks(prev => {
              const filtered = prev.filter(b => !newBooks.some(nb => nb.name === b.name));
              return [...newBooks, ...filtered];
            });
            const primary = newBooks[0];
            setActiveBook(primary);
            setUploadInfo({
              fileName: file.name,
              fileSizeStr,
              stage: 'done',
              statusText: `تم قراءة وفهرسة كتاب "${primary.realTitle || primary.name}" بنجاح! (${primary.pageCount} صفحة، ${primary.chapters.length} فصول)`,
              progressPercent: 100,
              book: primary,
            });

            onSendMessage(
              `لقد قمت برفع كتاب "${primary.realTitle || primary.name}". يرجى تأكيد استيعابك الكامل لمحتوى صفحات وفصول الكتاب، وإعطائي نظرة عامة شاملة، وفهرس الدروس وأهم المفاهيم والقوانين الموجودة فيه، واشرح لي كيفية البدء في مذاكرته بالصوت والكتابة.`,
              mode,
              selectedGrade,
              selectedSubject,
              primary,
              true
            );
          }
        } catch (localCatchErr) {
          console.warn('Local parsing in catch block error:', localCatchErr);
        }
      }

      if (!recovered) {
        sound.playIncorrect();
        setUploadInfo({
          fileName: file.name,
          fileSizeStr,
          stage: 'error',
          statusText: 'تعذر إتمام قراءة الكتاب',
          progressPercent: 0,
          errorText: error.message || 'حدث خطأ أثناء معالجة ملف الكتاب',
        });
      }
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    onSendMessage(text, mode, selectedGrade, selectedSubject, activeBook, autoVoice);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSpeak = (id: string, text: string) => {
    if (speakingMsgId === id) {
      stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      stopSpeaking();
      setSpeakingMsgId(id);
      speakText(text, () => {
        setSpeakingMsgId(null);
      }, speechSpeed);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick suggestion prompts
  const suggestions = [
    'اشرح لي جدول الضرب وحيله الذكية 🔢',
    'ما هي قوانين نيوتن للحركة في الفيزياء؟ ⚡',
    'Explain the Present Simple tense in English 🇬🇧',
    'حل معادلة: 3x + 9 = 24 بالتفصيل 📐',
    'كيف تحدث عملية البناء الضوئي في النبات؟ 🧪',
    'ما الفرق بين الاسم والفعل والحرف في النحو؟ 📖',
  ];

  // Helper to format text with markdown-like syntax
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 leading-relaxed">
        {lines.map((line, lIdx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={lIdx} className="text-base font-black text-indigo-700 dark:text-indigo-300 mt-2.5 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{line.replace('### ', '')}</span>
              </h4>
            );
          }
          if (line.startsWith('## ') || line.startsWith('# ')) {
            return (
              <h3 key={lIdx} className="text-lg font-black text-slate-900 dark:text-white mt-3.5 mb-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                {line.replace(/^#+ /, '')}
              </h3>
            );
          }
          if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
            return (
              <div key={lIdx} className="flex items-start gap-2 pl-2">
                <span className="text-indigo-500 font-bold text-base leading-none">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineStyles(line.slice(2)) }} />
              </div>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            const match = line.match(/^(\d+\.)\s(.*)$/);
            if (match) {
              return (
                <div key={lIdx} className="flex items-start gap-2 pl-2">
                  <span className="text-indigo-600 dark:text-indigo-400 font-black shrink-0">{match[1]}</span>
                  <span dangerouslySetInnerHTML={{ __html: formatInlineStyles(match[2]) }} />
                </div>
              );
            }
          }
          if (!line.trim()) {
            return <div key={lIdx} className="h-1.5" />;
          }
          return (
            <p key={lIdx} dangerouslySetInnerHTML={{ __html: formatInlineStyles(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInlineStyles = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">$1</code>');
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] px-3 sm:px-4 relative"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-indigo-600/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center text-white border-4 border-dashed border-white m-2 animate-in fade-in">
          <UploadCloud className="w-16 h-16 animate-bounce mb-3" />
          <h3 className="text-xl font-black">أفلت كتابك هنا لقراءته فوراً! 📚</h3>
          <p className="text-sm opacity-90 mt-1">يدعم ملفات الكتب المضغوطة (ZIP) أو ملفات الـ PDF المباشرة</p>
        </div>
      )}

      {/* Top Filter Bar: Grade, Subject & Mode */}
      <div className="py-2.5 flex items-center justify-between gap-2 overflow-x-auto border-b border-slate-200/80 dark:border-slate-800/80 shrink-0 text-xs scrollbar-none">
        {/* Grade Selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 font-bold hidden sm:inline">المرحلة:</span>
          {['جميع المراحل', 'الابتدائي', 'الإعدادي', 'الثانوي'].map(grade => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                selectedGrade === grade
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {grade}
            </button>
          ))}
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setMode('detailed')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-colors ${
              mode === 'detailed'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>شرح مفصل</span>
          </button>
          <button
            onClick={() => setMode('solver')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-colors ${
              mode === 'solver'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>حل مسألة</span>
          </button>
          <button
            onClick={() => setMode('simple')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-colors ${
              mode === 'simple'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Baby className="w-3.5 h-3.5" />
            <span>تبسيط فائق</span>
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          const isSpeaking = speakingMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-200`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                  isUser
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                    : 'bg-gradient-to-tr from-indigo-600 to-purple-600'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble Container */}
              <div className="max-w-[88%] sm:max-w-[82%] space-y-2">
                <div
                  className={`p-4 sm:p-5 rounded-3xl text-sm ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700/80 shadow-xs'
                  }`}
                >
                  {/* Book reference tag on top if message relates to a book */}
                  {msg.bookName && (
                    <div className="mb-2.5 pb-2 border-b border-indigo-100 dark:border-slate-700 flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span>مرجع المذاكرة: {msg.bookName}</span>
                    </div>
                  )}

                  {/* Dedicated Interactive Audio Player Header if speech is suggested or active */}
                  {!isUser && (msg.suggestAudio || isSpeaking) && (
                    <div className="mb-3 p-2.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => handleSpeak(msg.id, msg.content)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 transition-all ${
                            isSpeaking
                              ? 'bg-rose-500 shadow-md shadow-rose-500/30'
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                          title={isSpeaking ? 'إيقاف الإلقاء الصوتي' : 'تشغيل الشرح الصوتي'}
                        >
                          {isSpeaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                        </button>
                        <div className="min-w-0">
                          <span className="font-black text-indigo-900 dark:text-indigo-200 block truncate">
                            {isSpeaking ? 'جارٍ إلقاء الشرح صوتياً... 🎙️' : 'شرح جاهز للاستماع الصوتي 🔊'}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            صوت تعليمي واضح ومبسط
                          </span>
                        </div>
                      </div>

                      {/* Equalizer animation & speed toggle */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isSpeaking && (
                          <div className="flex items-end gap-0.5 h-4 px-1">
                            <span className="w-1 bg-indigo-600 rounded-full animate-pulse h-2" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 bg-purple-600 rounded-full animate-pulse h-4" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 bg-pink-600 rounded-full animate-pulse h-3" style={{ animationDelay: '300ms' }} />
                          </div>
                        )}
                        <button
                          onClick={() => {
                            const speeds = [1.0, 1.25, 1.5];
                            const next = speeds[(speeds.indexOf(speechSpeed) + 1) % speeds.length];
                            setSpeechSpeed(next);
                            if (isSpeaking) {
                              handleSpeak(msg.id, msg.content);
                            }
                          }}
                          className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[10px] font-black text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700"
                          title="تغيير سرعة الإلقاء الصوتي"
                        >
                          {speechSpeed}x
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Main Formatted Text */}
                  {renderFormattedText(msg.content)}

                  {msg.source && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400 font-bold flex items-center justify-between">
                      <span>{msg.source}</span>
                      {msg.suggestAudio && (
                        <span className="text-indigo-500 font-bold flex items-center gap-1">
                          <Headphones className="w-3 h-3" /> متاح صوتياً
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Assistant Action Buttons */}
                {!isUser && (
                  <div className="flex items-center gap-1.5 flex-wrap px-2">
                    <button
                      onClick={() => handleSpeak(msg.id, msg.content)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border transition-colors ${
                        isSpeaking
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 animate-pulse'
                          : 'bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                      title={isSpeaking ? 'إيقاف الصوت' : 'استمع للشرح صوتياً'}
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-amber-500" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-500" />}
                      <span>{isSpeaking ? 'إيقاف ⏹️' : 'استمع 🔊'}</span>
                    </button>

                    <button
                      onClick={() => onRequestQuiz(msg.topic || msg.content.slice(0, 30))}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 transition-colors"
                      title="اختبار سريع في هذا الدرس"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>اختبرني 📝</span>
                    </button>

                    <button
                      onClick={() => onSimplify(msg.content)}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                      title="تبسيط الشرح أكثر بنقاط مختصرة"
                    >
                      <span>🐢 بسّط أكثر</span>
                    </button>

                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="text-xs font-bold px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title="نسخ الشرح"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Uploading progress notification */}
        {isUploading && (
          <div className="flex gap-3 animate-in fade-in">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-tl-none flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping shrink-0" />
              <div className="text-xs">
                <p className="font-black text-indigo-900 dark:text-indigo-200">{uploadStatus}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  يتم استخراج ملفات الـ PDF وفهرسة الفصول لتحضير الشرح الصوتي والكتابي...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI Thinking Indicator */}
        {isLoading && !isUploading && (
          <div className="flex gap-3 animate-in fade-in">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-none flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-slate-400 font-bold mr-2">
                {activeBook 
                  ? `المعلم الذكي يقرأ من كتاب "${activeBook.name}" ويجهز الشرح الصوتي والكتابي...` 
                  : 'المعلم الذكي يجهز الشرح بأفضل أسلوب تعليمي...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chapters Index Drawer / Popup */}
      {showChaptersDrawer && activeBook && (
        <div className="mb-2 p-3.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-indigo-500 shadow-xl animate-in slide-in-from-bottom-3 duration-200 max-h-60 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs font-black text-indigo-700 dark:text-indigo-300">
              <Layers className="w-4 h-4" />
              <span>فهرس فصول كتاب: {activeBook.name}</span>
            </div>
            <button
              onClick={() => setShowChaptersDrawer(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeBook.chapters.map((ch, idx) => (
              <div
                key={idx}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-600 flex items-center justify-between gap-2 hover:border-indigo-400 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {ch.title}
                  </p>
                  {ch.excerpt && (
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {ch.excerpt.slice(0, 50)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Explain with Voice & Writing */}
                  <button
                    onClick={() => {
                      setShowChaptersDrawer(false);
                      onSendMessage(
                        `اشرح لي ${ch.title} من كتاب "${activeBook.name}" بالتفصيل بالصوت والكتابة مع أمثلة عملية وقوانين.`,
                        mode,
                        selectedGrade,
                        selectedSubject,
                        activeBook,
                        true
                      );
                    }}
                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black flex items-center gap-1 shadow-xs"
                    title="شرح هذا الفصل بالصوت والكتابة"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>صوت وكتابة</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestion Chips */}
      {messages.length <= 3 && !activeBook && (
        <div className="py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-xs font-bold text-slate-400 shrink-0">مقترحات شائعة:</span>
          {suggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => {
                setInput(sug);
                onSendMessage(sug, mode, selectedGrade, selectedSubject, activeBook, autoVoice);
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 hover:border-indigo-400 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0 transition-all hover:scale-102"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Live Upload Status & Progress Feedback Card */}
      {uploadInfo && (
        <div className={`mb-3 p-3.5 rounded-2xl border transition-all shadow-md animate-in fade-in slide-in-from-bottom-2 ${
          uploadInfo.stage === 'error'
            ? 'bg-rose-50/95 dark:bg-rose-950/85 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
            : uploadInfo.stage === 'done'
            ? 'bg-emerald-50/95 dark:bg-emerald-950/85 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
            : 'bg-indigo-50/95 dark:bg-indigo-950/85 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-100'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                uploadInfo.stage === 'error'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                  : uploadInfo.stage === 'done'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                  : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
              }`}>
                {uploadInfo.stage === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : uploadInfo.stage === 'done' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Loader2 className="w-5 h-5 animate-spin" />
                )}
              </div>
              
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm">
                    {uploadInfo.stage === 'error'
                      ? '⚠️ تعذر إتمام قراءة ملف الكتاب'
                      : uploadInfo.stage === 'done'
                      ? '🎉 تم استيعاب وفهرسة الكتاب بنجاح!'
                      : '⏳ جارٍ قراءة وتحليل الكتاب الدراسي...'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/80 dark:bg-black/40 border border-current/20">
                    {uploadInfo.fileName} ({uploadInfo.fileSizeStr})
                  </span>
                </div>

                <p className="text-xs opacity-90 leading-relaxed font-medium">
                  {uploadInfo.stage === 'error'
                    ? uploadInfo.errorText
                    : uploadInfo.statusText}
                </p>

                {/* Animated Progress Bar for Reading & Analyzing */}
                {(uploadInfo.stage === 'reading' || uploadInfo.stage === 'analyzing') && (
                  <div className="w-full bg-indigo-200/60 dark:bg-indigo-900/60 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadInfo.progressPercent}%` }}
                    />
                  </div>
                )}

                {/* Progress Stages Checklist */}
                {(uploadInfo.stage === 'reading' || uploadInfo.stage === 'analyzing') && (
                  <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] font-bold pt-1 text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className={`flex items-center gap-1 ${uploadInfo.progressPercent >= 25 ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600'}`}>
                      {uploadInfo.progressPercent >= 25 ? '✓ تجهيز الملف' : '⏳ قراءة الملف'}
                    </span>
                    <span>←</span>
                    <span className={`flex items-center gap-1 ${uploadInfo.progressPercent >= 50 ? 'text-indigo-600 dark:text-indigo-400 font-black animate-pulse' : ''}`}>
                      🧠 قراءة الفصول واستخراج القوانين
                    </span>
                    <span>←</span>
                    <span>🎙️ جاهز للشرح الصوتي والكتابي</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {uploadInfo.stage === 'error' && (
                <button
                  onClick={() => {
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    fileInputRef.current?.click();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>رفع ملف آخر</span>
                </button>
              )}

              {uploadInfo.stage === 'done' && (
                <button
                  onClick={() => setShowBookOverviewModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>معاينة ما قرأه المعلم</span>
                </button>
              )}

              <button
                onClick={() => setUploadInfo(null)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
                title="إغلاق الإشعار"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Book Ribbon directly above input bar */}
      {activeBook && (
        <div className="mb-2 space-y-2 animate-in fade-in">
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-50/95 via-purple-50/95 to-slate-50 dark:from-indigo-950/70 dark:via-purple-950/70 dark:to-slate-900 border border-indigo-200/90 dark:border-indigo-800/90 shadow-sm flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {activeBook.realTitle ? activeBook.realTitle : `كتاب: ${activeBook.name}`}
                  </span>
                  {activeBook.subject && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                      {activeBook.subject}
                    </span>
                  )}
                  {activeBook.grade && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 font-bold shrink-0">
                      {activeBook.grade}
                    </span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 font-bold shrink-0">
                    {activeBook.pageCount} صفحة
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {activeBook.chapters.length > 0 
                    ? `تم تحليل وفهرسة ${activeBook.chapters.length} فصول وأقسام دراسية جاهزة للشرح الصوتي والكتابي` 
                    : 'تم استيعاب محتوى الكتاب بنجاح'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Review what AI Read Modal Trigger */}
              <button
                onClick={() => setShowBookOverviewModal(true)}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-700 text-xs font-bold flex items-center gap-1 transition-all"
                title="معاينة ما قرأه المعلم الذكي من الكتاب"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>ماذا قرأ المعلم؟</span>
              </button>

              {/* Explain First Chapter Button */}
              {activeBook.chapters.length > 0 && (
                <button
                  onClick={() => {
                    const ch1 = activeBook.chapters[0];
                    onSendMessage(
                      `اشرح لي ${ch1.title} من كتاب "${activeBook.realTitle || activeBook.name}" بالتفصيل بالصوت والكتابة مع الأمثلة والقوانين`,
                      mode,
                      selectedGrade,
                      selectedSubject,
                      activeBook,
                      true
                    );
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>🎙️ اشرح أول فصل</span>
                </button>
              )}

              {/* Chapters Index Button */}
              {activeBook.chapters.length > 0 && (
                <button
                  onClick={() => setShowChaptersDrawer(prev => !prev)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>فهرس الفصول ({activeBook.chapters.length})</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showChaptersDrawer ? 'rotate-180' : ''}`} />
                </button>
              )}

              {/* Multiple books switcher */}
              {uploadedBooks.length > 1 && (
                <select
                  value={activeBook.id}
                  onChange={e => {
                    const found = uploadedBooks.find(b => b.id === e.target.value);
                    if (found) setActiveBook(found);
                  }}
                  className="text-xs font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none"
                >
                  {uploadedBooks.map(b => (
                    <option key={b.id} value={b.id}>
                      📖 {b.realTitle || b.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Clear Book */}
              <button
                onClick={() => setActiveBook(null)}
                title="إغلاق هذا الكتاب"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contextual Quick Actions for the Book */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <span className="text-slate-400 font-bold shrink-0">أسئلة سريعة للكتاب:</span>
            <button
              onClick={() => {
                onSendMessage(
                  `لخص لي أهم القوانين الرياضية/العلمية والمصطلحات الرئيسية في كتاب "${activeBook.realTitle || activeBook.name}" بالصوت والكتابة.`,
                  mode,
                  selectedGrade,
                  selectedSubject,
                  activeBook,
                  true
                );
              }}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:border-indigo-400 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0 transition-all font-semibold hover:scale-102"
            >
              📋 لخص أهم القوانين والمصطلحات
            </button>
            <button
              onClick={() => {
                onSendMessage(
                  `اطرح عليّ 3 أسئلة تدريبية تفاعلية لاختبار فهمي لما ورد في كتاب "${activeBook.realTitle || activeBook.name}".`,
                  'quiz',
                  selectedGrade,
                  selectedSubject,
                  activeBook,
                  false
                );
              }}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:border-purple-400 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0 transition-all font-semibold hover:scale-102"
            >
              🎯 اختبرني بأسئلة من الكتاب
            </button>
            <button
              onClick={() => {
                onSendMessage(
                  `ما هي أصعب المفاهيم أو المسائل المتوقعة في كتاب "${activeBook.realTitle || activeBook.name}" وكيف أتقنها؟`,
                  mode,
                  selectedGrade,
                  selectedSubject,
                  activeBook,
                  autoVoice
                );
              }}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:border-amber-400 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0 transition-all font-semibold hover:scale-102"
            >
              💡 أهم المفاهيم المتوقعة
            </button>
          </div>
        </div>
      )}

      {/* Input Bar (User requested: upload zip book button right beside the microphone) */}
      <div className="pt-2 pb-1 shrink-0">
        <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none p-1.5 flex items-center gap-1.5 focus-within:border-indigo-500 transition-colors">
          
          {/* Hidden File Input for ZIP and PDF books */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.pdf,application/zip,application/x-zip-compressed,application/pdf,application/octet-stream"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* Book Upload Button (Directly beside microphone) */}
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.value = '';
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            title="رفع كتب مضغوطة (ملف ZIP يحتوي كتب PDF) أو ملفات PDF مباشرة"
            className={`p-2.5 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs shrink-0 group relative ${
              isUploading
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse'
                : activeBook
                ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
                : 'text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-amber-600 dark:text-amber-400" />
            ) : (
              <FolderArchive className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            )}
            <span className="hidden md:inline font-bold text-xs">
              {isUploading ? 'جارٍ قراءة الكتاب...' : activeBook ? (activeBook.realTitle || activeBook.name).slice(0, 14) + '...' : 'رفع كتب ZIP/PDF'}
            </span>
            {uploadedBooks.length > 0 && !isUploading && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                {uploadedBooks.length}
              </span>
            )}
          </button>

          {/* Microphone button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            title={isRecording ? 'إيقاف التسجيل الصوتي' : 'تحدث بسؤالك صوتياً'}
            className={`p-2.5 rounded-xl transition-all shrink-0 ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Auto-Voice Explanation Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !autoVoice;
              setAutoVoice(next);
              if (next) sound.playCorrect();
            }}
            title={autoVoice ? 'الشرح الصوتي التلقائي مفعّل 🔊' : 'تفعيل الشرح الصوتي التلقائي'}
            className={`p-2.5 rounded-xl transition-all shrink-0 ${
              autoVoice
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <Volume2 className={`w-5 h-5 ${autoVoice ? 'animate-pulse' : ''}`} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isUploading}
            placeholder={
              isRecording
                ? 'جارٍ الاستماع إليك... تحدث الآن'
                : activeBook
                ? `اطلب شرح أي فصل أو درس من كتاب "${activeBook.name}" بالصوت والكتابة...`
                : 'اسأل عن أي منهج، مسألة، أو ارفع كتبك بصيغة ZIP من الزر المجاور...'
            }
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 text-sm px-2 placeholder:text-slate-400 font-medium min-w-0"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isUploading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 disabled:hover:scale-100 text-white transition-all hover:scale-105 active:scale-95 shadow-md shadow-indigo-600/20 shrink-0"
            title="إرسال السؤال"
          >
            <Send className="w-5 h-5 rotate-180" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-3 pt-1.5">
          <span>
            {autoVoice ? '🔊 الشرح الصوتي التلقائي مفعّل' : '💡 يمكنك طلب "اشرح لي بالصوت والكتابة" لأي فصل'}
          </span>
          <span className="hidden sm:inline">اضغط Enter للإرسال ↵</span>
        </div>
      </div>

      {/* Book Deep Overview Modal */}
      {showBookOverviewModal && activeBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div 
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/40 dark:to-purple-950/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                    {activeBook.realTitle || activeBook.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {activeBook.subject && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold">
                        {activeBook.subject}
                      </span>
                    )}
                    {activeBook.grade && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 font-bold">
                        {activeBook.grade}
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-bold">
                      {activeBook.pageCount} صفحة
                    </span>
                    <span className="text-[10px] text-slate-400">
                      اسم الملف: {activeBook.originalFileName}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowBookOverviewModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* AI Reading Summary */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                <div className="flex items-center gap-2 text-xs font-black text-indigo-700 dark:text-indigo-300 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>ما تم استيعابه من الكتاب بواسطة المعلم الذكي:</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {activeBook.summary || 'تم فحص محتوى الكتاب وفهرسة فصوله ومفاهيمه الرئيسية بنجاح، والمعلم الذكي جاهز لشرح أي مسألة أو قانون منه بالصوت والكتابة.'}
                </p>
              </div>

              {/* Chapters & Lessons Section */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>الفصول والوحدات المكتشفة ({activeBook.chapters.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    انقر على أي فصل لبدء الشرح الصوتي والكتابي
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {activeBook.chapters.map((ch, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/80 dark:border-slate-600/80 hover:border-indigo-400 transition-all flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                            {ch.title}
                          </p>
                        </div>
                        {ch.excerpt && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                            {ch.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <button
                          onClick={() => {
                            setShowBookOverviewModal(false);
                            onSendMessage(
                              `اشرح لي ${ch.title} من كتاب "${activeBook.realTitle || activeBook.name}" بالتفصيل بالصوت والكتابة مع إعطاء قوانين وأمثلة محلولة.`,
                              mode,
                              selectedGrade,
                              selectedSubject,
                              activeBook,
                              true
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all hover:scale-102"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>صوت وكتابة</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                💡 جميع الأسئلة التي تطرحها ستكون مبنية ومستندة مباشرة إلى محتوى هذا الكتاب
              </div>
              <button
                onClick={() => setShowBookOverviewModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
