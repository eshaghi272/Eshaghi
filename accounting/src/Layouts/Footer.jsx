const Footer = ({ isDarkMode }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-gray-800 dark:bg-gray-900 text-white h-10 flex items-center">
      <div className="w-full text-center text-xs text-gray-300 dark:text-gray-400">
        © {currentYear} کلیه حقوق محفوظ است.
      </div>
    </footer>
  );
};

export default Footer;
