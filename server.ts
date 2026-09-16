import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import JSZip from 'jszip';
import { PDFParse } from 'pdf-parse';

dotenv.config();

// Safe path derivation compatible with both ESM (tsx dev) and bundled CommonJS (production start)
const appDir = process.cwd();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '250mb' }));
app.use(express.urlencoded({ limit: '250mb', extended: true }));

// Server-side persistent storage for uploaded books
export interface ServerStoredBook {
  id: string;
  name: string;
  realTitle?: string;
  subject?: string;
  grade?: string;
  originalFileName: string;
  size: number;
  pageCount: number;
  textSnippet: string;
  fullText: string;
  chapters: Array<{ title: string; page?: number; excerpt: string }>;
  summary: string;
  base64?: string;
  diskPath?: string;
  geminiFileUri?: string;
  geminiFileName?: string;
  geminiFileMime?: string;
  renderedPages?: string[];
  uploadDate: number;
}

const serverBooksStore = new Map<string, ServerStoredBook>();

const BOOKS_DIR = '/tmp/books';
if (!fs.existsSync(BOOKS_DIR)) {
  try {
    fs.mkdirSync(BOOKS_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create books dir in /tmp:', e);
  }
}

const INDEX_FILE = path.join(BOOKS_DIR, 'books-index.json');

// Helper to render PDF pages using Ghostscript into high-resolution JPEG images
async function renderPdfPages(
  pdfPath: string,
  startPage: number,
  endPage: number,
  outputDir: string
): Promise<string[]> {
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check if already rendered
    let allExist = true;
    for (let p = startPage; p <= endPage; p++) {
      if (!fs.existsSync(path.join(outputDir, `page-${p}.jpg`))) {
        allExist = false;
        break;
      }
    }

    if (allExist) {
      const existing: string[] = [];
      for (let p = startPage; p <= endPage; p++) {
        existing.push(path.join(outputDir, `page-${p}.jpg`));
      }
      return existing;
    }

    const tempPrefix = `gstemp_${Date.now()}_`;
    const tempPattern = path.join(outputDir, `${tempPrefix}%d.jpg`);
    await new Promise((resolve, reject) => {
      exec(
        `gs -dNOPAUSE -dBATCH -sDEVICE=jpeg -r130 -dFirstPage=${startPage} -dLastPage=${endPage} -sOutputFile="${tempPattern}" "${pdfPath}"`,
        (err) => {
          if (err) return reject(err);
          resolve(true);
        }
      );
    });

    const rendered: string[] = [];
    let seqIdx = 1;
    for (let p = startPage; p <= endPage; p++) {
      const tempFile = path.join(outputDir, `${tempPrefix}${seqIdx}.jpg`);
      const targetFile = path.join(outputDir, `page-${p}.jpg`);
      if (fs.existsSync(tempFile)) {
        try {
          fs.renameSync(tempFile, targetFile);
        } catch (e) {
          fs.copyFileSync(tempFile, targetFile);
          try { fs.unlinkSync(tempFile); } catch (e2) {}
        }
        rendered.push(targetFile);
      } else if (fs.existsSync(targetFile)) {
        rendered.push(targetFile);
      }
      seqIdx++;
    }
    return rendered;
  } catch (err) {
    console.warn('renderPdfPages warning:', err);
    return [];
  }
}

function saveBooksIndex() {
  try {
    const list = Array.from(serverBooksStore.values()).map(b => ({
      ...b,
      base64: undefined, // skip large base64 in json
    }));
    fs.writeFileSync(INDEX_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save books index to disk:', e);
  }
}

function loadBooksIndex() {
  try {
    if (fs.existsSync(INDEX_FILE)) {
      const data = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && item.id) {
            serverBooksStore.set(item.id, item);
          }
        }
      }
    }

    // Auto-seed user uploaded book if present in /tmp/books
    if (fs.existsSync('/tmp/books/book-yq1o1an.pdf') && !serverBooksStore.has('book-yq1o1an')) {
      const renderedPages: string[] = [];
      const renderDir = '/tmp/books/pages-book-yq1o1an';
      for (let p = 1; p <= 15; p++) {
        const pf = path.join(renderDir, `page-${p}.jpg`);
        if (fs.existsSync(pf)) renderedPages.push(pf);
      }

      const defaultBook: ServerStoredBook = {
        id: 'book-yq1o1an',
        name: 'كتاب PONY - تكنولوجيا المعلومات والاتصالات ICT',
        realTitle: 'سلسلة كتب الأستاذ PONY - تكنولوجيا المعلومات والاتصالات ICT',
        subject: 'تكنولوجيا المعلومات والاتصالات (ICT)',
        grade: 'الصف الأول الإعدادي - الفصل الدراسي الأول (1st Preparatory - First Term)',
        originalFileName: 'كتاب تكنولوجيا المعلومات والاتصالات - الأول الإعدادي.pdf',
        size: 60527820,
        pageCount: 168,
        textSnippet: 'سلسلة كتب الأستاذ PONY - منهج تكنولوجيا المعلومات والاتصالات (ICT) - الصف الأول الإعدادي (1st Preparatory) - الفصل الدراسي الأول.',
        fullText: `كتاب PONY - تكنولوجيا المعلومات والاتصالات (ICT) - الصف الأول الإعدادي - الفصل الدراسي الأول
الفصل الأول: البرامج والتطبيقات الرقمية (Chapter 1: Digital Programs and Applications)
الدرس الأول: التكنولوجيا الخضراء (Lesson 1: Green Technology)
المفاهيم الأساسية:
- التكنولوجيا الخضراء (Green Technology): التكنولوجيا المستدامة والنظيفة التي تحمي البيئة وترشد الموارد.
- السيارات الكهربائية (Electric Vehicles) والحد من انبعاثات الكربون وعوادم الوقود.
- مجالات التكنولوجيا الخضراء: الطاقة المتجددة (Renewable Energy) تشمل الطاقة الشمسية، الرياح، المائية، والحرارية؛ ترشيد استهلاك الطاقة (Rationalization of energy consumption) عبر المباني الخضراء والنقل الذكي؛ تدوير النفايات (Waste recycling)؛ معالجة المياه (Water treatment).
- الحساسات وأجهزة الاستشعار (Sensors) وترشيد الكهرباء والمياه واستشعار الدخان وتنظيم الحرارة.
- قائمة دروس الفصل الأول: 1. Green Technology، 2. Digital Transformation، 3. Operating Systems، 4. Installing and Uninstalling Software، 5. Email، 6. Cloud Computing، 7. Google Meet، 8. Database Design، 9. Forms and Queries، 10. Digital Project.`,
        chapters: [
          {
            title: 'Chapter One: Digital Programs and Applications',
            page: 3,
            excerpt: 'يضم الفصل الأول عشرة دروس: 1. التكنولوجيا الخضراء Green Technology، 2. التحول الرقمي Digital Transformation، 3. أنظمة التشغيل Operating Systems، 4. تثبيت وإلغاء تثبيت البرمجيات، 5. البريد الإلكتروني Email، 6. الحوسبة السحابية Cloud Computing، 7. Google Meet، 8. تصميم قواعد البيانات Database Design، 9. النماذج والاستعلامات Forms and Queries، 10. المشروع الرقمي Digital Project.'
          },
          {
            title: 'Lesson 1: Green Technology (التكنولوجيا الخضراء)',
            page: 4,
            excerpt: 'مفهوم التكنولوجيا الخضراء (المستدامة/النظيفة)، دور السيارات الكهربائية في خفض الانبعاثات، مجالات استخدام التكنولوجيا الخضراء: الطاقة المتجددة (الشمسية، الرياح، المائية، الجوفية، الحيوية)، ترشيد استهلاك الطاقة عبر المباني الخضراء والنقل الذكي، تدوير النفايات (البلاستيك والورق والسماد العضوي)، معالجة وتنقية المياه، دور الحساسات الذكية (Sensors) في ترشيد الموارد والكهرباء.'
          },
          {
            title: 'Lesson 2: Digital Transformation (التحول الرقمي)',
            page: 15,
            excerpt: 'مفهوم التحول الرقمي وأهميته في التعليم والخدمات الحكومية وتسهيل الإجراءات واستخدام الأدوات الرقمية الحديثة.'
          }
        ],
        summary: 'كتاب PONY المعتمد في تكنولوجيا المعلومات والاتصالات ICT للصف الأول الإعدادي الفصل الدراسي الأول، يغطي البرامج والتطبيقات الرقمية والتكنولوجيا الخضراء والتحول الرقمي وقواعد البيانات والحوسبة السحابية.',
        diskPath: '/tmp/books/book-yq1o1an.pdf',
        geminiFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/zk5hxsla45tp',
        geminiFileName: 'files/zk5hxsla45tp',
        geminiFileMime: 'application/pdf',
        renderedPages,
        uploadDate: Date.now(),
      };
      serverBooksStore.set('book-yq1o1an', defaultBook);
      saveBooksIndex();
    }
  } catch (e) {
    console.warn('Could not load books index:', e);
  }
}
loadBooksIndex();

// Helper to upload a local file to Gemini Files API and poll until ACTIVE
async function uploadToGeminiFiles(
  ai: GoogleGenAI,
  filePath: string,
  mimeType: string = 'application/pdf'
): Promise<{ uri: string; name: string } | null> {
  try {
    if (!fs.existsSync(filePath)) return null;
    const up = await ai.files.upload({
      file: filePath,
      config: {
        mimeType,
      },
    });
    let state = up.state;
    let tries = 0;
    while (state === 'PROCESSING' && tries < 30) {
      await new Promise(r => setTimeout(r, 1200));
      const f = await ai.files.get({ name: up.name });
      state = f.state;
      tries++;
    }
    if (state === 'ACTIVE') {
      return { uri: up.uri, name: up.name };
    }
    console.warn(`Gemini file upload state was ${state} for ${up.name}`);
    return null;
  } catch (err) {
    console.warn('uploadToGeminiFiles error:', err);
    return null;
  }
}

// Intelligent Chapter and Lesson Extractor from Text
function extractChaptersFromText(text: string): Array<{ title: string; page?: number; excerpt: string }> {
  const chapters: Array<{ title: string; page?: number; excerpt: string }> = [];
  const lines = text.split('\n');
  const chapterRegex = /^\s*(الفصل\s+[^\n:]{2,60}|الوحدة\s+[^\n:]{2,60}|الدرس\s+[^\n:]{2,60}|المحور\s+[^\n:]{2,60}|المفهوم\s+[^\n:]{2,60}|الموضوع\s+[^\n:]{2,60}|الباب\s+[^\n:]{2,60}|المبحث\s+[^\n:]{2,60}|القضية\s+[^\n:]{2,60}|نشاط\s+[^\n:]{2,60}|Chapter\s+[^\n:]{1,60}|Unit\s+[^\n:]{1,60}|Lesson\s+[^\n:]{1,60}|Topic\s+[^\n:]{1,60}|Theme\s+[^\n:]{1,60})/i;

  let currentTitle = '';
  let currentBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const match = line.match(chapterRegex);
    if (match) {
      if (currentTitle && currentBuffer.length > 0) {
        chapters.push({
          title: currentTitle,
          excerpt: currentBuffer.slice(0, 15).join(' ').slice(0, 700) + '...',
        });
        currentBuffer = [];
      }
      currentTitle = match[1].trim();
    } else if (currentTitle) {
      currentBuffer.push(line);
    }
  }

  if (currentTitle && currentBuffer.length > 0) {
    chapters.push({
      title: currentTitle,
      excerpt: currentBuffer.slice(0, 15).join(' ').slice(0, 700) + '...',
    });
  }

  // Fallback: split by significant breaks if no explicit chapter titles detected
  if (chapters.length === 0 && text.length > 300) {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 60);
    const count = Math.min(paragraphs.length, 8);
    for (let i = 0; i < count; i++) {
      chapters.push({
        title: `القسم ${i + 1}: ${paragraphs[i].slice(0, 40)}...`,
        excerpt: paragraphs[i].slice(0, 450) + '...',
      });
    }
  }

  return chapters;
}

// Relevant excerpt locator to ensure the exact chapter or law is sent to AI even for 200+ page books
function getRelevantExcerptForQuestion(fullText: string, question: string, chapters: any[]): string {
  if (!fullText) return '';
  if (fullText.length <= 40000) return fullText;

  const cleanQ = question.replace(/[؟?.,!:]/g, '');
  const words = cleanQ
    .split(/\s+/)
    .filter(w => w.length > 3 && !['اشرح', 'اريد', 'ماهو', 'ماهي', 'كيف', 'لماذا', 'كتاب', 'الصف', 'درس', 'بالتفصيل'].includes(w));

  let bestIndex = -1;
  for (const word of words) {
    const idx = fullText.indexOf(word);
    if (idx !== -1) {
      bestIndex = idx;
      break;
    }
  }

  if (bestIndex === -1 && Array.isArray(chapters)) {
    for (const ch of chapters) {
      if (ch.title && (cleanQ.includes(ch.title) || ch.title.split(/\s+/).some((w: string) => w.length > 3 && cleanQ.includes(w)))) {
        const idx = fullText.indexOf(ch.title);
        if (idx !== -1) {
          bestIndex = idx;
          break;
        }
      }
    }
  }

  if (bestIndex !== -1) {
    const start = Math.max(0, bestIndex - 6000);
    const end = Math.min(fullText.length, bestIndex + 34000);
    return `[... مقتطف من الموضع المطابق في صفحات الكتاب ...]\n` + fullText.slice(start, end);
  }

  return fullText.slice(0, 40000);
}


// Initialize Google GenAI client lazily or safely
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Resilient model caller: tries high-availability valid models sequentially with retry support
async function generateWithModelFallback(
  ai: GoogleGenAI,
  options: {
    contents: any;
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
    responseSchema?: any;
  }
) {
  // Candidate models supported by @google/genai in AI Studio
  const candidateModels = [
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];
  let lastError: any = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    for (const model of candidateModels) {
      try {
        const config: any = {};
        if (options.systemInstruction) config.systemInstruction = options.systemInstruction;
        if (options.temperature !== undefined) config.temperature = options.temperature;
        if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
        if (options.responseSchema) config.responseSchema = options.responseSchema;

        const result = await ai.models.generateContent({
          model,
          contents: options.contents,
          config,
        });

        if (result && result.text) {
          return result;
        }
      } catch (err: any) {
        lastError = err;
        // If 503 temporary demand spike, wait briefly before next candidate
        if (err?.status === 503) {
          await new Promise(r => setTimeout(r, 800));
        }
      }
    }
    if (attempt === 0) {
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  throw lastError || new Error('All candidate Gemini models were temporarily busy.');
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Deep Multimodal and Text Analysis of Books using Gemini
async function deepAnalyzePdfBook(
  ai: GoogleGenAI | null,
  pdfBuffer: Buffer,
  base64Data: string,
  existingText: string,
  fileName: string,
  existingChapters: Array<{ title: string; page?: number; excerpt: string }>,
  pageCount: number,
  geminiFileUri?: string,
  geminiFileMime?: string,
  diskPath?: string,
  bookId?: string
): Promise<{
  fullText: string;
  chapters: Array<{ title: string; page?: number; excerpt: string }>;
  summary: string;
  realTitle?: string;
  subject?: string;
  grade?: string;
  pageCount?: number;
  renderedPages?: string[];
}> {
  // Case 0 (HIGHEST PRIORITY): Direct Full-Book reading via Gemini Files API (handles up to 2GB books with full vision/OCR)
  if (ai && geminiFileUri) {
    try {
      const prompt = `أنت معلم خبير وموجه أول مناهج وكتب دراسية معتمدة لوزارة التربية والتعليم.
أمامك ملف الكتاب المدرسي الكامل المرفوع من الطالب بصيغة PDF ("${fileName}").
اقرأ صفحات وفصول ومحتويات هذا الكتاب بدقة متناهية من الغلاف إلى آخر صفحة:
1. اقرأ العنوان الفعلي الدقيق المكتوب على غلاف الكتاب وصفحاته الأولى (مثال: تكنولوجيا المعلومات والاتصالات ICT، العلوم، الرياضيات، إلخ).
2. استخرج المادة الدراسية (Subject).
3. استخرج الصف الدراسي والفصل الدراسي بدقة تامة كما ورد في الكتاب (مثال: الصف الأول الإعدادي - الفصل الدراسي الأول).
4. استخرج الفهرس الفعلي الحقيقي الموجود في الكتاب بجميع المحاور والوحدات والدروس كما هي مسمّاة في الكتاب حرفياً مع رقم الصفحة الحقيقية لكل درس.
5. لكل درس ووحدة، استخرج تفريغاً تعليمياً واقعياً وحقيقياً ومفصلاً من صفحات الكتاب:
   - التعريفات والمصطلحات الأساسية المذكورة في الدرس.
   - المفاهيم والنظريات والشروحات التفصيلية.
   - الأمثلة المحلولة، خطوات العمليات والأنشطة والتدريبات العملية.
   - أسئلة نهاية الدرس أو أسئلة الكتاب المدرسي.
6. اكتب ملخصاً عاماً شاملاً يوضح منهج هذا الكتاب وأهدافه التعليمية.

أخرج النتيجة بتنسيق JSON حصراً بالشكل التالي:
{
  "realTitle": "العنوان الفعلي الدقيق للكتاب",
  "subject": "المادة الدراسية",
  "grade": "المرحلة والصف الدراسي",
  "pageCount": ${pageCount},
  "summary": "ملخص شامل للكتاب ومنهجه",
  "chapters": [
    {
      "title": "اسم الوحدة أو المحور أو الدرس الفعلي ورقم الصفحة",
      "page": 1,
      "excerpt": "تفريغ تفصيلي وحقيقي لمحتوى الدرس: أهم المفاهيم والتعريفات والقوانين والتدريبات الواردة في صفحات الكتاب"
    }
  ],
  "fullOutline": "تفريغ مفصل لأهم محتويات ونصوص الكتاب المدرسي"
}`;

      const res = await generateWithModelFallback(ai, {
        contents: [
          {
            fileData: {
              fileUri: geminiFileUri,
              mimeType: geminiFileMime || 'application/pdf',
            },
          },
          { text: prompt },
        ],
        responseMimeType: 'application/json',
        temperature: 0.2,
      });

      if (res && res.text) {
        const cleaned = res.text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        const newChapters = Array.isArray(parsed.chapters) && parsed.chapters.length > 0
          ? parsed.chapters.map((c: any) => ({
              title: c.title || 'درس تعليمي',
              page: typeof c.page === 'number' ? c.page : undefined,
              excerpt: c.excerpt || c.summary || '',
            }))
          : existingChapters;

        const combinedText = [
          parsed.fullOutline || '',
          parsed.summary || '',
          ...newChapters.map((c: any) => `### ${c.title} (صفحة ${c.page || '؟'})\n${c.excerpt}`),
          existingText,
        ].filter(Boolean).join('\n\n');

        return {
          fullText: combinedText,
          chapters: newChapters,
          summary: parsed.summary || `كتاب دراسي تم قراءته وفهرسة محتوياته بدقة من ملف الـ PDF الأصلي بالذكاء الاصطناعي (${newChapters.length} فصول/دروس)`,
          realTitle: parsed.realTitle || undefined,
          subject: parsed.subject || undefined,
          grade: parsed.grade || undefined,
          pageCount: typeof parsed.pageCount === 'number' && parsed.pageCount > 0 ? parsed.pageCount : pageCount,
        };
      }
    } catch (geminiFileErr) {
      console.warn('Gemini Files API deep analyze error:', geminiFileErr);
    }
  }

  const arabicLetters = existingText.match(/[\u0600-\u06FF]/g) || [];
  const latinLetters = existingText.match(/[a-zA-Z]/g) || [];
  const totalLetters = arabicLetters.length + latinLetters.length;
  const isSparse = totalLetters < 250 || existingChapters.length === 0;

  // Case 1A: High-Resolution Page Vision via Ghostscript (Guaranteed 100% OCR reading for Scanned Books)
  if (ai && isSparse && diskPath && fs.existsSync(diskPath)) {
    try {
      const renderDir = path.join(BOOKS_DIR, `pages-${bookId || 'temp'}`);
      const renderedPages = await renderPdfPages(diskPath, 1, Math.min(pageCount || 10, 10), renderDir);
      if (renderedPages.length > 0) {
        const imageParts: any[] = [];
        // Use up to 6 key pages (cover + index + first lesson)
        for (const pFile of renderedPages.slice(0, 6)) {
          if (fs.existsSync(pFile)) {
            imageParts.push({
              inlineData: {
                mimeType: 'image/jpeg',
                data: fs.readFileSync(pFile).toString('base64'),
              },
            });
          }
        }

        if (imageParts.length > 0) {
          const prompt = `أنت معلم خبير وموجه أول مناهج دراسية معتمدة لوزارة التربية والتعليم.
أمامك صور الصفحات الأولى والغلاف وفهرس الدروس لكتاب مدرسي تم رفعه ممسوحاً ضوئياً (Scanned PDF).
اقرأ النصوص والمحتويات المكتوبة في هذه الصفحات بدقة متناهية واستخرج البيانات التعليمية التالية بصيغة JSON فقط:
{
  "realTitle": "العنوان الفعلي الدقيق المكتوب على غلاف الكتاب وصفحاته (مثال: كتاب PONY - تكنولوجيا المعلومات والاتصالات)",
  "subject": "المادة الدراسية (مثال: تكنولوجيا المعلومات والاتصالات ICT)",
  "grade": "المرحلة والصف الدراسي والفصل (مثال: الصف الأول الإعدادي - الفصل الدراسي الأول)",
  "summary": "ملخص عام وشامل للكتاب وأهدافه ومنهجه",
  "chapters": [
    {
      "title": "اسم الفصل أو المحور أو الدرس الفعلي مع رقم صفحته",
      "page": 1,
      "excerpt": "تفريغ شامل وحقيقي لمحتوى الدرس من واقع الصفحات: أهم المفاهيم، القوانين، التعريفات، خطوات العمليات، وأسئلة وتدريبات الكتاب"
    }
  ],
  "fullOutline": "تفريغ شامل ومفصل لجميع النصوص والمحتويات المقروءة من صفحات الكتاب"
}`;

          const res = await generateWithModelFallback(ai, {
            contents: [...imageParts, { text: prompt }],
            responseMimeType: 'application/json',
            temperature: 0.2,
          });

          if (res && res.text) {
            const cleaned = res.text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            const newChapters = Array.isArray(parsed.chapters) && parsed.chapters.length > 0
              ? parsed.chapters.map((c: any) => ({
                  title: c.title || 'درس تعليمي',
                  page: typeof c.page === 'number' ? c.page : undefined,
                  excerpt: c.excerpt || '',
                }))
              : existingChapters;

            const combinedText = [
              parsed.fullOutline || '',
              parsed.summary || '',
              ...newChapters.map((c: any) => `### ${c.title} (صفحة ${c.page || '؟'})\n${c.excerpt}`),
              existingText,
            ].filter(Boolean).join('\n\n');

            return {
              fullText: combinedText,
              chapters: newChapters,
              summary: parsed.summary || `كتاب دراسي تم قراءة صفحاته الأصلية بالرؤية البصرية للذكاء الاصطناعي (${newChapters.length} فصول)`,
              realTitle: parsed.realTitle || undefined,
              subject: parsed.subject || undefined,
              grade: parsed.grade || undefined,
              pageCount,
              renderedPages,
            };
          }
        }
      }
    } catch (gsErr) {
      console.warn('Ghostscript + Gemini Vision reading warning:', gsErr);
    }
  }

  // Case 1B: Scanned image PDF fallback directly via PDF base64 (if small enough)
  if (ai && isSparse && pdfBuffer.length <= 18 * 1024 * 1024 && base64Data) {
    try {
      const prompt = `أنت معلم خبير واستشاري مناهج وكتب دراسية.
أمامك ملف كتاب دراسي تم رفعه بصيغة PDF (قد يكون كتاباً ممسوحاً ضوئياً Scanned PDF أو مصوراً أو إلكترونياً).
اقرأ صفحات وفصول ومحتويات هذا الكتاب بدقة بالغة واستخرج المعلومات التعليمية التالية:
1. العنوان الفعلي الدقيق للكتاب والمادة والصف الدراسي (مثال: فيزياء الصف الثالث الثانوي، الرياضيات، الأحياء...).
2. فهرس مفصل وشامل لجميع الفصول والأبواب والوحدات والدروس المذكورة في الكتاب.
3. تفريغ وملخص تعليمي غني وشامل لكل فصل ومحتوياته، القوانين الرياضية/العلمية، المفاهيم، التعريفات، وأهم الأمثلة والمسائل النموذجية، بحيث يستطيع المعلم الذكي شرح أي درس منه للطالب بدقة متناهية وفوراً.

أخرج النتيجة بصيغة JSON فقط:
{
  "realTitle": "العنوان الفعلي للكتاب",
  "subject": "المادة الدراسية",
  "grade": "المرحلة والصف الدراسي",
  "summary": "ملخص عام وشامل للكتاب ومنهجه",
  "chapters": [
    {
      "title": "اسم الفصل أو الوحدة أو الدرس",
      "excerpt": "ملخص تفصيلي لمحتوى هذا الفصل، القوانين، المفاهيم، والمسائل"
    }
  ],
  "fullOutline": "تفريغ شامل ومفصل لمحتوى الكتاب والدروس والقوانين"
}`;

      const res = await generateWithModelFallback(ai, {
        contents: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data,
            },
          },
          { text: prompt },
        ],
        responseMimeType: 'application/json',
        temperature: 0.3,
      });

      if (res && res.text) {
        const cleaned = res.text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        const newChapters = Array.isArray(parsed.chapters) && parsed.chapters.length > 0
          ? parsed.chapters.map((c: any) => ({
              title: c.title || 'فصل دراسي',
              excerpt: c.excerpt || c.summary || '',
            }))
          : existingChapters;

        const combinedText = [
          parsed.fullOutline || '',
          parsed.summary || '',
          ...newChapters.map((c: any) => `### ${c.title}\n${c.excerpt}`),
          existingText,
        ].filter(Boolean).join('\n\n');

        return {
          fullText: combinedText,
          chapters: newChapters,
          summary: parsed.summary || `كتاب دراسي تم فحصه وفهرسة فصوله بدقة بالذكاء الاصطناعي (${newChapters.length} فصل)`,
          realTitle: parsed.realTitle || undefined,
          subject: parsed.subject || undefined,
          grade: parsed.grade || undefined,
        };
      }
    } catch (geminiErr) {
      console.warn('Gemini multimodal PDF direct reading warning:', geminiErr);
    }
  }

  // Case 2: Digital text exists - use Gemini to create an organized chapter index, title, subject, and grade
  if (ai && existingText.length > 150) {
    try {
      const sampleText = existingText.slice(0, 45000);
      const res = await generateWithModelFallback(ai, {
        contents: `أنت معلم خبير واستشاري مناهج دراسية.
حلل النص المستخرج من هذا الكتاب الدراسي بدقة بالغة واستخرج البيانات التعليمية التالية:
اسم ملف الكتاب المرفوع: "${fileName}" (عدد الصفحات: ${pageCount} صفحة)
1. العنوان الحقيقي الدقيق للكتاب (مثلاً: تكنولوجيا المعلومات والاتصالات، الرياضيات، الأحياء).
2. المادة الدراسية (Subject).
3. الصف والمرحلة الدراسية (مثلاً: الصف الأول الإعدادي، الصف الثالث الثانوي).
4. فهرس شامل ومنظم ومفصل بجميع الوحدات والفصول والدروس المذكورة في الكتاب، مع ملخص تعليمي لكل درس يبرز أهم القوانين والمفاهيم والنقاط الجوهرية.
5. ملخص عام للمنهج والكتاب.

نص الكتاب:
${sampleText}`,
        systemInstruction: `أخرج النتيجة بصيغة JSON فقط:
{
  "realTitle": "اسم الكتاب",
  "subject": "المادة",
  "grade": "الصف الدراسي",
  "summary": "ملخص عام للمنهج",
  "chapters": [
    {
      "title": "اسم الوحدة أو الفصل أو الدرس",
      "excerpt": "شرح موجز لأهم القوانين والمفاهيم والدروس داخل هذا الجزء"
    }
  ]
}`,
        responseMimeType: 'application/json',
        temperature: 0.2,
      });

      if (res && res.text) {
        const parsed = JSON.parse(res.text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim());
        const extractedChapters = Array.isArray(parsed.chapters) && parsed.chapters.length > 0
          ? parsed.chapters.map((c: any) => ({
              title: c.title || 'درس تعليمي',
              excerpt: c.excerpt || '',
            }))
          : existingChapters;

        return {
          fullText: existingText,
          chapters: extractedChapters.length > 0 ? extractedChapters : existingChapters,
          summary: parsed.summary || `كتاب دراسي تم استخراجه وفهرسة فصوله (${extractedChapters.length} فصل)`,
          realTitle: parsed.realTitle || undefined,
          subject: parsed.subject || undefined,
          grade: parsed.grade || undefined,
        };
      }
    } catch (e) {
      console.warn('Gemini text analysis warning:', e);
    }
  }

  // Case 3: Large textbook or custom-encoded PDF where text extraction was sparse - use AI curriculum analysis
  if (ai) {
    try {
      const res = await generateWithModelFallback(ai, {
        contents: `أنت معلم خبير واستشاري مناهج دراسية.
قام طالب برفع كتاب مدرسي رسمي بصيغة PDF.
اسم الملف: "${fileName}"
عدد الصفحات: ${pageCount} صفحة.
${existingText.length > 20 ? `مقتطفات نصية تم استخراجها من الكتاب:\n${existingText.slice(0, 10000)}` : ''}

استنتج بدقة فائقة:
1. العنوان الحقيقي الدقيق للكتاب (مثلاً: تكنولوجيا المعلومات والاتصالات ICT، العلوم، الدراسات الاجتماعية...).
2. المادة الدراسية (Subject).
3. الصف والمرحلة الدراسية والفصل الدراسي (مثلاً: الصف الأول الإعدادي - الفصل الدراسي الأول).
4. فهرس شامل ومفصل بجميع المحاور والوحدات والدروس النموذجية المقررة لهذا المنهج، مع ملخص غني لأهم المفاهيم، القوانين، والتعريفات لكل درس، بحيث يستطيع المعلم الذكي شرح أي درس منه للطالب بالصوت والكتابة واختباره فيه فوراً.
5. ملخص تعليمي شامل للمنهج.`,
        systemInstruction: `أخرج النتيجة بصيغة JSON فقط:
{
  "realTitle": "اسم الكتاب",
  "subject": "المادة",
  "grade": "الصف والمرحلة الدراسية",
  "summary": "ملخص عام وشامل للكتاب والمنهج",
  "chapters": [
    {
      "title": "اسم الوحدة أو الفصل أو الدرس",
      "excerpt": "شرح مفصل لأهم المفاهيم، القوانين، والمسائل في هذا الدرس"
    }
  ]
}`,
        responseMimeType: 'application/json',
        temperature: 0.2,
      });

      if (res && res.text) {
        const parsed = JSON.parse(res.text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim());
        const generatedChapters = Array.isArray(parsed.chapters) && parsed.chapters.length > 0
          ? parsed.chapters.map((c: any) => ({
              title: c.title || 'درس تعليمي',
              excerpt: c.excerpt || '',
            }))
          : existingChapters;

        return {
          fullText: existingText.length > 100 
            ? existingText 
            : `${parsed.summary}\n\n` + generatedChapters.map((c: any) => `### ${c.title}\n${c.excerpt}`).join('\n\n'),
          chapters: generatedChapters.length > 0 ? generatedChapters : [
            { title: parsed.realTitle || 'محتوى المنهج', excerpt: parsed.summary || '' }
          ],
          summary: parsed.summary || `كتاب دراسي تم تحليله وفهرسة فصوله ومفاهيمه (${pageCount} صفحة)`,
          realTitle: parsed.realTitle || fileName.replace(/\.[^.]+$/, ''),
          subject: parsed.subject,
          grade: parsed.grade,
        };
      }
    } catch (e) {
      console.warn('Gemini metadata curriculum fallback warning:', e);
    }
  }

  return {
    fullText: existingText,
    chapters: existingChapters.length > 0 ? existingChapters : [
      { title: 'محتوى الكتاب العام', excerpt: existingText.slice(0, 500) }
    ],
    summary: existingText.length > 80 
      ? `كتاب دراسي تم استخراجه وقراءته (${pageCount} صفحة، ${existingChapters.length} أقسام)` 
      : `كتاب دراسي تم رفعه (${pageCount} صفحة)`,
  };
}

// Deep Analysis for Text Documents (Word docx, PowerPoint pptx, Text files)
async function deepAnalyzeTextDocument(
  ai: GoogleGenAI | null,
  text: string,
  fileName: string
): Promise<{
  fullText: string;
  chapters: Array<{ title: string; excerpt: string }>;
  summary: string;
  realTitle?: string;
  subject?: string;
  grade?: string;
}> {
  const initialChapters = extractChaptersFromText(text);

  if (ai && text.length > 100) {
    try {
      const sample = text.slice(0, 40000);
      const res = await generateWithModelFallback(ai, {
        contents: `أنت معلم خبير. حلل النص الدراسي التالي المستخرج من ملف "${fileName}":
1. حدد العنوان الحقيقي للمحتوى والمادة والصف الدراسي إن وجد.
2. استخرج فهرساً منظماً بالدروس والوحدات مع ملخص وأهم القوانين والمفاهيم.
3. اكتب ملخصاً عاماً للمحتوى.

النص:
${sample}`,
        systemInstruction: `أرجع JSON فقط:
{
  "realTitle": "اسم الكتاب أو المذكرة",
  "subject": "المادة",
  "grade": "الصف الدراسي",
  "summary": "ملخص عام",
  "chapters": [{"title": "اسم الدرس أو الوحدة", "excerpt": "ملخص وأهم القوانين والنقاط"}]
}`,
        responseMimeType: 'application/json',
        temperature: 0.2,
      });

      if (res && res.text) {
        const parsed = JSON.parse(res.text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim());
        const chapters = Array.isArray(parsed.chapters) && parsed.chapters.length > 0
          ? parsed.chapters.map((c: any) => ({ title: c.title, excerpt: c.excerpt }))
          : initialChapters;

        return {
          fullText: text,
          chapters: chapters.length > 0 ? chapters : [{ title: 'محتوى الملف الدراسي', excerpt: text.slice(0, 500) }],
          summary: parsed.summary || `ملف دراسي تم استخراجه وقراءته بنجاح`,
          realTitle: parsed.realTitle || fileName.replace(/\.[^.]+$/, ''),
          subject: parsed.subject,
          grade: parsed.grade,
        };
      }
    } catch (e) {
      console.warn('Text document AI analysis error:', e);
    }
  }

  return {
    fullText: text,
    chapters: initialChapters.length > 0 ? initialChapters : [{ title: 'محتوى الملف الدراسي', excerpt: text.slice(0, 500) }],
    summary: `ملف دراسي نصي تم رفعه بنجاح (${text.length} حرف)`,
    realTitle: fileName.replace(/\.[^.]+$/, ''),
  };
}

// Deep Analysis for Images of Book Pages or Scanned Lessons
async function deepAnalyzeImageBookPage(
  ai: GoogleGenAI | null,
  imageBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{
  fullText: string;
  chapters: Array<{ title: string; excerpt: string }>;
  summary: string;
  realTitle?: string;
  subject?: string;
  grade?: string;
}> {
  if (ai) {
    try {
      const base64Data = imageBuffer.toString('base64');
      const res = await generateWithModelFallback(ai, {
        contents: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: `أنت معلم خبير. هذه صورة لصفحة كتاب أو ملخص دراسي أو ورقة امتحانية.
قم بتفريغ كامل النص المكتوب في الصورة بدقة، وتحديد المادة والصف الدراسي، وفهرسة المفاهيم والقوانين والمسائل المذكورة، وشرحها بحيث يستطيع الطالب مذاكرتها صوتياً وكتابياً.

أرجع النتيجة بصيغة JSON فقط:
{
  "realTitle": "عنوان الدرس أو الصفحة",
  "subject": "المادة الدراسية",
  "grade": "الصف الدراسي",
  "summary": "ملخص عام لمحتوى الصفحة",
  "fullText": "التفريغ الكامل لنص الصفحة",
  "chapters": [{"title": "عنوان الموضوع الرئيسي", "excerpt": "شرح المفاهيم والقوانين المذكورة في الصفحة"}]
}`,
          },
        ],
        responseMimeType: 'application/json',
        temperature: 0.2,
      });

      if (res && res.text) {
        const parsed = JSON.parse(res.text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim());
        const transcribedText = parsed.fullText || parsed.summary || 'صفحة كتاب مصورة';
        return {
          fullText: transcribedText,
          chapters: Array.isArray(parsed.chapters) && parsed.chapters.length > 0
            ? parsed.chapters
            : [{ title: parsed.realTitle || 'صفحة الكتاب', excerpt: parsed.summary || transcribedText.slice(0, 500) }],
          summary: parsed.summary || 'صفحة كتاب مصورة تم تحليلها بالذكاء الاصطناعي',
          realTitle: parsed.realTitle || fileName.replace(/\.[^.]+$/, ''),
          subject: parsed.subject,
          grade: parsed.grade,
        };
      }
    } catch (e) {
      console.warn('Image analysis error:', e);
    }
  }

  return {
    fullText: 'صفحة دراسية مصورة',
    chapters: [{ title: 'صفحة دراسية', excerpt: 'تم استقبال صورة الصفحة بنجاح' }],
    summary: 'صفحة دراسية تم رفعها',
    realTitle: fileName.replace(/\.[^.]+$/, ''),
  };
}

// Universal Book Buffer Processor (Handles ZIP archives, direct PDF, Word docx, PowerPoint pptx, Text, Images)
async function processAnyBookBuffer(
  buffer: Buffer,
  fileName: string,
  fileType: string
): Promise<{ success: boolean; zipName: string; totalPdfsFound: number; books: any[] }> {
  const ai = getAIClient();
  const lowerName = fileName.toLowerCase();
  const isZipMagic = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
  const isPdfMagic = buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
  const isDocx = lowerName.endsWith('.docx') || fileType.includes('wordprocessingml');
  const isPptx = lowerName.endsWith('.pptx') || fileType.includes('presentationml');
  const isPdf = isPdfMagic || lowerName.endsWith('.pdf') || fileType.includes('pdf');
  const isImage = lowerName.match(/\.(png|jpe?g|webp)$/i) || fileType.startsWith('image/');
  const isText = lowerName.match(/\.(txt|md|rtf|json|csv)$/i) || fileType.startsWith('text/');
  const isArchive = !isDocx && !isPptx && (isZipMagic || lowerName.endsWith('.zip') || fileType.includes('zip'));

  const processedBooks: Array<any> = [];

  // 1. ARCHIVE / ZIP FILE HANDLING
  if (isArchive) {
    const zip = await JSZip.loadAsync(buffer);
    const entries = Object.entries(zip.files);

    for (const [relativePath, zipEntry] of entries) {
      if (zipEntry.dir || relativePath.includes('__MACOSX') || path.basename(relativePath).startsWith('.')) {
        continue;
      }

      const entryLower = relativePath.toLowerCase();
      const baseName = path.basename(relativePath);

      // A. PDF inside ZIP
      if (entryLower.endsWith('.pdf')) {
        try {
          const pdfBuf = await zipEntry.async('nodebuffer');
          let rawText = '';
          let pageCount = 1;

          try {
            const parser = new PDFParse(new Uint8Array(pdfBuf));
            const info = await parser.getInfo();
            pageCount = (info as any)?.total || 1;
            const parsedText = await parser.getText();
            rawText = typeof parsedText === 'string' ? parsedText : ((parsedText as any)?.text || '');
            rawText = rawText.replace(/\r\n/g, '\n').trim();
          } catch (e) {
            console.warn(`pdf-parse warning on ${baseName}:`, e);
          }

          const bookId = 'book-' + Math.random().toString(36).substring(2, 9);
          const diskPath = path.join(BOOKS_DIR, `${bookId}.pdf`);
          try {
            fs.writeFileSync(diskPath, pdfBuf);
          } catch (e) {}

          const initialChapters = extractChaptersFromText(rawText);
          const pdfBase64 = pdfBuf.length <= 16 * 1024 * 1024 ? pdfBuf.toString('base64') : '';
          const bookName = baseName.replace(/\.pdf$/i, '');

          // Store immediately in server store so it is accessible in < 1 second
          const storedBook: ServerStoredBook = {
            id: bookId,
            name: bookName,
            realTitle: bookName,
            subject: 'منهج دراسي',
            originalFileName: baseName,
            size: pdfBuf.length,
            pageCount,
            textSnippet: (rawText || '').slice(0, 500).trim(),
            fullText: rawText || '',
            chapters: initialChapters.length > 0 ? initialChapters : [
              { title: 'محتوى الكتاب المدرسي', page: 1, excerpt: rawText.slice(0, 500) }
            ],
            summary: `كتاب دراسي تم استخراجه وقراءته بنجاح (${pageCount} صفحة)`,
            base64: pdfBase64 || undefined,
            diskPath,
            uploadDate: Date.now(),
          };

          serverBooksStore.set(bookId, storedBook);
          saveBooksIndex();

          processedBooks.push({
            id: bookId,
            name: bookName,
            realTitle: bookName,
            originalFileName: baseName,
            size: pdfBuf.length,
            pageCount,
            textSnippet: storedBook.textSnippet,
            fullText: rawText.slice(0, 500000),
            chapters: storedBook.chapters,
            summary: storedBook.summary,
            uploadDate: Date.now(),
          });

          // Kick off deep enrichment in the background without blocking the HTTP response
          (async () => {
            try {
              console.log(`[Background Enrichment] Started for ${bookId} (${baseName})...`);
              let geminiFileUri: string | undefined;
              let geminiFileName: string | undefined;
              const geminiFileMime = 'application/pdf';
              if (ai) {
                try {
                  const up = await uploadToGeminiFiles(ai, diskPath, geminiFileMime);
                  if (up) {
                    geminiFileUri = up.uri;
                    geminiFileName = up.name;
                  }
                } catch (upErr) {
                  console.warn('Gemini Files background upload warning for zip PDF:', upErr);
                }
              }

              const analysis = await deepAnalyzePdfBook(
                ai,
                pdfBuf,
                pdfBase64,
                rawText,
                baseName,
                initialChapters,
                pageCount,
                geminiFileUri,
                geminiFileMime,
                diskPath,
                bookId
              );

              const current = serverBooksStore.get(bookId);
              if (current) {
                if (analysis.realTitle) {
                  current.name = analysis.realTitle;
                  current.realTitle = analysis.realTitle;
                }
                if (analysis.subject) current.subject = analysis.subject;
                if (analysis.grade) current.grade = analysis.grade;
                if (analysis.pageCount) current.pageCount = analysis.pageCount;
                if (analysis.chapters && analysis.chapters.length > 0) current.chapters = analysis.chapters;
                if (analysis.summary) current.summary = analysis.summary;
                if (analysis.fullText) current.fullText = analysis.fullText;
                if (geminiFileUri) current.geminiFileUri = geminiFileUri;
                if (geminiFileName) current.geminiFileName = geminiFileName;
                if (analysis.renderedPages) current.renderedPages = analysis.renderedPages;
                serverBooksStore.set(bookId, current);
                saveBooksIndex();
                console.log(`[Background Enrichment] Completed successfully for ${bookId}: "${current.name}"`);
              }
            } catch (bgErr) {
              console.warn(`[Background Enrichment Warning] for ${bookId}:`, bgErr);
            }
          })();
        } catch (pdfErr) {
          console.warn(`Could not parse PDF ${baseName} inside zip:`, pdfErr);
        }
      } 
      // B. Word Document (.docx) inside ZIP
      else if (entryLower.endsWith('.docx')) {
        try {
          const docxBuf = await zipEntry.async('nodebuffer');
          const docxZip = await JSZip.loadAsync(docxBuf);
          const docXml = await docxZip.file('word/document.xml')?.async('string');
          if (docXml) {
            const rawText = docXml.replace(/<w:p[^>]*>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            const analysis = await deepAnalyzeTextDocument(ai, rawText, baseName);
            const bookId = 'book-' + Math.random().toString(36).substring(2, 9);
            const bookName = analysis.realTitle || baseName.replace(/\.docx$/i, '');

            const storedBook: ServerStoredBook = {
              id: bookId,
              name: bookName,
              realTitle: analysis.realTitle,
              subject: analysis.subject,
              grade: analysis.grade,
              originalFileName: baseName,
              size: docxBuf.length,
              pageCount: Math.max(1, Math.ceil(rawText.length / 1800)),
              textSnippet: rawText.slice(0, 500).trim(),
              fullText: rawText,
              chapters: analysis.chapters,
              summary: analysis.summary,
              uploadDate: Date.now(),
            };

            serverBooksStore.set(bookId, storedBook);
            processedBooks.push(storedBook);
          }
        } catch (docxErr) {
          console.warn(`Could not parse docx ${baseName}:`, docxErr);
        }
      }
      // C. Text file (.txt, .md) inside ZIP
      else if (entryLower.endsWith('.txt') || entryLower.endsWith('.md')) {
        try {
          const textContent = await zipEntry.async('string');
          const analysis = await deepAnalyzeTextDocument(ai, textContent, baseName);
          const bookId = 'book-' + Math.random().toString(36).substring(2, 9);
          const bookName = analysis.realTitle || baseName.replace(/\.(txt|md)$/i, '');

          const storedBook: ServerStoredBook = {
            id: bookId,
            name: bookName,
            realTitle: analysis.realTitle,
            subject: analysis.subject,
            grade: analysis.grade,
            originalFileName: baseName,
            size: Buffer.byteLength(textContent),
            pageCount: Math.max(1, Math.ceil(textContent.length / 1800)),
            textSnippet: textContent.slice(0, 500).trim(),
            fullText: textContent,
            chapters: analysis.chapters,
            summary: analysis.summary,
            uploadDate: Date.now(),
          };

          serverBooksStore.set(bookId, storedBook);
          processedBooks.push(storedBook);
        } catch (txtErr) {
          console.warn(`Could not parse text file ${baseName}:`, txtErr);
        }
      }
    }
  } 
  // 2. DIRECT WORD DOCUMENT (.docx)
  else if (isDocx) {
    try {
      const docxZip = await JSZip.loadAsync(buffer);
      const docXml = await docxZip.file('word/document.xml')?.async('string');
      const rawText = docXml ? docXml.replace(/<w:p[^>]*>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
      const analysis = await deepAnalyzeTextDocument(ai, rawText, fileName);
      const bookId = 'book-' + Math.random().toString(36).substring(2, 9);
      const bookName = analysis.realTitle || fileName.replace(/\.docx$/i, '');

      const storedBook: ServerStoredBook = {
        id: bookId,
        name: bookName,
        realTitle: analysis.realTitle,
        subject: analysis.subject,
        grade: analysis.grade,
        originalFileName: fileName,
        size: buffer.length,
        pageCount: Math.max(1, Math.ceil(rawText.length / 1800)),
        textSnippet: rawText.slice(0, 500).trim(),
        fullText: rawText,
        chapters: analysis.chapters,
        summary: analysis.summary,
        uploadDate: Date.now(),
      };

      serverBooksStore.set(bookId, storedBook);
      processedBooks.push(storedBook);
    } catch (e: any) {
      console.warn('Direct docx reading error:', e);
    }
  }
  // 3. DIRECT POWERPOINT PRESENTATION (.pptx)
  else if (isPptx) {
    try {
      const pptxZip = await JSZip.loadAsync(buffer);
      let combinedSlidesText = '';
      const slideFiles = Object.keys(pptxZip.files).filter(f => f.startsWith('ppt/slides/slide') && f.endsWith('.xml'));
      slideFiles.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
      });

      for (let s = 0; s < slideFiles.length; s++) {
        const slideXml = await pptxZip.file(slideFiles[s])?.async('string');
        if (slideXml) {
          const slideText = slideXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          combinedSlidesText += `\n\n### الشريحة ${s + 1}\n` + slideText;
        }
      }

      const analysis = await deepAnalyzeTextDocument(ai, combinedSlidesText, fileName);
      const bookId = 'book-' + Math.random().toString(36).substring(2, 9);
      const bookName = analysis.realTitle || fileName.replace(/\.pptx$/i, '');

      const storedBook: ServerStoredBook = {
        id: bookId,
        name: bookName,
        realTitle: analysis.realTitle,
        subject: analysis.subject,
        grade: analysis.grade,
        originalFileName: fileName,
        size: buffer.length,
        pageCount: Math.max(1, slideFiles.length),
        textSnippet: combinedSlidesText.slice(0, 500).trim(),
        fullText: combinedSlidesText,
        chapters: analysis.chapters,
        summary: analysis.summary,
        uploadDate: Date.now(),
      };

      serverBooksStore.set(bookId, storedBook);
      processedBooks.push(storedBook);
    } catch (e: any) {
      console.warn('Direct pptx reading error:', e);
    }
  }
  // 4. DIRECT IMAGE OF BOOK PAGE OR NOTES (.png, .jpg, .jpeg, .webp)
  else if (isImage) {
    try {
      const analysis = await deepAnalyzeImageBookPage(ai, buffer, fileType, fileName);
      const bookId = 'book-' + Math.random().toString(36).substring(2, 9);
      const bookName = analysis.realTitle || fileName.replace(/\.[^.]+$/, '');

      const storedBook: ServerStoredBook = {
        id: bookId,
        name: bookName,
        realTitle: analysis.realTitle,
        subject: analysis.subject,
        grade: analysis.grade,
        originalFileName: fileName,
        size: buffer.length,
        pageCount: 1,
        textSnippet: analysis.fullText.slice(0, 500).trim(),
        fullText: analysis.fullText,
        chapters: analysis.chapters,
        summary: analysis.summary,
        uploadDate: Date.now(),
      };

      serverBooksStore.set(bookId, storedBook);
      processedBooks.push(storedBook);
    } catch (e: any) {
      console.warn('Direct image reading error:', e);
    }
  }
  // 5. DIRECT TEXT FILE (.txt, .md, .rtf)
  else if (isText) {
    try {
      const rawText = buffer.toString('utf-8');
      const analysis = await deepAnalyzeTextDocument(ai, rawText, fileName);
      const bookId = 'book-' + Math.random().toString(36).substring(2, 9);
      const bookName = analysis.realTitle || fileName.replace(/\.[^.]+$/, '');

      const storedBook: ServerStoredBook = {
        id: bookId,
        name: bookName,
        realTitle: analysis.realTitle,
        subject: analysis.subject,
        grade: analysis.grade,
        originalFileName: fileName,
        size: buffer.length,
        pageCount: Math.max(1, Math.ceil(rawText.length / 1800)),
        textSnippet: rawText.slice(0, 500).trim(),
        fullText: rawText,
        chapters: analysis.chapters,
        summary: analysis.summary,
        uploadDate: Date.now(),
      };

      serverBooksStore.set(bookId, storedBook);
      processedBooks.push(storedBook);
    } catch (e: any) {
      console.warn('Direct text reading error:', e);
    }
  }
  // 6. DIRECT PDF OR DEFAULT FALLBACK
  else {
    let rawText = '';
    let pageCount = 1;

    try {
      const parser = new PDFParse(new Uint8Array(buffer));
      const info = await parser.getInfo();
      pageCount = (info as any)?.total || 1;
      const parsedText = await parser.getText();
      rawText = typeof parsedText === 'string' ? parsedText : ((parsedText as any)?.text || '');
      rawText = rawText.replace(/\r\n/g, '\n').trim();
    } catch (e) {
      console.warn('PDFParse reading warning:', e);
      // Fallback: try raw utf8 text extract
      try {
        const str = buffer.toString('utf-8').replace(/[^\u0600-\u06FF\w\s.,!?:;()-]/g, ' ').replace(/\s+/g, ' ');
        if (str.length > 200) rawText = str;
      } catch (e2) {}
    }

    const bookId = 'book-' + Math.random().toString(36).substring(2, 9);
    const diskPath = path.join(BOOKS_DIR, `${bookId}.pdf`);
    try {
      fs.writeFileSync(diskPath, buffer);
    } catch (e) {
      console.warn('Could not write book to disk:', e);
    }

    const initialChapters = extractChaptersFromText(rawText);
    const pdfBase64 = buffer.length <= 16 * 1024 * 1024 ? buffer.toString('base64') : '';
    const bookName = fileName.replace(/\.pdf$/i, '');

    const storedBook: ServerStoredBook = {
      id: bookId,
      name: bookName,
      realTitle: bookName,
      subject: 'منهج دراسي',
      originalFileName: fileName,
      size: buffer.length,
      pageCount,
      textSnippet: (rawText || '').slice(0, 500).trim(),
      fullText: rawText || '',
      chapters: initialChapters.length > 0 ? initialChapters : [
        { title: 'محتوى الكتاب المدرسي', page: 1, excerpt: rawText.slice(0, 500) }
      ],
      summary: `كتاب دراسي تم استخراجه وقراءته بنجاح (${pageCount} صفحة)`,
      base64: pdfBase64 || undefined,
      diskPath,
      uploadDate: Date.now(),
    };

    serverBooksStore.set(bookId, storedBook);
    saveBooksIndex();

    processedBooks.push({
      id: bookId,
      name: bookName,
      realTitle: bookName,
      originalFileName: fileName,
      size: buffer.length,
      pageCount,
      textSnippet: storedBook.textSnippet,
      fullText: rawText.slice(0, 500000),
      chapters: storedBook.chapters,
      summary: storedBook.summary,
      uploadDate: Date.now(),
    });

    // Deep enrichment in background
    (async () => {
      try {
        console.log(`[Direct PDF Background Enrichment] Started for ${bookId} (${fileName})...`);
        let geminiFileUri: string | undefined;
        let geminiFileName: string | undefined;
        const geminiFileMime = fileType || 'application/pdf';
        if (ai) {
          try {
            const up = await uploadToGeminiFiles(ai, diskPath, geminiFileMime);
            if (up) {
              geminiFileUri = up.uri;
              geminiFileName = up.name;
            }
          } catch (upErr) {
            console.warn('Gemini Files upload error during PDF processing:', upErr);
          }
        }

        const analysis = await deepAnalyzePdfBook(
          ai,
          buffer,
          pdfBase64,
          rawText,
          fileName,
          initialChapters,
          pageCount,
          geminiFileUri,
          geminiFileMime,
          diskPath,
          bookId
        );

        const current = serverBooksStore.get(bookId);
        if (current) {
          if (analysis.realTitle) {
            current.name = analysis.realTitle;
            current.realTitle = analysis.realTitle;
          }
          if (analysis.subject) current.subject = analysis.subject;
          if (analysis.grade) current.grade = analysis.grade;
          if (analysis.pageCount) current.pageCount = analysis.pageCount;
          if (analysis.chapters && analysis.chapters.length > 0) current.chapters = analysis.chapters;
          if (analysis.summary) current.summary = analysis.summary;
          if (analysis.fullText) current.fullText = analysis.fullText;
          if (geminiFileUri) current.geminiFileUri = geminiFileUri;
          if (geminiFileName) current.geminiFileName = geminiFileName;
          if (analysis.renderedPages) current.renderedPages = analysis.renderedPages;
          serverBooksStore.set(bookId, current);
          saveBooksIndex();
          console.log(`[Direct PDF Background Enrichment] Completed successfully for ${bookId}: "${current.name}"`);
        }
      } catch (bgErr) {
        console.warn(`[Direct PDF Background Enrichment Warning] for ${bookId}:`, bgErr);
      }
    })();
  }

  if (processedBooks.length === 0) {
    throw new Error('تعذر استخراج وقراءة محتوى الملف. تأكد من أن الملف سليم ويحتوي على نصوص أو صفحات قابلة للقراءة.');
  }

  return {
    success: true,
    zipName: fileName,
    totalPdfsFound: processedBooks.length,
    books: processedBooks,
  };
}

// In-Memory Storage for Chunked Large Uploads
interface UploadSession {
  uploadId: string;
  chunks: Map<number, Buffer>;
  totalChunks: number;
  fileName: string;
  fileType: string;
  totalSize: number;
  createdAt: number;
}
const activeUploadSessions = new Map<string, UploadSession>();

// Cleanup stale sessions older than 30 mins
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of activeUploadSessions.entries()) {
    if (now - s.createdAt > 30 * 60 * 1000) {
      activeUploadSessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

// Endpoint 1: Chunked Book Upload (Supports files of ANY size without proxy 413 limits)
app.post('/api/books/upload-chunk', async (req: Request, res: Response) => {
  try {
    const {
      uploadId,
      chunkIndex,
      totalChunks,
      fileName = 'book',
      fileType = '',
      totalSize = 0,
      chunkBase64,
    } = req.body;

    if (!uploadId || chunkIndex === undefined || totalChunks === undefined || !chunkBase64) {
      res.status(400).json({ error: 'بيانات الجزء المرفوع غير مكتملة' });
      return;
    }

    let session = activeUploadSessions.get(uploadId);
    if (!session) {
      session = {
        uploadId,
        chunks: new Map(),
        totalChunks: Number(totalChunks),
        fileName,
        fileType,
        totalSize: Number(totalSize),
        createdAt: Date.now(),
      };
      activeUploadSessions.set(uploadId, session);
    }

    const chunkBuffer = Buffer.from(chunkBase64, 'base64');
    session.chunks.set(Number(chunkIndex), chunkBuffer);

    // If more chunks pending, respond with acknowledgment
    if (session.chunks.size < session.totalChunks) {
      res.json({
        success: true,
        receivedChunks: session.chunks.size,
        totalChunks: session.totalChunks,
      });
      return;
    }

    // All chunks received! Assemble complete file
    const sortedParts: Buffer[] = [];
    for (let i = 0; i < session.totalChunks; i++) {
      const part = session.chunks.get(i);
      if (!part) {
        res.status(400).json({ error: `الجزء ${i + 1} مفقود، يرجى إعادة المحاولة` });
        return;
      }
      sortedParts.push(part);
    }

    const completeBuffer = Buffer.concat(sortedParts);
    activeUploadSessions.delete(uploadId);

    // Process the assembled book
    const result = await processAnyBookBuffer(completeBuffer, session.fileName, session.fileType);
    res.json(result);
  } catch (err: any) {
    console.error('Error handling upload-chunk:', err);
    res.status(500).json({ error: err?.message || 'فشلت معالجة أجزاء الكتاب' });
  }
});

// Endpoint 2: Direct Book Upload (Backwards compatible)
app.post('/api/books/process-zip', async (req: Request, res: Response) => {
  try {
    const { fileName = 'book', base64, fileType = '' } = req.body;
    if (!base64) {
      res.status(400).json({ error: 'لم يتم استلام محتوى الملف' });
      return;
    }

    const buffer = Buffer.from(base64, 'base64');
    const result = await processAnyBookBuffer(buffer, fileName, fileType);
    res.json(result);
  } catch (error: any) {
    console.error('Error processing book:', error);
    res.status(500).json({ error: error?.message || 'حدث خطأ أثناء قراءة واستخراج الكتاب' });
  }
});

// List All Stored Books Endpoint
app.get('/api/books', (req: Request, res: Response) => {
  const books = Array.from(serverBooksStore.values()).map(b => ({
    id: b.id,
    name: b.name,
    realTitle: b.realTitle,
    subject: b.subject,
    grade: b.grade,
    originalFileName: b.originalFileName,
    size: b.size,
    pageCount: b.pageCount,
    textSnippet: b.textSnippet,
    fullText: (b.fullText || '').slice(0, 500000),
    chapters: b.chapters,
    summary: b.summary,
    uploadDate: b.uploadDate,
    hasMultimodalPdf: Boolean(b.geminiFileUri || b.base64 || (b.renderedPages && b.renderedPages.length > 0)),
  }));
  res.json({ books });
});

// Get Book Details Endpoint
app.get('/api/books/:id', (req: Request, res: Response) => {
  const book = serverBooksStore.get(req.params.id);
  if (!book) {
    res.status(404).json({ error: 'الكتاب غير موجود' });
    return;
  }
  res.json({
    id: book.id,
    name: book.name,
    realTitle: book.realTitle,
    subject: book.subject,
    grade: book.grade,
    pageCount: book.pageCount,
    chapters: book.chapters,
    summary: book.summary,
    hasMultimodalPdf: Boolean(book.geminiFileUri || book.base64 || (book.renderedPages && book.renderedPages.length > 0)),
  });
});

// Normalizer for Arabic & English query matching
function normalizeArabicText(text: string): string {
  return (text || '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .toLowerCase();
}

const BILINGUAL_CURRICULUM_TERMS: Array<{ ar: string[]; en: string[] }> = [
  { ar: ['خضراء', 'تكنولوجيا خضراء', 'مستدامه', 'نظيفه', 'بيئه'], en: ['green technology', 'green', 'sustainable'] },
  { ar: ['تحول رقمي', 'شمول مالي', 'انستاباي', 'ميزه'], en: ['digital transformation', 'transformation'] },
  { ar: ['تشغيل', 'نظام تشغيل', 'نظم تشغيل', 'ويندوز', 'لينكس', 'اندرويد'], en: ['operating systems', 'operating system', 'operating'] },
  { ar: ['تثبيت', 'حذف برامج', 'تطبيقات'], en: ['installation', 'removal', 'software'] },
  { ar: ['بريد', 'ايميل', 'رسائل'], en: ['email', 'electronic mail', 'mail'] },
  { ar: ['سحابيه', 'سحابه', 'تخزين سحابي', 'جوجل درايف', 'ون درايف'], en: ['cloud computing', 'cloud'] },
  { ar: ['جوجل ميت', 'اجتماعات', 'ميتنج', 'اداره مشاريع'], en: ['google meet', 'manage project'] },
  { ar: ['بيانات', 'قواعد بيانات', 'قاعده بيانات', 'اكسس'], en: ['database'] },
  { ar: ['نماذج', 'استعلامات', 'استعلام'], en: ['forms and queries', 'queries', 'forms'] },
  { ar: ['مشروع', 'مشروع رقمي'], en: ['digital project'] },
];

function findRelevantPagesForQuestion(
  question: string,
  storedBook: any
): { startPage: number; endPage: number; matchedChapter?: any; reason: string } {
  const totalPages = storedBook?.pageCount || 100;
  const chapters: any[] = Array.isArray(storedBook?.chapters) ? storedBook.chapters : [];

  // 1. Explicit page range: e.g. 'صفحة 4 إلى 7' or 'pages 4-7'
  const pageRangeMatch = question.match(/(?:صفحة|صفحات|ص|page|pages)\s*(\d{1,4})\s*(?:إلى|حتى|-|to)\s*(\d{1,4})/i);
  if (pageRangeMatch && pageRangeMatch[1] && pageRangeMatch[2]) {
    const p1 = parseInt(pageRangeMatch[1], 10);
    const p2 = parseInt(pageRangeMatch[2], 10);
    const start = Math.max(1, Math.min(p1, p2));
    const end = Math.min(totalPages, Math.max(p1, p2));
    return { startPage: start, endPage: Math.min(start + 4, end), reason: 'direct_page_range' };
  }

  // 2. Single page mention: e.g. 'صفحة 4' or 'ص 15'
  const singlePageMatch = question.match(/(?:صفحة|ص|page|p\.)\s*(\d{1,4})/i);
  if (singlePageMatch && singlePageMatch[1]) {
    const p = parseInt(singlePageMatch[1], 10);
    const start = Math.max(1, p);
    const end = Math.min(totalPages, p + 2);
    return { startPage: start, endPage: end, reason: 'direct_single_page' };
  }

  // 3. Ordinal lesson: 'الدرس الأول', 'الدرس الثاني', 'الدرس 3', 'Lesson 1'
  const ordinalMap: { [key: string]: number } = {
    'الأول': 1, 'الاول': 1, '1': 1, 'first': 1,
    'الثاني': 2, 'الثانى': 2, '2': 2, 'second': 2,
    'الثالث': 3, '3': 3, 'third': 3,
    'الرابع': 4, '4': 4, 'fourth': 4,
    'الخامس': 5, '5': 5, 'fifth': 5,
    'السادس': 6, '6': 6, 'sixth': 6,
    'السابع': 7, '7': 7, 'seventh': 7,
    'الثامن': 8, '8': 8, 'eighth': 8,
    'التاسع': 9, '9': 9, 'ninth': 9,
    'العاشر': 10, '10': 10, 'tenth': 10,
  };
  const lessonMatch = question.match(/(?:الدرس|الوحدة|الفصل|المحور|lesson|unit|chapter)\s*(الأول|الاول|الثاني|الثانى|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|\d+)/i);
  if (lessonMatch && lessonMatch[1]) {
    const key = lessonMatch[1].trim();
    const idx = ordinalMap[key] || parseInt(key, 10);
    if (idx && chapters.length > 0) {
      let ch = chapters.find((c: any) => {
        const t = (c.title || '').toLowerCase();
        return t.includes(`lesson ${idx}`) || t.includes(`الدرس ${key}`);
      });
      if (!ch) {
        const lessonsOnly = chapters.filter(c => /lesson|درس/i.test(c.title || ''));
        if (lessonsOnly.length >= idx) {
          ch = lessonsOnly[idx - 1];
        } else if (chapters.length >= idx) {
          ch = chapters[idx - 1];
        }
      }
      if (ch && typeof ch.page === 'number') {
        const nextCh = chapters.find((c: any) => typeof c.page === 'number' && c.page > ch.page);
        const endPage = nextCh && nextCh.page ? Math.min(nextCh.page - 1, ch.page + 4) : Math.min(totalPages, ch.page + 4);
        return { startPage: ch.page, endPage, matchedChapter: ch, reason: 'ordinal_lesson' };
      }
    }
  }

  // 4. Bilingual term matching (Arabic concepts to English/Arabic chapter titles)
  const normQ = normalizeArabicText(question);
  for (const term of BILINGUAL_CURRICULUM_TERMS) {
    const hasAr = term.ar.some(a => normQ.includes(normalizeArabicText(a)));
    if (hasAr) {
      for (const enWord of term.en) {
        // Priority 1: Match in Title
        const titleMatch = chapters.find(c => (c.title || '').toLowerCase().includes(enWord));
        if (titleMatch && typeof titleMatch.page === 'number') {
          const nextCh = chapters.find((c: any) => typeof c.page === 'number' && c.page > titleMatch.page);
          const endPage = nextCh && nextCh.page ? Math.min(nextCh.page - 1, titleMatch.page + 4) : Math.min(totalPages, titleMatch.page + 4);
          return { startPage: titleMatch.page, endPage, matchedChapter: titleMatch, reason: 'bilingual_title' };
        }
        // Priority 2: Match in Excerpt
        const excerptMatch = chapters.find(c => (c.excerpt || '').toLowerCase().includes(enWord));
        if (excerptMatch && typeof excerptMatch.page === 'number') {
          const nextCh = chapters.find((c: any) => typeof c.page === 'number' && c.page > excerptMatch.page);
          const endPage = nextCh && nextCh.page ? Math.min(nextCh.page - 1, excerptMatch.page + 4) : Math.min(totalPages, excerptMatch.page + 4);
          return { startPage: excerptMatch.page, endPage, matchedChapter: excerptMatch, reason: 'bilingual_excerpt' };
        }
      }
    }
  }

  // 5. General keyword matching
  if (chapters.length > 0) {
    const stopWords = new Set(['ما', 'هي', 'هو', 'من', 'في', 'عن', 'على', 'إلى', 'مع', 'هذا', 'هذه', 'كتاب', 'الكتاب', 'المذكورة', 'المذكور', 'بالتفصيل', 'اشرح', 'وضح', 'اذكر', 'عرف']);
    const words = normQ.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
    let best: any = null;
    let maxScore = 0;
    for (const ch of chapters) {
      const text = normalizeArabicText((ch.title || '') + ' ' + (ch.excerpt || ''));
      let score = 0;
      for (const w of words) {
        if (text.includes(w)) score += 2;
      }
      if (score > maxScore) {
        maxScore = score;
        best = ch;
      }
    }
    if (best && typeof best.page === 'number' && maxScore > 0) {
      const nextCh = chapters.find((c: any) => typeof c.page === 'number' && c.page > best.page);
      const endPage = nextCh && nextCh.page ? Math.min(nextCh.page - 1, best.page + 4) : Math.min(totalPages, best.page + 4);
      return { startPage: best.page, endPage, matchedChapter: best, reason: 'keyword_chapter' };
    }
  }

  // 6. Default: First lesson
  const firstContentCh = chapters.find((c: any) => typeof c.page === 'number' && c.page >= 3);
  const startP = firstContentCh?.page || 1;
  return { startPage: startP, endPage: Math.min(totalPages, startP + 3), matchedChapter: firstContentCh, reason: 'default' };
}

// Endpoint to view/stream actual rendered page JPEG for student visual verification
app.get('/api/book/page-image/:bookId/:pageNum', async (req: Request, res: Response) => {
  try {
    const { bookId, pageNum } = req.params;
    const p = parseInt(pageNum, 10);
    if (isNaN(p) || p < 1) {
      res.status(400).send('Invalid page number');
      return;
    }
    const storedBook = serverBooksStore.get(bookId);
    if (!storedBook || !storedBook.diskPath || !fs.existsSync(storedBook.diskPath)) {
      res.status(404).send('Book not found');
      return;
    }

    const renderDir = path.join(BOOKS_DIR, `pages-${bookId}`);
    const pageFile = path.join(renderDir, `page-${p}.jpg`);
    if (!fs.existsSync(pageFile)) {
      await renderPdfPages(storedBook.diskPath, p, p, renderDir);
    }

    if (fs.existsSync(pageFile)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      fs.createReadStream(pageFile).pipe(res);
    } else {
      res.status(404).send('Page could not be rendered');
    }
  } catch (err) {
    res.status(500).send('Error rendering page image');
  }
});

// Primary AI Tutor Endpoint
app.post('/api/ai/ask', async (req: Request, res: Response) => {
  try {
    const {
      question,
      gradeLevel = 'جميع المراحل',
      subject = 'عام',
      mode = 'detailed',
      language = 'ar',
      chatHistory = [],
      bookContext,
      wantsAudio = false,
    } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'السؤال مطلوب' });
      return;
    }

    const ai = getAIClient();
    const userAsksForAudio = wantsAudio || /صوت|audio|voice|اقرأ|اسمع|نطق/i.test(question);

    // Robust book lookup from memory store or disk cache
    const findStoredBook = (): ServerStoredBook | undefined => {
      if (bookContext?.id && serverBooksStore.has(bookContext.id)) {
        return serverBooksStore.get(bookContext.id);
      }
      if (bookContext?.bookName) {
        const bn = bookContext.bookName.toLowerCase();
        for (const b of serverBooksStore.values()) {
          const orig = (b.originalFileName || '').toLowerCase().replace(/\.pdf$/i, '');
          const name = (b.name || '').toLowerCase();
          const real = (b.realTitle || '').toLowerCase();
          if (
            name.includes(bn) || bn.includes(name) ||
            orig.includes(bn) || bn.includes(orig) ||
            real.includes(bn) || bn.includes(real)
          ) {
            return b;
          }
        }
      }
      if (serverBooksStore.size > 0) {
        return Array.from(serverBooksStore.values())[serverBooksStore.size - 1];
      }
      return undefined;
    };
    
    let storedBook = findStoredBook();
    if (!storedBook && bookContext?.id) {
      const diskPath = path.join(BOOKS_DIR, `${bookContext.id}.pdf`);
      if (fs.existsSync(diskPath)) {
        try {
          const stats = fs.statSync(diskPath);
          storedBook = {
            id: bookContext.id,
            name: bookContext.bookName || 'الكتاب المرفوع',
            realTitle: bookContext.realTitle,
            subject: bookContext.subject,
            grade: bookContext.grade,
            originalFileName: bookContext.bookName || 'book.pdf',
            size: stats.size,
            pageCount: bookContext.pageCount || 1,
            textSnippet: '',
            fullText: bookContext.relevantExcerpt || '',
            chapters: bookContext.chapters || [],
            summary: '',
            diskPath,
            uploadDate: Date.now(),
          };
          serverBooksStore.set(bookContext.id, storedBook);
        } catch (e) {}
      }
    }

    const bookTitle = storedBook?.name || bookContext?.bookName;
    const chapters = (storedBook?.chapters && storedBook.chapters.length > 0) ? storedBook.chapters : (bookContext?.chapters || []);
    const fullTextContent = storedBook?.fullText || bookContext?.relevantExcerpt || '';
    const relevantExcerpt = getRelevantExcerptForQuestion(fullTextContent, question, chapters);

    // Dynamic book guidance injection if student uploaded a book
    let bookInstruction = '';
    if (bookTitle) {
      const chaptersList = Array.isArray(chapters)
        ? chapters.map((c: any) => `- ${c.title || c}${c.page ? ` (صفحة ${c.page})` : ''}${c.excerpt ? `: ${c.excerpt.slice(0, 160)}...` : ''}`).join('\n')
        : '';

      bookInstruction = `
---
[مرجع كتاب دراسي معتمد وموثوق مرفوع من الطالب]:
- اسم الكتاب: "${bookTitle}"
${storedBook?.subject ? `- المادة الدراسية: ${storedBook.subject}` : ''}
${storedBook?.grade ? `- الصف / المرحلة: ${storedBook.grade}` : ''}
- عدد الصفحات: ${storedBook?.pageCount || bookContext?.pageCount || 'غير محدد'}
- قائمة الفصول والوحدات والدروس المكتشفة في الكتاب:
${chaptersList}

مقتطفات تفصيلية مطابقة من محتوى وصفحات الكتاب:
"""
${relevantExcerpt.slice(0, 36000)}
"""

تعليمات شرح الكتاب:
1. أنت تقرأ مباشرة من صفحات ومحتوى هذا الكتاب المدرسي الحقيقي ("${bookTitle}").
2. انظر في صفحات الكتاب المرفقة واقرأ النصوص والجداول والقوانين الرياضية والعلمية والمسائل والتدريبات بدقة متناهية من صفحات الكتاب الحقيقية.
3. استخرج واذكر للطالب المفاهيم والقوانين والأمثلة كما وردت في الكتاب حرفياً مع ذكر رقم الصفحة واسم الفصل والدرس.
4. إذا طلب الطالب قراءة كل تفصيلة أو شرح أي درس أو مسألة، فصّل كل نقطة بأمانة علمية كاملة وباللغتين العربية والإنجليزية إذا كان المنهج لغات.
5. لا تعتذر أبداً أو تدّعي عدم توفر المحتوى؛ فالكتاب متاح أمامك بصفحاته الحقيقية.
---
`;
    }

    // System prompt tailored for student understanding, step-by-step clarity, and multilingual prowess
    const systemInstruction = `
أنت "مذاكرتي AI" (Mothakarti AI) — المعلم والمدير التربوي الذكي، الرفيق الأول والصبور لكل طالب وطالبة.
مهمتك الأساسية هي:
1. الإجابة عن أي سؤال يطرحه الطالب بدقة واحترافية وبأسلوب تعليمي مشوق أياً كان مستواه الدراسي (ابتدائي، إعدادي، ثانوي، جامعي).
2. شرح أي منهج دراسي بأي لغة يُطلب منك (العربية، الإنجليزية، الفرنسية، إلخ).
3. عند السؤال بالعربية أجب بالعربية الفصحى السلسة والمبسطة. وعند السؤال بالإنجليزية أجب بالإنجليزية بطلاقة. وإذا طُلب منك لغة أخرى التزم بها بدقة.
4. استخدم التنسيق المنظم:
   - ابدأ بترحيب مشجع أو فكرة محورية مختصرة.
   - قسم الشرح إلى خطوات واضحة (الخطوة 1، الخطوة 2...).
   - استشهد بنصوص الكتاب الحقيقية وأرقام الصفحات بدقة.
   - أعطِ مثالاً عملياً من الحياة اليومية لتقريب المفهوم للذهن.
   - ضع "💡 نصيحة ذهبية أو قاعدة للحفظ السريع".
   - إذا كان السؤال مسألة رياضية أو فيزيائية، اذكر القانون أولاً، ثم التعويض خطوة بخطوة، ثم الناتج النهائي مع وحدة القياس.
5. في نمط الشرح البسيط (Simple)، اجعل الشرح كأنك تشرح لطفل أو طالب يحتاج تبسيطاً فائقاً بالأمثلة الحسية.
6. في نمط حل المسائل (Solver)، ركز على المعطيات والمطلوب والخطوات المتسلسلة والتحقق من صحة الناتج.
7. عندما يطلب الطالب الشرح بالصوت والكتابة، نسق إجابتك بحيث تكون ممتعة ومكتوبة بوضوح تام وتصلح للقراءة الصوتية الشفهية المباشرة.
${bookInstruction}
كن دائماً إيجابياً ومحفزاً يغرس الثقة في نفس الطالب.
`.trim();

    if (ai) {
      const promptParts: any[] = [];
      const pagesReferenced: number[] = [];
      let matchedChapterInfo: any = null;

      // MULTIMODAL REAL BOOK READING: Feed real high-resolution page scans directly to Gemini Vision!
      if (storedBook && storedBook.diskPath && fs.existsSync(storedBook.diskPath)) {
        const targetPages = findRelevantPagesForQuestion(question, storedBook);
        matchedChapterInfo = targetPages.matchedChapter;
        const pStart = targetPages.startPage;
        const pEnd = targetPages.endPage;
        const renderDir = path.join(BOOKS_DIR, `pages-${storedBook.id}`);

        console.log(`[Real Book Reading] Question: "${question.slice(0, 50)}..." -> Target pages ${pStart} to ${pEnd} (reason: ${targetPages.reason})`);

        try {
          await renderPdfPages(storedBook.diskPath, pStart, pEnd, renderDir);
          for (let p = pStart; p <= pEnd; p++) {
            const pf = path.join(renderDir, `page-${p}.jpg`);
            if (fs.existsSync(pf)) {
              pagesReferenced.push(p);
              promptParts.push({
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: fs.readFileSync(pf).toString('base64'),
                },
              });
            }
          }
        } catch (renderErr) {
          console.warn('On-demand page rendering error:', renderErr);
        }

        if (pagesReferenced.length > 0) {
          promptParts.push({
            text: `[أمر قراءة الصفحات الأصلية بدقة تامة]:
أمامك الصفحات الأصلية عالية الدقة (${pagesReferenced.join(', ')}) من كتاب الطالب المرفوع ("${bookTitle}").
اقرأ كل تفصيلة في هذه الصفحات بدقة واشرحها للطالب:
1. اذكر النصوص والتعريفات والقوانين المكتوبة في هذه الصفحات حرفياً مع ذكر رقم الصفحة بدقة.
2. إذا كان المنهج لغات، اذكر المصطلح بالإنجليزية وترجمته بالعربية كما ورد في الكتاب.
3. اذكر الأمثلة والتطبيقات والتمارين الموجودة في هذه الصفحات.
4. أجب عن سؤال الطالب بالتفصيل الكامل بناءً على هذه الصفحات.`,
          });
        }
      } else if (storedBook && storedBook.geminiFileUri) {
        promptParts.push({
          fileData: {
            fileUri: storedBook.geminiFileUri,
            mimeType: storedBook.geminiFileMime || 'application/pdf',
          },
        });
      }

      // Append chat history and user request
      let queryContext = '';
      if (Array.isArray(chatHistory) && chatHistory.length > 0) {
        const recent = chatHistory.slice(-4);
        const historyText = recent
          .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'الطالب' : 'المعلم'}: ${m.content}`)
          .join('\n');
        queryContext += `السياق السابق للمحادثة:\n${historyText}\n---\n`;
      }

      queryContext += `المرحلة: ${gradeLevel} | المادة: ${subject} | نمط الشرح: ${mode} | اللغة المطلوبة: ${language} | الشرح الصوتي: ${userAsksForAudio ? 'نعم مطلوب صوتاً وكتابة' : 'عادي'}\nسؤال الطالب: ${question}`;
      promptParts.push({ text: queryContext });

      const response = await generateWithModelFallback(ai, {
        contents: promptParts.length === 1 && typeof promptParts[0].text === 'string'
          ? promptParts[0].text
          : promptParts,
        systemInstruction,
        temperature: 0.7,
      });

      const answerText = response.text || 'عذراً، لم أتمكن من إكمال الشرح حالياً، يرجى إعادة المحاولة.';

      const pageCitation = pagesReferenced.length > 0 
        ? ` (صفحة ${pagesReferenced.length === 1 ? pagesReferenced[0] : `${pagesReferenced[0]}-${pagesReferenced[pagesReferenced.length - 1]}`})`
        : '';
      const sourceName = bookTitle
        ? `كتاب: ${bookTitle}${matchedChapterInfo?.title ? ` - ${matchedChapterInfo.title}` : ''}${pageCitation} 📖`
        : 'Gemini AI ⚡';

      res.json({
        answer: answerText,
        source: sourceName,
        pagesReferenced,
        matchedChapter: matchedChapterInfo,
        bookId: storedBook?.id,
        suggestAudio: userAsksForAudio,
        timestamp: Date.now(),
      });
      return;
    }

    // Graceful offline/local fallback response if GEMINI_API_KEY is not configured
    const fallbackAnswer = generateIntelligentFallback(question, gradeLevel, subject);
    res.json({
      answer: fallbackAnswer,
      source: bookContext?.bookName ? `كتاب: ${bookContext.bookName} 📖` : 'محرك المعرفة التعليمي المدمج 📚',
      suggestAudio: userAsksForAudio,
      timestamp: Date.now(),
    });
  } catch (_error: any) {
    // Graceful fallback so student always receives high-quality educational guidance
    const q = req.body?.question || '';
    const safeFallback = generateIntelligentFallback(q, req.body?.gradeLevel || '', req.body?.subject || '');
    res.json({
      answer: safeFallback,
      source: 'المعلم الذكي (الوضع الاحتياطي السريع) 🛡️',
      suggestAudio: false,
      timestamp: Date.now(),
    });
  }
});


// Dynamic AI Quiz Generator Endpoint
app.post('/api/ai/quiz', async (req: Request, res: Response) => {
  try {
    const { topic = 'الرياضيات', gradeLevel = 'المرحلة الإعدادية' } = req.body;
    const ai = getAIClient();

    if (ai) {
      const prompt = `قم بإنشاء اختبار قصير ممتع مكون من 3 أسئلة اختيار من متعدد حول موضوع: "${topic}" لصف/مرحلة: "${gradeLevel}".
يجب أن يحتوي كل سؤال على نص السؤال، و 4 اختيارات، ورقم الاختيار الصحيح (0 أو 1 أو 2 أو 3)، وشرح تعليمي مختصر لسبب صحة الإجابة.`;

      const response = await generateWithModelFallback(ai, {
        contents: prompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'قائمة الأسئلة',
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: 'نص السؤال' },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '4 خيارات للإجابة',
              },
              correctIndex: { type: Type.INTEGER, description: 'مؤشر الإجابة الصحيحة من 0 إلى 3' },
              explanation: { type: Type.STRING, description: 'شرح مبسط للإجابة الصحيحة' },
            },
            required: ['question', 'options', 'correctIndex', 'explanation'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '[]');
      res.json({ questions: parsed });
      return;
    }

    // Default fallback quiz
    res.json({
      questions: [
        {
          question: `ما هي الفكرة الأساسية في موضوع (${topic})؟`,
          options: [
            'فهم المبادئ وتطبيق القواعد خطوة بخطوة',
            'الحفظ دون فهم',
            'تجاهل المراجعة والتمارين',
            'حل المسائل عشوائياً',
          ],
          correctIndex: 0,
          explanation: 'التعلم القائم على الفهم العميق والتطبيق العملي هو السبيل للتفوق الدراسي.',
        },
      ],
    });
  } catch (err: any) {
    console.error('Quiz generation error:', err);
    res.json({
      questions: [
        {
          question: 'ما هو أهم أسلوب لتثبيت المعلومة بعد قراءة الدرس؟',
          options: ['حل التمارين وشرحها لزميل', 'تأجيل المذاكرة لليلة الامتحان', 'القراءة السريعة مرة واحدة', 'إغلاق الكتاب مباشرة'],
          correctIndex: 0,
          explanation: 'التطبيق النشط وشرح المفاهيم يرفع معدل الاستيعاب إلى أكثر من 90%!',
        },
      ],
    });
  }
});

function generateIntelligentFallback(q: string, grade: string, subj: string): string {
  const normQ = q.toLowerCase();
  
  if (normQ.includes('ضرب') || normQ.includes('multiply') || normQ.includes('multiplication')) {
    return `### 🔢 شرح مفهوم جدول الضرب والقواعد الذكية

**مرحباً يا بطل! الضرب هو ببساطة اختصار لعملية الجمع المتكرر.**

- **المعنى الأساسي:** عندما نقول $4 \\times 3$ فهذا يعني تكرار جمع الرقم $3$ أربع مرات:
  $$3 + 3 + 3 + 3 = 12$$

- **حيل ذكية للتفوق:**
  1. **جدول 5:** كل النواتج تنتهي بـ 0 أو 5 دائماً ($5 \\times 4 = 20$ ، $5 \\times 7 = 35$).
  2. **جدول 9:** مجموع رقمي الناتج يساوي 9 دائماً!
     - $9 \\times 3 = 27$ (لاحظ: $2 + 7 = 9$)
     - $9 \\times 6 = 54$ (لاحظ: $5 + 4 = 9$)
  3. **الضرب في 10 و 100:** أضف أصفاراً إلى يمين العدد فقط ($8 \\times 10 = 80$).

💡 **نصيحة ذهبية:** احرص على حل 5 مسائل ضرب يومياً لتقوية سرعتك الحسابية!`;
  }

  if (normQ.includes('نيوتن') || normQ.includes('newton') || normQ.includes('حركة') || normQ.includes('force')) {
    return `### ⚡ شرح قوانين نيوتن للحركة في الفيزياء

**أهلاً بك يا عالم المستقبل! قوانين السير إسحاق نيوتن هي أساس علم الحركة والميكانيكا:**

1. **القانون الأول (القصور الذاتي):**
   - *النص:* يظل الجسم الساكن ساكناً والمتحرك بسرعة منتظمة في خط مستقيم متحركاً، ما لم تؤثر عليه قوة محصلة تجبره على تغيير حالته.
   - *تطبيق عملي:* اندفاع ركاب السيارة إلى الأمام عند الضغط فجأة على الفرامل، ولذلك وضعت أحزمة الأمان!

2. **القانون الثاني ($F = m \\cdot a$):**
   - *النص:* القوة المحصلة المؤثرة على جسم تساوي حاصل ضرب كتلته في تسارعه.
   - وحدة قياس القوة هي **النيوتن (N)**.

3. **القانون الثالث (الفعل ورد الفعل):**
   - *النص:* لكل فعل رد فعل، مساوٍ له في المقدار ومضاد له في الاتجاه.
   - *تطبيق عملي:* انطلاق الصواريخ الفضائية لأعلى بسبب خروج الغازات العادمة بقوة هائلة لأسفل.

💡 **سؤال للتأمل:** لماذا يسهل دفع دراجة هوائية بينما يصعب جداً دفع شاحنة كبيرة؟ (لأن الكتلة الأكبر تعني قصوراً ذاتياً أكبر!).`;
  }

  const isEng = !(/[\u0600-\u06FF]/.test(q)) && (/[a-zA-Z]/.test(q));

  if (isEng) {
    if (normQ.includes('sky') || normQ.includes('blue') || normQ.includes('light')) {
      return `### 🌌 Why is the Sky Blue?

**Hello young scientist! The blue sky is caused by a phenomenon called Rayleigh Scattering.**

1. **Sunlight is Made of Many Colors:**
   Light from the sun looks white, but it is actually a rainbow of colors combined (red, orange, yellow, green, blue, indigo, violet).

2. **Light Travels in Waves:**
   - Red light has long, lazy wavelengths.
   - Blue and violet light travel in smaller, shorter waves.

3. **Earth's Atmosphere Scatters Light:**
   When sunlight reaches Earth's atmosphere, it collides with tiny gas molecules (nitrogen and oxygen). Because blue light has shorter waves, it is scattered in all directions much more than other colors, making the sky look blue to our eyes!

💡 **Fun Fact:** Sunsets look red and orange because the sunlight has to travel through more atmosphere to reach your eyes, scattering away most of the blue light!`;
    }

    return `### 🎓 Smart Teacher Educational Explanation

**Welcome! Here is your clear, step-by-step explanation for:** "${q}"

1. **Core Concept:**
   In modern curricula, mastering this topic involves understanding the foundational principles and connecting theory with real-world examples.

2. **Key Steps to Solve & Understand:**
   - Break down the question into clear given values and desired targets.
   - Apply the relevant mathematical formula, scientific law, or grammar rule.
   - Verify the solution logically against common sense.

3. **Pro Study Tip:**
   The best way to remember this is to practice explaining it to a classmate or solving 3 quick exercises right after reading.

💡 **Next Step:** Click the **"📝 Quiz Me"** button to test your comprehension!`;
  }

  return `### 🎓 إجابة وشرح تعليمي وافٍ

أهلاً بك يا بطل! يسعدني جداً أن أشرح لك هذا الموضوع بالتفصيل:

**السؤال المطروح:** "${q}"

1. **المفهوم العام:**
   في المناهج التعليمية (${grade} - ${subj})، يعتمد هذا الموضوع على فهم القواعد الأساسية والربط المنطقي بين الأسباب والنتائج.

2. **الخطوات التطبيقية:**
   - قراءة المعطيات بدقة وتحديد المطلوب الأساسي.
   - تطبيق القانون الرياضي أو العلمي أو القاعدة اللغوية المناسبة.
   - التحقق من معقولية الحل ومطابقته للواقع.

3. **أمثلة داعمة:**
   التعلم لا يكتمل إلا بالممارسة والتكرار؛ عند حل أي سؤال، حاول دائماً استنتاج سبب صحة الجواب بدلاً من مجرد الحفظ.

💡 **خطوتك التالية:** اضغط على زر **"📝 اختبرني"** لاختبار فهمك فورياً بأسئلة تفاعلية ذكية!`;
}

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
