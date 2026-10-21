# ATTIKID

ATTIKID's artist site and creator workspace. The public music catalog remains available alongside browser-first Studio tools.

## ATTIKID Studio

Open the Studio at [attikid.com/studio](https://www.attikid.com/studio).

### Routes and tools

- `/studio` — workspace landing page and tool directory.
- `/studio/tools/rhyme-finder` — Datamuse-powered perfect and near-rhyme lookup with a temporary scratchpad.
- `/studio/tools/bar-counter` — offline heuristic syllable estimates, line counts, and cadence comparisons.
- `/studio/tools/prompt-builder` — editable structured prompts and local style/production variations; it does not generate audio or call an AI model.
- `/studio/tools/lyric-formatter` — section insertion and conservative formatting that preserves lyric wording.
- `/studio/tools/bpm-planner` — editable song sections, tempo, time signature, bar totals, and estimated runtime.
- `/studio/tools/split-sheet` — contributor/ownership draft with validation, CSV export, and print output.
- `/studio/tools/release-checklist` — suggested release tasks, custom tasks, browser-local progress, JSON export, and print output.
- `/studio/tools/epk-builder` — artist press-kit editor with local preview and text/print output.
- `/studio/tools/lyric-pad` — notepad with color-coded perfect, slant, near, multisyllabic, and internal rhyme highlighting.

The Music corner navigation groups Albums and Songs under **Music**. The Songs directory search filters by song title.

### Local-first data and privacy

- Lyrics, rhyme scratchpads, prompt drafts, split-sheet contributor data, and EPK fields are not automatically saved or sent to a backend.
- Studio recent-tool history and Release Checklist progress are stored in versioned browser-local storage keys. They do not sync across devices and may be lost when browser/site data is cleared.
- Rhyme Finder makes a request to the Datamuse public API only when the user submits a lookup; it sends the lookup word, not the draft. The provider currently has no API key configured in this frontend. Its published key-policy transition is expected on February 1, 2027; evaluate a secure server-side proxy or alternate provider before that date. Never place long-term secrets in `NEXT_PUBLIC_*` variables.
- Lyric Pad and Bar Counter use spelling heuristics, not an audio engine or pronunciation dictionary. Review rhyme colors and syllable estimates manually.
- Split sheets and EPK previews are working drafts, not legal contracts or published web pages.

### Development and validation

- `npm run dev` — start the Next.js development server.
- `npm run lint` — run ESLint.
- `npm run typecheck` — run TypeScript checking.
- `npm run build` — production build.
- `npm run check` — lint, typecheck, and build.

The current repository does not define a Vitest or Playwright test script. The configured CI workflow runs lint, typecheck, and build on pushes and pull requests to `master`.
