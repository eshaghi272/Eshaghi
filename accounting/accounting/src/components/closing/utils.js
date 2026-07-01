// تابع تبدیل تاریخ میلادی به شمسی
export const formatPersianDate = (dateString) => {
  if (!dateString) return '';
  try {
    // اگر تاریخ شمسی است (مانند 1404/01/01) همان را برگردان
    if (typeof dateString === 'string' && dateString.includes('/')) {
      return dateString;
    }
    
    // اگر تاریخ میلادی است، به شمسی تبدیل کن
    if (dateString instanceof Date || (typeof dateString === 'string' && dateString.includes('-'))) {
      const date = new Date(dateString);
      const persianDate = new Intl.DateTimeFormat('fa-IR').format(date);
      return persianDate;
    }
    
    return dateString;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// تابع فرمت ارز
export const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '۰ ریال';
  const absoluteValue = Math.abs(Math.round(value));
  return new Intl.NumberFormat('fa-IR').format(absoluteValue) + ' ریال';
};

// تابع به‌روزرسانی مراحل
export const updateSteps = (steps, currentStep) => {
  return steps.map(step => ({
    ...step,
    status: 
      step.step < currentStep ? 'completed' :
      step.step === currentStep ? 'active' : 'pending'
  }));
};