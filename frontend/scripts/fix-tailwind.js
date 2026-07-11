const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'public', 'tailwind-dist.css');
try {
  let css = fs.readFileSync(file, 'utf8');
  const before = 'calc(infinity * 1px)';
  if (css.includes(before)) {
    css = css.replace(new RegExp(before, 'g'), '9999px');
    fs.writeFileSync(file, css, 'utf8');
    console.log('Sanitized tailwind-dist.css: replaced infinity calc');
  } else {
    console.log('No sanitization needed for tailwind-dist.css');
  }
} catch (err) {
  console.error('Failed to sanitize tailwind-dist.css', err);
  process.exit(1);
}
