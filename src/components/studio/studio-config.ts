export const studioTools = [
  {
    id: "rhyme-finder",
    name: "Rhyme Finder",
    category: "WRITE",
    symbol: "RHY",
    description: "Find perfect and near rhymes, then collect words for your next line.",
    detail: "Search a word or phrase for remotely sourced rhyme suggestions and build a temporary scratchpad.",
  },
  {
    id: "bar-counter",
    name: "Syllable & Bar Counter",
    category: "WRITE",
    symbol: "8:8",
    description: "Check line length, syllable estimates, and lyrical density.",
    detail: "Inspect each lyric line with an offline syllable estimate and compare it with your target cadence.",
  },
  {
    id: "lyric-formatter",
    name: "Lyric Formatter",
    category: "WRITE",
    symbol: "[ ]",
    description: "Clean up lyric drafts and organize song sections without rewriting your words.",
    detail: "Normalize spacing and section labels while keeping the words and intentional line breaks intact.",
  },
  {
    id: "lyric-pad",
    name: "Lyric Pad",
    category: "WRITE",
    symbol: "Aa",
    description: "Write in a focused notepad with a live, color-coded rhyme map.",
    detail: "See perfect, slant, near, multisyllabic, and internal rhyme patterns highlighted as you write.",
  },
  {
    id: "prompt-builder",
    name: "AI Song Prompt Builder",
    category: "CREATE",
    symbol: "PROMPT",
    description: "Shape genre, vocals, instruments, production, and arrangement into a usable prompt.",
    detail: "Build an editable structured prompt locally, with distinct composition and production variations.",
  },
  {
    id: "bpm-planner",
    name: "BPM & Song Structure Planner",
    category: "PRODUCE",
    symbol: "BPM",
    description: "Plan tempo, bars, sections, and an estimated track duration.",
    detail: "Edit a song timeline and calculate section duration from tempo and time signature.",
  },
  {
    id: "split-sheet",
    name: "Split-Sheet Generator",
    category: "ORGANIZE",
    symbol: "%",
    description: "Prepare a draft record of collaborators and agreed ownership percentages.",
    detail: "Validate contributors and percentages, then export a CSV or print a draft for review.",
  },
  {
    id: "release-checklist",
    name: "Release Checklist",
    category: "ORGANIZE",
    symbol: "TODO",
    description: "Track creative, credits, distribution, marketing, and release tasks.",
    detail: "Use an editable release checklist with browser-local progress and JSON export.",
  },
  {
    id: "epk-builder",
    name: "Electronic Press Kit Builder",
    category: "ORGANIZE",
    symbol: "EPK",
    description: "Draft a professional artist press kit with a real-time preview.",
    detail: "Prepare bios, releases, links, achievements, and press quotes for export or printing.",
  },
] as const;

export type StudioToolId = (typeof studioTools)[number]["id"];

export function studioToolById(id: string) {
  return studioTools.find((tool) => tool.id === id);
}
