// scripts/check-dark-mode.js
const fs = require('fs');
const path = require('path');

const targetExtensions = ['.jsx', '.tsx'];
const projectRoot = path.resolve(__dirname, '../src');

const filesWithoutDarkMode = [];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (targetExtensions.includes(path.extname(entry.name))) {
      const content = fs.readFileSync(fullPath, 'utf-8');

      const hasTailwindClasses = /class(Name)?=["'][^"']*["']/.test(content);
      const hasDarkClasses = /dark:/.test(content);

      if (hasTailwindClasses && !hasDarkClasses) {
        filesWithoutDarkMode.push(fullPath);
      }
    }
  }
}

scanDirectory(projectRoot);

if (filesWithoutDarkMode.length === 0) {
  console.log('✅ همه فایل‌ها دارک مود دارند.');
} else {
  console.log('⚠️ فایل‌هایی که دارک مود ندارند:');
  filesWithoutDarkMode.forEach((file) => {
    console.log(' -', path.relative(projectRoot, file));
  });
}
