export const rtlClass = (className: string) => {
  const isRTL = document.documentElement.dir === 'rtl';
  return isRTL ? `${className}-rtl` : className;
};