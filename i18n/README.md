# i18n

## Launching it

```
npm run build   # -> book/html/en, book/html/fr, book/pdf/*.pdf
npm run serve   # builds, then serves book/html on http://localhost:3000
```

(`npm run build` is `node i18n/build.js`, `npm run serve` is `node i18n/serve.js` —
no npm dependencies are involved, `npm` is only used to remember the commands.)

Do **not** use plain `mdbook serve` to test the language switcher or the
landing page: it only serves a single language directly at the site root
(no `/en/`, `/fr/`, ... siblings), so switching language 404s. `mdbook
serve`/`mdbook build` are still fine for iterating on the English text
itself (book.toml defaults `src` to `src/en`).

## How it works

- `src/<code>/` holds a full copy of the book for language `<code>` (e.g. `src/en`,
  `src/fr`). Files must keep the exact same relative paths across languages —
  the language switcher swaps the `/en/`/`/fr/` prefix in the URL and expects
  the rest of the path to match.
- Images are only tracked once, under the default language (`src/en/img`).
  `i18n/build.js` copies them into every other `src/<code>/img` for the
  duration of that language's build and removes the copy again afterwards —
  mdbook only bundles assets that live inside the src directory it's building.
- `i18n/languages.json` lists the languages to build.
- `i18n/build.js` runs a normal `mdbook build` once per language (overriding
  `book.src`, `book.language` and `book.title` via env vars), collects each
  into `book/html/<code>` and `book/pdf/<pdfName>`, then writes
  `book/html/index.html` from `i18n/index.template.html` — a small language
  picker that also auto-redirects returning visitors to their last choice.
- `i18n/serve.js` runs the build above and serves `book/html` with a plain
  Node http server, so the multi-language layout can be clicked through
  locally exactly as it will be deployed.
- The in-page language dropdown (`js/i18n/switcher.js`, menu bar, next to the
  theme toggle) is wired up from the `<li data-lang="...">` entries in
  `theme/index.hbs`.

## Adding a language

1. Add an entry to `i18n/languages.json`.
2. Copy `src/en` (without `img/`) to `src/<code>` and translate it
   (`SUMMARY.md` included). Keep every image reference's `../` depth
   unchanged — it must still count the file's own depth under `src/<code>`.
3. Add a matching `<li role="none"><a role="menuitem" class="theme" data-lang="<code>">...</a></li>`
   entry to the language list in `theme/index.hbs`.
4. Run `npm run serve` and click through `book/html/<code>`.
