# CSES Forge

A Firefox extension that turns any [CSES](https://cses.fi) problem page into a full in-page IDE — problem statement, a real Monaco code editor, a test runner, and one-click submission — without ever leaving the page.

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Manifest V3](https://img.shields.io/badge/manifest-v3-orange.svg)
![Firefox](https://img.shields.io/badge/firefox-89%2B-ff7139.svg?logo=firefoxbrowser&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

Made with ❤️ by [Karan Yadav](https://github.com/karanBRAVO) ([@karanBRAVO](https://github.com/karanBRAVO))

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [How it works](#how-it-works)
- [Architecture](#architecture)
  - [Why the build is split into three Vite configs](#why-the-build-is-split-into-three-vite-configs)
  - [Content script ↔ editor iframe protocol](#content-script--editor-iframe-protocol)
  - [Shadow DOM styling](#shadow-dom-styling)
  - [Run vs. Submit](#run-vs-submit)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Development workflow](#development-workflow)
- [Publishing to Firefox Add-ons](#publishing-to-firefox-add-ons)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

## Features

- **In-page problem statement** — scraped directly from the CSES DOM, including rendered KaTeX math and example test cases.
- **Full Monaco editor** (C++, Python, Java) embedded on the page, with syntax highlighting, font size and word-wrap settings.
- **Per-account, per-problem code persistence** — code is saved to `browser.storage.local`, namespaced by CSES account and problem, so switching accounts or reloading never mixes up or loses your code.
- **Light/dark theme sync** — follows CSES's own dark mode toggle automatically, with a manual override if you want to pick independently.
- **Resizable panel layout** — drag to resize the problem panel, editor, and test cases/output panels.
- **Test cases panel** — pre-filled from the problem's own examples; add/remove custom cases.
- **Run** — executes your code against every test case and shows the output, using a free public compile/run API (no backend to host yourself).
- **Submit** — checks you're logged in, then fills in and submits CSES's own submission form for you, landing you on the real verdict page.
- **No custom server** — the extension talks directly to CSES and a public execution API; there's nothing you need to deploy or maintain.

## Tech stack

| Layer                | Choice                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------- |
| UI framework         | React 19                                                                               |
| Language             | TypeScript                                                                             |
| Build tool           | Vite 8 (Rolldown-powered)                                                              |
| Styling              | Tailwind CSS v4                                                                        |
| Component primitives | [Base UI](https://base-ui.com) (shadcn-style wrappers in `src/components/ui`)          |
| Code editor          | [Monaco Editor](https://microsoft.github.io/monaco-editor/) via `@monaco-editor/react` |
| Resizable layout     | [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)            |
| Icons                | [lucide-react](https://lucide.dev)                                                     |
| Linting              | [oxlint](https://oxc.rs) (with `oxlint-tsgolint` for type-aware rules)                 |
| Extension tooling    | [web-ext](https://github.com/mozilla/web-ext)                                          |
| Code execution       | [Wandbox](https://wandbox.org) public compile/run API                                  |
| Extension platform   | Firefox, Manifest V3                                                                   |

## How it works

1. You open a CSES task page (`cses.fi/problemset/task/*`). A content script scrapes the problem statement (`src/content/scraper.ts`) and shows a floating **CSES Forge** button.
2. Clicking it mounts a React panel (`CompanionPanel.tsx`) into a **Shadow DOM** host appended to the page, so its styles never clash with CSES's own CSS.
3. The code editor itself is _not_ rendered inside that shadow tree — it's a separate extension page (`editor.html`) loaded in an `<iframe>`, running Monaco. The panel and the editor iframe talk to each other over `postMessage` using a typed protocol (`src/editor/protocol.ts`) to sync language, theme, editor settings, and code.
4. **Run** sends your code to a background script, which forwards it to Wandbox's public API for each test case in the Test Cases panel, and shows the results in the Output tab.
5. **Submit** checks you're logged into CSES; if so, it saves your code temporarily, navigates you to CSES's own `/problemset/submit/{id}` page, and auto-fills + submits the _real_ CSES submission form — so the official judge, not a third party, produces your verdict.

## Architecture

```bash
┌─────────────────────────────── CSES page (cses.fi) ───────────────────────────────┐
│                                                                                    │
│   content.ts  ──scrapes──▶  scraper.ts                                            │
│       │                                                                            │
│       ▼                                                                            │
│   Shadow DOM host                                                                  │
│   └── CompanionPanel.tsx (React)                                                   │
│         │  problem statement, toolbar, test cases/output                          │
│         │                                                                          │
│         │  postMessage (src/editor/protocol.ts)                                    │
│         ▼                                                                          │
│   ┌─────────────────────────────┐                                                 │
│   │  <iframe src="editor.html"> │  ← separate extension page (its own document)    │
│   │  EditorApp.tsx + Monaco     │                                                 │
│   └─────────────────────────────┘                                                 │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                     │ runtime.sendMessage                    │ real form submit
                     ▼                                         ▼
          background.ts ──fetch──▶ Wandbox API      cses.fi/problemset/submit/{id}
```

### Why the build is split into three Vite configs

Firefox content scripts run as classic, non-module scripts — they can't contain `import`/`export` statements. Monaco, however, needs real ES modules and Web Workers to run efficiently, which only works from a proper extension page (`editor.html`), not a content script.

Bundling everything through one Vite config caused the bundler to hoist shared code (like React's `jsx-runtime`) into a chunk loaded via `import`, which broke the content script at runtime (`SyntaxError: import declarations may only appear at top level of a module`). The fix is three independent builds:

- **`vite.config.ts`** — builds `editor.html` as a normal Vite app: ES modules, code-splitting, Web Workers, all fully supported since it's a real extension page.
- **`vite.config.content.ts`** — builds `content.ts` alone as a single self-contained IIFE bundle (`format: "iife"`), guaranteeing no `import` statements ever appear in it.
- **`vite.config.background.ts`** — same idea, for `background.ts`.

`npm run build` runs all three in sequence.

### Content script ↔ editor iframe protocol

Since the editor lives in a separate document, all communication is via `window.postMessage`, typed in `src/editor/protocol.ts`:

- `ParentToEditorMessage` — language changes, theme changes, editor settings, "give me the current code" requests.
- `EditorToParentMessage` — ready signal, code/language changes, save status, current editor settings.

The editor iframe owns and persists its own state (code, language, settings) in `browser.storage.local`; the panel is just a thin remote control that mirrors what the iframe reports back, so there's a single source of truth per concern.

### Shadow DOM styling

Tailwind's theme tokens (colors, borders, etc.) are normally declared under `:root` — but `:root` only ever matches the _page's_ `<html>` element, never anything inside a Shadow DOM. `src/content/ui/styles.css` declares them under `:host` instead, which correctly targets the shadow host and cascades down into everything the extension renders. (This one line was the source of several "borders/hover states are invisible" bugs during development — worth remembering if you add new global styles here.)

### Run vs. Submit

These intentionally work very differently:

- **Run** treats your code as untrusted scratch input — it's sent to a public third-party execution API (Wandbox) purely to produce output for _your own_ test cases. Nothing here touches CSES.
- **Submit** never executes your code itself. It locates the real submission form CSES renders on `/problemset/submit/{id}` (a separate page from the task page) and drives it exactly like a human would — filling in the language and attaching your code as a file — then lets CSES's own judge run and grade it. Because that form lives on a different page than the one you're solving on, `pendingSubmit.ts` stashes your code in `browser.storage.local` just long enough to survive the navigation.

## Project structure

```bash
public/
  manifest.json          # MV3 manifest
editor.html               # Entry HTML for the editor extension page
index.html                 # Unused Vite template entry (not part of the extension)
src/
  background/
    background.ts         # Executes code via Wandbox on behalf of the content script
  content/
    content.ts             # Entry point injected into CSES pages
    scraper.ts              # Scrapes problem statement/examples from the DOM
    auth.ts                  # Detects CSES login state + account id
    theme.ts                  # Detects/tracks CSES's own dark mode
    submit.ts                  # Fills + submits the real CSES submission form
    pendingSubmit.ts             # Carries code across the task→submit page navigation
    execute.ts                    # Relays Run requests to the background script
    ui/
      mount.tsx                    # Creates the Shadow DOM host and mounts the panel
      CompanionPanel.tsx            # Main panel: problem view, toolbar, test cases/output
      styles.css                     # Tailwind, injected into the shadow root
  editor/
    main.tsx                        # Entry point for editor.html
    EditorApp.tsx                    # Monaco editor + its own state/persistence
    protocol.ts                       # Typed postMessage contract between panel and editor
    storage.ts                         # Per-account/per-problem code + settings persistence
    monacoEnvironment.ts                # Configures Monaco's web worker
  components/ui/                        # shadcn-style component wrappers (Base UI primitives)
  types/problem.ts                       # Shared scraped-problem types
vite.config.ts             # Builds editor.html (ESM)
vite.config.content.ts      # Builds content.ts (IIFE)
vite.config.background.ts    # Builds background.ts (IIFE)
```

## Getting started

**Prerequisites:** Node 24 (see `.nvmrc`), Firefox.

```bash
git clone <this-repo>
cd cses-firefox-extension
nvm use          # picks up Node 24 from .nvmrc
npm install
npm run build     # builds dist/
```

Load it in Firefox:

1. Go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Select `dist/manifest.json`.
4. Open any CSES task page, e.g. `https://cses.fi/problemset/task/1068`.

Or use `web-ext` to launch a fresh Firefox profile with it pre-loaded:

```bash
npx web-ext run --source-dir ./dist/
```

## Development workflow

- `npm run build` — full production build (type-check, then all three Vite builds).
- `npm run lint` — runs oxlint (includes type-aware rules via `oxlint-tsgolint`).
- `npm run dev` — Vite dev server for iterating on UI in isolation (not the extension itself — `App.tsx`/`index.html` are the unmodified Vite template scaffolding, not part of the shipped extension).

There's no automated test suite yet; changes are verified manually by reloading the temporary add-on in `about:debugging` and testing against real CSES problem pages. Please do the same before opening a PR — in particular, re-check both light and dark theme, and both the Run and Submit flows, since they touch real external services (Wandbox, CSES's own submission form).

## Publishing to Firefox Add-ons

1. **Bump the version** in both `package.json` and `public/manifest.json` (they should match).
2. **Build a clean release bundle**: `rm -rf dist && npm run build`.
3. **Package it with `web-ext`** (already a dev dependency) rather than zipping by hand — manual zips made with Windows tools (Explorer's "Compress", PowerShell's `Compress-Archive`) often store `\`-separated paths, which AMO's validator rejects with `Invalid file name in archive`:

   ```bash
   npx web-ext lint --source-dir ./dist # (Optional but recommended) verify no errors before packaging
   npx web-ext build --source-dir ./dist --artifacts-dir ./web-ext-artifacts --overwrite-dest
   ```

   This produces `web-ext-artifacts/cses_forge-<version>.zip` with correctly `/`-separated paths, ready to upload as-is.

4. **Create an AMO account** at [addons.mozilla.org](https://addons.mozilla.org) if you don't have one, and sign in to the [Developer Hub](https://addons.mozilla.org/developers/).
5. **Submit a new version**: Developer Hub → _Submit a New Add-on_ → _On this site_ (recommended, for public listing) or _On your own_ (unlisted, self-distributed) → upload the zip.
6. **Automated review**: AMO runs its linter over the zip immediately; fix and re-upload if it flags anything (e.g. missing permissions justification).
7. **Fill in listing details**: name, summary, description, category, screenshots, and — importantly — a **permissions justification** explaining why the extension needs `storage` and host access to `cses.fi`/`wandbox.org` (reviewers reject vague justifications).
8. **Submit for human review** (listed extensions require manual review, which can take anywhere from hours to a couple of weeks). Unlisted/self-distributed extensions only need the automated signing step and are approved much faster.
9. Once approved, AMO **signs** the extension. For a listed submission it's published directly to the store; for unlisted, you download the signed `.xpi` and can distribute it yourself (e.g. via your own site or GitHub Releases).
10. **Keep future releases in sync**: every new version needs its manifest version bumped and goes through the same submit → review → sign cycle.

Source-code note: if the review team asks for the pre-build source (common when a build step like this project's Vite pipeline is involved), keep a matching source zip of the repo at the tagged commit ready to upload alongside build instructions (`npm install && npm run build`).

## Contributing

Contributions are welcome! A few things that make reviews smoother:

1. **Branch from `main`**, one focused change per PR.
2. **Run `npm run build` and `npm run lint`** before opening a PR — both should be clean.
3. **Test manually in Firefox** via `about:debugging` (see [Getting started](#getting-started)) — cover both light/dark theme and, if you touched Run/Submit, an actual test run and a real submission.
4. **Match the existing code style**: no comments explaining _what_ code does (only non-obvious _why_), small focused functions, and prefer extending an existing module (`src/content/*.ts`, `src/editor/*.ts`) over introducing new abstractions.
5. If you're changing anything under `src/content/ui/styles.css` or the Shadow DOM mounting logic in `mount.tsx`, please re-read [Shadow DOM styling](#shadow-dom-styling) first — it's an easy place to reintroduce a subtle, hard-to-spot styling bug.
6. Open an issue first for anything that changes the execution backend (Wandbox) or the submission mechanism, since both depend on external, unversioned behavior (a third-party API and CSES's own page markup) that can change without notice.

## License

[MIT](LICENSE)

## Author

**Karan Yadav** ([@karanBRAVO](https://github.com/karanBRAVO))

- GitHub: [github.com/karanBRAVO](https://github.com/karanBRAVO)
