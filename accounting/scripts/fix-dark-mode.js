// scripts/fix-dark-mode.js
const fs = require('fs');
const path = require('path');

const targetExtensions = ['.jsx', '.tsx'];
const projectRoot = path.resolve(__dirname, '../src');

const tailwindFixMap = {
  'bg-white': 'dark:bg-gray-800',
  'bg-gray-50': 'dark:bg-gray-900',
  'text-gray-900': 'dark:text-gray-200',
  'text-gray-800': 'dark:text-gray-100',
  'border-gray-200': 'dark:border-gray-700',
  'border-gray-300': 'dark:border-gray-600',
  'hover:bg-gray-100': 'dark:hover:bg-gray-700',
  'hover:text-gray-900': 'dark:hover:text-gray-100',
};

function fixTailwindClasses(content) {
  let modified = false;

  for (const [lightClass, darkClass] of Object.entries(tailwindFixMap)) {
    const regex = new RegExp(`\\b${lightClass}\\b`, 'g');
    if (regex.test(content) && !content.includes(darkClass)) {
      content = content.replace(regex, `${lightClass} ${darkClass}`);
      modified = true;
    }
  }

  return { content, modified };
}

function scanAndFix(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanAndFix(fullPath);
    } else if (targetExtensions.includes(path.extname(entry.name))) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      const { content: fixedContent, modified } = fixTailwindClasses(content);

      if (modified) {
        fs.writeFileSync(fullPath, fixedContent, 'utf-8');
        console.log(`✅ اصلاح شد: ${path.relative(projectRoot, fullPath)}`);
      }
    }
  }
}

console.log('🔍 در حال بررسی و اصلاح کلاس‌های Tailwind برای دارک مود...');
scanAndFix(projectRoot);
console.log('🎉 تمام فایل‌های اصلاح‌شده آماده‌اند.');
