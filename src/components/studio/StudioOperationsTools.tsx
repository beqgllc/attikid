"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { copyText, downloadText } from "@/components/studio/studio-utilities";

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

function download(filename: string, content: string, mimeType?: string) {
  downloadText(filename, content, mimeType);
}

function durationLabel(seconds: number) {
  const rounded = Math.max(0, Math.round(seconds));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

type SongSection = { id: number; name: string; bars: string; notes: string };
const structureTemplates: Record<string, { name: string; bars: number }[]> = {
  "verse-chorus": [
    { name: "Verse 1", bars: 16 }, { name: "Chorus", bars: 8 }, { name: "Verse 2", bars: 16 },
    { name: "Chorus", bars: 8 }, { name: "Bridge", bars: 8 }, { name: "Final Chorus", bars: 8 },
  ],
  "full-song": [
    { name: "Intro", bars: 4 }, { name: "Verse 1", bars: 16 }, { name: "Pre-Chorus", bars: 4 },
    { name: "Chorus", bars: 8 }, { name: "Verse 2", bars: 16 }, { name: "Chorus", bars: 8 },
    { name: "Bridge", bars: 8 }, { name: "Final Chorus", bars: 8 }, { name: "Outro", bars: 4 },
  ],
  "hook-rap": [
    { name: "Intro", bars: 4 }, { name: "Verse 1", bars: 16 }, { name: "Hook", bars: 8 },
    { name: "Verse 2", bars: 16 }, { name: "Hook", bars: 8 }, { name: "Outro", bars: 4 },
  ],
  custom: [{ name: "Intro", bars: 4 }, { name: "Verse 1", bars: 16 }, { name: "Chorus", bars: 8 }],
};

function materializeSections(template: string): SongSection[] {
  return (structureTemplates[template] ?? structureTemplates.custom).map((section, index) => ({
    id: Date.now() + index,
    name: section.name,
    bars: String(section.bars),
    notes: "",
  }));
}

export function BpmPlannerTool() {
  const [bpm, setBpm] = useState("92");
  const [meter, setMeter] = useState("4/4");
  const [template, setTemplate] = useState("verse-chorus");
  const [sections, setSections] = useState<SongSection[]>(() => materializeSections("verse-chorus"));
  const [notice, setNotice] = useState<NoticeState>(null);
  const [nextId, setNextId] = useState(1_000_000);

  const bpmNumber = Number(bpm);
  const match = meter.match(/^(\d+)\/(\d+)$/);
  const numerator = match ? Number(match[1]) : 4;
  const denominator = match ? Number(match[2]) : 4;
  const quarterBeatsPerBar = numerator * (4 / denominator);
  const validBpm = bpm.trim() !== "" && Number.isFinite(bpmNumber) && bpmNumber >= 30 && bpmNumber <= 250;
  const validMeter = Boolean(match && numerator >= 1 && numerator <= 16 && [2, 4, 8, 16].includes(denominator));
  const barsFor = (section: SongSection) => {
    const value = Number(section.bars);
    return Number.isFinite(value) && value >= 0 && value <= 512 ? value : 0;
  };
  const totalBars = sections.reduce((total, section) => total + barsFor(section), 0);
  const secondsFor = (bars: number) => validBpm && validMeter ? bars * quarterBeatsPerBar * 60 / bpmNumber : 0;
  const totalSeconds = secondsFor(totalBars);
  const exportText = [
    "ATTIKID STUDIO — BPM & SONG STRUCTURE PLAN",
    `Tempo: ${validBpm ? bpmNumber + " BPM" : "Invalid BPM"}`,
    `Time signature: ${meter}`,
    `Total bars: ${totalBars}`,
    `Estimated runtime: ${validBpm && validMeter ? durationLabel(totalSeconds) : "Unavailable"}`,
    "",
    ...sections.map((section) => `${section.name} — ${barsFor(section)} bars — ${durationLabel(secondsFor(barsFor(section)))} — ${section.notes}`),
    "",
    "Estimate assumes a constant tempo and does not model tempo changes, pickups, rubato, or production tails.",
  ].join("\n");

  function updateSection(id: number, key: "name" | "bars" | "notes", value: string) {
    setSections((current) => current.map((section) => section.id === id ? { ...section, [key]: value } : section));
  }
  function moveSection(index: number, direction: -1 | 1) {
    setSections((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function applyTemplate(value: string) {
    setTemplate(value);
    setSections(materializeSections(value));
    setNotice(null);
  }

  return (
    <div className="ak-tool-grid ak-tool-grid--editor">
      <section className="ak-tool-panel">
        <div className="ak-tool-panel__heading"><span>01 / ARRANGEMENT</span><span>EDITABLE SECTIONS</span></div>
        <div className="ak-studio-form-grid">
          <label className="ak-studio-field"><span>TEMPO / BPM</span><input aria-invalid={!validBpm} type="number" min="30" max="250" value={bpm} onChange={(event) => setBpm(event.target.value)} /></label>
          <label className="ak-studio-field"><span>TIME SIGNATURE</span><select value={meter} onChange={(event) => setMeter(event.target.value)}><option>4/4</option><option>3/4</option><option>6/8</option><option>12/8</option><option>2/4</option><option>5/4</option><option>7/8</option></select></label>
          <label className="ak-studio-field ak-studio-field--full"><span>STRUCTURE TEMPLATE</span><select value={template} onChange={(event) => applyTemplate(event.target.value)}><option value="verse-chorus">Verse / Chorus / Verse / Chorus / Bridge / Final Chorus</option><option value="full-song">Intro / Verse / Pre-Chorus / Chorus / Verse / Chorus / Bridge / Final Chorus / Outro</option><option value="hook-rap">Intro / Verse / Hook / Verse / Hook / Outro</option><option value="custom">Custom starter structure</option></select></label>
        </div>
        {!validBpm && <p className="ak-studio-validation" role="alert">Enter a BPM from 30 to 250 to calculate duration.</p>}
        {!validMeter && <p className="ak-studio-validation" role="alert">Choose a supported time signature.</p>}
        <div className="ak-bpm-section-list">
          {sections.map((section, index) => {
            const bars = barsFor(section);
            const startBars = sections
              .slice(0, index)
              .reduce((total, previousSection) => total + barsFor(previousSection), 0);
            const startTime = secondsFor(startBars);
            return (
              <article className="ak-bpm-section" key={section.id}>
                <div className="ak-bpm-section__index">{String(index + 1).padStart(2, "0")}</div>
                <div className="ak-bpm-section__fields">
                  <label className="ak-studio-field"><span>SECTION NAME</span><input value={section.name} onChange={(event) => updateSection(section.id, "name", event.target.value)} /></label>
                  <label className="ak-studio-field"><span>BARS</span><input type="number" min="0" max="512" value={section.bars} onChange={(event) => updateSection(section.id, "bars", event.target.value)} /></label>
                  <label className="ak-studio-field ak-studio-field--full"><span>NOTES (OPTIONAL)</span><input value={section.notes} onChange={(event) => updateSection(section.id, "notes", event.target.value)} placeholder="Arrangement, instrument entry, or vocal note" /></label>
                  <p className="ak-bpm-section__timing">START {durationLabel(startTime)} <span>·</span> LENGTH {durationLabel(secondsFor(bars))}</p>
                </div>
                <div className="ak-bpm-section__controls">
                  <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label={`Move ${section.name || "section"} up`}>↑</button>
                  <button type="button" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1} aria-label={`Move ${section.name || "section"} down`}>↓</button>
                  <button type="button" onClick={() => setSections((current) => current.filter((item) => item.id !== section.id))} aria-label={`Remove ${section.name || "section"}`}>×</button>
                </div>
              </article>
            );
          })}
        </div>
        <div className="ak-tool-actions">
          <button className="ak-studio-button" type="button" onClick={() => { setSections((current) => [...current, { id: nextId, name: `Section ${current.length + 1}`, bars: "8", notes: "" }]); setNextId((value) => value + 1); }}>+ ADD SECTION</button>
          <button className="ak-studio-button" type="button" onClick={() => applyTemplate("custom")}>RESET STRUCTURE</button>
          <button className="ak-studio-button" type="button" onClick={() => void copyWithNotice(exportText, setNotice)}>COPY PLAN</button>
          <button className="ak-studio-button" type="button" onClick={() => download("attikid-song-structure.txt", exportText)}>DOWNLOAD .TXT</button>
        </div>
        <Notice notice={notice} />
      </section>
      <section className="ak-tool-panel">
        <div className="ak-tool-panel__heading"><span>02 / SONG TIMELINE</span><span>CONSTANT TEMPO ESTIMATE</span></div>
        <div className="ak-studio-metrics">
          <div><span>TOTAL BARS</span><strong>{totalBars}</strong></div>
          <div><span>ESTIMATED LENGTH</span><strong>{validBpm && validMeter ? durationLabel(totalSeconds) : "—"}</strong></div>
          <div><span>BPM</span><strong>{validBpm ? bpmNumber : "—"}</strong></div>
          <div><span>SECTIONS</span><strong>{sections.length}</strong></div>
        </div>
        <div className="ak-bpm-timeline">
          {sections.map((section, index) => {
            const bars = barsFor(section);
            const width = totalBars ? Math.max(bars / totalBars * 100, bars > 0 ? 1.5 : 0) : 0;
            return <div className="ak-bpm-timeline__section" key={section.id} style={{ width: `${width}%` }} title={`${section.name}: ${bars} bars`}><span>{index + 1}</span></div>;
          })}
        </div>
        <div className="ak-bpm-timeline__legend">{sections.map((section, index) => <p key={section.id}><span>{String(index + 1).padStart(2, "0")}</span><strong>{section.name || "Untitled section"}</strong><small>{barsFor(section)} bars</small></p>)}</div>
        <p className="ak-studio-footnote">Runtime uses quarter-note beats: bars × numerator × (4 ÷ denominator) × 60 ÷ BPM. It assumes a constant tempo and does not account for tempo changes, pickups, rubato, or production tails.</p>
      </section>
    </div>
  );
}

type Contributor = { id: number; name: string; role: string; email: string; notes: string; share: string };
const contributorRoles = ["Songwriter", "Lyricist", "Composer", "Producer", "Other"];
const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`;

export function SplitSheetTool() {
  const [title, setTitle] = useState("");
  const [contributors, setContributors] = useState<Contributor[]>([{ id: 1, name: "", role: "Songwriter", email: "", notes: "", share: "" }]);
  const [notice, setNotice] = useState<NoticeState>(null);
  const total = contributors.reduce((sum, person) => sum + (person.share.trim() ? Number(person.share) || 0 : 0), 0);
  const invalidShare = contributors.some((person) => person.share.trim() && (!Number.isFinite(Number(person.share)) || Number(person.share) < 0 || Number(person.share) > 100));
  const missingName = contributors.some((person) => !person.name.trim());
  const exact = Math.abs(total - 100) <= 0.01;
  const remaining = 100 - total;

  function update(id: number, key: keyof Omit<Contributor, "id">, value: string) {
    setContributors((current) => current.map((person) => person.id === id ? { ...person, [key]: value } : person));
  }
  function add() {
    setContributors((current) => [...current, { id: Date.now(), name: "", role: "Songwriter", email: "", notes: "", share: "" }]);
  }
  function exportCsv() {
    const rows = [["Track title", "Contributor", "Role", "Contact email", "Ownership percent", "Notes"], ...contributors.map((person) => [title, person.name, person.role, person.email, person.share, person.notes])];
    download("attikid-split-sheet.csv", rows.map((row) => row.map(csvEscape).join(",")).join("\r\n"), "text/csv;charset=utf-8");
  }
  function printPage() {
    window.print();
  }

  return (
    <div className="ak-tool-grid ak-tool-grid--editor">
      <section className="ak-tool-panel ak-split-form">
        <div className="ak-tool-panel__heading"><span>COLLABORATOR DETAILS</span><span>NOT SAVED</span></div>
        <label className="ak-studio-field"><span>TRACK / PROJECT TITLE</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Working title" /></label>
        {contributors.map((person, index) => (
          <fieldset className="ak-contributor" key={person.id}>
            <legend>CONTRIBUTOR {String(index + 1).padStart(2, "0")}</legend>
            <div className="ak-studio-form-grid">
              <label className="ak-studio-field"><span>NAME</span><input value={person.name} onChange={(event) => update(person.id, "name", event.target.value)} /></label>
              <label className="ak-studio-field"><span>ROLE</span><select value={person.role} onChange={(event) => update(person.id, "role", event.target.value)}>{contributorRoles.map((role) => <option key={role}>{role}</option>)}</select></label>
              <label className="ak-studio-field"><span>CONTACT EMAIL (OPTIONAL)</span><input type="email" value={person.email} onChange={(event) => update(person.id, "email", event.target.value)} /></label>
              <label className="ak-studio-field"><span>OWNERSHIP %</span><input type="number" min="0" max="100" step="0.01" value={person.share} onChange={(event) => update(person.id, "share", event.target.value)} placeholder="0–100" /></label>
              <label className="ak-studio-field ak-studio-field--full"><span>NOTES (OPTIONAL)</span><input value={person.notes} onChange={(event) => update(person.id, "notes", event.target.value)} /></label>
            </div>
            {contributors.length > 1 && <button type="button" className="ak-text-button" onClick={() => setContributors((current) => current.filter((item) => item.id !== person.id))}>REMOVE CONTRIBUTOR ×</button>}
          </fieldset>
        ))}
        <div className="ak-tool-actions">
          <button type="button" className="ak-studio-button" onClick={add}>+ ADD CONTRIBUTOR</button>
          <button type="button" className="ak-studio-button" onClick={() => { if (window.confirm("Clear the split sheet and contributor details?")) { setTitle(""); setContributors([{ id: Date.now(), name: "", role: "Songwriter", email: "", notes: "", share: "" }]); setNotice(null); } }}>RESET FORM</button>
        </div>
      </section>
      <section className="ak-tool-panel ak-print-document">
        <div className="ak-tool-panel__heading"><span>OWNERSHIP SUMMARY</span><span>DRAFT / REVIEW REQUIRED</span></div>
        <div className={`ak-split-total${exact && !invalidShare && !missingName ? " ak-split-total--valid" : " ak-split-total--warning"}`}>
          <span>TOTAL OWNERSHIP</span><strong>{total.toFixed(2)}%</strong>
          <p>{invalidShare ? "One or more percentages are outside 0–100%." : exact ? "Ownership totals 100%. Verify all entries before signing." : remaining > 0 ? `${remaining.toFixed(2)}% remains unallocated.` : `${Math.abs(remaining).toFixed(2)}% above 100%.`}</p>
        </div>
        {missingName && <p className="ak-studio-validation" role="alert">Add a name for each listed contributor before treating this as a complete draft.</p>}
        {invalidShare && <p className="ak-studio-validation" role="alert">Each ownership percentage must be a number from 0 through 100.</p>}
        <div className="ak-split-preview">
          <p className="ak-studio-eyebrow">PROJECT</p><h2>{title.trim() || "Untitled project"}</h2>
          {contributors.map((person, index) => (
            <div className="ak-split-preview__person" key={person.id}>
              <div><span>{String(index + 1).padStart(2, "0")}</span><strong>{person.name.trim() || "Contributor name needed"}</strong><small>{person.role}{person.email ? ` · ${person.email}` : ""}</small>{person.notes && <p>{person.notes}</p>}</div>
              <strong>{person.share.trim() ? `${Number(person.share).toFixed(2)}%` : "—"}</strong>
            </div>
          ))}
        </div>
        <div className="ak-tool-actions no-print">
          <button type="button" className="ak-studio-button ak-studio-button--primary" onClick={exportCsv}>EXPORT CSV</button>
          <button type="button" className="ak-studio-button" onClick={printPage}>PRINT / SAVE PDF</button>
        </div>
        <p className="ak-studio-footnote">Drafting aid only, not a legally binding contract or legal advice. Contributors should independently verify names, contact details, rights, ownership arrangements, applicable law, and signatures. Contact details stay in this browser session and are not saved to storage or sent to a service.</p>
        <Notice notice={notice} />
      </section>
    </div>
  );
}

type ChecklistTask = { id: string; section: string; label: string; checked: boolean; custom: boolean };
const CHECKLIST_KEY = "attikid.studio.release-checklist.v1";

const seedTasks: Omit<ChecklistTask, "checked">[] = [
  ["creative", "Creative finalization", "Final audio approved."],
  ["explicit", "Creative finalization", "Explicit-content status reviewed."],
  ["lyrics", "Creative finalization", "Lyrics checked."],
  ["artwork", "Creative finalization", "Final artwork selected."],
  ["versions", "Creative finalization", "Required audio versions prepared."],
  ["titles", "Credits and metadata", "Song titles finalized."],
  ["credits", "Credits and metadata", "Songwriters and producer credits confirmed."],
  ["splits", "Credits and metadata", "Writer splits reviewed."],
  ["date", "Credits and metadata", "Release date selected."],
  ["ids", "Credits and metadata", "Relevant identifiers and metadata collected."],
  ["distribution", "Distribution", "Distribution requirements reviewed."],
  ["files", "Distribution", "Audio files checked."],
  ["artwork-check", "Distribution", "Artwork requirements checked."],
  ["metadata", "Distribution", "Metadata entered."],
  ["submission", "Distribution", "Release submission completed."],
  ["bio", "Marketing", "Artist biography and promotional assets updated."],
  ["announcement", "Marketing", "Announcement content prepared."],
  ["shortform", "Marketing", "Short-form promotional content prepared."],
  ["press", "Marketing", "Press contacts reviewed."],
  ["campaign", "Marketing", "Release links and campaign details prepared."],
  ["links", "Release and follow-up", "Store and streaming links verified."],
  ["website", "Release and follow-up", "Website updated."],
  ["announcement-live", "Release and follow-up", "Audience announcement published."],
  ["metrics", "Release and follow-up", "Performance metrics scheduled for review."],
].map(([id, section, label]) => ({ id, section, label, custom: false } as Omit<ChecklistTask, "checked">));
const defaultTasks: ChecklistTask[] = seedTasks.map((task) => ({ ...task, checked: false }));

function validChecklist(input: unknown): input is ChecklistTask[] {
  return Array.isArray(input) && input.every((item) =>
    typeof item === "object" && item !== null &&
    typeof item.id === "string" && typeof item.section === "string" &&
    typeof item.label === "string" && typeof item.checked === "boolean" &&
    typeof item.custom === "boolean");
}

export function ReleaseChecklistTool() {
  const [tasks, setTasks] = useState<ChecklistTask[]>(defaultTasks);
  const [loaded, setLoaded] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [notice, setNotice] = useState<NoticeState>(null);
  const completed = tasks.filter((task) => task.checked).length;
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  const sections = [...new Set(tasks.map((task) => task.section))];

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(CHECKLIST_KEY);
        if (raw !== null) {
          const parsed: unknown = JSON.parse(raw);
          if (validChecklist(parsed)) setTasks(parsed);
          else setNotice({ kind: "error", text: "Saved checklist data was malformed. A fresh checklist is loaded in this browser." });
        }
      } catch {
        setNotice({ kind: "error", text: "Saved checklist data could not be read. A fresh checklist is loaded in this browser." });
      }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(CHECKLIST_KEY, JSON.stringify(tasks)); }
    catch {
      // Checklist interactions remain available; export JSON if browser storage is blocked.
    }
  }, [loaded, tasks]);

  const exportJson = () => download("attikid-release-checklist.json", JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), tasks }, null, 2), "application/json;charset=utf-8");
  function reset() {
    if (!window.confirm("Reset all checklist progress and remove custom tasks?")) return;
    setTasks(defaultTasks);
    setNotice({ kind: "success", text: "Checklist reset." });
  }
  function addCustomTask() {
    const label = newTask.trim();
    if (!label) { setNotice({ kind: "error", text: "Enter a task name before adding it." }); return; }
    setTasks((current) => [...current, { id: `custom-${Date.now()}`, section: "Custom tasks", label, checked: false, custom: true }]);
    setNewTask("");
    setNotice({ kind: "success", text: "Custom task added." });
  }

  return (
    <div className="ak-tool-stack">
      <section className="ak-tool-panel">
        <div className="ak-tool-panel__heading"><span>RELEASE READINESS</span><span>{completed} / {tasks.length} COMPLETE</span></div>
        <div className="ak-checklist-progress" aria-label={`${progress}% complete`} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div>
        <div className="ak-checklist-progress__label"><strong>{progress}%</strong><span>COMPLETE</span><span>{tasks.length - completed} TASKS LEFT</span></div>
      </section>
      <section className="ak-tool-panel">
        <div className="ak-tool-panel__heading"><span>THE CHECKLIST</span><span>EDITABLE / LOCAL TO THIS BROWSER</span></div>
        <div className="ak-checklist-groups">
          {sections.map((section) => {
            const groupTasks = tasks.filter((task) => task.section === section);
            const groupComplete = groupTasks.filter((task) => task.checked).length;
            return (
              <details className="ak-checklist-group" key={section} open>
                <summary><span>{section}</span><small>{groupComplete}/{groupTasks.length}</small></summary>
                <div className="ak-checklist-group__items">
                  {groupTasks.map((task) => (
                    <div className="ak-checklist-task" key={task.id}>
                      <label><input type="checkbox" checked={task.checked} onChange={(event) => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, checked: event.target.checked } : item))} /><span>{task.label}</span></label>
                      {task.custom && <button type="button" onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))} aria-label={`Remove task ${task.label}`}>×</button>}
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
        <div className="ak-studio-form-row ak-studio-form-row--custom-task">
          <label className="ak-studio-field"><span>ADD A CUSTOM TASK</span><input value={newTask} onChange={(event) => setNewTask(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addCustomTask(); }} placeholder="e.g. Confirm feature artist credits" /></label>
          <button type="button" className="ak-studio-button" onClick={addCustomTask}>ADD TASK</button>
        </div>
        <div className="ak-tool-actions">
          <button type="button" className="ak-studio-button" onClick={exportJson}>EXPORT JSON</button>
          <button type="button" className="ak-studio-button" onClick={() => window.print()}>PRINT / SAVE PDF</button>
          <button type="button" className="ak-studio-button" onClick={reset}>RESET CHECKLIST</button>
        </div>
        <Notice notice={notice} />
        <p className="ak-studio-footnote">This starter checklist is a suggested workflow. Actual requirements vary by distributor, provider, release type, territory, and campaign. Progress is stored in this browser only and will not sync; clearing browser data can erase it. If storage is blocked, export a JSON backup before leaving.</p>
      </section>
    </div>
  );
}

type EpkData = {
  artistName: string; bio: string; extendedBio: string; genre: string; base: string; email: string;
  releases: string; streaming: string; socials: string; videos: string; achievements: string; quotes: string; photoUrl: string;
};
const blankEpk: EpkData = { artistName: "", bio: "", extendedBio: "", genre: "", base: "", email: "", releases: "", streaming: "", socials: "", videos: "", achievements: "", quotes: "", photoUrl: "" };

function safeHttpUrl(value: string) {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function EpkLines({ value }: { value: string }) {
  return <div className="ak-epk-lines">{value.split("\n").map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return null;
    const parts = trimmed.split("|").map((part) => part.trim());
    const url = safeHttpUrl(parts.length > 1 ? parts[1] : trimmed);
    const label = parts.length > 1 ? parts[0] : trimmed;
    return <p key={index}>{url ? <a href={url} target="_blank" rel="noreferrer noopener">{label}</a> : trimmed}</p>;
  })}</div>;
}

export function EpkBuilderTool() {
  const [data, setData] = useState<EpkData>(blankEpk);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const validPhoto = safeHttpUrl(data.photoUrl);
  const validEmail = !data.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim());
  const linkInputs = [data.streaming, data.socials, data.videos, data.releases].flatMap((value) => value.split("\n")).map((value) => value.trim()).filter(Boolean);
  const invalidLinks = linkInputs.filter((value) => {
    const parts = value.split("|");
    return !safeHttpUrl(parts.length > 1 ? parts.slice(1).join("|").trim() : value);
  });
  const exportText = [
    data.artistName.trim() || "Artist Name",
    data.genre.trim() ? `Genre: ${data.genre.trim()}` : "",
    data.base.trim() ? `Based in: ${data.base.trim()}` : "",
    "",
    "SHORT BIOGRAPHY",
    data.bio.trim(),
    "",
    "EXTENDED BIOGRAPHY",
    data.extendedBio.trim(),
    "",
    "SELECTED RELEASES",
    data.releases.trim(),
    "",
    "STREAMING LINKS",
    data.streaming.trim(),
    "",
    "SOCIAL LINKS",
    data.socials.trim(),
    "",
    "VIDEO LINKS",
    data.videos.trim(),
    "",
    "ACHIEVEMENTS",
    data.achievements.trim(),
    "",
    "PRESS QUOTES",
    data.quotes.trim(),
    "",
    data.email.trim() ? `CONTACT: ${data.email.trim()}` : "",
  ].filter((line) => line !== "").join("\n");

  function update<K extends keyof EpkData>(key: K, value: EpkData[K]) {
    setData((current) => ({ ...current, [key]: value }));
    if (key === "photoUrl") setPhotoFailed(false);
  }

  return (
    <div className="ak-tool-grid ak-tool-grid--editor ak-epk-layout">
      <section className="ak-tool-panel">
        <div className="ak-tool-panel__heading"><span>PRESS KIT DETAILS</span><span>LOCAL PREVIEW</span></div>
        <div className="ak-studio-form-grid">
          <label className="ak-studio-field"><span>ARTIST NAME</span><input value={data.artistName} onChange={(event) => update("artistName", event.target.value)} /></label>
          <label className="ak-studio-field"><span>GENRE / STYLE</span><input value={data.genre} onChange={(event) => update("genre", event.target.value)} /></label>
          <label className="ak-studio-field"><span>CITY / BASE (OPTIONAL)</span><input value={data.base} onChange={(event) => update("base", event.target.value)} /></label>
          <label className="ak-studio-field"><span>CONTACT EMAIL</span><input type="email" value={data.email} onChange={(event) => update("email", event.target.value)} aria-invalid={!validEmail} /></label>
          <label className="ak-studio-field ak-studio-field--full"><span>SHORT BIOGRAPHY</span><textarea rows={4} value={data.bio} onChange={(event) => update("bio", event.target.value)} /></label>
          <label className="ak-studio-field ak-studio-field--full"><span>EXTENDED BIOGRAPHY</span><textarea rows={6} value={data.extendedBio} onChange={(event) => update("extendedBio", event.target.value)} /></label>
          <label className="ak-studio-field ak-studio-field--full"><span>SELECTED RELEASES (ONE PER LINE; OPTIONAL “TITLE | URL” FORMAT)</span><textarea rows={3} value={data.releases} onChange={(event) => update("releases", event.target.value)} /></label>
          <label className="ak-studio-field ak-studio-field--full"><span>STREAMING LINKS (ONE PER LINE)</span><textarea rows={3} value={data.streaming} onChange={(event) => update("streaming", event.target.value)} /></label>
          <label className="ak-studio-field ak-studio-field--full"><span>SOCIAL LINKS (ONE PER LINE)</span><textarea rows={3} value={data.socials} onChange={(event) => update("socials", event.target.value)} /></label>
          <label className="ak-studio-field ak-studio-field--full"><span>VIDEO LINKS (ONE PER LINE)</span><textarea rows={2} value={data.videos} onChange={(event) => update("videos", event.target.value)} /></label>
          <label className="ak-studio-field ak-studio-field--full"><span>ACHIEVEMENTS / MILESTONES</span><textarea rows={3} value={data.achievements} onChange={(event) => update("achievements", event.target.value)} /></label>
          <label className="ak-studio-field ak-studio-field--full"><span>PRESS QUOTES (USER-SUPPLIED)</span><textarea rows={3} value={data.quotes} onChange={(event) => update("quotes", event.target.value)} /></label>
          <label className="ak-studio-field ak-studio-field--full"><span>ARTIST PHOTO URL (OPTIONAL HTTPS/HTTP URL)</span><input type="url" value={data.photoUrl} onChange={(event) => update("photoUrl", event.target.value)} aria-invalid={Boolean(data.photoUrl.trim() && !validPhoto)} /></label>
        </div>
        {!validEmail && <p className="ak-studio-validation" role="alert">Enter a valid contact email address.</p>}
        {data.photoUrl.trim() && !validPhoto && <p className="ak-studio-validation" role="alert">Photo URL must use http or https.</p>}
        {invalidLinks.length > 0 && <p className="ak-studio-validation" role="status">{invalidLinks.length} link line(s) are not valid HTTP/HTTPS URLs. They will be shown as plain text in the preview.</p>}
        <div className="ak-tool-actions no-print">
          <button type="button" className="ak-studio-button ak-studio-button--primary" onClick={() => void copyWithNotice(exportText, setNotice)}>COPY EPK TEXT</button>
          <button type="button" className="ak-studio-button" onClick={() => download("attikid-electronic-press-kit.txt", exportText)}>DOWNLOAD .TXT</button>
          <button type="button" className="ak-studio-button" onClick={() => window.print()}>PRINT / SAVE PDF</button>
          <button type="button" className="ak-studio-button" onClick={() => { if (window.confirm("Reset all press kit fields?")) { setData(blankEpk); setPhotoFailed(false); setNotice(null); } }}>RESET FORM</button>
        </div>
        <Notice notice={notice} />
      </section>

      <section className="ak-tool-panel ak-epk-preview ak-print-document" aria-label="Live press kit preview">
        <div className="ak-tool-panel__heading no-print"><span>PREVIEW</span><span>NOT PUBLISHED</span></div>
        {validPhoto && !photoFailed && <Image src={validPhoto} alt={`${data.artistName || "Artist"} press kit photo`} width={1200} height={800} unoptimized className="ak-epk-preview__image" onError={() => setPhotoFailed(true)} />}
        <p className="ak-studio-eyebrow">ELECTRONIC PRESS KIT</p>
        <h2>{data.artistName.trim() || "ARTIST NAME"}</h2>
        {data.genre && <p className="ak-epk-preview__genre">{data.genre}</p>}
        {data.base && <p className="ak-epk-preview__base">{data.base}</p>}
        {data.bio && <section><h3>ABOUT</h3><p className="ak-epk-preview__bio">{data.bio}</p></section>}
        {data.extendedBio && <section><h3>BIOGRAPHY</h3><p className="ak-epk-preview__bio">{data.extendedBio}</p></section>}
        {data.releases && <section><h3>SELECTED RELEASES</h3><EpkLines value={data.releases} /></section>}
        {data.streaming && <section><h3>STREAMING</h3><EpkLines value={data.streaming} /></section>}
        {data.socials && <section><h3>SOCIAL</h3><EpkLines value={data.socials} /></section>}
        {data.videos && <section><h3>VIDEOS</h3><EpkLines value={data.videos} /></section>}
        {data.achievements && <section><h3>SELECTED HIGHLIGHTS</h3><p className="ak-epk-preview__bio">{data.achievements}</p></section>}
        {data.quotes && <section><h3>PRESS</h3><blockquote>{data.quotes}</blockquote></section>}
        {data.email && <footer><span>BOOKING / PRESS CONTACT</span><p>{data.email}</p></footer>}
        <p className="ak-studio-footnote no-print">This is a local preview only. It does not publish a website or upload your details. A user-supplied image URL is requested by your browser when entered.</p>
      </section>
    </div>
  );
}
