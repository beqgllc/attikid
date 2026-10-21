"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { copyText, downloadText, estimateSyllables, analyzeLyricRhymes, type RhymeType } from "@/components/studio/studio-utilities";

type NoticeState = { kind: "success" | "error" | "info"; text: string } | null;

function Notice({ notice }: { notice: NoticeState }) {
  if (!notice) return null;
  return <p className={`ak-studio-notice ak-studio-notice--${notice.kind}`} role="status">{notice.text}</p>;
}

async function copyWithNotice(value: string, setNotice: (notice: NoticeState) => void) {
  const success = await copyText(value);
  setNotice(success
    ? { kind: "success", text: "Copied to clipboard." }
    : { kind: "error", text: "Clipboard access is unavailable. Select the text and copy it manually." });
}

function downloadAnalysis(filename: string, value: string) {
  downloadText(filename, value);
}

export function RhymeFinderTool() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"perfect" | "near">("perfect");
  const [limit, setLimit] = useState("30");
  const [results, setResults] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error" | "success">("idle");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<NoticeState>(null);
  const [scratchpad, setScratchpad] = useState<string[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const requestRef = useRef(0);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setStatus("error");
      setMessage("Enter a word or phrase to search.");
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestRef.current;
    const lookupWord = trimmed.split(/\s+/).at(-1) ?? trimmed;
    const relation = mode === "perfect" ? "rel_rhy" : "rel_nry";
    setStatus("loading");
    setMessage("Searching for rhyme suggestions…");
    setNotice(null);

    try {
      const params = new URLSearchParams({ [relation]: lookupWord, max: limit });
      const response = await fetch(`https://api.datamuse.com/words?${params.toString()}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(response.status === 429
        ? "The rhyme service is rate-limiting requests. Wait a moment and try again."
        : `The rhyme service returned HTTP ${response.status}.`);
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) throw new Error("The rhyme service returned an unexpected response.");
      const words = payload
        .filter((item): item is { word: string } =>
          typeof item === "object" && item !== null && typeof item.word === "string")
        .map((item) => item.word.trim())
        .filter((word) => word.length > 0 && word.toLowerCase() !== lookupWord.toLowerCase());
      if (requestRef.current !== requestId) return;
      setResults(words);
      setStatus(words.length ? "success" : "empty");
      setMessage(words.length
        ? `${words.length} suggestions for “${lookupWord}”.`
        : `No suggestions found for “${lookupWord}”. Try another word or switch rhyme mode.`);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      if (requestRef.current !== requestId) return;
      setStatus("error");
      setMessage(error instanceof Error
        ? error.message
        : "The rhyme service could not be reached. Check your connection and try again.");
    }
  }

  function toggleScratchpad(word: string) {
    setScratchpad((current) => current.includes(word)
      ? current.filter((item) => item !== word)
      : [...current, word]);
  }

  return (
    <div className="ak-tool-stack">
      <div className="ak-tool-grid ak-tool-grid--rhyme">
        <section className="ak-tool-panel">
          <div className="ak-tool-panel__heading"><span>01 / LOOKUP</span><span>REMOTE PHONETIC SUGGESTIONS</span></div>
          <form className="ak-tool-form" onSubmit={search}>
            <label className="ak-studio-field">
              <span>WORD OR PHRASE</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={120} placeholder="e.g. late night" autoComplete="off" />
            </label>
            <div className="ak-studio-form-row">
              <label className="ak-studio-field">
                <span>RHYME MODE</span>
                <select value={mode} onChange={(event) => setMode(event.target.value as "perfect" | "near")}>
                  <option value="perfect">Perfect rhymes</option>
                  <option value="near">Near rhymes</option>
                </select>
              </label>
              <label className="ak-studio-field">
                <span>RESULT COUNT</span>
                <select value={limit} onChange={(event) => setLimit(event.target.value)}>
                  <option value="10">10 results</option>
                  <option value="20">20 results</option>
                  <option value="30">30 results</option>
                  <option value="50">50 results</option>
                </select>
              </label>
            </div>
            <button className="ak-studio-button ak-studio-button--primary" type="submit" disabled={status === "loading"}>
              {status === "loading" ? "SEARCHING…" : "FIND RHYMES"} <span aria-hidden="true">↗</span>
            </button>
          </form>
          <p className="ak-studio-help">For phrase searches, this lookup uses the final word only. Results come from Datamuse when online; no draft lyrics are sent, only the word you submit.</p>
          <Notice notice={notice} />
        </section>

        <section className="ak-tool-panel">
          <div className="ak-tool-panel__heading"><span>02 / RESULTS</span><span>{status === "success" ? results.length : "—"} WORDS</span></div>
          <p className="ak-tool-message" aria-live="polite">{message || "Enter a word to view suggestions here."}</p>
          {results.length > 0 && (
            <>
              <div className="ak-rhyme-results">
                {results.map((word) => (
                  <div className="ak-rhyme-result" key={word}>
                    <button type="button" className="ak-rhyme-result__word" onClick={() => toggleScratchpad(word)} aria-pressed={scratchpad.includes(word)}>
                      {word}
                    </button>
                    <button type="button" className="ak-icon-button" onClick={() => void copyWithNotice(word, setNotice)} aria-label={`Copy ${word}`}>COPY</button>
                  </div>
                ))}
              </div>
              <div className="ak-tool-actions">
                <button type="button" className="ak-studio-button" onClick={() => void copyWithNotice(results.join(", "), setNotice)}>COPY ALL RESULTS</button>
                <button type="button" className="ak-studio-button" onClick={() => { setResults([]); setStatus("idle"); setMessage(""); setNotice(null); }}>CLEAR RESULTS</button>
              </div>
            </>
          )}
          {status === "empty" && <p className="ak-studio-muted">Try a shorter input or use the near-rhyme mode for looser matches.</p>}
        </section>
      </div>

      <section className="ak-tool-panel">
        <div className="ak-tool-panel__heading"><span>03 / SCRATCHPAD</span><span>{scratchpad.length} SAVED WORDS</span></div>
        {scratchpad.length ? (
          <>
            <div className="ak-rhyme-scratchpad">
              {scratchpad.map((word) => <button type="button" key={word} onClick={() => toggleScratchpad(word)} aria-label={`Remove ${word} from scratchpad`}>{word} <span aria-hidden="true">×</span></button>)}
            </div>
            <div className="ak-tool-actions">
              <button type="button" className="ak-studio-button" onClick={() => void copyWithNotice(scratchpad.join(", "), setNotice)}>COPY SCRATCHPAD</button>
              <button type="button" className="ak-studio-button" onClick={() => setScratchpad([])}>CLEAR SCRATCHPAD</button>
            </div>
          </>
        ) : <p className="ak-studio-muted">Select any result word to collect it here while you write.</p>}
      </section>
      <p className="ak-studio-footnote">Source: Datamuse word-finding API. Linguistic matches depend on the provider’s phonetic data; this tool does not analyze a complete multi-word phrase.</p>
    </div>
  );
}

const sectionHeader = /^\[(?:intro|verse(?:\s*\d+)?|pre[- ]?chorus|chorus|hook|bridge|breakdown|outro|ad[- ]?libs?|refrain|instrumental)(?:\s*[^\]]*)?\]$/i;

export function BarCounterTool() {
  const [lyrics, setLyrics] = useState("");
  const [target, setTarget] = useState("12");
  const [notice, setNotice] = useState<NoticeState>(null);
  const breakdown = useMemo(() => lyrics.split("\n").map((line, index) => {
    const trimmed = line.trim();
    const isHeader = sectionHeader.test(trimmed);
    const words = isHeader || !trimmed ? [] : trimmed.match(/[A-Za-z0-9’'-]+/g) ?? [];
    const syllables = words.reduce((total, word) => total + estimateSyllables(word), 0);
    return { line: index + 1, text: line, isHeader, isBlank: !trimmed, wordCount: words.length, syllables };
  }), [lyrics]);
  const lyricLines = breakdown.filter((line) => !line.isHeader && !line.isBlank);
  const words = lyricLines.reduce((total, line) => total + line.wordCount, 0);
  const syllables = lyricLines.reduce((total, line) => total + line.syllables, 0);
  const average = lyricLines.length ? syllables / lyricLines.length : 0;
  const targetNumber = Number(target);

  const report = [
    "ATTIKID STUDIO — SYLLABLE & BAR ANALYSIS",
    `Words: ${words}`,
    `Lyric lines / estimated bars: ${lyricLines.length}`,
    `Estimated syllables: ${syllables}`,
    `Average syllables per line: ${average.toFixed(1)}`,
    "",
    ...breakdown.map((line) => line.isHeader
      ? `Line ${line.line}: [SECTION] ${line.text.trim()}`
      : line.isBlank ? `Line ${line.line}: [BLANK]` : `Line ${line.line}: ${line.syllables} estimated syllables — ${line.text}`),
    "",
    "Note: syllable counts are estimates based on English spelling, not audio or performed cadence.",
  ].join("\n");

  return (
    <div className="ak-tool-grid ak-tool-grid--editor">
      <section className="ak-tool-panel">
        <div className="ak-tool-panel__heading"><span>LYRIC INPUT</span><span>OFFLINE ANALYSIS</span></div>
        <label className="ak-studio-field"><span>PASTE OR WRITE LYRICS</span>
          <textarea className="ak-studio-textarea ak-studio-textarea--large" value={lyrics} onChange={(event) => setLyrics(event.target.value)} placeholder={"[Verse 1]\nWrite one candidate bar per line..."} rows={17} />
        </label>
        <div className="ak-studio-form-row ak-studio-form-row--tight">
          <label className="ak-studio-field"><span>TARGET SYLLABLES / LINE</span>
            <input type="number" min="1" max="40" value={target} onChange={(event) => setTarget(event.target.value)} />
          </label>
          <div className="ak-studio-field"><span>LINE COUNT RULE</span><p className="ak-studio-static-value">Each nonempty lyric line = 1 bar</p></div>
        </div>
        <div className="ak-tool-actions">
          <button className="ak-studio-button" type="button" onClick={() => void copyWithNotice(report, setNotice)}>COPY ANALYSIS</button>
          <button className="ak-studio-button" type="button" onClick={() => downloadAnalysis("attikid-bar-analysis.txt", report)}>DOWNLOAD .TXT</button>
          <button className="ak-studio-button" type="button" onClick={() => { if (lyrics && window.confirm("Clear the lyric draft?")) { setLyrics(""); setNotice(null); } }}>CLEAR DRAFT</button>
        </div>
        <Notice notice={notice} />
      </section>
      <section className="ak-tool-panel">
        <div className="ak-tool-panel__heading"><span>LINE ANALYSIS</span><span>ESTIMATES ONLY</span></div>
        <div className="ak-studio-metrics">
          <div><span>WORDS</span><strong>{words}</strong></div>
          <div><span>LYRIC LINES / BARS</span><strong>{lyricLines.length}</strong></div>
          <div><span>TOTAL SYLLABLES</span><strong>{syllables}</strong></div>
          <div><span>AVG. SYLLABLES / LINE</span><strong>{average.toFixed(1)}</strong></div>
        </div>
        <div className="ak-bar-breakdown">
          {breakdown.filter((line) => !line.isBlank).map((line) => {
            const offTarget = !line.isHeader && target !== "" && Number.isFinite(targetNumber) && Math.abs(line.syllables - targetNumber) > 2;
            return (
              <div className={`ak-bar-line${line.isHeader ? " ak-bar-line--header" : ""}${offTarget ? " ak-bar-line--off-target" : ""}`} key={line.line}>
                <span className="ak-bar-line__number">{String(line.line).padStart(2, "0")}</span>
                <span className="ak-bar-line__copy">{line.isHeader ? <strong>{line.text.trim()}</strong> : line.text}</span>
                {!line.isHeader && <span className="ak-bar-line__count">{line.syllables} syl.</span>}
              </div>
            );
          })}
          {!breakdown.some((line) => !line.isBlank) && <p className="ak-studio-muted">Your line-by-line breakdown will appear as you write.</p>}
        </div>
        <p className="ak-studio-footnote">The count is a spelling-based estimate. Accents, pronunciation, contractions, ad-libs, and performed timing may change the actual syllable count.</p>
      </section>
    </div>
  );
}

type PromptForm = {
  genre: string; subgenre: string; mood: string; intensity: string; bpm: string;
  timeSignature: string; vocalPresentation: string; vocalDelivery: string; vocalTexture: string;
  instrumentation: string; production: string; arrangement: string; dynamics: string;
  exclusions: string; language: string; notes: string;
};
type PromptEmphasis = "balanced" | "vocal" | "production" | "arrangement";

const promptDefaults: PromptForm = {
  genre: "Hip-hop / Rap", subgenre: "Emo rap", mood: "melancholic, tense", intensity: "restrained verses opening into a cathartic hook",
  bpm: "92", timeSignature: "4/4", vocalPresentation: "masculine lead vocal", vocalDelivery: "melodic rap with conversational verses",
  vocalTexture: "low, grainy, intimate, lightly strained", instrumentation: "detuned piano, muted guitar, deep 808, sparse atmospheric pads",
  production: "dry upfront vocal, controlled low end, wide but restrained ambience, crisp percussion",
  arrangement: "short instrumental intro, verse, hook, second verse, final hook, unresolved outro",
  dynamics: "minimal opening, gradual layering, beat drops back before the final hook",
  exclusions: "", language: "English", notes: "",
};

const promptPresets: Record<string, Partial<PromptForm>> = {
  "emo-rap": promptDefaults,
  "melodic-rap": { ...promptDefaults, genre: "Hip-hop / Rap", subgenre: "Melodic rap", mood: "reflective, urgent", intensity: "steady momentum with a lift in the hook", bpm: "104", instrumentation: "round 808 bass, glassy keys, plucked guitar, tight hats", vocalDelivery: "rhythmic melodic phrasing, singable hook, controlled ad-libs" },
  "alternative-rnb": { ...promptDefaults, genre: "R&B", subgenre: "Alternative R&B", mood: "late-night, intimate, uneasy", intensity: "understated and close-mic'd", bpm: "78", instrumentation: "detuned electric piano, sub bass, clipped drums, reversed textures", vocalPresentation: "androgynous lead vocal", vocalDelivery: "breathy melodic phrasing with a few spoken lines", arrangement: "texture-led intro, verse, refrain, second verse, stripped bridge, fading outro" },
  "country-trap": { ...promptDefaults, genre: "Country / Hip-hop", subgenre: "Country trap", mood: "worn-down, defiant, widescreen", intensity: "quiet storytelling builds to a heavy hook", bpm: "88", instrumentation: "acoustic guitar, 808 bass, live snare, slide guitar accents", vocalDelivery: "plainspoken country phrasing over a syncopated rap pocket", production: "organic guitar transients against a controlled sub bass; keep the vocal clear" },
  "pop": { ...promptDefaults, genre: "Pop", subgenre: "Alternative pop", mood: "bittersweet, immediate, hopeful", intensity: "tight verse into a broad melodic chorus", bpm: "116", instrumentation: "muted synth bass, bright plucks, live-feeling drums, layered vocal harmonies", vocalDelivery: "clear melodic lead with a memorable, concise chorus" },
  "rock": { ...promptDefaults, genre: "Rock", subgenre: "Alternative rock", mood: "restless, raw, release-driven", intensity: "contained verse, explosive chorus, quiet bridge", bpm: "122", instrumentation: "overdriven rhythm guitars, live drums, melodic bass, feedback textures", vocalPresentation: "rough-edged lead vocal", vocalDelivery: "dynamic sung verses with a forceful open-throated chorus" },
  "experimental": { ...promptDefaults, genre: "Experimental hybrid", subgenre: "Industrial trip-hop / alt rap", mood: "surreal, claustrophobic, unstable", intensity: "irregular tension and abrupt dropouts", bpm: "96", instrumentation: "granular vocal fragments, detuned keys, distorted sub, metallic percussion", production: "intentional texture contrast, restrained distortion, space around low-frequency elements", arrangement: "fragmented intro, unstable verse, abrupt refrain, reduced bridge, unresolved ending" },
  "country-pop": { genre: "Country / Pop", subgenre: "Modern country pop", mood: "nostalgic, open, resilient", intensity: "intimate verse into a wide singalong chorus", bpm: "100", timeSignature: "4/4", vocalPresentation: "natural lead vocal", vocalDelivery: "clear storytelling with sustained melodic phrases", vocalTexture: "warm, lightly raspy", instrumentation: "acoustic guitar, piano, live drums, steel guitar accents", production: "organic instruments, balanced low end, vocal-forward mix", arrangement: "intro, verse, chorus, second verse, chorus, bridge, final chorus, outro", dynamics: "build from sparse acoustic opening to a full final chorus", exclusions: "", language: "English", notes: "" },
};

function buildPrompt(form: PromptForm, emphasis: PromptEmphasis) {
  const bpm = Number(form.bpm);
  const tempo = form.bpm.trim() && Number.isFinite(bpm) && bpm >= 30 && bpm <= 250 ? `${bpm} BPM` : "";
  const vocal = [form.vocalPresentation, form.vocalDelivery, form.vocalTexture].filter(Boolean).join("; ");
  const palette = [form.genre, form.subgenre].filter(Boolean).join(" / ");
  const core = [palette, form.mood, form.intensity].filter(Boolean).join("; ");
  const instrumental = form.instrumentation.trim();
  const production = form.production.trim();
  const arrangement = form.arrangement.trim();
  const dynamics = form.dynamics.trim();
  const sections: string[] = [];

  if (emphasis === "vocal") {
    if (vocal) sections.push(`VOCAL DIRECTION: ${vocal}.`);
    if (core) sections.push(`SONIC IDENTITY: ${core}.`);
    if (instrumental) sections.push(`INSTRUMENTAL PALETTE: ${instrumental}.`);
  } else if (emphasis === "production") {
    if (production) sections.push(`MIX AND PRODUCTION: ${production}.`);
    if (instrumental) sections.push(`SOUND SOURCES: ${instrumental}.`);
    if (core) sections.push(`STYLE AND EMOTION: ${core}.`);
    if (vocal) sections.push(`VOCALS: ${vocal}.`);
  } else if (emphasis === "arrangement") {
    if (arrangement) sections.push(`ARRANGEMENT: ${arrangement}.`);
    if (dynamics) sections.push(`DYNAMIC ARC: ${dynamics}.`);
    if (core) sections.push(`STYLE AND EMOTION: ${core}.`);
    if (instrumental) sections.push(`INSTRUMENTAL PALETTE: ${instrumental}.`);
    if (vocal) sections.push(`VOCALS: ${vocal}.`);
  } else {
    if (core) sections.push(`Create a ${core} track.`);
    if (vocal) sections.push(`Vocal direction: ${vocal}.`);
    if (instrumental) sections.push(`Instrumentation: ${instrumental}.`);
    if (production) sections.push(`Production: ${production}.`);
    if (arrangement) sections.push(`Structure: ${arrangement}.`);
    if (dynamics) sections.push(`Dynamics: ${dynamics}.`);
  }

  if (tempo || form.timeSignature) sections.push(`TEMPO / METER: ${[tempo, form.timeSignature].filter(Boolean).join(", ")}.`);
  if (form.language.trim()) sections.push(`LANGUAGE: ${form.language.trim()}.`);
  if (form.exclusions.trim()) sections.push(`AVOID: ${form.exclusions.trim()}.`);
  if (form.notes.trim()) sections.push(`ADDITIONAL DIRECTION: ${form.notes.trim()}.`);
  return sections.join("\n\n").replace(/\s+\./g, ".").trim();
}

export function PromptBuilderTool() {
  const [form, setForm] = useState<PromptForm>(promptDefaults);
  const [preset, setPreset] = useState("emo-rap");
  const [emphasis, setEmphasis] = useState<PromptEmphasis>("balanced");
  const [prompt, setPrompt] = useState(() => buildPrompt(promptDefaults, "balanced"));
  const [notice, setNotice] = useState<NoticeState>(null);

  function update<K extends keyof PromptForm>(key: K, value: PromptForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function changePreset(value: string) {
    setPreset(value);
    setEmphasis("balanced");
    setForm({ ...promptDefaults, ...(promptPresets[value] ?? {}) });
    setNotice(null);
  }

  return (
    <div className="ak-tool-grid ak-tool-grid--editor">
      <section className="ak-tool-panel">
        <div className="ak-tool-panel__heading"><span>BUILD YOUR SOUND</span><span>STRUCTURED INPUT</span></div>
        <div className="ak-studio-field"><label htmlFor="prompt-preset">STARTING PRESET</label>
          <select id="prompt-preset" value={preset} onChange={(event) => changePreset(event.target.value)}>
            <option value="emo-rap">Emo rap</option><option value="melodic-rap">Melodic rap</option><option value="alternative-rnb">Alternative R&amp;B</option><option value="country-trap">Country trap</option><option value="country-pop">Country pop</option><option value="pop">Alternative pop</option><option value="rock">Alternative rock</option><option value="experimental">Experimental hybrid</option>
          </select>
        </div>
        <div className="ak-studio-form-grid">
          <label className="ak-studio-field"><span>GENRE</span><input value={form.genre} onChange={(event) => update("genre", event.target.value)} /></label>
          <label className="ak-studio-field"><span>SUBGENRE</span><input value={form.subgenre} onChange={(event) => update("subgenre", event.target.value)} /></label>
          <label className="ak-studio-field"><span>MOOD</span><input value={form.mood} onChange={(event) => update("mood", event.target.value)} /></label>
          <label className="ak-studio-field"><span>EMOTIONAL INTENSITY</span><input value={form.intensity} onChange={(event) => update("intensity", event.target.value)} /></label>
          <label className="ak-studio-field"><span>BPM (30–250)</span><input type="number" min="30" max="250" value={form.bpm} onChange={(event) => update("bpm", event.target.value)} /></label>
          <label className="ak-studio-field"><span>TIME SIGNATURE</span><select value={form.timeSignature} onChange={(event) => update("timeSignature", event.target.value)}><option>4/4</option><option>3/4</option><option>6/8</option><option>12/8</option><option>2/4</option><option>5/4</option><option>7/8</option></select></label>
          <label className="ak-studio-field"><span>VOCAL PRESENTATION</span><select value={form.vocalPresentation} onChange={(event) => update("vocalPresentation", event.target.value)}><option value="">Unspecified</option><option>masculine lead vocal</option><option>feminine lead vocal</option><option>androgynous lead vocal</option><option>duet / contrasting voices</option><option>instrumental, no lead vocal</option><option>spoken-word lead</option></select></label>
          <label className="ak-studio-field"><span>VOCAL DELIVERY</span><input value={form.vocalDelivery} onChange={(event) => update("vocalDelivery", event.target.value)} /></label>
          <label className="ak-studio-field"><span>VOCAL TEXTURE</span><input value={form.vocalTexture} onChange={(event) => update("vocalTexture", event.target.value)} /></label>
          <label className="ak-studio-field"><span>INSTRUMENTATION</span><textarea value={form.instrumentation} onChange={(event) => update("instrumentation", event.target.value)} rows={3} /></label>
          <label className="ak-studio-field"><span>PRODUCTION / MIX</span><textarea value={form.production} onChange={(event) => update("production", event.target.value)} rows={3} /></label>
          <label className="ak-studio-field"><span>ARRANGEMENT / STRUCTURE</span><textarea value={form.arrangement} onChange={(event) => update("arrangement", event.target.value)} rows={3} /></label>
          <label className="ak-studio-field"><span>ENERGY / DYNAMICS</span><textarea value={form.dynamics} onChange={(event) => update("dynamics", event.target.value)} rows={3} /></label>
          <label className="ak-studio-field"><span>EXCLUSIONS</span><input value={form.exclusions} onChange={(event) => update("exclusions", event.target.value)} placeholder="e.g. no bright EDM synths" /></label>
          <label className="ak-studio-field"><span>LANGUAGE</span><input value={form.language} onChange={(event) => update("language", event.target.value)} /></label>
          <label className="ak-studio-field ak-studio-field--full"><span>ADDITIONAL NOTES</span><textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} rows={2} placeholder="Optional details for the intended result." /></label>
        </div>
        <div className="ak-tool-actions">
          <button className="ak-studio-button" type="button" onClick={() => { setForm(promptDefaults); setPreset("emo-rap"); setEmphasis("balanced"); setPrompt(buildPrompt(promptDefaults, "balanced")); setNotice(null); }}>RESET FORM</button>
        </div>
      </section>
      <section className="ak-tool-panel">
        <div className="ak-tool-panel__heading"><span>OUTPUT / EDITABLE PROMPT</span><span>{prompt.length} CHARACTERS</span></div>
        <div className="ak-prompt-variations" aria-label="Prompt emphasis variations">
          {([
            ["balanced", "BALANCED"], ["vocal", "VOCAL-LED"], ["production", "PRODUCTION-LED"], ["arrangement", "ARRANGEMENT-LED"],
          ] as [PromptEmphasis, string][]).map(([value, label]) => (
            <button type="button" className={emphasis === value ? "is-active" : ""} key={value} onClick={() => { setEmphasis(value); setPrompt(buildPrompt(form, value)); }} aria-pressed={emphasis === value}>{label}</button>
          ))}
        </div>
        <label className="ak-studio-field"><span>EDIT THE RESULT BEFORE COPYING</span>
          <textarea className="ak-studio-textarea ak-studio-textarea--large" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={15} />
        </label>
        <div className="ak-tool-actions">
          <button className="ak-studio-button ak-studio-button--primary" type="button" onClick={() => void copyWithNotice(prompt, setNotice)}>COPY PROMPT</button>
          <button className="ak-studio-button" type="button" onClick={() => downloadAnalysis("attikid-song-prompt.txt", prompt)}>DOWNLOAD .TXT</button>
        </div>
        <Notice notice={notice} />
        <p className="ak-studio-footnote">This is a local prompt-building utility, not an AI model. It does not generate audio or submit prompts to a music service.</p>
      </section>
    </div>
  );
}

const sectionLabels = [
  "Intro", "Verse 1", "Pre-Chorus", "Chorus", "Verse 2", "Verse 3", "Bridge", "Breakdown", "Outro", "Ad-libs",
];

function formatLyricDraft(input: string, uppercase: boolean, collapseBlankLines: boolean) {
  const recognized: Record<string, string> = {
    intro: "Intro", verse: "Verse", chorus: "Chorus", hook: "Chorus", refrain: "Chorus",
    "pre chorus": "Pre-Chorus", "pre-chorus": "Pre-Chorus", bridge: "Bridge", breakdown: "Breakdown",
    outro: "Outro", "ad libs": "Ad-libs", "ad-libs": "Ad-libs",
  };
  let result = input.split("\n").map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    const key = trimmed.replace(/^\[|\]$/g, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").toLowerCase();
    const match = key.match(/^(pre[- ]chorus|ad[- ]libs?|intro|verse|chorus|hook|refrain|bridge|breakdown|outro)(?:\s*(\d+))?$/);
    if (match) {
      const base = recognized[match[1]] ?? recognized[match[1].replace("-", " ")] ?? match[1];
      const label = `${base}${match[2] ? ` ${match[2]}` : ""}`;
      return uppercase ? `[${label.toUpperCase()}]` : `[${label}]`;
    }
    return trimmed;
  }).join("\n");
  if (collapseBlankLines) result = result.replace(/\n{3,}/g, "\n\n");
  return result.trim();
}

export function LyricFormatterTool() {
  const [draft, setDraft] = useState("");
  const [formatted, setFormatted] = useState("");
  const [uppercase, setUppercase] = useState(false);
  const [collapseBlankLines, setCollapseBlankLines] = useState(true);
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const [notice, setNotice] = useState<NoticeState>(null);

  function insertSection(label: string) {
    const textarea = sourceRef.current;
    const start = textarea?.selectionStart ?? draft.length;
    const end = textarea?.selectionEnd ?? draft.length;
    const before = draft.slice(0, start);
    const after = draft.slice(end);
    const needsSpacer = before.length > 0 && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const inserted = `${needsSpacer}[${label}]` + "\n";
    const next = before + inserted + after;
    setDraft(next);
    requestAnimationFrame(() => {
      const input = sourceRef.current;
      if (!input) return;
      input.focus();
      const caret = (before + inserted).length;
      input.setSelectionRange(caret, caret);
    });
  }

  function format() {
    setFormatted(formatLyricDraft(draft, uppercase, collapseBlankLines));
    setNotice({ kind: "success", text: "Formatting applied. Lyric words and section order were preserved." });
  }

  return (
    <div className="ak-tool-grid ak-tool-grid--editor">
      <section className="ak-tool-panel">
        <div className="ak-tool-panel__heading"><span>01 / ORIGINAL DRAFT</span><span>{draft.length} CHARACTERS</span></div>
        <label className="ak-studio-field"><span>LYRICS</span>
          <textarea ref={sourceRef} className="ak-studio-textarea ak-studio-textarea--large" value={draft} onChange={(event) => setDraft(event.target.value)} rows={15} placeholder={"Paste your rough draft here. Your wording stays yours."} />
        </label>
        <div className="ak-section-insert">
          <span>INSERT SECTION AT CURSOR</span>
          <div>{sectionLabels.map((label) => <button type="button" key={label} onClick={() => insertSection(label)}>{label}</button>)}</div>
        </div>
        <div className="ak-studio-checkbox-row">
          <label><input type="checkbox" checked={uppercase} onChange={(event) => setUppercase(event.target.checked)} /> Uppercase section labels</label>
          <label><input type="checkbox" checked={collapseBlankLines} onChange={(event) => setCollapseBlankLines(event.target.checked)} /> Normalize excess blank lines</label>
        </div>
        <div className="ak-tool-actions">
          <button className="ak-studio-button ak-studio-button--primary" type="button" onClick={format}>FORMAT DRAFT</button>
          <button className="ak-studio-button" type="button" onClick={() => { if (draft && window.confirm("Clear the original lyric draft?")) { setDraft(""); setFormatted(""); setNotice(null); } }}>CLEAR</button>
        </div>
      </section>
      <section className="ak-tool-panel">
        <div className="ak-tool-panel__heading"><span>02 / FORMATTED OUTPUT</span><span>{formatted.split("\n").length} LINES</span></div>
        <label className="ak-studio-field"><span>REVIEW AND EDIT THE RESULT</span>
          <textarea className="ak-studio-textarea ak-studio-textarea--large" value={formatted} onChange={(event) => setFormatted(event.target.value)} rows={15} placeholder="Formatted lyrics will appear here. You can edit the output before exporting." />
        </label>
        <div className="ak-tool-actions">
          <button className="ak-studio-button" type="button" onClick={() => setFormatted(draft)}>RESET OUTPUT FROM ORIGINAL</button>
          <button className="ak-studio-button" type="button" onClick={() => void copyWithNotice(formatted, setNotice)}>COPY OUTPUT</button>
          <button className="ak-studio-button" type="button" onClick={() => downloadAnalysis("attikid-formatted-lyrics.txt", formatted)}>DOWNLOAD .TXT</button>
        </div>
        <Notice notice={notice} />
        <p className="ak-studio-footnote">Formatting trims whitespace and standardizes recognizable headings only. Review the result before using it in a release workflow.</p>
      </section>
    </div>
  );
}

const rhymeStyle: Record<RhymeType, { label: string; color: string; background: string; description: string }> = {
  perfect: { label: "Perfect", color: "#ff724f", background: "rgba(255, 89, 48, .23)", description: "Matching approximate end-rhyme spelling from the final vowel sound." },
  slant: { label: "Slant", color: "#b9a0ff", background: "rgba(145, 109, 255, .22)", description: "Looser match sharing an ending consonant pattern." },
  near: { label: "Near", color: "#7bd5e7", background: "rgba(75, 192, 216, .2)", description: "Similar ending letters with a different main rhyme key." },
  multi: { label: "Multi", color: "#f3cd6c", background: "rgba(243, 205, 108, .2)", description: "A matching ending across an approximate two-syllable-or-longer phrase." },
  internal: { label: "Internal", color: "#f19ed8", background: "rgba(241, 158, 216, .2)", description: "A rhyme pair detected within the same lyric line." },
};

const rhymePriority: RhymeType[] = ["multi", "perfect", "near", "slant", "internal"];

export function LyricPadTool() {
  const [lyrics, setLyrics] = useState("");
  const [notice, setNotice] = useState<NoticeState>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const analysis = useMemo(() => analyzeLyricRhymes(lyrics), [lyrics]);
  const words = lyrics.trim() ? lyrics.match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g)?.length ?? 0 : 0;
  const lineCount = lyrics.split("\n").filter((line) => line.trim().length > 0).length;
  const order: RhymeType[] = ["perfect", "slant", "near", "multi", "internal"];

  function renderLine(line: string, lineIndex: number) {
    const tokens = [...line.matchAll(/[A-Za-z]+(?:['’][A-Za-z]+)?|[^A-Za-z]+/g)];
    return tokens.map((match, tokenIndex) => {
      const text = match[0];
      const start = match.index ?? 0;
      if (!/^[A-Za-z]/.test(text)) return <span key={`${start}-${tokenIndex}`}>{text}</span>;
      const mark = analysis.lines[lineIndex]?.find((word) => word.start === start);
      if (!mark || !mark.types.length) return <span key={`${start}-${tokenIndex}`}>{text}</span>;
      const sorted = [...mark.types].sort((first, second) => rhymePriority.indexOf(first) - rhymePriority.indexOf(second));
      const primary = sorted[0];
      const secondary = sorted[1];
      const style = {
        backgroundColor: rhymeStyle[primary].background,
        borderBottomColor: secondary ? rhymeStyle[secondary].color : rhymeStyle[primary].color,
      };
      return (
        <mark
          className="ak-lyric-mark"
          key={`${start}-${tokenIndex}`}
          style={style}
          title={sorted.map((type) => rhymeStyle[type].label).join(" + ")}
        >{text}</mark>
      );
    });
  }

  function handleClear() {
    if (lyrics && !window.confirm("Clear this lyric pad? The draft is not saved anywhere.")) return;
    setLyrics("");
    setNotice(null);
  }

  return (
    <div className="ak-lyric-pad">
      <div className="ak-lyric-pad__toolbar">
        <div><span className="ak-studio-eyebrow">LIVE RHYME MAP</span><p>Write freely. Matching word endings are highlighted as a guide, not a pronunciation verdict.</p></div>
        <div className="ak-lyric-pad__toolbar-actions">
          <button type="button" className="ak-studio-button" onClick={() => void copyWithNotice(lyrics, setNotice)}>COPY LYRICS</button>
          <button type="button" className="ak-studio-button" onClick={() => downloadText("attikid-lyric-pad.txt", lyrics)}>DOWNLOAD .TXT</button>
          <button type="button" className="ak-studio-button" onClick={handleClear}>CLEAR PAD</button>
        </div>
      </div>
      <div className="ak-lyric-pad__workspace">
        <section className="ak-lyric-pad__notepad" aria-label="Lyric Pad notepad">
          <div className="ak-lyric-pad__notepad-top"><span>UNTITLED DRAFT</span><span>LOCAL ONLY · NOT AUTO-SAVED</span></div>
          <div className="ak-lyric-pad__editor-shell">
            <pre ref={highlightRef} className="ak-lyric-pad__highlight-layer" aria-hidden="true">{lyrics ? lyrics.split("\n").map((line, index, all) => <span key={index}>{renderLine(line, index)}{index < all.length - 1 ? "\n" : ""}</span>) : <span className="ak-lyric-pad__placeholder">Start with a line. Follow the sound.</span>}{ "\n" }</pre>
            <textarea
              ref={editorRef}
              className="ak-lyric-pad__textarea"
              value={lyrics}
              onChange={(event) => setLyrics(event.target.value)}
              onScroll={() => {
                if (editorRef.current && highlightRef.current) {
                  highlightRef.current.scrollTop = editorRef.current.scrollTop;
                  highlightRef.current.scrollLeft = editorRef.current.scrollLeft;
                }
              }}
              spellCheck
              aria-label="Write lyrics in Lyric Pad"
              placeholder="Write or paste your lyrics here…"
            />
          </div>
          <div className="ak-lyric-pad__counts" aria-live="polite" aria-label="Detected rhyme pair counts">
            {order.map((type) => (
              <div className={`ak-lyric-pad__count ak-lyric-pad__count--${type}`} key={type}>
                <span>{rhymeStyle[type].label}</span><strong>{analysis.counts[type]}</strong>
              </div>
            ))}
          </div>
          <div className="ak-lyric-pad__stats"><span>{words} WORDS</span><span>{lineCount} LINES</span><span>{lyrics.length} CHARACTERS</span></div>
          <Notice notice={notice} />
        </section>

        <aside className="ak-lyric-pad__key" aria-labelledby="lyric-pad-key-title">
          <div className="ak-tool-panel__heading"><span>COLOR KEY</span><span>5 RHYME TYPES</span></div>
          <h3 id="lyric-pad-key-title">READ THE PATTERN.</h3>
          {order.map((type) => (
            <div className="ak-lyric-pad__key-item" key={type}>
              <span className={`ak-lyric-pad__swatch ak-lyric-pad__swatch--${type}`} aria-hidden="true" />
              <div><strong>{rhymeStyle[type].label}</strong><p>{rhymeStyle[type].description}</p></div>
            </div>
          ))}
          <div className="ak-lyric-pad__key-note">
            <strong>HOW TO READ COUNTS</strong>
            <p>Totals represent detected word-pair matches, not just highlighted words. A pair can count toward more than one type.</p>
          </div>
        </aside>
      </div>
      <p className="ak-studio-footnote">Rhyme highlighting is computed in your browser. English spelling is an imperfect proxy for sound: pronunciation, accent, proper names, and multisyllabic stress can produce false positives or missed rhymes. Nothing in this pad is uploaded or automatically saved.</p>
    </div>
  );
}
