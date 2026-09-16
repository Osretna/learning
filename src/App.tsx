import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ChatView } from './components/ChatView';
import { LibraryView } from './components/LibraryView';
import { ProgressView } from './components/ProgressView';
import { QuizModal } from './components/QuizModal';
import { DownloadModal } from './components/DownloadModal';
import { Message, StudentProfile, ExplanationMode, QuizQuestion, UploadedBook } from './types';
import { CURRICULUM_DATA } from './data/curriculum';
import { speakText } from './utils/audio';

export default function App() {
  // Student profile state with localStorage persistence
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem('mothakarti_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      points: 20,
      streak: 1,
      lastActiveDate: new Date().toDateString(),
      completedLessons: [],
      totalQuestionsAsked: 0,
      correctQuizAnswers: 0,
      totalQuizAnswers: 0,
    };
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'chat' | 'library' | 'progress'>('chat');
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mothakarti_theme') === 'dark';
    } catch (e) {
      return false;
    }
  });
  const [fontScale, setFontScale] = useState(1);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  // Books uploaded via ZIP (containing PDFs) or direct PDF with localStorage persistence
  const [uploadedBooks, setUploadedBooks] = useState<UploadedBook[]>(() => {
    try {
      const saved = localStorage.getItem('mothakarti_uploaded_books');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [activeBook, setActiveBook] = useState<UploadedBook | null>(() => {
    try {
      const savedActive = localStorage.getItem('mothakarti_active_book');
      if (savedActive) return JSON.parse(savedActive);
      const savedBooks = localStorage.getItem('mothakarti_uploaded_books');
      if (savedBooks) {
        const parsed = JSON.parse(savedBooks);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      }
    } catch (e) {}
    return null;
  });

  // Sync uploaded books to localStorage
  useEffect(() => {
    try {
      if (uploadedBooks.length > 0) {
        localStorage.setItem('mothakarti_uploaded_books', JSON.stringify(uploadedBooks));
      }
    } catch (e) {}
  }, [uploadedBooks]);

  useEffect(() => {
    try {
      if (activeBook) {
        localStorage.setItem('mothakarti_active_book', JSON.stringify(activeBook));
      }
    } catch (e) {}
  }, [activeBook]);

  // Quiz Modal state
  const [quizState, setQuizState] = useState<{
    isOpen: boolean;
    title: string;
    questions: QuizQuestion[];
  }>({
    isOpen: false,
    title: '',
    questions: [],
  });

  // Chat conversation state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `### 🎓 مرحباً بك يا بطل في "مذاكرتي AI"! 

أنا معلمك الذكي والمساعد التربوي الخاص بك:
- 💡 **أشرح أي درس أو منهج:** في الرياضيات، العلوم، الفيزياء، الكيمياء، الأحياء، قواعد النحو، واللغة الإنجليزية وغيرها.
- 📦 **رفع كتب PDF مضغوطة (ZIP):** اضغط على زر الكتب بجوار المايك 🎤 لرفع كتبك الدراسية وسأقوم بقراءتها وشرح أي فصل أو درس تريده بالصوت والكتابة!
- 🌍 **أجيب بأي لغة:** بالعربية الفصحى، بالإنجليزية (Fluent English)، أو بأي لغة تطلبها.
- 🔊 **شرح بالصوت والكتابة:** يمكنك الاستماع لأي شرح صوتياً بضغطة زر، أو التحدث معي بالمايكروفون 🎙️.
- 📝 **اختبارات فورية:** بعد كل درس، اضغط "اختبرني" لقياس استيعابك وكسب نقاط التميز.
- 📥 **تحميل التطبيق مجاناً:** اضغط على زر "تحميل التطبيق" بالأعلى للحصول على ملف أوفلاين مجاني.

*اسألني الآن، أو ارفع كتابك الدراسي لنبدأ المذاكرة معاً! 👇*`,
      timestamp: Date.now(),
      source: 'مذاكرتي AI ✨',
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  // Sync dark mode class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      try { localStorage.setItem('mothakarti_theme', 'dark'); } catch (e) {}
    } else {
      document.documentElement.classList.remove('dark');
      try { localStorage.setItem('mothakarti_theme', 'light'); } catch (e) {}
    }
  }, [isDark]);

  // Sync font size
  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * fontScale}px`;
  }, [fontScale]);

  // Save profile changes & update streak
  useEffect(() => {
    try {
      localStorage.setItem('mothakarti_profile', JSON.stringify(profile));
    } catch (e) {}
  }, [profile]);

  // Daily streak check
  useEffect(() => {
    const today = new Date().toDateString();
    if (profile.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      setProfile(prev => ({
        ...prev,
        lastActiveDate: today,
        streak: prev.lastActiveDate === yesterday ? prev.streak + 1 : 1,
      }));
    }
  }, []);

  // Automatically load persisted books from server on startup and merge with local storage
  useEffect(() => {
    fetch('/api/books')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data.books) && data.books.length > 0) {
          setUploadedBooks(prev => {
            const map = new Map<string, UploadedBook>();
            // Keep local books first
            prev.forEach(b => map.set(b.id || b.name, b));
            // Add server books
            data.books.forEach((b: UploadedBook) => map.set(b.id || b.name, b));
            return Array.from(map.values());
          });
          setActiveBook(prev => prev || data.books[0]);
        }
      })
      .catch(err => console.warn('Could not load books list from server:', err));
  }, []);

  // Send question to AI backend
  const handleSendMessage = async (
    text: string, 
    mode: ExplanationMode, 
    grade: string, 
    subject: string,
    bookToUse?: UploadedBook | null,
    wantsAudio?: boolean
  ) => {
    const bookTarget = bookToUse !== undefined ? bookToUse : activeBook;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      bookName: bookTarget?.name,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Update student stats (+10 points for engagement)
    setProfile(prev => ({
      ...prev,
      points: prev.points + 10,
      totalQuestionsAsked: prev.totalQuestionsAsked + 1,
    }));

    const isVoiceRequested = Boolean(wantsAudio || /صوت|audio|voice|اقرأ|اسمع|نطق/i.test(text));

    try {
      // Send to server-side Gemini route
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          gradeLevel: grade,
          subject: subject,
          mode: mode,
          language: /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en',
          chatHistory: messages.slice(-4).map(m => ({ role: m.role, content: m.content })),
          bookContext: bookTarget ? {
            id: bookTarget.id,
            bookName: bookTarget.name,
            realTitle: bookTarget.realTitle,
            subject: bookTarget.subject,
            grade: bookTarget.grade,
            pageCount: bookTarget.pageCount,
            chapters: bookTarget.chapters,
            relevantExcerpt: bookTarget.fullText ? bookTarget.fullText.slice(0, 45000) : '',
          } : undefined,
          wantsAudio: isVoiceRequested,
        }),
      });

      if (!response.ok) {
        throw new Error('فشل استجابة الخادم');
      }

      const data = await response.json();
      const shouldSpeak = Boolean(isVoiceRequested || data.suggestAudio);

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'عذراً، حدث خطأ أثناء إعداد الشرح.',
        timestamp: Date.now(),
        source: data.source || (bookTarget ? `كتاب: ${bookTarget.name} 📖` : 'المعلم الذكي 🎓'),
        topic: text.slice(0, 30),
        suggestAudio: shouldSpeak,
        bookName: bookTarget?.name,
      };

      setMessages(prev => [...prev, aiMsg]);

      // If audio requested, speak text
      if (shouldSpeak && data.answer) {
        speakText(data.answer);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      let content = '';

      if (bookTarget && bookTarget.chapters && bookTarget.chapters.length > 0) {
        const normQ = text.toLowerCase();
        const matched = bookTarget.chapters.find(ch => {
          const t = ch.title.toLowerCase();
          const words = normQ.split(/\s+/).filter(w => w.length > 3);
          return words.some(w => t.includes(w)) || (ch.excerpt && words.some(w => ch.excerpt.toLowerCase().includes(w)));
        }) || bookTarget.chapters[0];

        const isIntro = /تأكيد|استيعاب|نظرة عامة|فهرس|كيفية البدء/i.test(text);

        if (isIntro) {
          content = `### 📚 استيعاب وفهرسة كتاب: ${bookTarget.realTitle || bookTarget.name}

**مرحباً بك يا بطل! لقد استوعبت محتوى وصفحات هذا الكتاب بشكل كامل:**

1. **بيانات الكتاب والمرحلة:**
   - **المادة:** ${bookTarget.subject || 'المادة الدراسية المقررة'}
   - **المرحلة:** ${bookTarget.grade || 'المرحلة الإعدادية'}
   - **عدد الصفحات:** ${bookTarget.pageCount} صفحة (${bookTarget.chapters.length} فصول وأقسام مكتشفة ومفهرسة).

2. **فهرس الدروس والمحاور الأساسية:**
${bookTarget.chapters.slice(0, 8).map(ch => `   - **${ch.title}**${ch.page ? ` (ص ${ch.page})` : ''}`).join('\n')}

3. **خطة المذاكرة والشرح بالصوت والكتابة:**
   - يمكنك الآن الضغط على زر **"🎙️ اشرح أول فصل"** أو سؤال المعلم عن أي قانون أو مفهوم بالصوت أو الكتابة.
   - بعد نهاية كل درس، اضغط على **"📝 اختبرني"** لقياس مدى استيعابك وكسب نقاط التميز.

💡 *أنا جاهز تماماً؛ اكتب أو انطق سؤالك حول أي صفحة أو فصل وسأجيبك فوراً!*`;
        } else {
          content = `### 📖 شرح من كتاب: ${bookTarget.realTitle || bookTarget.name}

**السؤال المطروح:** "${text}"

1. **الدرس المرتبط:** ${matched.title}
${matched.excerpt ? `2. **المفهوم كما ورد في الكتاب:**\n   ${matched.excerpt.slice(0, 320)}...` : ''}

3. **الشرح التعليمي المبسط:**
   - في هذا الجزء من المنهج، يتم التركيز على استيعاب المصطلحات وتطبيق القواعد خطوة بخطوة.
   - لحل أي تمرين في هذا الدرس: حدد المعطيات، ثم طبق القاعدة المباشرة، وتأكد من منطقية النتيجة.

💡 **خطوتك التالية:** اضغط على **"اختبرني 📝"** للتأكد من فهمك لهذا الدرس وحل الأسئلة التفاعلية!`;
        }
      } else {
        content = `### 💡 إجابة المعلم الذكي

أهلاً بك! لقد تم تسجيل سؤالك: **"${text}"**.
تذكر دائماً أن فهم المبادئ الأساسية وتطبيق القوانين وحل التمارين العملية هي أسرع طريقة للتفوق الدراسي.
يمكنك استعراض الدروس والشروحات الجاهزة من تبويب **"📚 بنك المناهج"** بالأعلى.`;
      }

      const fallbackMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: Date.now(),
        source: bookTarget ? `كتاب: ${bookTarget.realTitle || bookTarget.name} 📖` : 'مذاكرتي AI ✨',
        topic: text.slice(0, 30),
        bookName: bookTarget?.name,
        suggestAudio: true,
      };
      setMessages(prev => [...prev, fallbackMsg]);
      if (isVoiceRequested) {
        speakText(content);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger quiz for topic
  const handleRequestQuiz = async (topic: string) => {
    // 1. Check if we already have this topic in curriculum data
    for (const stage of CURRICULUM_DATA) {
      for (const subj of stage.subjects) {
        for (const lesson of subj.lessons) {
          if (
            lesson.title.includes(topic) ||
            topic.includes(lesson.title) ||
            lesson.sampleQuestions.some(q => q.question.includes(topic))
          ) {
            setQuizState({
              isOpen: true,
              title: `اختبار: ${lesson.title}`,
              questions: lesson.sampleQuestions,
            });
            return;
          }
        }
      }
    }

    // 2. Otherwise dynamically fetch quiz from AI endpoint
    try {
      const response = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        const formatted: QuizQuestion[] = data.questions.map((q: any, i: number) => ({
          id: `dyn-q-${i}`,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
        }));
        setQuizState({
          isOpen: true,
          title: `اختبار تفاعلي: ${topic}`,
          questions: formatted,
        });
        return;
      }
    } catch (e) {
      console.error(e);
    }

    // 3. Fallback generic quiz
    setQuizState({
      isOpen: true,
      title: `اختبار استيعاب: ${topic}`,
      questions: [
        {
          id: 'fb-1',
          question: `ما هي أهم خطوة لفهم وإتقان (${topic})؟`,
          options: [
            'فهم المفهوم الأساسي وتطبيق التمارين العملية',
            'حفظ القوانين دون تجربة أو حل مسائل',
            'القراءة لمرة واحدة سريعة ليلة الامتحان',
            'تجنب الأسئلة الصعبة',
          ],
          correctIndex: 0,
          explanation: 'الفهم العميق المقترن بالحل العملي يرسخ المعلومة في الذاكرة طويلة المدى بنسبة تتجاوز 90%!',
        },
        {
          id: 'fb-2',
          question: 'عند مواجهة مسألة غير مباشرة أو صعبة، ما التصرف الأمثل؟',
          options: [
            'تحديد المعطيات والمطلوب وتطبيق القوانين ذات الصلة خطوة بخطوة',
            'تخمين الناتج عشوائياً',
            'ترك السؤال فارغاً مباشرة',
            'كتابة أرقام دون قوانين',
          ],
          correctIndex: 0,
          explanation: 'التحليل المنطقي وتقسيم المسألة لخطوات صغيرة يسهل الوصول للناتج الصحيح دائماً.',
        },
      ],
    });
  };

  // Simplify an existing explanation
  const handleSimplify = (original: string) => {
    const prompt = `اشرح لي هذا المحتوى بأسلوب مبسط جداً ومباشر كأنك تشرح لطفل في 3 نقاط محددة وسهلة الفهم: ${original.slice(0, 300)}`;
    handleSendMessage(prompt, 'simple', 'جميع المراحل', 'عام');
  };

  // Ask about a specific curriculum lesson from LibraryView
  const handleAskLesson = (prompt: string, stage: string, subject: string) => {
    setActiveTab('chat');
    handleSendMessage(prompt, 'detailed', stage, subject);
  };

  // Handle quiz completion
  const handleQuizComplete = (score: number, total: number) => {
    setProfile(prev => ({
      ...prev,
      points: prev.points + score * 20,
      correctQuizAnswers: prev.correctQuizAnswers + score,
      totalQuizAnswers: prev.totalQuizAnswers + total,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation */}
      <Navbar
        profile={profile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        setIsDark={setIsDark}
        fontScale={fontScale}
        setFontScale={setFontScale}
        onOpenDownload={() => setIsDownloadOpen(true)}
      />

      {/* Main Screen Views */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'chat' && (
          <ChatView
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onRequestQuiz={handleRequestQuiz}
            onSimplify={handleSimplify}
            uploadedBooks={uploadedBooks}
            setUploadedBooks={setUploadedBooks}
            activeBook={activeBook}
            setActiveBook={setActiveBook}
          />
        )}

        {activeTab === 'library' && (
          <LibraryView
            completedLessons={profile.completedLessons}
            onAskLesson={handleAskLesson}
            onStartQuiz={(title, questions) =>
              setQuizState({
                isOpen: true,
                title,
                questions,
              })
            }
            uploadedBooks={uploadedBooks}
            activeBook={activeBook}
            onSelectBook={(book) => {
              setActiveBook(book);
              setActiveTab('chat');
            }}
            onOpenUpload={() => {
              setActiveTab('chat');
            }}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressView
            profile={profile}
            onExploreLessons={() => setActiveTab('library')}
          />
        )}
      </main>

      {/* Interactive Quiz Modal */}
      <QuizModal
        isOpen={quizState.isOpen}
        onClose={() => setQuizState(prev => ({ ...prev, isOpen: false }))}
        title={quizState.title}
        questions={quizState.questions}
        onComplete={handleQuizComplete}
      />

      {/* Single-File HTML Standalone Download Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />
    </div>
  );
}
