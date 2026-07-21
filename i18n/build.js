#!/usr/bin/env node
// Builds every language listed in i18n/languages.json with a single command.
// Each language is a normal mdbook build (src/<code> -> book/html/<code>,
// book/pdf/output.pdf), pointed at via MDBOOK_* env overrides so book.toml
// stays untouched. See i18n/README.md for how this fits together.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const languages = JSON.parse(fs.readFileSync(path.join(__dirname, 'languages.json'), 'utf8'));

const bookOut = path.join(root, 'book');
const htmlOut = path.join(bookOut, 'html');
const pdfOut = path.join(bookOut, 'pdf');
fs.rmSync(bookOut, { recursive: true, force: true });
fs.mkdirSync(htmlOut, { recursive: true });
fs.mkdirSync(pdfOut, { recursive: true });

// mdbook only copies assets that live inside the src dir it's building.
// The images are only tracked once, under the default language
// (src/<default>/img); for every other language they're copied in for the
// duration of the build and removed again straight after.
const defaultLang = languages.find((l) => l.default) || languages[0];
const sharedImg = path.join(root, 'src', defaultLang.code, 'img');

for (const lang of languages) {
  console.log(`\n==> Building ${lang.code} (${lang.native})`);

  const langSrcImg = path.join(root, 'src', lang.code, 'img');
  const isTempImg = lang.code !== defaultLang.code;
  if (isTempImg) fs.cpSync(sharedImg, langSrcImg, { recursive: true });

  const langBuildDir = `book/.${lang.code}`;
  const env = {
    ...process.env,
    MDBOOK_BOOK__SRC: `src/${lang.code}`,
    MDBOOK_BOOK__LANGUAGE: lang.mdbookLang,
    MDBOOK_BOOK__TITLE: lang.title,
  };

  try {
    execFileSync('mdbook', ['build', '--dest-dir', langBuildDir], { cwd: root, env, stdio: 'inherit' });
  } finally {
    if (isTempImg) fs.rmSync(langSrcImg, { recursive: true, force: true });
  }

  fs.renameSync(path.join(root, langBuildDir, 'html'), path.join(htmlOut, lang.code));

  const builtPdf = path.join(root, langBuildDir, 'pdf', 'output.pdf');
  if (fs.existsSync(builtPdf)) {
    fs.renameSync(builtPdf, path.join(pdfOut, lang.pdfName));
  }
  fs.rmSync(path.join(root, langBuildDir), { recursive: true, force: true });
}

const chooserTemplate = fs.readFileSync(path.join(__dirname, 'index.template.html'), 'utf8');
const chooser = chooserTemplate
  .replace('__BOOK_TITLE__', languages[0].title)
  .replace('__DEFAULT_LANG__', defaultLang.code)
  .replace(
    '__LANGUAGE_LINKS__',
    languages
      .map((l) => `<a class="lang-option" href="./${l.code}/" data-lang="${l.code}">${l.native}</a>`)
      .join('\n        ')
  )
  .replace('__LANGUAGE_JSON__', JSON.stringify(languages.map((l) => l.code)));

fs.writeFileSync(path.join(htmlOut, 'index.html'), chooser);

console.log('\ni18n build complete.');
