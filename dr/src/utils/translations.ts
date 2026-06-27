import { Language } from '../types';

export const translations: Record<Language, Record<string, string>> = {
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
    'home.hero.cta': 'Learn More',
    'home.hero.cta2': 'Book an Appointment',
    
    // Stats
    'home.stats.experience': 'Years Experience',
    'home.stats.patients': 'Satisfied Patients',
    'home.stats.certified': 'Board Certified',
    'home.stats.rating': 'Patient Rating',
    
    // Sections
    'home.news.title': 'News & Education',
    'home.news.viewAll': 'View All Articles',
    'home.facilities.title': 'State-of-the-Art Facilities',
    'home.facilities.subtitle': 'Our practice utilizes the latest robotic and laparoscopic surgical technology to ensure the best outcomes for our patients.',
    'home.testimonials.title': 'Patient Reviews',
    'home.cta.title': 'Schedule Your Consultation',
    'home.cta.subtitle': 'Take the first step toward better health. Book your consultation with Dr. Abedian today.',
    'home.cta.button': 'Book Now',
    
    // Footer
    'footer.services': 'Services',
    'footer.resources': 'Patient Resources',
    'footer.contact': 'Contact Info',
    'footer.rights': 'All rights reserved.',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.hipaa': 'HIPAA Notice',
    
    // About
    'about.title': 'About Dr. Abedian',
    'about.experience': 'Experience',
    'about.specialization': 'Specialization',
    'about.credentials': 'Credentials',
    
    // Services
    'services.title': 'Our Services',
    'services.subtitle': 'Comprehensive surgical care with a focus on minimally invasive techniques',
    'services.laparoscopic': 'Laparoscopic Surgery',
    'services.thyroid': 'Thyroid Surgery',
    'services.weight': 'Weight Management',
    'services.consultation': 'Consultation',
    
    // Forms
    'form.name': 'Full Name',
    'form.email': 'Email Address',
    'form.phone': 'Phone Number',
    'form.date': 'Preferred Date',
    'form.time': 'Preferred Time',
    'form.service': 'Service',
    'form.message': 'Message',
    'form.submit': 'Submit',
    'form.required': 'This field is required',
    'form.invalidEmail': 'Please enter a valid email',
    'form.invalidPhone': 'Please enter a valid phone number',
    
    // Messages
    'msg.loading': 'Loading...',
    'msg.error': 'Something went wrong',
    'msg.success': 'Success!',
    'msg.noResults': 'No results found',
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
    'home.hero.cta': 'بیشتر بدانید',
    'home.hero.cta2': 'رزرو نوبت',
    
    // Stats
    'home.stats.experience': 'سال تجربه',
    'home.stats.patients': 'بیمار راضی',
    'home.stats.certified': 'گواهی نامه',
    'home.stats.rating': 'امتیاز بیماران',
    
    // Sections
    'home.news.title': 'اخبار و آموزش',
    'home.news.viewAll': 'مشاهده همه مقالات',
    'home.facilities.title': 'امکانات پیشرفته',
    'home.facilities.subtitle': 'کلینیک ما از جدیدترین تکنولوژی‌های روباتیک و جراحی لاپاراسکوپی برای بهترین نتایج استفاده می‌کند.',
    'home.testimonials.title': 'نظرات بیماران',
    'home.cta.title': 'نوبت خود را رزرو کنید',
    'home.cta.subtitle': 'اولین قدم را به سمت سلامتی بردارید. امروز با دکتر عابدین مشورت کنید.',
    'home.cta.button': 'رزرو نوبت',
    
    // Footer
    'footer.services': 'خدمات',
    'footer.resources': 'منابع بیماران',
    'footer.contact': 'اطلاعات تماس',
    'footer.rights': 'تمامی حقوق محفوظ است.',
    'footer.privacy': 'حریم خصوصی',
    'footer.terms': 'قوانین استفاده',
    'footer.hipaa': 'اطلاعیه HIPAA',
    
    // About
    'about.title': 'درباره دکتر عابدین',
    'about.experience': 'تجربه',
    'about.specialization': 'تخصص',
    'about.credentials': 'مدارک',
    
    // Services
    'services.title': 'خدمات ما',
    'services.subtitle': 'مراقبت جراحی جامع با تمرکز بر تکنیک‌های کم تهاجمی',
    'services.laparoscopic': 'جراحی لاپاراسکوپی',
    'services.thyroid': 'جراحی تیروئید',
    'services.weight': 'مدیریت وزن',
    'services.consultation': 'مشاوره',
    
    // Forms
    'form.name': 'نام کامل',
    'form.email': 'آدرس ایمیل',
    'form.phone': 'شماره تلفن',
    'form.date': 'تاریخ ترجیحی',
    'form.time': 'زمان ترجیحی',
    'form.service': 'خدمت',
    'form.message': 'پیام',
    'form.submit': 'ارسال',
    'form.required': 'این فیلد الزامی است',
    'form.invalidEmail': 'لطفاً ایمیل معتبر وارد کنید',
    'form.invalidPhone': 'لطفاً شماره تلفن معتبر وارد کنید',
    
    // Messages
    'msg.loading': 'در حال بارگذاری...',
    'msg.error': 'خطایی رخ داده است',
    'msg.success': 'موفقیت آمیز!',
    'msg.noResults': 'نتیجه‌ای یافت نشد',
  }
};

export const getTranslation = (key: string, language: Language): string => {
  return translations[language]?.[key] || key;
};
