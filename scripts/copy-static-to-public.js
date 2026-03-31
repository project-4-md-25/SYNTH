/**
 * Vercel ожидает статику в outputDirectory (по умолчанию public/).
 * Копируем HTML и ассеты в public/; api/ остаётся в корне для serverless.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pub = path.join(root, 'public');

fs.rmSync(pub, { recursive: true, force: true });
fs.mkdirSync(pub, { recursive: true });

const htmlFiles = ['index.html', 'catalog.html', 'configurator.html', 'faq.html', 'wireframe.html'];
for (const f of htmlFiles) {
  const src = path.join(root, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(pub, f));
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, ent.name);
    const to = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

for (const dir of ['css', 'js', 'img', 'data', 'atribut']) {
  const src = path.join(root, dir);
  if (fs.existsSync(src)) {
    copyDir(src, path.join(pub, dir));
  }
}

console.log('Static files copied to public/');
