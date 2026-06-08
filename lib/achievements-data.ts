export type StudentRole = 'innovator' | 'participant';

export interface AchievementStudent {
  id: string;
  name: string;
  members?: string[];   // present only for team entries
  projectAr: string;
  projectEn: string;
  role: StudentRole;
  photos: [string, string, string];
  videoId: string;
  color: string;
}

export interface AchievementEdition {
  slug: string;
  number: 1 | 2 | 3;
  year: number;
  students: AchievementStudent[];
}

export const ACHIEVEMENT_EDITIONS: AchievementEdition[] = [
  {
    slug: 'edition-1',
    number: 1,
    year: 2023,
    students: [
      // ── المبتكرون ──────────────────────────────────────────────────
      {
        id: 'e1-s01', name: 'رضوان علي صالح',
        projectAr: 'نظام الذكاء الاصطناعي للفحص البصري للإطارات المعيبة في خط الإنتاج',
        projectEn: 'AI Visual Inspection System for Defective Tires in Production Lines',
        role: 'innovator', color: '#0078D4', videoId: 'iYxPgs3AG28',
        photos: ['/images/achievements/e1/ridwan-saleh.jpg', '/images/achievements/e1/ridwan-saleh-p1.jpg', '/images/achievements/e1/ridwan-saleh-p2.jpg'],
      },
      {
        id: 'e1-s02', name: 'اياد عبد القادر سيف',
        projectAr: 'نظام الطاقة الهجين (HPS) لمركبات الإقلاع والهبوط العمودي (VTOL) في التنقل الجوي الحضري',
        projectEn: 'Hybrid Power System (HPS) for VTOL Urban Air Mobility (UAM)',
        role: 'innovator', color: '#038387', videoId: 'iYxPgs3AG28',
        photos: ['/images/achievements/e1/iyad-seif.jpg', '/images/achievements/e1/iyad-seif-p1.jpg', '/images/achievements/e1/iyad-seif-p2.jpg'],
      },
      {
        id: 'e1-s03', name: 'مصعب الميدان',
        projectAr: 'طائرة درون بتقنيات ومميزات الذكاء الاصطناعي',
        projectEn: 'AI-Powered Drone Aircraft',
        role: 'innovator', color: '#8764B8', videoId: 'iYxPgs3AG28',
        photos: ['/images/achievements/e1/musab.jpg', '/images/achievements/e1/musab-p1.jpg', '/images/achievements/e1/musab-p2.jpg'],
      },
      {
        id: 'e1-s04', name: 'محمد عبدالملك محمد',
        projectAr: 'جهاز ترسيب · ذراع روبوت · عربة الروبوت',
        projectEn: 'Deposition Device · Robotic Arm · Robot Cart',
        role: 'innovator', color: '#C19C00', videoId: 'iYxPgs3AG28',
        photos: ['/images/achievements/e1/mohammed-abdulmalik.jpg', '/images/achievements/e1/mohammed-abdulmalik-p1.jpg', '/images/achievements/e1/mohammed-abdulmalik-p2.jpg'],
      },
      {
        id: 'e1-s05', name: 'ريمون عمر باوزير',
        projectAr: 'الخدمة المثلى للنظام الكهروضوئي المتصل بالشبكة',
        projectEn: 'Optimal Service for Grid-Connected Photovoltaic System',
        role: 'innovator', color: '#107C10', videoId: 'iYxPgs3AG28',
        photos: ['/images/achievements/e1/remon.jpg', '/images/achievements/e1/remon-p1.jpg', '/images/achievements/e1/remon-p2.jpg'],
      },
      {
        id: 'e1-s06', name: 'اسامه نبيل يحيى',
        projectAr: 'كاشفة الألغام',
        projectEn: 'Landmine Detector',
        role: 'innovator', color: '#C43E1C', videoId: 'iYxPgs3AG28',
        photos: ['/images/achievements/e1/osama-nabil.jpg', '/images/achievements/e1/osama-nabil-p1.jpg', '/images/achievements/e1/osama-nabil-p2.jpg'],
      },
      // ── الباحثون ───────────────────────────────────────────────────
      {
        id: 'e1-r01', name: 'الحسين الشرفي',
        projectAr: 'مدى مطابقة بطاقة الاحتياج لمعايير المرابحة',
        projectEn: 'Compliance of the Need Card with Murabaha Standards',
        role: 'participant', color: '#E3008C', videoId: 'ObWDgJNe9jY',
        photos: ['/images/achievements/e1/hussein-sharfi.jpg', '/images/achievements/e1/hussein-sharfi-p1.jpg', '/images/achievements/e1/hussein-sharfi-p2.jpg'],
      },
      {
        id: 'e1-r02', name: 'يحيى العمري',
        projectAr: 'منهجية استخدام الواقع الافتراضي لإحياء مواقع التراث الثقافي',
        projectEn: 'Virtual Reality Methodology for Reviving Cultural Heritage Sites',
        role: 'participant', color: '#5C2E91', videoId: 'ObWDgJNe9jY',
        photos: ['/images/achievements/e1/yahya-omari.jpg', '/images/achievements/e1/yahya-omari-p1.jpg', '/images/achievements/e1/yahya-omari-p2.jpg'],
      },
      {
        id: 'e1-r03', name: 'محمد عبدالملك',
        projectAr: 'نمذجة بطاريات السيارات الكهربائية باستخدام تابع نقل من الدرجة الثانية',
        projectEn: 'Modeling EV Batteries Using a Second-Order Transfer Function',
        role: 'participant', color: '#004E8C', videoId: 'ObWDgJNe9jY',
        photos: ['/images/achievements/e1/mohammed-am.jpg', '/images/achievements/e1/mohammed-am-p1.jpg', '/images/achievements/e1/mohammed-am-p2.jpg'],
      },
      {
        id: 'e1-r04', name: 'إبراهيم واصل',
        projectAr: 'أثر الفكر السياسي الديني لأبي حامد الغزالي في العصر السلجوقي',
        projectEn: "Al-Ghazali's Religious Political Thought in the Seljuk Era",
        role: 'participant', color: '#00B294', videoId: 'ObWDgJNe9jY',
        photos: ['/images/achievements/e1/ibrahim-wasil.jpg', '/images/achievements/e1/ibrahim-wasil-p1.jpg', '/images/achievements/e1/ibrahim-wasil-p2.jpg'],
      },
      {
        id: 'e1-r05', name: 'غمدان راجح',
        projectAr: 'القطع الأثرية في عهد المماليك',
        projectEn: 'Archaeological Artifacts in the Mamluk Era',
        role: 'participant', color: '#0078D4', videoId: 'ObWDgJNe9jY',
        photos: ['/images/achievements/e1/ghamdan.jpg', '/images/achievements/e1/ghamdan-p1.jpg', '/images/achievements/e1/ghamdan-p2.jpg'],
      },
    ],
  },
  {
    slug: 'edition-2',
    number: 2,
    year: 2024,
    students: [
      // ── المبتكرون ──────────────────────────────────────────────────
      {
        id: 'e2-s01', name: 'إياد سيف',
        projectAr: 'الأطراف الاصطناعية للأطراف العلوية بتحكم كهربائي عضلي',
        projectEn: 'Myoelectric Upper-Limb Prosthetic Prototype',
        role: 'innovator', color: '#0078D4', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/iyad-seif.jpg', '/images/achievements/e2/iyad-seif-p1.jpg', '/images/achievements/e2/iyad-seif-p2.jpg'],
      },
      {
        id: 'e2-s02', name: 'رضوان عبدالغني',
        projectAr: 'تحسين نسبة خليط الجيوبوليمر بالذكاء الاصطناعي وخوارزميات التحسين',
        projectEn: 'Geopolymer Concrete Mix Optimization Using AI',
        role: 'innovator', color: '#038387', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/ridwan.jpg', '/images/achievements/e2/ridwan-p1.jpg', '/images/achievements/e2/ridwan-p2.jpg'],
      },
      {
        id: 'e2-s03', name: 'نورا الجوفي',
        projectAr: 'جهاز الميمريستور',
        projectEn: 'Memristor Device',
        role: 'innovator', color: '#8764B8', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/nora.jpg', '/images/achievements/e2/nora-p1.jpg', '/images/achievements/e2/nora-p2.jpg'],
      },
      {
        id: 'e2-s04', name: 'عبدالفتاح باعلوي',
        projectAr: 'النظام المحسن لتقدير مدى الرضاء في النصوص العربية والتركية بنموذج هجين',
        projectEn: 'Enhanced Sentiment Analysis for Arabic & Turkish Texts',
        role: 'innovator', color: '#C19C00', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/abdulfatah.jpg', '/images/achievements/e2/abdulfatah-p1.jpg', '/images/achievements/e2/abdulfatah-p2.jpg'],
      },
      {
        id: 'e2-s05', name: 'زكريا الشعيبي',
        projectAr: 'الكشف المبكر عن سرطان الدم بتقنية مطيافية رامان المعززة مع التعلم الآلي',
        projectEn: 'Early Leukemia Detection via SERS & Machine Learning',
        role: 'innovator', color: '#107C10', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/zakariya-sh.jpg', '/images/achievements/e2/zakariya-sh-p1.jpg', '/images/achievements/e2/zakariya-sh-p2.jpg'],
      },
      {
        id: 'e2-s06', name: 'عزام الطيري',
        projectAr: 'تصنيع مركبات بوليمريه من مواد متجددة — حلول مستدامة للجيل القادم',
        projectEn: 'Polymeric Compounds from Renewable Materials',
        role: 'innovator', color: '#C43E1C', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/azzam.jpg', '/images/achievements/e2/azzam-p1.jpg', '/images/achievements/e2/azzam-p2.jpg'],
      },
      {
        id: 'e2-s07', name: 'منار إدريس',
        projectAr: 'أداة دليل جراحي لعمليات قطع العظم',
        projectEn: 'Surgical Guide Tool for Osteotomy Operations',
        role: 'innovator', color: '#E3008C', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/manar.jpg', '/images/achievements/e2/manar-p1.jpg', '/images/achievements/e2/manar-p2.jpg'],
      },
      {
        id: 'e2-s08', name: 'أحمد نصاري',
        projectAr: 'طبيب أسنان افتراضي بالذكاء الاصطناعي لاكتشاف الأسنان المكسورة',
        projectEn: 'AI Virtual Dentist for Broken Teeth Detection via X-Ray',
        role: 'innovator', color: '#5C2E91', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/ahmed-nassari.jpg', '/images/achievements/e2/ahmed-nassari-p1.jpg', '/images/achievements/e2/ahmed-nassari-p2.jpg'],
      },
      {
        id: 'e2-s09', name: 'فريق SSV',
        members: ['عبدالله باجبير', 'محمد الصلاحي', 'مكرم الهاتف'],
        projectAr: 'جهاز SSV — قياس المسافة الآمنة بين الشاشة والمشاهد وضبط الإضاءة',
        projectEn: 'SSV — Safe Screen-Viewer Distance & Lighting Adjustment Device',
        role: 'innovator', color: '#004E8C', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/ssv-team.jpg', '/images/achievements/e2/ssv-p1.jpg', '/images/achievements/e2/ssv-p2.jpg'],
      },
      {
        id: 'e2-s10', name: 'قائد عبد الرقيب القاضي',
        projectAr: 'حاوية ذكية لتصنيف القمامة أوتوماتيكياً',
        projectEn: 'Smart Automatic Waste Sorting Bin',
        role: 'innovator', color: '#00B294', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/qaid.jpg', '/images/achievements/e2/qaid-p1.jpg', '/images/achievements/e2/qaid-p2.jpg'],
      },
      {
        id: 'e2-s11', name: 'فريق Spin Coating',
        members: ['محمد طربوش الحكيمي', 'زكريا محمد الريمي', 'عبدالله فهد العفيف'],
        projectAr: 'آلة Spin Coating',
        projectEn: 'Spin Coating Machine',
        role: 'innovator', color: '#8764B8', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/spin-team.jpg', '/images/achievements/e2/spin-p1.jpg', '/images/achievements/e2/spin-p2.jpg'],
      },
      {
        id: 'e2-s12', name: 'عاصم حسن محمد الكاف',
        projectAr: 'Tempo',
        projectEn: 'Tempo',
        role: 'innovator', color: '#C19C00', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/asim.jpg', '/images/achievements/e2/asim-p1.jpg', '/images/achievements/e2/asim-p2.jpg'],
      },
      {
        id: 'e2-s13', name: 'أنس عبدالكريم عبده الجحمة',
        projectAr: 'موقع عقارات إلكتروني',
        projectEn: 'Real Estate Website',
        role: 'innovator', color: '#107C10', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/anas.jpg', '/images/achievements/e2/anas-p1.jpg', '/images/achievements/e2/anas-p2.jpg'],
      },
      {
        id: 'e2-s14', name: 'حمزة علي حسين القهبلي',
        projectAr: 'جهاز مراقبة صحي',
        projectEn: 'Health Monitoring Device',
        role: 'innovator', color: '#0078D4', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/hamza-q.jpg', '/images/achievements/e2/hamza-q-p1.jpg', '/images/achievements/e2/hamza-q-p2.jpg'],
      },
      {
        id: 'e2-s15', name: 'تميم عبدالرحمن حيدر النهاري',
        projectAr: 'روبوت متحرك',
        projectEn: 'Mobile Robot',
        role: 'innovator', color: '#038387', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/tamim.jpg', '/images/achievements/e2/tamim-p1.jpg', '/images/achievements/e2/tamim-p2.jpg'],
      },
      // ── الباحثون ───────────────────────────────────────────────────
      {
        id: 'e2-r01', name: 'وهيب طشان',
        projectAr: 'تحليل تحسين مرونة التنقل في الشبكات غير المتجانسة ذات الكثافة العالية',
        projectEn: 'Mobility Resilience Optimization in High-Density Heterogeneous Networks',
        role: 'participant', color: '#C43E1C', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/wahib.jpg', '/images/achievements/e2/wahib-p1.jpg', '/images/achievements/e2/wahib-p2.jpg'],
      },
      {
        id: 'e2-r02', name: 'فتحيه وهبه',
        projectAr: 'تقييم الخصائص الفيزيائية والكيميائية والتوافق الحيوي لجزيئات أكسيد الجادولينيوم كعوامل تباين في التصوير بالرنين المغناطيسي',
        projectEn: 'Evaluation of Gadolinium Oxide Nanoparticles as MRI Contrast Agents',
        role: 'participant', color: '#E3008C', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/fatihiya.jpg', '/images/achievements/e2/fatihiya-p1.jpg', '/images/achievements/e2/fatihiya-p2.jpg'],
      },
      {
        id: 'e2-r03', name: 'يحيى جبر',
        projectAr: 'مشتقات الثيازول الجديدة: التخليق وتحليل البنية البلورية والتقييمات البيولوجية',
        projectEn: 'New Thiazole Derivatives: Synthesis, X-Ray Structure & Biological Evaluations',
        role: 'participant', color: '#5C2E91', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/yahya.jpg', '/images/achievements/e2/yahya-p1.jpg', '/images/achievements/e2/yahya-p2.jpg'],
      },
      {
        id: 'e2-r04', name: 'عصام الأحمدي',
        projectAr: 'أثر الحرب على العنف القائم على النوع الاجتماعي في اليمن',
        projectEn: 'Impact of War on Gender-Based Violence in Yemen',
        role: 'participant', color: '#004E8C', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/issam.jpg', '/images/achievements/e2/issam-p1.jpg', '/images/achievements/e2/issam-p2.jpg'],
      },
      {
        id: 'e2-r05', name: 'هاني الجباري',
        projectAr: 'الدراسات الدلالية الحديثة — توشيهيكو إيزوتسو أنموذجاً',
        projectEn: 'Modern Semantic Studies: Toshihiko Izutsu as a Model',
        role: 'participant', color: '#00B294', videoId: 'AS_Pj9ECTUw',
        photos: ['/images/achievements/e2/hani.jpg', '/images/achievements/e2/hani-p1.jpg', '/images/achievements/e2/hani-p2.jpg'],
      },
    ],
  },
  {
    slug: 'edition-3',
    number: 3,
    year: 2025,
    students: [
      // ── المبتكرون — دراسات عليا ────────────────────────────────────
      {
        id: 'e3-s01', name: 'يحيى جبر',
        projectAr: 'مركبات كيميائية مضادة للسرطان والبيكتريا والفطريات بثلاث براءات اختراع',
        projectEn: 'Anti-Cancer, Antibacterial & Antifungal Compounds — Three Patents',
        role: 'innovator', color: '#0078D4', videoId: '7eWVxi1OgjY',
        photos: ['/images/achievements/e3/yahya-jabr.jpg', '/images/achievements/e3/yahya-jabr-p1.jpg', '/images/achievements/e3/yahya-jabr-p2.jpg'],
      },
      {
        id: 'e3-s02', name: 'فتحيه وهبه',
        projectAr: 'مركب نانوني مبتكر من السليلوز والجادولينيوم لتحسين التصوير بالرنين المغناطيسي باستخدام أشعة جاما',
        projectEn: 'Cellulose-Gadolinium Nanocomposite for Enhanced MRI Using Gamma Rays',
        role: 'innovator', color: '#038387', videoId: '7eWVxi1OgjY',
        photos: ['/images/achievements/e3/fatihiya-wahba.jpg', '/images/achievements/e3/fatihiya-wahba-p1.jpg', '/images/achievements/e3/fatihiya-wahba-p2.jpg'],
      },
      {
        id: 'e3-s03', name: 'روضه غالب',
        projectAr: 'بطاريات صديقة للبيئة من كربون فسسفوري مستخلص من الدياتوميت والريحان الأرجواني',
        projectEn: 'Eco-Friendly Batteries from Phosphorous Carbon Extracted from Diatomite & Purple Basil',
        role: 'innovator', color: '#8764B8', videoId: '7eWVxi1OgjY',
        photos: ['/images/achievements/e3/rawdha.jpg', '/images/achievements/e3/rawdha-p1.jpg', '/images/achievements/e3/rawdha-p2.jpg'],
      },
      // ── المبتكرون — بكالوريوس ──────────────────────────────────────
      {
        id: 'e3-s04', name: 'فريق الدرع الضوئي',
        members: ['تميم النهاري', 'عبدالله العبد', 'مختار حافظ', 'عبدالرحمن العبد', 'محمد طالل', 'رضوان الشوبكي', 'يوسف امجد', 'أنس عيد'],
        projectAr: 'الدرع الضوئي — منظومة دفاع جوي',
        projectEn: 'Optical Shield — Air Defense System',
        role: 'innovator', color: '#C19C00', videoId: '7eWVxi1OgjY',
        photos: ['/images/achievements/e3/shield-team.jpg', '/images/achievements/e3/shield-p1.jpg', '/images/achievements/e3/shield-p2.jpg'],
      },
      {
        id: 'e3-s05', name: 'فريق VTOL LIFELINE',
        members: ['ايمن الحميري', 'محمد طلال جامل', 'عصام الشاوش', 'طه خليل'],
        projectAr: 'VTOL LIFELINE — طائرة خط الحياة',
        projectEn: 'VTOL LIFELINE — Rescue Aircraft',
        role: 'innovator', color: '#107C10', videoId: '7eWVxi1OgjY',
        photos: ['/images/achievements/e3/vtol-lifeline-team.jpg', '/images/achievements/e3/vtol-lifeline-p1.jpg', '/images/achievements/e3/vtol-lifeline-p2.jpg'],
      },
      {
        id: 'e3-s06', name: 'فريق مُكمّل',
        members: ['أنس مهيوب القاضي', 'محمد باجحاو'],
        projectAr: 'مُكمّل (Mukammil) — نظام دمج روبوتي',
        projectEn: 'Mukammil — Robotic Integration System',
        role: 'innovator', color: '#C43E1C', videoId: '7eWVxi1OgjY',
        photos: ['/images/achievements/e3/mukammil-team.jpg', '/images/achievements/e3/mukammil-p1.jpg', '/images/achievements/e3/mukammil-p2.jpg'],
      },
      {
        id: 'e3-s07', name: 'فريق الطائرة الشمسية',
        members: ['يزن بن بشر', 'تميم النهاري', 'خالد باهبري', 'اياد الخطيب', 'طه ماردينلي'],
        projectAr: 'طائرة مسيرة بالطاقة الشمسية',
        projectEn: 'Solar-Powered Drone',
        role: 'innovator', color: '#E3008C', videoId: '7eWVxi1OgjY',
        photos: ['/images/achievements/e3/solar-drone-team.jpg', '/images/achievements/e3/solar-drone-p1.jpg', '/images/achievements/e3/solar-drone-p2.jpg'],
      },
      {
        id: 'e3-s08', name: 'فريق VTOL SKYGÖZÜ',
        members: ['حسام سليمان', 'أحمد الورد', 'شادي سيف'],
        projectAr: 'VTOL SKYGÖZÜ — طائرة مسيرة',
        projectEn: 'VTOL SKYGÖZÜ — Unmanned Aerial Vehicle',
        role: 'innovator', color: '#5C2E91', videoId: '7eWVxi1OgjY',
        photos: ['/images/achievements/e3/skygozü-team.jpg', '/images/achievements/e3/skygozü-p1.jpg', '/images/achievements/e3/skygozü-p2.jpg'],
      },
      {
        id: 'e3-s09', name: 'فريق Nephrocare POC',
        members: ['محمد ناشر', 'محمد إيهاب', 'محمد صالح', 'هاشم الجومي', 'رضوان الإياني', 'اسامة العريفي', 'خالد حامد', 'حبيب الاكوع', 'يوسف ماتوبه', 'عيسى بن نزار'],
        projectAr: 'Nephrocare POC — جهاز قياس المستشعرات الحيوية لمرضى الكلى',
        projectEn: 'Nephrocare POC — Kidney Patients Biosensor Device',
        role: 'innovator', color: '#004E8C', videoId: '7eWVxi1OgjY',
        photos: ['/images/achievements/e3/nephrocare-team.jpg', '/images/achievements/e3/nephrocare-p1.jpg', '/images/achievements/e3/nephrocare-p2.jpg'],
      },
      {
        id: 'e3-s10', name: 'عزام عبدالله المخلافي',
        projectAr: 'SKY BRIDGE — طائرة جسر السماء للدعم والإنقاذ',
        projectEn: 'SKY BRIDGE — Support & Rescue Aircraft',
        role: 'innovator', color: '#00B294', videoId: '7eWVxi1OgjY',
        photos: ['/images/achievements/e3/azzam-m.jpg', '/images/achievements/e3/azzam-m-p1.jpg', '/images/achievements/e3/azzam-m-p2.jpg'],
      },
      // ── الباحثون ───────────────────────────────────────────────────
      {
        id: 'e3-r01', name: 'فريق بحث الاقتصاد اليمني',
        members: ['مقبل أحمد عبد الله', 'أحمد عبد العزيز السارة', 'ماجد محمد المطري', 'عبد العزيز أحمد بن عبد العزيز'],
        projectAr: 'نحو نموذج متكامل لإعادة هيكلة الاقتصاد اليمني: مقاربة استراتيجية لبناء اقتصاد مقاوم ومستدام',
        projectEn: 'Towards an Integrated Model for Restructuring the Yemeni Economy',
        role: 'participant', color: '#0078D4', videoId: '7eWVxi1OgjY',
        photos: ['/images/achievements/e3/economy-team.jpg', '/images/achievements/e3/economy-p1.jpg', '/images/achievements/e3/economy-p2.jpg'],
      },
      {
        id: 'e3-r02', name: 'فريق بحث التعليم المهني',
        members: ['سلسبيل سعيد', 'سلسبيل صدام الذيباني', 'شيماء عبد الله اليدومي', 'أشجان علي شمسان', 'أيمن عمر', 'عبد العزيز محمد المالكي'],
        projectAr: 'التعليم الفني والتدريب المهني في اليمن: الواقع والتحديات والتطلعات المستقبلية',
        projectEn: 'Technical & Vocational Education in Yemen: Reality, Challenges & Prospects',
        role: 'participant', color: '#038387', videoId: '7eWVxi1OgjY',
        photos: ['/images/achievements/e3/vocational-team.jpg', '/images/achievements/e3/vocational-p1.jpg', '/images/achievements/e3/vocational-p2.jpg'],
      },
      {
        id: 'e3-r03', name: 'فريق بحث الواقع التعليمي',
        members: ['محمد قاسم الجمالي', 'محمد عقلان', 'عبد الله علي المخلافي'],
        projectAr: 'الواقع التعليمي في اليمن وآثاره بعد الحرب',
        projectEn: 'Educational Reality in Yemen and Its Post-War Impact',
        role: 'participant', color: '#8764B8', videoId: '7eWVxi1OgjY',
        photos: ['/images/achievements/e3/education-team.jpg', '/images/achievements/e3/education-p1.jpg', '/images/achievements/e3/education-p2.jpg'],
      },
      {
        id: 'e3-r04', name: 'مبادرة YEMGROW',
        members: ['هديل عبد الله الجبري', 'معتصم علي النهاري', 'عمرو عبده العواضي', 'عبد الرزاق أنيس فاضل', 'معاذ خالد بابطاح'],
        projectAr: 'مبادرة YEMGROW — نحو تنمية زراعية مستدامة في اليمن',
        projectEn: 'YEMGROW Initiative — Towards Sustainable Agricultural Development in Yemen',
        role: 'participant', color: '#107C10', videoId: '7eWVxi1OgjY',
        photos: ['/images/achievements/e3/yemgrow-team.jpg', '/images/achievements/e3/yemgrow-p1.jpg', '/images/achievements/e3/yemgrow-p2.jpg'],
      },
      {
        id: 'e3-r05', name: 'مبادرة نزاهة',
        members: ['أبوبكر مهيوب عبده محمد', 'الحسن محمد زبارة'],
        projectAr: 'مبادرة نزاهة',
        projectEn: 'Integrity Initiative',
        role: 'participant', color: '#C43E1C', videoId: '7eWVxi1OgjY',
        photos: ['/images/achievements/e3/integrity-team.jpg', '/images/achievements/e3/integrity-p1.jpg', '/images/achievements/e3/integrity-p2.jpg'],
      },
    ],
  },
];
