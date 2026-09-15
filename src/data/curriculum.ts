import { CurriculumStage } from '../types';

export const CURRICULUM_DATA: CurriculumStage[] = [
  {
    id: 'primary',
    name: 'المرحلة الابتدائية',
    nameEn: 'Primary Stage (Grades 1-6)',
    icon: '🌱',
    color: 'from-emerald-500 to-teal-600',
    subjects: [
      {
        id: 'math-primary',
        name: 'الرياضيات',
        nameEn: 'Mathematics',
        icon: '🔢',
        color: '#2563eb',
        lessons: [
          {
            id: 'pri-math-1',
            title: 'جمع الأعداد مع الحمل حتى 100',
            titleEn: 'Addition with Regrouping up to 100',
            summary: 'كيف تجمع الأرقام في خانة الآحاد وخانة العشرات واستخدام فكرة الحمل للخانة التالية.',
            explanation: [
              'الجمع هو ضم مجموعتين أو أكثر لمعرفة العدد الإجمالي ونستخدم له إشارة (+).',
              'طريقة الحل خطوة بخطوة: عند جمع 38 + 25، نبدأ بخانة الآحاد أولاً: 8 + 5 = 13. نكتب 3 في الآحاد ونحمل 1 إلى خانة العشرات.',
              'ثم نجمع العشرات: 3 + 2 + 1 (المحمول) = 6. إذن الناتج النهائي هو 63!',
              'خاصية مهمة: الجمع إبدالي، يعني 4 + 7 = 7 + 4 دائماً دون أن يتغير الناتج.'
            ],
            keyPoints: ['ابدأ دائماً من خانة الآحاد', 'إذا زاد ناتج الآحاد عن 9 احمل الواحد للعشرات', 'الجمع عملية إبدالية'],
            sampleQuestions: [
              {
                id: 'q-pm1',
                question: 'ما هو ناتج جمع 47 + 28 ؟',
                options: ['75', '65', '85', '72'],
                correctIndex: 0,
                explanation: 'نجمع الآحاد: 7 + 8 = 15 (نكتب 5 ونحمل 1). ثم العشرات: 4 + 2 + 1 = 7. الناتج 75.'
              },
              {
                id: 'q-pm2',
                question: 'ما هي الخاصية الممثلة في: 12 + 8 = 8 + 12 ؟',
                options: ['الخاصية الإبدالية', 'الخاصية التوزيعية', 'خاصية الصفر', 'خاصية التقريب'],
                correctIndex: 0,
                explanation: 'تبديل مكان العددين المجموعين دون تغيير الناتج يُسمى الخاصية الإبدالية.'
              }
            ]
          },
          {
            id: 'pri-math-2',
            title: 'جدول الضرب وحيله الذكية',
            titleEn: 'Multiplication Tables & Clever Tricks',
            summary: 'الضرب هو جمع متكرر، مع أسهل الطرق لحفظ جدول الضرب من 1 إلى 12.',
            explanation: [
              'الضرب عملية اختصار للجمع المتكرر: 4 × 3 تعني تكرار جمع العدد 3 أربع مرات (3 + 3 + 3 + 3 = 12).',
              'حيلة جدول 5: أي عدد يُضرب في 5 ينتهي دائماً بـ 0 أو 5 (مثل 5×4=20، 5×7=35).',
              'حيلة جدول 9: مجموع أرقام ناتج الضرب في 9 يساوي 9 دائماً! (9×3=27 حيث 2+7=9، و 9×6=54 حيث 5+4=9).',
              'الضرب في 10 و 100: كل ما عليك هو إضافة أصفار إلى يمين العدد (7 × 10 = 70، 7 × 100 = 700).'
            ],
            keyPoints: ['الضرب = جمع متكرر', 'جدول 5 ينتهي بصفر أو خمسة', 'جدول 9 مجموع رقميه 9', 'الضرب في الصفر يساوي صفر دائماً'],
            sampleQuestions: [
              {
                id: 'q-pm3',
                question: 'ما هو ناتج 7 × 8 ؟',
                options: ['56', '54', '48', '64'],
                correctIndex: 0,
                explanation: '7 × 8 = 56.'
              },
              {
                id: 'q-pm4',
                question: 'أي جملة جمع متكرر تمثل العملية 3 × 5 ؟',
                options: ['5 + 5 + 5', '3 + 3 + 3', '5 × 5 × 5', '3 + 5'],
                correctIndex: 0,
                explanation: '3 × 5 تعني تكرار الرقم 5 ثلاث مرات: 5 + 5 + 5 = 15.'
              }
            ]
          },
          {
            id: 'pri-math-3',
            title: 'الكسور البسيطة والمقارنة بينها',
            titleEn: 'Simple Fractions & Comparisons',
            summary: 'فهم البسط والمقام وتخيل الكسور كأجزاء من البيتزا أو الكعك.',
            explanation: [
              'الكسر يمثل جزءاً من الكل. يتكون من بسط (في الأعلى) ومقام (في الأسفل).',
              'البسط: يوضح عدد الأجزاء التي أخذناها أو لونّاها.',
              'المقام: يوضح العدد الكلي لجميع الأجزاء المتساوية.',
              'قاعدة ذهبية للمقارنة: إذا تساوى البسط، فالكسر ذو المقام الأصغر هو الأكبر! نصف البيتزا (1/2) أكبر من ربع البيتزا (1/4) لأننا قسمناها على عدد أقل.'
            ],
            keyPoints: ['البسط = الجزء المأخوذ', 'المقام = الكل', 'النصف 1/2 أكبر من الربع 1/4'],
            sampleQuestions: [
              {
                id: 'q-pm5',
                question: 'في الكسر 3/8 ، ماذا يمثل الرقم 3؟',
                options: ['البسط', 'المقام', 'الناتج', 'المقسوم عليه'],
                correctIndex: 0,
                explanation: 'الرقم العلوي في الكسر هو البسط، والرقم السفلي هو المقام.'
              }
            ]
          }
        ]
      },
      {
        id: 'science-primary',
        name: 'العلوم',
        nameEn: 'Science',
        icon: '🧪',
        color: '#059669',
        lessons: [
          {
            id: 'pri-sci-1',
            title: 'أجزاء النبات وعملية البناء الضوئي',
            titleEn: 'Plant Parts & Photosynthesis',
            summary: 'الجذور والساق والأوراق وكيف يصنع النبات غذاءه بنفسه باستخدام ضوء الشمس.',
            explanation: [
              'يتكون النبات من ثلاثة أجزاء رئيسية: الجذور، الساق، والأوراق.',
              'الجذور: تثبت النبات في التربة وتمتص الماء والأملاح المعدنية.',
              'الساق: يدعم النبات وينقل الماء والغذاء بين الجذور وباقي أجزاء النبتة.',
              'الأوراق (مطبخ النبات): تحتوي على مادة الكلوروفيل الخضراء التي تمتص ضوء الشمس وتستخدم ثاني أكسيد الكربون من الهواء والماء لتصنع سكر الجلوكوز وتطلق غاز الأكسجين الضروري لتنفسنا.'
            ],
            keyPoints: ['الجذر يمتص الماء ويثبت', 'الساق ينقل ويدعم', 'الورقة تصنع الغذاء بالبناء الضوئي', 'ينتج الأكسجين كغاز نافع'],
            sampleQuestions: [
              {
                id: 'q-ps1',
                question: 'أي جزء في النبات مسؤول عن امتصاص الماء والأملاح من التربة؟',
                options: ['الجذور', 'الأوراق', 'الأزهار', 'الساق'],
                correctIndex: 0,
                explanation: 'الجذور هي العضو الممتد في التربة لامتصاص الماء وتثبيت النبتة.'
              },
              {
                id: 'q-ps2',
                question: 'الغاز الذي يطلقه النبات أثناء عملية البناء الضوئي هو:',
                options: ['الأكسجين', 'ثاني أكسيد الكربون', 'النيتروجين', 'الهيليوم'],
                correctIndex: 0,
                explanation: 'يأخذ النبات ثاني أكسيد الكربون ويطلق الأكسجين O2 في النهار.'
              }
            ]
          },
          {
            id: 'pri-sci-2',
            title: 'حالات المادة الثلاث ودورة الماء',
            titleEn: 'States of Matter & The Water Cycle',
            summary: 'الحالة الصلبة والسائلة والغازية، وكيف يتحول الماء بينها في الطبيعة.',
            explanation: [
              'المادة هي كل ما له كتلة ويشغل حيزاً من الفراغ، وتوجد في 3 حالات رئيسية:',
              '1. الحالة الصلبة: لها شكل ثابت وحجم ثابت (مثل الجليد، الصخور، الحديد).',
              '2. الحالة السائلة: لها حجم ثابت وشكل متغير يأخذ شكل الإناء (مثل الماء السائل، العصير).',
              '3. الحالة الغازية: ليس لها شكل ثابت ولا حجم ثابت وتنتشر في الفراغ (مثل بخار الماء، الهواء).',
              'دورة الماء: تسخن الشمس مياه البحار فيحدث التبخر، ثم يصعد البخار ويبرد فيحدث التكاثف مشكلاً السحب، ثم يسقط المطر (الهطول) ويعود للجريان.'
            ],
            keyPoints: ['الصلب: شكل وحجم ثابت', 'السائل: حجم ثابت وشكل الإناء', 'الغاز: حر الحركة', 'دورة الماء: تبخر -> تكاثف -> هطول'],
            sampleQuestions: [
              {
                id: 'q-ps3',
                question: 'تحول الماء السائل إلى بخار ماء عند التسخين يسمى:',
                options: ['تبخر', 'تكاثف', 'انصهار', 'تجمد'],
                correctIndex: 0,
                explanation: 'التبخر هو تحول السائل إلى غاز بفعل الحرارة.'
              }
            ]
          }
        ]
      },
      {
        id: 'arabic-primary',
        name: 'اللغة العربية',
        nameEn: 'Arabic Language',
        icon: '📖',
        color: '#d97706',
        lessons: [
          {
            id: 'pri-ara-1',
            title: 'أقسام الكلمة: اسم وفعل وحرف',
            titleEn: 'Parts of Speech in Arabic',
            summary: 'كيف تميز فوراً بين الاسم والفعل والحرف في أي جملة عربية.',
            explanation: [
              'الكلام في اللغة العربية كله يتكون من ثلاثة أصناف لا رابع لها:',
              '1. الاسم: كلمة تدل على إنسان، حيوان، نبات، جماد، صفة أو مكان ولا ترتبط بزمن. علاماته: يقبل (الـ) التعريف، والتنوين، وحرف الجر (كتاب، الكتابُ، في بيتٍ).',
              '2. الفعل: كلمة تدل على حدث مقترن بزمن محدد (ماضٍ مثل: كتبَ، مضارع مثل: يكتبُ، أمر مثل: اكتبْ).',
              '3. الحرف: كلمة لا يظهر معناها إلا مع غيرها (حروف الجر: من، إلى، عن، على، في، الباء، الكاف، اللام).'
            ],
            keyPoints: ['الاسم يقبل الـ والتنوين', 'الفعل مرتبط بزمن ماضٍ أو حاضر أو أمر', 'الحرف يربط بين الكلمات'],
            sampleQuestions: [
              {
                id: 'q-pa1',
                question: 'كلمة (استمعَ) تصنف على أنها:',
                options: ['فعل ماضٍ', 'اسم علم', 'حرف جر', 'فعل مضارع'],
                correctIndex: 0,
                explanation: 'استمعَ تدل على حدث وقع في الزمن الماضي وانتهى.'
              },
              {
                id: 'q-pa2',
                question: 'أي من الكلمات الآتية تعتبر اسماً؟',
                options: ['المدرسة', 'يذهبُ', 'إلى', 'ركضَ'],
                correctIndex: 0,
                explanation: 'المدرسة اسم لأنها تقبل ال التعريف وتدل على مكان.'
              }
            ]
          }
        ]
      },
      {
        id: 'english-primary',
        name: 'اللغة الإنجليزية',
        nameEn: 'English for Beginners',
        icon: '🔤',
        color: '#7c3aed',
        lessons: [
          {
            id: 'pri-eng-1',
            title: 'Verb to Be: am / is / are',
            titleEn: 'Using Verb to Be in Simple Sentences',
            summary: 'Mastering the most important verb in English with pronouns.',
            explanation: [
              'Verb to Be means "to exist" (يكون). We use it to describe people, age, feelings, and jobs.',
              'I -> am (I am a student / I am happy)',
              'He / She / It / Singular Noun -> is (He is a teacher / The cat is fast)',
              'We / You / They / Plural Nouns -> are (We are friends / They are playing)',
              'Negative form: Just add NOT after am/is/are (He is not sad = He isn\'t sad).'
            ],
            keyPoints: ['I + am', 'He/She/It + is', 'We/You/They + are', 'Negative: add not'],
            sampleQuestions: [
              {
                id: 'q-pe1',
                question: 'Choose the correct form: She ____ a clever doctor.',
                options: ['is', 'are', 'am', 'be'],
                correctIndex: 0,
                explanation: 'With singular pronouns (He, She, It) we use "is".'
              },
              {
                id: 'q-pe2',
                question: 'Choose the correct sentence:',
                options: ['They are students.', 'They is students.', 'They am students.', 'They be students.'],
                correctIndex: 0,
                explanation: 'Plural pronoun "They" takes "are".'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'prep',
    name: 'المرحلة الإعدادية / المتوسطة',
    nameEn: 'Preparatory / Middle School',
    icon: '⚡',
    color: 'from-blue-600 to-indigo-700',
    subjects: [
      {
        id: 'math-prep',
        name: 'الرياضيات والجبر',
        nameEn: 'Algebra & Geometry',
        icon: '📐',
        color: '#2563eb',
        lessons: [
          {
            id: 'prep-math-1',
            title: 'حل معادلات الدرجة الأولى في مجهول واحد',
            titleEn: 'Solving Linear Equations in One Variable',
            summary: 'خطوات عزل المجهول s أو x وقاعدة العمليات المعاكسة للطرفين.',
            explanation: [
              'المعادلة كالميزان ذو الكفتين المتوازنتين، أي عملية نجريها في طرف يجب أن نكررها في الطرف الآخر.',
              'القاعدة الأساسية: انقل الأعداد في طرف والمجاهيل في طرف، وعند نقل حد غير إشارته (+ تصبح - ، والضرب يصبح قسمة).',
              'مثال توضيحي: حل المعادلة 3x + 6 = 21',
              'الخطوة 1: نطرح 6 من الطرفين -> 3x = 21 - 6 -> 3x = 15',
              'الخطوة 2: نقسم الطرفين على معامل x وهو 3 -> x = 15 / 3 = 5.',
              'التحقق: نعوض بـ 5 في المعادلة الأصلية: 3(5) + 6 = 15 + 6 = 21 (صحيح!).'
            ],
            keyPoints: ['المعادلة توازن كفتين', 'نقل الحد يغير إشارته', 'اقسم على معامل المجهول بالخطوة الأخيرة', 'تحقق بالتعويض'],
            sampleQuestions: [
              {
                id: 'q-prep-m1',
                question: 'حل المعادلة: 2x - 4 = 10 هو:',
                options: ['x = 7', 'x = 3', 'x = 5', 'x = 8'],
                correctIndex: 0,
                explanation: 'نضيف 4 للطرفين: 2x = 14، ثم نقسم على 2: x = 7.'
              },
              {
                id: 'q-prep-m2',
                question: 'إذا كان 5x = 40 فإن قيمة x + 3 تساوي:',
                options: ['11', '8', '15', '5'],
                correctIndex: 0,
                explanation: 'أولاً نحسب x: 40 ÷ 5 = 8. ثم المطلوب هو x + 3 = 8 + 3 = 11.'
              }
            ]
          },
          {
            id: 'prep-math-2',
            title: 'نظرية فيثاغورس وتطبيقاتها في المثلث القائم',
            titleEn: 'Pythagorean Theorem & Right Triangles',
            summary: 'العلاقة الذهبية: مربع طول الوتر يساوي مجموع مربعي طولي ضلعي القائمة.',
            explanation: [
              'تطبق نظرية فيثاغورس حصرياً على المثلثات القائمة الزاوية (إحدى زواياها 90 درجة).',
              'الوتر (c): هو أطول ضلع ويقع دائماً في المقابل المباشر للزاوية القائمة.',
              'نص النظرية: c² = a² + b²',
              'مثال مشهور: إذا كان ضلعا القائمة 3 سم و 4 سم: c² = 3² + 4² = 9 + 16 = 25 -> طول الوتر = جذر 25 = 5 سم!',
              'أشهر ثلاثيات فيثاغورس للحفظ السريع: (3, 4, 5) و (6, 8, 10) و (5, 12, 13).'
            ],
            keyPoints: ['تنطبق فقط على المثلث القائم', 'الوتر أطول ضلع', 'c² = a² + b²', 'الثلاثية المشهورة 3, 4, 5'],
            sampleQuestions: [
              {
                id: 'q-prep-m3',
                question: 'مثلث قائم طولا ضلعي القائمة فيه 6 سم و 8 سم، ما طول وتره؟',
                options: ['10 سم', '14 سم', '12 سم', '100 سم'],
                correctIndex: 0,
                explanation: 'الوتر² = 6² + 8² = 36 + 64 = 100، وجذر 100 هو 10 سم.'
              }
            ]
          }
        ]
      },
      {
        id: 'science-prep',
        name: 'العلوم العامة',
        nameEn: 'General Science & Chemistry',
        icon: '🔬',
        color: '#059669',
        lessons: [
          {
            id: 'prep-sci-1',
            title: 'التركيب الذري والجدول الدوري',
            titleEn: 'Atomic Structure & Periodic Table',
            summary: 'البروتونات والنيوترونات والإلكترونات وكيف تترتب العناصر حسب عددها الذري.',
            explanation: [
              'الذرة هي أصغر وحدة بنائية للمادة وتتكون من نواة مركزية وسحابة إلكترونية.',
              'داخل النواة: بروتونات موجبة الشحنة (p+) ونيوترونات متعادلة (n0).',
              'حول النواة: إلكترونات سالبة الشحنة (e-) تدور في مستويات طاقة محددة (K, L, M...).',
              'العدد الذري: هو عدد البروتونات الموجبة في النواة وهو الهوية الفريدة لكل عنصر في الجدول الدوري.',
              'الذرة في حالتها العادية متعادلة كهربائياً لأن عدد البروتونات الموجبة يساوي عدد الإلكترونات السالبة.'
            ],
            keyPoints: ['البروتون موجب، الإلكترون سالب، النيوترون متعادل', 'العدد الذري = عدد البروتونات', 'الذرة متعادلة كهربائياً'],
            sampleQuestions: [
              {
                id: 'q-prep-s1',
                question: 'شحنة الإلكترونات التي تدور حول النواة هي:',
                options: ['سالبة', 'موجبة', 'متعادلة', 'مزدوجة'],
                correctIndex: 0,
                explanation: 'الإلكترونات تحمل شحنة سالبة، والبروتونات تحمل شحنة موجبة.'
              }
            ]
          }
        ]
      },
      {
        id: 'english-prep',
        name: 'اللغة الإنجليزية',
        nameEn: 'English Language',
        icon: '🇬🇧',
        color: '#7c3aed',
        lessons: [
          {
            id: 'prep-eng-1',
            title: 'Past Simple vs Present Perfect',
            titleEn: 'Past Simple vs Present Perfect Tenses',
            summary: 'When to use finished past time vs experiences with impact on now.',
            explanation: [
              'Past Simple: Used for actions finished at a specific time in the past (yesterday, last year, in 2020, ago).',
              'Form: Subject + Verb2 (-ed or irregular like went, saw, ate). Example: "I visited London in 2022."',
              'Present Perfect: Used for experiences, actions with no specific time, or past actions with a result in the present.',
              'Form: Subject + have/has + Past Participle (V3). Example: "I have visited London three times."',
              'Keywords for Present Perfect: already, yet, just, ever, never, since, for.'
            ],
            keyPoints: ['Past Simple = specific past time', 'Present Perfect = experience/result now', 'Keywords: since, for, already, yet'],
            sampleQuestions: [
              {
                id: 'q-prep-e1',
                question: 'I _______ my keys! Now I can’t open the door.',
                options: ['have lost', 'lost', 'losing', 'was lost'],
                correctIndex: 0,
                explanation: 'The action happened in the past but has a direct result right now (I can’t open the door), so we use Present Perfect.'
              },
              {
                id: 'q-prep-e2',
                question: 'She ________ to Paris two years ago.',
                options: ['traveled', 'has traveled', 'travels', 'traveling'],
                correctIndex: 0,
                explanation: '"Two years ago" specifies a finished past time, which requires Past Simple.'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'secondary',
    name: 'المرحلة الثانوية',
    nameEn: 'Secondary / High School',
    icon: '🚀',
    color: 'from-purple-600 to-pink-600',
    subjects: [
      {
        id: 'physics-sec',
        name: 'الفيزياء',
        nameEn: 'Physics',
        icon: '⚡',
        color: '#7c3aed',
        lessons: [
          {
            id: 'sec-phy-1',
            title: 'قوانين نيوتن للحركة والقصور الذاتي',
            titleEn: "Newton's Laws of Motion & Inertia",
            summary: 'القوانين الثلاثة التي تحكم حركة الأجسام في الكون وتطبيقاتها الهندسية.',
            explanation: [
              'قانون نيوتن الأول (القصور الذاتي): يظل الجسم الساكن ساكناً والمتحرك بسرعة ثابتة في خط مستقيم متحركاً، ما لم تؤثر عليه قوة محصلة خارجية تغير من حالته.',
              'قانون نيوتن الثاني: القوة المحصلة المؤثرة على جسم تساوي كتلته مضروبة في تسارعه: F = m × a. القوة تقاس بالنيوتن (N).',
              'قانون نيوتن الثالث: لكل فعل رد فعل مساوٍ له في المقدار ومضاد له في الاتجاه (مثل اندفاع الصاروخ لأعلى نتيجة خروج الغازات المحترقة لأسفل).',
              'تطبيقات عملية: أحزمة الأمان في السيارات والوسائد الهوائية لحماية الركاب من القصور الذاتي عند التوقف المفاجئ.'
            ],
            keyPoints: ['الأول: القصور الذاتي ومقاومة التغير', 'الثاني: F = m × a', 'الثالث: الفعل ورد الفعل متساويان ومتعاكسان'],
            sampleQuestions: [
              {
                id: 'q-sp1',
                question: 'إذا أثرت قوة مقدارها 50 نيوتن على جسم كتلته 10 كجم، فكم يكون تسارعه؟',
                options: ['5 م/ث²', '500 م/ث²', '0.2 م/ث²', '40 م/ث²'],
                correctIndex: 0,
                explanation: 'باستخدام قانون نيوتن الثاني: a = F / m = 50 / 10 = 5 م/ث².'
              },
              {
                id: 'q-sp2',
                question: 'اندفاع راكب الحافلة إلى الأمام عند توقفها فجأة يرجع إلى:',
                options: ['القصور الذاتي', 'الجاذبية الأرضية', 'قوة الاحتكاك', 'الدفع الصاروخي'],
                correctIndex: 0,
                explanation: 'القصور الذاتي يجعل جسم الراكب يحاول الاستمرار في حالة الحركة التي كان عليها.'
              }
            ]
          }
        ]
      },
      {
        id: 'math-sec',
        name: 'التفاضل والتكامل',
        nameEn: 'Calculus & Derivatives',
        icon: '📈',
        color: '#2563eb',
        lessons: [
          {
            id: 'sec-cal-1',
            title: 'قواعد الاشتقاق الأساسية والمعدل اللحظي',
            titleEn: 'Basic Rules of Differentiation',
            summary: 'مشتقة الدالة كثيرة الحدود، مشتقة الثابت، وقاعدة السلسلة.',
            explanation: [
              'المشتقة الأولى f’(x) أو dy/dx تمثل هندسياً ميل المماس لمنحنى الدالة عند أي نقطة، وفيزيائياً تمثل معدل التغير اللحظي (مثل السرعة اللحظية v = dx/dt).',
              'قاعدة القوة: مشتقة x^n هي n × x^(n-1). مثال: مشتقة x³ هي 3x².',
              'مشتقة الثابت: مشتقة أي عدد ثابت c تساوي صفر دائماً، لأن الثابت لا يتغير (ميله أفقي = 0).',
              'قاعدة المجموع: مشتقة (f + g) هي مشتقة الأول + مشتقة الثاني.',
              'مثال شامل: أوجد مشتقة y = 4x³ - 5x + 7. الحل: y’ = 4(3x²) - 5(1) + 0 = 12x² - 5.'
            ],
            keyPoints: ['مشتقة x^n هي n·x^(n-1)', 'مشتقة الثابت = صفر', 'المشتقة = ميل المماس = معدل التغير اللحظي'],
            sampleQuestions: [
              {
                id: 'q-sm1',
                question: 'ما هي مشتقة الدالة f(x) = 5x² + 3 ؟',
                options: ['10x', '10x + 3', '5x', '10'],
                correctIndex: 0,
                explanation: 'مشتقة 5x² هي 5 × 2x = 10x، ومشتقة الثابت 3 هي صفر. الناتج 10x.'
              }
            ]
          }
        ]
      },
      {
        id: 'chemistry-sec',
        name: 'الكيمياء',
        nameEn: 'Chemistry',
        icon: '⚗️',
        color: '#059669',
        lessons: [
          {
            id: 'sec-chem-1',
            title: 'الاتزان الكيميائي وقاعدة لوشاتيليه',
            titleEn: "Chemical Equilibrium & Le Chatelier's Principle",
            summary: 'كيف تستجيب التفاعلات الانعكاسية لتغيرات الضغط والحرارة والتركيز.',
            explanation: [
              'التفاعل الانعكاسي يصل إلى حالة اتزان ديناميكي عندما تتساوى سرعة التفاعل الأمامي مع سرعة التفاعل العكسي وتثبت تراكيز المواد المتفاعلة والناتجة.',
              'قاعدة لوشاتيليه: إذا طرأ تغير على أحد العوامل المؤثرة على نظام متزن (مثل التركيز أو درجة الحرارة أو الضغط)، فإن النظام ينشط في الاتجاه الذي يقلل أو يلغي تأثير هذا التغير.',
              'تأثير التركيز: زيادة تركيز مادة متفاعلة يزيح الاتزان نحو النواتج لتصريف الزيادة.',
              'تأثير الحرارة: في التفاعل الطارد للحرارة، خفض الحرارة يزيح الاتزان في الاتجاه الأمامي لتعويض النقص.'
            ],
            keyPoints: ['الاتزان ديناميكي تتساوى فيه السرعتان', 'قاعدة لوشاتيليه تعاكس المؤثر الخارجي', 'الضغط يؤثر فقط على التفاعلات الغازية متفاوتة المولات'],
            sampleQuestions: [
              {
                id: 'q-sc1',
                question: 'في تفاعل متزن طارد للحرارة، ماذا يحدث عند رفع درجة الحرارة؟',
                options: ['ينشط التفاعل في الاتجاه العكسي', 'ينشط التفاعل في الاتجاه الأمامي', 'لا يتأثر الاتزان', 'يتوقف التفاعل تماماً'],
                correctIndex: 0,
                explanation: 'حسب لوشاتيليه، عند إضافة حرارة لنظام طارد، ينشط النظام في الاتجاه الماص (العكسي) لامتصاص الحرارة الزائدة.'
              }
            ]
          }
        ]
      }
    ]
  }
];
