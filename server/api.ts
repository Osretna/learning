import { Router, Request, Response } from "express";
import { generateContentWithFallback } from "./gemini.ts";

export const apiRouter = Router();

// Helper to prepare parts for Gemini
function prepareContentParts(fileBase64?: string, fileType?: string, textContent?: string, promptText?: string) {
  const parts: any[] = [];

  // If a PDF base64 is provided, attach it as inlineData
  if (fileBase64 && fileType === "application/pdf") {
    // Strip data url prefix if present
    const cleanBase64 = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
    parts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: cleanBase64,
      },
    });
  }

  // If extracted text is provided (or if it's a plain text/markdown document)
  if (textContent && textContent.trim().length > 0) {
    // If we didn't pass base64 PDF, or to reinforce text indexing
    if (!fileBase64 || fileType !== "application/pdf") {
      parts.push({
        text: `--- محتوى الكتاب المرفق للنص الكامل ---\n${textContent}\n--- نهاية محتوى الكتاب ---`,
      });
    }
  }

  if (promptText) {
    parts.push({
      text: promptText,
    });
  }

  return parts;
}

// 1. Quick inspect endpoint: reads the book and extracts metadata, structure, and initial overview
apiRouter.post("/inspect-book", async (req: Request, res: Response) => {
  try {
    const { fileBase64, fileType, textContent, fileName } = req.body;

    if (!fileBase64 && (!textContent || textContent.trim().length === 0)) {
      return res.status(400).json({ error: "يرجى تقديم ملف الكتاب أو نصه للقراءة." });
    }

    const prompt = `أنت خبير فاحص للكتب ومحلل أدبي وأكاديمي دقيق.
المطلوب منك فحص هذا الكتاب المرفق بعناية تامة واستخراج بياناته الأساسية وهيكليته الحقيقية.
اقرأ صفحات الكتاب ومقدمته وفهرسه وفصوله، وقدم النتيجة بتنسيق JSON حصراً بهذا المخطط:
{
  "title": "عنوان الكتاب الحقيقي كما هو وارد في الصفحات الأولى",
  "author": "اسم المؤلف كما ورد في الكتاب (أو غير محدد إذا لم يذكر)",
  "language": "لغة الكتاب الرئيسية",
  "pageCountEstimated": "تقدير عدد الفصول أو الأقسام",
  "mainGenre": "تصنيف الكتاب (مثلاً: تاريخ، علوم، تنمية، فلسفة، تقنية، رواية...)",
  "oneSentenceThesis": "الفكرة الجوهرية للكتاب في جملة واحدة مكثفة ودقيقة",
  "detailedExecutiveSummary": "ملخص تنفيذي عميق من 3-4 فقرات يشرح الأطروحة والهدف العام للكتاب بدقة بالغة",
  "tableOfContents": [
    {
      "chapterNumber": 1,
      "title": "عنوان الفصل أو الباب",
      "brief": "ملخص سطرين عما يناقشه هذا الفصل بناءً على النص الفعلي"
    }
  ],
  "keyConcepts": ["المفهوم الأول مع نبذة", "المفهوم الثاني مع نبذة", "المفهوم الثالث مع نبذة", "المفهوم الرابع مع نبذة"],
  "suggestedDeepQuestions": [
    "سؤال عميق ودقيق جداً حول نقطة تفصيلية واردة في الفصل الأول أو الثاني",
    "سؤال حول الحجة المركزية للمؤلف أو تجربة/إحصائية مذكورة في الكتاب",
    "سؤال نقدي حول حلول المؤلف أو فكرته المحورية",
    "سؤال حول استنتاج معين في الصفحات الأخيرة"
  ]
}

تأكد من عدم اختلاق أي شيء؛ استند تماماً وبدقة على محتوى الكتاب المرفق. أخرج الـ JSON فقط بدون علامات markdown.`;

    const parts = prepareContentParts(fileBase64, fileType, textContent, prompt);

    const response = await generateContentWithFallback({
      contents: { parts },
      config: {
        systemInstruction: "أنت خبير موثوق في قراءة الكتب والمستندات واستخراج الحقائق منها بدقة متناهية دون أي تأليف.",
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const outputText = response.text || "{}";
    try {
      const parsed = JSON.parse(outputText);
      return res.json({ success: true, data: parsed });
    } catch {
      // If regex extraction needed
      const jsonMatch = outputText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({ success: true, data: parsed });
      }
      return res.json({ success: true, raw: outputText });
    }
  } catch (error: any) {
    console.error("Error inspecting book:", error);
    return res.status(500).json({
      error: error.message || "حدث خطأ أثناء قراءة وفحص الكتاب بواسطة النموذج الذكي.",
    });
  }
});

// 2. Comprehensive deep analysis / question answering / entity extraction
apiRouter.post("/query-book", async (req: Request, res: Response) => {
  try {
    const {
      fileBase64,
      fileType,
      textContent,
      mode = "ask_question",
      question,
      chapterTitle,
      specificScope,
    } = req.body;

    if (!fileBase64 && (!textContent || textContent.trim().length === 0)) {
      return res.status(400).json({ error: "لا يوجد محتوى للكتاب لإجراء التحليل." });
    }

    let promptInstruction = "";

    switch (mode) {
      case "ask_question":
        promptInstruction = `المستخدم يسألك سؤالاً محدداً جداً عن محتوى هذا الكتاب:
"${question}"

تعليمات صارمة للإجابة:
1. اقرأ صفحات ومواضع الكتاب المتعلقة بهذا السؤال بدقة بالغة.
2. قدم إجابة مفصلة وحقيقية مستمدة 100% من نص الكتاب.
3. استشهد بالنصوص والاقتباسات الدقيقة الواردة في الكتاب ("بين علامتي تنصيص") واذكر رقم الفصل أو الصفحة أو السياق كلما كان ذلك ممكناً.
4. إذا كان السؤال يتعلق ببيانات أو أرقام أو خطوات أو أمثلة ذكرها المؤلف، اذكرها كاملة كما جاءت بالضبط.
5. إذا كانت هذه النقطة غير مذكورة نهائياً في الكتاب، قل بوضوح: "هذه الجزئية غير مذكورة في صفحات الكتاب المرفق" واشرح ما يقترب منها داخل الكتاب إن وجد.`;
        break;

      case "full_comprehensive_study":
        promptInstruction = `المطلوب: إعداد دراسة تحليلية شاملة وموسعة وشديدة الدقة لهذا الكتاب.
عليك أن تتناول:
1. **المدخل والأطروحة المركزية**: ما هي المشكلة التي يعالجها المؤلف؟ ما هو فرضه الأساسي؟
2. **تحليل الفصول تفصيلياً (فصلاً فصلاً)**:
   - اسم كل فصل وأهم الأفكار والحجج والبراهين والأمثلة التي أوردها الكاتب فيه بالتفصيل.
3. **المفاهيم والنظريات الأساسية**: شرح دقيق لكل مصطلح أو نظرية أو استراتيجية ابتكرها أو اعتمد عليها الكاتب.
4. **أهم الاقتباسات الجوهرية**: قائمة بالاقتباسات الدقيقة الحقيقية من صلب الكتاب مع شرح دلالتها.
5. **الإحصائيات والأرقام والبيانات**: أي دراسات أو تجارب أو أرقام حقيقية استند إليها الكاتب.
6. **الخلاصة والدروس التطبيقية**: كيف يمكن تطبيق أفكار الكتاب في الواقع العملي؟

اكتب بلغة عربية فصيحة، منسقة بأقسام وعناوين واضحة وجداول عند الحاجة.`;
        break;

      case "chapter_deep_dive":
        promptInstruction = `المطلوب دراسة تفصيلية عميقة جداً للفصل التالي من الكتاب:
"${chapterTitle || "الفصل المحدد"}"

تعليمات:
- استخرج كل فكرة فرعية ومثال وحجة وردت في هذا الفصل تحديداً.
- لا تكتف بالعموميات، بل اذكر كل خطوة، قاعدة، أو حكاية استشهد بها المؤلف في هذا الفصل.
- اذكر الاقتباسات النصية الحرفية من هذا الفصل.
- لخص النتيجة والرسالة النهائية التي أراد الكاتب إيصالها للقارئ من خلال هذا الفصل.`;
        break;

      case "extract_data_and_quotes":
        promptInstruction = `المطلوب استخراج "بنك البيانات والاقتباسات الحقيقية" من هذا الكتاب:
1. **أهم الاقتباسات الحرفية الخالدة**: اقتبس 8 إلى 12 اقتباساً حقيقياً بالنص الصريح مع ذكر الفصل وسياق المقولة.
2. **الأرقام والإحصائيات والبيانات المؤكدة**: أي دراسات، تجارب علمية، تواريخ، أو نسب مئوية وردت في الكتاب.
3. **الشخصيات والمصادر**: أهم العلماء، الفلاسفة، الكتب، أو الشخصيات التي استشهد بها المؤلف.
4. **المعادلات / النماذج / القواعد العملية**: القوانين أو المبادئ التي صاغها الكاتب كقواعد سلوكية أو فكرية.`;
        break;

      case "subtle_quiz":
        promptInstruction = `قم بإنشاء اختبار استيعاب دقيق مكون من 5 أسئلة متعددة الخيارات (MCQ) تقيس فهم التفاصيل الحقيقية في الكتاب وليس فقط المعلومات السطحية.
قدم النتيجة بصيغة JSON حصراً بهذا المخطط:
[
  {
    "question": "نص السؤال الدقيق من صلب الكتاب",
    "options": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
    "correctIndex": 0,
    "explanation": "الشرح الدقيق استناداً إلى ما ذكره المؤلف في الكتاب مع الاقتباس أو الإشارة إلى موضع الذكر."
  }
]
أخرج الـ JSON فقط.`;
        break;

      case "verify_claim":
        promptInstruction = `يريد المستخدم التحقق مما إذا كان الكتاب يؤيد أو ينفي أو يذكر الادعاء التالي:
"${question}"

قم بالتحقق الحقيقي في صفحات الكتاب:
1. هل ذُكر هذا المفهوم أو الادعاء في الكتاب؟ (نعم / لا / جزئياً).
2. أين ورد وما هو السياق الدقيق؟
3. ما هو الموقف الفعلي للمؤلف تجاهه، مدعوماً باقتباسات نصية من الكتاب.`;
        break;

      default:
        promptInstruction = question || "قم بقراءة الكتاب وتقديم تلخيص شامل ودقيق له.";
    }

    if (specificScope) {
      promptInstruction += `\n\nنطاق التركيز الإضافي المطلوب من المستخدم: ${specificScope}`;
    }

    const parts = prepareContentParts(fileBase64, fileType, textContent, promptInstruction);

    const isQuiz = mode === "subtle_quiz";

    const response = await generateContentWithFallback({
      contents: { parts },
      config: {
        systemInstruction:
          "أنت باحث ومحلل كتب أكاديمي فائق الدقة. تعتمد بنسبة 100% على محتوى الكتاب المرفق، وتذكر الحقائق بدقة وأمانة علمية دون تأليف، وتستشهد بالاقتباسات والصفحات كلما أمكن.",
        temperature: isQuiz ? 0.2 : 0.3,
        responseMimeType: isQuiz ? "application/json" : "text/plain",
      },
    });

    const resultText = response.text || "";

    if (isQuiz) {
      try {
        const parsed = JSON.parse(resultText);
        return res.json({ success: true, mode, quiz: parsed });
      } catch {
        const match = resultText.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return res.json({ success: true, mode, quiz: parsed });
        }
      }
    }

    return res.json({
      success: true,
      mode,
      content: resultText,
    });
  } catch (error: any) {
    console.error("Error querying book:", error);
    return res.status(500).json({
      error: error.message || "حدث خطأ أثناء معالجة استفسارك حول الكتاب.",
    });
  }
});
