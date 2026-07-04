import React, { createContext, useState, useContext, useEffect } from 'react';

type Language = 'en' | 'fa';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.services': 'Services',
    'nav.gallery': 'Gallery',
    'nav.testimonials': 'Testimonials',
    'nav.news': 'News',
    'nav.education': 'Education',
    'nav.contact': 'Contact',
    'nav.book': 'Book an Appointment',

    // Home
    'home.hero.title': 'Artful surgery, trusted hands, nested in science research',
    'home.hero.subtitle': 'Dr. Mohammad Abedian - Board-certified surgeon with over 3 decades of experience',
    'home.stats.experience': 'Years Experience',
    'home.stats.patients': 'Satisfied Patients',
    'home.stats.certified': 'Board Certified',
    'home.stats.rating': 'Patient Rating',
    'home.news.title': 'News & Education',
    'home.news.viewAll': 'View All Articles',
    'home.cta.title': 'Schedule Your Consultation',
    'home.cta.button': 'Book Now',

    // About Page
    'about.title': 'Dr. Mohammad Abedian',
    'about.subtitle': 'Meet Dr. Mohammed Abedian',
    'about.bio.p1': 'Dr. Mohammad Abedian graduated with a Doctor of Medicine (MD) degree from Shiraz University of Medical Sciences in 1990. With over three decades of surgical experience, he is recognized as one of the early adopters and leading practitioners of laparoscopic surgery, combining courage, precision, and exceptional surgical skill.',
    'about.bio.p2': 'Currently practicing at Burjeel Hospital Dubai and serving as Surgeon and Medical Director at Armada Surgical Center, Dr. Abedian advocates for a thoughtful and measured approach to patient care, emphasizing the importance of avoiding rushed decisions in clinical management.',
    'about.bio.p3': 'His consistently successful surgical outcomes, combined with his deep respect for patients, have earned him a reputation as a highly successful and beloved surgeon, leading to numerous commendations and formal recognitions throughout his career.',
    
    'about.journey.title': 'Professional Journey',
    'about.journey.early.title': 'Early Career & Academic Foundations',
    'about.journey.early.desc': 'Joined Yasuj University of Medical Sciences as a faculty member, playing a pioneering role in the establishment of the university.',
    'about.journey.specialty.title': 'Surgical Specialty Training',
    'about.journey.specialty.desc': 'Pursued postgraduate studies in General Surgery at Isfahan University of Medical Sciences, earning surgical specialty in 1997.',
    'about.journey.uae.title': 'UAE Practice & Leadership',
    'about.journey.uae.desc': 'Moved to the United Arab Emirates, actively engaged in surgical practice at Burjeel Hospital and Armada Surgical Center.',
    
    'about.education.title': 'Education & Training',
    'about.education.md': 'Doctor of Medicine (MD)',
    'about.education.md.uni': 'Shiraz University of Medical Sciences',
    'about.education.md.year': '1990',
    'about.education.specialty': 'General Surgery Specialty',
    'about.education.specialty.uni': 'Isfahan University of Medical Sciences',
    'about.education.specialty.year': '1997',
    'about.education.continuing': 'Continuous Medical Education',
    'about.education.continuing.desc': 'Ongoing commitment to staying current with surgical advances',
    
    'about.leadership.title': 'Academic Leadership',
    'about.leadership.faculty': 'Founding Faculty Member',
    'about.leadership.faculty.desc': 'Yasuj University of Medical Sciences',
    'about.leadership.department': 'Department Head',
    'about.leadership.department.desc': 'Anatomy and Physiology Departments',
    'about.leadership.founder': 'Founder & Director',
    'about.leadership.founder.desc': 'Faculty Members\' Specialty Clinic',
    'about.leadership.deputy': 'Deputy of Medical Affairs',
    'about.leadership.deputy.desc': 'Yasuj University of Medical Sciences',
    
    'about.expertise.title': 'Clinical Expertise & Specializations',
    'about.expertise.laparoscopic': 'Laparoscopic Surgery Pioneer',
    'about.expertise.laparoscopic.desc': 'Early adopter and leading practitioner of minimally invasive laparoscopic procedures for gastrointestinal tract, gallbladder, and biliary system',
    'about.expertise.thyroid': 'Thyroid Surgery Specialist',
    'about.expertise.thyroid.desc': 'Advanced expertise in thyroid surgery and endocrine surgical procedures with proven successful outcomes',
    'about.expertise.weight': 'Weight Management Expert',
    'about.expertise.weight.desc': 'Active practice in weight management and bariatric surgery in both Iran and Dubai, emphasizing comprehensive care',
    
    'about.philosophy.title': 'Philosophy of Care',
    'about.philosophy.thoughtful': 'Thoughtful & Measured Approach',
    'about.philosophy.thoughtful.desc': 'Advocates for careful, deliberate decision-making in clinical management, emphasizing the importance of avoiding rushed decisions in patient care.',
    'about.philosophy.holistic': 'Holistic Treatment Philosophy',
    'about.philosophy.holistic.desc': 'Strongly believes in the role of lifestyle modification alongside medical and surgical interventions, especially in the management of obesity and chronic diseases.',
    'about.philosophy.education': 'Patient Education & Public Health',
    'about.philosophy.education.desc': 'Dedicates significant effort to enhancing public health information and educating patients, ensuring they are well-informed partners in their healthcare journey.',
    
    'about.locations.title': 'Current Practice Locations',
    'about.locations.burjeel': 'Burjeel Hospital Dubai',
    'about.locations.burjeel.desc': 'General & Laparoscopic Surgery',
    'about.locations.armada': 'Armada Surgical Center',
    'about.locations.armada.desc': 'Surgeon & Medical Director',
    'about.locations.book': 'Book a Consultation',

    // Services Page
    'services.title': 'Our Services',
    'services.subtitle': 'Comprehensive general surgery and minimally invasive procedures with nearly three decades of surgical expertise.',
    'services.aesthetic': 'Aesthetic and Skin Surgery',
    'services.aesthetic.items': 'Excision of skin lesion (SCC, BCC, nevus, etc.),Subcutaneous masses (Lipoma, sebaceus cyst, cancer, etc.),Cutaneous and subcutaneous cellulitis and abscess,Liposuction,Abdominoplasty,Mammopexy,Mammoreduction and breast augmentation',
    'services.weight': 'Weight Control Management and Bariatric Surgery',
    'services.weight.items': 'Gastric balloon,Gastric sleeve,Gastric bypass',
    'services.hernia': 'Abdominal Wall Hernia',
    'services.hernia.items': 'Inguinal hernia repair (open and laparoscopic),Umbilical and paraumbilical hernia,Abdominal diastasis repair,Epigastric hernia repair,Incisional hernia repair',
    'services.gastrointestinal': 'Gastrointestinal Disease',
    'services.gastrointestinal.items': 'Gastric disease including cancer and ulcer,Bariatric surgeries,Colon disease and cancer,Intestinal disease and cancer,Appendicitis,Pancreatic disease and masses,Rectal cancer,Rectal prolapse,Anal disease (Hemorrhoid, anal fissure, anal fistula, etc.)',
    'services.healthcare': 'Healthcare Management Advisory',
    'services.healthcare.items': 'Hospital management advisory,Primary health care network advisory,Crisis health care services advisory',
    'services.breast': 'Breast Disease',
    'services.breast.items': 'Breast mass,Breast screening consultation,Breast infection and abscess,Breast FNA under US guide,Breast biopsy,Breast preserving mastectomy,Male Gynecomastia (Peri-areolar Subcutaneous mastectomy),Total modified mastectomy,Ectopic breast removal',
    'services.thyroid': 'Thyroid and Parathyroid Disease',
    'services.thyroid.items': 'Thyroid nodules,Thyroid FNA under US guide,Thyroid cancer management,Thyroidectomy,Parathyroidectomy',
    'services.robotic': 'Advanced and Robotic Laparoscopic Surgery',
    'services.robotic.items': 'Laparoscopic cholecystectomy,Laparoscopic appendectomy,Laparoscopic Hiatal hernia repair,Laparoscopic selective/highly selective vagotomy,Laparoscopic GI and Colon cancer surgery,Laparoscopic GI surgeries,Laparoscopic Liver disease surgery,Laparoscopic Hernia surgeries,Laparoscopic weight management and bariatric surgery,Laparoscopic pancreatic surgeries,Laparoscopic Gynecology surgeries (Hysterectomy, ovarian cystectomy, uterine myomectomy)',
    'services.laser': 'Laser Assisted Surgery',
    'services.laser.items': 'Anal hemorrhoid laser assisted treatment,Anal fistula laser assisted treatment,Anal fissure laser assisted treatment,Sacral pilonidal cyst laser assisted treatment,Subcutaneous fistula laser assisted',

    // Footer
    'footer.doctor.description': 'Dr. Mohammad Abedian - Expert laparoscopic surgeon with nearly three decades of experience.',
    'footer.services': 'Services',
    'footer.services.laparoscopic': 'Laparoscopic Surgery',
    'footer.services.thyroid': 'Thyroid Surgery',
    'footer.services.weight': 'Weight Management',
    'footer.resources': 'Resources',
    'footer.resources.about': 'About Dr. Abedian',
    'footer.resources.testimonials': 'Testimonials',
    'footer.resources.gallery': 'Gallery',
    'footer.contact': 'Contact',
    'footer.contact.burjeel': 'Burjeel Hospital',
    'footer.contact.burjeel.address': 'Sheikh Zayed Road, Dubai',
    'footer.contact.armada': 'Armada Surgical Center',
    'footer.contact.armada.address': 'Armada Tower 2, Cluster P, JLT, Dubai',
    'footer.rights': 'All rights reserved.',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.hipaa': 'HIPAA Notice',

    // Forms
    'form.name': 'Full Name',
    'form.email': 'Email Address',
    'form.phone': 'Phone Number',
    'form.date': 'Preferred Date',
    'form.message': 'Message',
    'form.submit': 'Submit',
  },
  fa: {
    // Navigation
    'nav.home': 'خانه',
    'nav.about': 'درباره ما',
    'nav.services': 'خدمات',
    'nav.gallery': 'گالری',
    'nav.testimonials': 'نظرات',
    'nav.news': 'اخبار',
    'nav.education': 'آموزش',
    'nav.contact': 'تماس با ما',
    'nav.book': 'رزرو نوبت',

    // Home
    'home.hero.title': 'جراحی هنرمندانه، دستان قابل اعتماد، در دل تحقیقات علمی',
    'home.hero.subtitle': 'دکتر محمد عابدین - جراح دارای گواهی نامه با بیش از سه دهه تجربه',
    'home.stats.experience': 'سال تجربه',
    'home.stats.patients': 'بیمار راضی',
    'home.stats.certified': 'گواهی نامه',
    'home.stats.rating': 'امتیاز بیماران',
    'home.news.title': 'اخبار و آموزش',
    'home.news.viewAll': 'مشاهده همه مقالات',
    'home.cta.title': 'نوبت خود را رزرو کنید',
    'home.cta.button': 'رزرو نوبت',

    // About Page
    'about.title': 'دکتر محمد عابدین',
    'about.subtitle': 'آشنایی با دکتر محمد عابدین',
    'about.bio.p1': 'دکتر محمد عابدین در سال ۱۳۶۹ (۱۹۹۰ میلادی) مدرک دکترای پزشکی خود را از دانشگاه علوم پزشکی شیراز دریافت کرد. با بیش از سه دهه تجربه جراحی، او به عنوان یکی از پیشگامان و برجسته‌ترین جراحان لاپاراسکوپی شناخته می‌شود که شجاعت، دقت و مهارت فوق‌العاده جراحی را ترکیب کرده است.',
    'about.bio.p2': 'دکتر عابدین در حال حاضر در بیمارستان برجیل دبی فعالیت می‌کند و به عنوان جراح و مدیر پزشکی مرکز جراحی آرامادا خدمت می‌کند. او رویکردی اندیشمندانه و سنجیده را در مراقبت از بیمار ترویج می‌دهد و بر اهمیت پرهیز از تصمیمات عجولانه در مدیریت بالینی تأکید دارد.',
    'about.bio.p3': 'نتایج موفقیت‌آمیز جراحی او، همراه با احترام عمیق به بیماران، شهرتی به عنوان جراح بسیار موفق و محبوب برای او به ارمغان آورده است که منجر به تقدیرها و شناخت‌های رسمی متعددی در طول حرفه‌اش شده است.',
    
    'about.journey.title': 'سیر حرفه‌ای',
    'about.journey.early.title': 'دوران اولیه و بنیان‌های علمی (۱۹۹۰-۱۹۹۷)',
    'about.journey.early.desc': 'به عنوان عضو هیئت علمی به دانشگاه علوم پزشکی یاسوج پیوست و نقش پیشگامی در تأسیس این دانشگاه ایفا کرد.',
    'about.journey.specialty.title': 'دوره تخصصی جراحی (۱۹۹۷)',
    'about.journey.specialty.desc': 'تحصیلات تکمیلی خود را در رشته جراحی عمومی در دانشگاه علوم پزشکی اصفهان ادامه داد و در سال ۱۹۹۷ موفق به اخذ تخصص جراحی شد.',
    'about.journey.uae.title': 'عملکرد و رهبری در امارات (۲۰۱۰ تا کنون)',
    'about.journey.uae.desc': 'در سال ۲۰۱۰ به امارات متحده عربی نقل مکان کرد و به طور فعال در حوزه جراحی در بیمارستان برجیل و مرکز جراحی آرامادا مشغول به کار است.',
    
    'about.education.title': 'تحصیلات و آموزش',
    'about.education.md': 'دکترای پزشکی (MD)',
    'about.education.md.uni': 'دانشگاه علوم پزشکی شیراز',
    'about.education.md.year': '۱۳۶۹',
    'about.education.specialty': 'تخصص جراحی عمومی',
    'about.education.specialty.uni': 'دانشگاه علوم پزشکی اصفهان',
    'about.education.specialty.year': '۱۳۷۶',
    'about.education.continuing': 'آموزش مداوم پزشکی',
    'about.education.continuing.desc': 'تعهد مستمر به به‌روز ماندن با پیشرفت‌های جراحی',
    
    'about.leadership.title': 'رهبری علمی',
    'about.leadership.faculty': 'عضو هیئت علمی بنیان‌گذار',
    'about.leadership.faculty.desc': 'دانشگاه علوم پزشکی یاسوج',
    'about.leadership.department': 'رئیس گروه',
    'about.leadership.department.desc': 'گروه‌های آناتومی و فیزیولوژی',
    'about.leadership.founder': 'بنیان‌گذار و مدیر',
    'about.leadership.founder.desc': 'کلینیک تخصصی اعضای هیئت علمی',
    'about.leadership.deputy': 'معاون امور پزشکی',
    'about.leadership.deputy.desc': 'دانشگاه علوم پزشکی یاسوج',
    
    'about.expertise.title': 'تخصص‌ها و زمینه‌های بالینی',
    'about.expertise.laparoscopic': 'پیشگام جراحی لاپاراسکوپی',
    'about.expertise.laparoscopic.desc': 'پیشگام و از برجسته‌ترین پزشکان در زمینه جراحی‌های لاپاراسکوپی و کم‌تهاجمی برای دستگاه گوارش، کیسه صفرا و سیستم صفراوی',
    'about.expertise.thyroid': 'متخصص جراحی تیروئید',
    'about.expertise.thyroid.desc': 'تخصص پیشرفته در جراحی تیروئید و اعمال جراحی غدد درون ریز با نتایج موفقیت‌آمیز اثبات شده',
    'about.expertise.weight': 'متخصص مدیریت وزن',
    'about.expertise.weight.desc': 'فعال در زمینه مدیریت وزن و جراحی چاقی در ایران و دبی با تأکید بر مراقبت جامع',
    
    'about.philosophy.title': 'فلسفه مراقبت',
    'about.philosophy.thoughtful': 'رویکرد اندیشمندانه و سنجیده',
    'about.philosophy.thoughtful.desc': 'از تصمیم‌گیری دقیق و سنجیده در مدیریت بالینی حمایت می‌کند و بر اهمیت پرهیز از تصمیمات عجولانه در مراقبت از بیمار تأکید دارد.',
    'about.philosophy.holistic': 'فلسفه درمان جامع',
    'about.philosophy.holistic.desc': 'به شدت به نقش تغییر سبک زندگی در کنار مداخلات پزشکی و جراحی، به ویژه در مدیریت چاقی و بیماری‌های مزمن، اعتقاد دارد.',
    'about.philosophy.education': 'آموزش بیمار و بهداشت عمومی',
    'about.philosophy.education.desc': 'تلاش قابل توجهی در جهت ارتقای اطلاعات بهداشت عمومی و آموزش بیماران انجام می‌دهد و اطمینان حاصل می‌کند که آنها شرکای آگاه در سفر درمانی خود هستند.',
    
    'about.locations.title': 'محل‌های فعالیت فعلی',
    'about.locations.burjeel': 'بیمارستان برجیل دبی',
    'about.locations.burjeel.desc': 'جراحی عمومی و لاپاراسکوپی',
    'about.locations.armada': 'مرکز جراحی آرامادا',
    'about.locations.armada.desc': 'جراح و مدیر پزشکی',
    'about.locations.book': 'رزرو نوبت مشاوره',

    // Services Page
    'services.title': 'خدمات ما',
    'services.subtitle': 'جراحی عمومی جامع و روش‌های کم‌تهاجمی با نزدیک به سه دهه تخصص جراحی.',
    'services.aesthetic': 'جراحی زیبایی و پوست',
    'services.aesthetic.items': 'برداشتن ضایعات پوستی (SCC، BCC، خال و غیره),توده‌های زیرجلدی (لیپوم، کیست سباسه، سرطان و غیره),سلولیت و آبسه پوستی و زیرجلدی,لیپوساکشن,ابدومینوپلاستی (جراحی شکم),ماستوپکسی (جراحی سینه),کاهش و بزرگ کردن سینه',
    'services.weight': 'مدیریت وزن و جراحی چاقی',
    'services.weight.items': 'بالون معده,اسلیو معده (آستین معده),بای‌پس معده',
    'services.hernia': 'فتق دیواره شکم',
    'services.hernia.items': 'ترمیم فتق اینگوینال (باز و لاپاراسکوپی),فتق نافی و پارانافی,ترمیم دیاستاز شکم,ترمیم فتق اپی‌گاستر,ترمیم فتق برشی',
    'services.gastrointestinal': 'بیماری‌های گوارشی',
    'services.gastrointestinal.items': 'بیماری‌های معده شامل سرطان و زخم,جراحی‌های چاقی,بیماری‌ها و سرطان کولون,بیماری‌ها و سرطان روده,آپاندیسیت,بیماری‌ها و توده‌های پانکراس,سرطان رکتوم,پرولاپس رکتوم,بیماری‌های مقعد (هموروئید، شقاق مقعد، فیستول مقعد و غیره)',
    'services.healthcare': 'مشاوره مدیریت بهداشت و درمان',
    'services.healthcare.items': 'مشاوره مدیریت بیمارستان,مشاوره شبکه مراقبت بهداشتی اولیه,مشاوره خدمات مراقبت بهداشتی در بحران',
    'services.breast': 'بیماری‌های سینه',
    'services.breast.items': 'توده سینه,مشاوره غربالگری سینه,عفونت و آبسه سینه,FNA سینه تحت راهنمایی سونوگرافی,بیوپسی سینه,ماستکتومی حفظ سینه,ژنیکوماستی مردان (ماستکتومی زیرجلدی پری‌آرئولار),ماستکتومی کامل اصلاح شده,برداشتن سینه نابجا',
    'services.thyroid': 'بیماری‌های تیروئید و پاراتیروئید',
    'services.thyroid.items': 'گره‌های تیروئید,FNA تیروئید تحت راهنمایی سونوگرافی,مدیریت سرطان تیروئید,تیروئیدکتومی,پاراتیروئیدکتومی',
    'services.robotic': 'جراحی پیشرفته و روباتیک لاپاراسکوپی',
    'services.robotic.items': 'کوله‌سیستکتومی لاپاراسکوپی,آپاندکتومی لاپاراسکوپی,ترمیم فتق هیاتال لاپاراسکوپی,واگوتومی انتخابی/بسیار انتخابی لاپاراسکوپی,جراحی سرطان GI و کولون لاپاراسکوپی,جراحی‌های GI لاپاراسکوپی,جراحی بیماری‌های کبد لاپاراسکوپی,جراحی‌های فتق لاپاراسکوپی,مدیریت وزن و جراحی چاقی لاپاراسکوپی,جراحی‌های پانکراس لاپاراسکوپی,جراحی‌های زنان لاپاراسکوپی (هیسترکتومی، سیستکتومی تخمدان، میومکتومی رحم)',
    'services.laser': 'جراحی با کمک لیزر',
    'services.laser.items': 'درمان هموروئید با کمک لیزر,درمان فیستول مقعد با کمک لیزر,درمان شقاق مقعد با کمک لیزر,درمان کیست پیلونیدال ساکرال با کمک لیزر,درمان فیستول زیرجلدی با کمک لیزر',

    // Footer
    'footer.doctor.description': 'دکتر محمد عابدین - جراح متخصص لاپاراسکوپی با نزدیک به سه دهه تجربه.',
    'footer.services': 'خدمات',
    'footer.services.laparoscopic': 'جراحی لاپاراسکوپی',
    'footer.services.thyroid': 'جراحی تیروئید',
    'footer.services.weight': 'مدیریت وزن',
    'footer.resources': 'منابع',
    'footer.resources.about': 'درباره دکتر عابدین',
    'footer.resources.testimonials': 'نظرات بیماران',
    'footer.resources.gallery': 'گالری',
    'footer.contact': 'تماس',
    'footer.contact.burjeel': 'بیمارستان برجیل',
    'footer.contact.burjeel.address': 'شیخ زاید Road، دبی',
    'footer.contact.armada': 'مرکز جراحی آرامادا',
    'footer.contact.armada.address': 'برج آرامادا ۲، Cluster P، JLT، دبی',
    'footer.rights': 'تمامی حقوق محفوظ است.',
    'footer.privacy': 'حریم خصوصی',
    'footer.terms': 'قوانین استفاده',
    'footer.hipaa': 'اطلاعیه HIPAA',

    // Forms
    'form.name': 'نام کامل',
    'form.email': 'آدرس ایمیل',
    'form.phone': 'شماره تلفن',
    'form.date': 'تاریخ ترجیحی',
    'form.message': 'پیام',
    'form.submit': 'ارسال',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'fa' : 'en');
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
