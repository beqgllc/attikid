"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";
import { createClient } from "@/lib/supabase/client";

type Section = { id: string; kind: string; text: string };
type Draft = { title: string; lyrics: string; sections: Section[]; notes: string; updatedAt: number };
const KEY = "attikid.studio.song-desk.v1";
type SavedVersion = { id: string; savedAt: number; draft: Draft };
type CloudProject = { id: string; title: string; draft: Draft; updated_at: string };
type IdeaNote = { id: string; title: string; tags: string[]; createdAt: number; blob: Blob; };
const HISTORY_KEY = "attikid.studio.song-desk.history.v1";
const NOTES_DB = "attikid-studio-notes";
const NOTES_STORE = "voice-notes";
function openNotesDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NOTES_DB, 1);
    request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains(NOTES_STORE)) db.createObjectStore(NOTES_STORE, { keyPath: "id" }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function saveIdea(note: IdeaNote) {
  const db = await openNotesDb();
  await new Promise<void>((resolve, reject) => { const tx = db.transaction(NOTES_STORE, "readwrite"); tx.objectStore(NOTES_STORE).put(note); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
  db.close();
}
async function listIdeas(): Promise<IdeaNote[]> {
  const db = await openNotesDb();
  const items = await new Promise<IdeaNote[]>((resolve, reject) => { const req = db.transaction(NOTES_STORE, "readonly").objectStore(NOTES_STORE).getAll(); req.onsuccess = () => resolve(req.result as IdeaNote[]); req.onerror = () => reject(req.error); });
  db.close(); return items.sort((a,b) => b.createdAt-a.createdAt);
}
async function removeIdea(id: string) {
  const db = await openNotesDb();
  await new Promise<void>((resolve, reject) => { const tx = db.transaction(NOTES_STORE, "readwrite"); tx.objectStore(NOTES_STORE).delete(id); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
  db.close();
}

const initial: Draft = { title: "Untitled draft", lyrics: "", sections: [{ id: "v1", kind: "Verse 1", text: "" }, { id: "hook", kind: "Hook", text: "" }], notes: "", updatedAt: Date.now() };
const countSyllables = (word: string) => { const w = word.toLowerCase().replace(/[^a-z']/g, ""); if (!w) return 0; if (w.length <= 3) return 1; const groups = w.match(/[aeiouy]+/g); let count = groups?.length ?? 1; if (w.endsWith("e") && !w.endsWith("le") && count > 1) count--; if (w.endsWith("ed") && !w.endsWith("ted") && !w.endsWith("ded") && count > 1) count--; return Math.max(1, count); };
const lineSyllables = (line: string) => line.trim() ? line.trim().split(/\s+/).reduce((n, word) => n + countSyllables(word), 0) : 0;

export default function SongDeskPage() {
  const [draft, setDraft] = useState<Draft>(initial);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [rhymes, setRhymes] = useState<string[]>([]);
  const [rhyming, setRhyming] = useState(false);
  const [rhymingError, setRhymingError] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [recordingError, setRecordingError] = useState("");
  const [versions, setVersions] = useState<SavedVersion[]>([]);
  const [ideas, setIdeas] = useState<IdeaNote[]>([]);
  const [ideaTitle, setIdeaTitle] = useState("Voice note");
  const [ideaTags, setIdeaTags] = useState("hook, melody");
  const [ideaStatus, setIdeaStatus] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");
  const [cloudUser, setCloudUser] = useState<string | null>(null);
  const [cloudProjects, setCloudProjects] = useState<CloudProject[]>([]);
  const [cloudProjectId, setCloudProjectId] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState("");
  const [cloudBusy, setCloudBusy] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDraft({ ...initial, ...JSON.parse(raw) });
      const history = localStorage.getItem(HISTORY_KEY);
      if (history) setVersions(JSON.parse(history));
      setCloudProjectId(localStorage.getItem("attikid.studio.cloud-project-id"));
    } catch {}
    setLoaded(true);
    void listIdeas().then(setIdeas).catch(() => setIdeaStatus("Voice-note storage is unavailable in this browser."));
    void supabase.auth.getUser().then(async ({ data, error }) => {
      if (error || !data.user) return;
      setCloudUser(data.user.email ?? "Signed-in creator");
      try {
        const response = await fetch("/api/studio/projects", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load cloud projects.");
        const result = await response.json() as { projects: CloudProject[] };
        setCloudProjects(result.projects ?? []);
      } catch { setCloudStatus("Signed in, but cloud drafts could not be loaded."); }
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCloudUser(session?.user?.email ?? null);
      if (!session) { setCloudProjects([]); setCloudProjectId(null); localStorage.removeItem("attikid.studio.cloud-project-id"); }
    });
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);
  useEffect(() => { if (!loaded) return; const id = window.setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify({ ...draft, updatedAt: Date.now() })); } catch {} }, 350); return () => window.clearTimeout(id); }, [draft, loaded]);
  const lines = useMemo(() => draft.lyrics.split("\n"), [draft.lyrics]);
  const syllables = useMemo(() => lines.map((line) => lineSyllables(line)), [lines]);
  const average = useMemo(() => { const nonempty = syllables.filter((n) => n > 0); return nonempty.length ? (nonempty.reduce((a,b)=>a+b,0)/nonempty.length).toFixed(1) : "—"; }, [syllables]);
  async function refreshCloudProjects() { const response = await fetch("/api/studio/projects", { cache: "no-store" }); if (!response.ok) throw new Error("Could not load cloud drafts."); const result = await response.json() as { projects: CloudProject[] }; setCloudProjects(result.projects ?? []); }
  async function saveCloudDraft() {
    if (!cloudUser) { setCloudStatus("Sign in to sync this draft across devices."); return; }
    setCloudBusy(true); setCloudStatus("");
    const payload = { title: draft.title.trim() || "Untitled draft", draft: { ...draft, updatedAt: Date.now() } };
    try {
      const url = cloudProjectId ? "/api/studio/projects/" + encodeURIComponent(cloudProjectId) : "/api/studio/projects";
      const response = await fetch(url, { method: cloudProjectId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Cloud save failed.");
      const project = result.project as CloudProject;
      setCloudProjectId(project.id); localStorage.setItem("attikid.studio.cloud-project-id", project.id);
      await refreshCloudProjects(); setCloudStatus("Saved to your ATTIKID account.");
    } catch (error) { setCloudStatus(error instanceof Error ? error.message : "Cloud save failed."); }
    finally { setCloudBusy(false); }
  }
  async function loadCloudDraft(id: string) {
    const project = cloudProjects.find((item) => item.id === id);
    if (!project) return;
    const next = { ...initial, ...(project.draft as Draft), title: project.title };
    setDraft(next); setCloudProjectId(project.id); localStorage.setItem("attikid.studio.cloud-project-id", project.id);
    setCloudStatus("Loaded cloud draft: " + project.title);
  }
  async function signOut() { await supabase.auth.signOut(); setCloudUser(null); setCloudProjects([]); setCloudProjectId(null); localStorage.removeItem("attikid.studio.cloud-project-id"); setCloudStatus("Signed out. This browser’s local draft is unchanged."); }
  function saveVersion() { const next = [{ id: crypto.randomUUID(), savedAt: Date.now(), draft: { ...draft, updatedAt: Date.now() } }, ...versions].slice(0, 30); try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); setVersions(next); setHistoryStatus("Version saved on this device."); } catch { setHistoryStatus("Could not save a version. Browser storage may be full."); } }
  function restoreVersion(version: SavedVersion) { setDraft({ ...version.draft }); setHistoryStatus("Restored a saved version. Save again to create a new checkpoint."); }
  async function saveRecordedIdea() { if (!recordingUrl) return; try { const response = await fetch(recordingUrl); const blob = await response.blob(); const note: IdeaNote = { id: crypto.randomUUID(), title: ideaTitle.trim() || "Untitled voice note", tags: ideaTags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 12), createdAt: Date.now(), blob }; await saveIdea(note); setIdeas(await listIdeas()); setIdeaStatus("Saved to this browser’s idea inbox."); } catch { setIdeaStatus("Could not save the voice note. Download it as a backup."); } }
  async function deleteIdea(id: string) { try { await removeIdea(id); setIdeas(await listIdeas()); } catch { setIdeaStatus("Could not delete this note."); } }
  function openIdea(note: IdeaNote) { if (recordingUrl) URL.revokeObjectURL(recordingUrl); setRecordingUrl(URL.createObjectURL(note.blob)); setIdeaTitle(note.title); setIdeaTags(note.tags.join(", ")); setIdeaStatus("Loaded note from this browser’s inbox."); }
  async function findRhymes() { const word = query.trim().split(/\s+/).pop(); if (!word) return; setRhyming(true); setRhymingError(""); try { const res = await fetch("https://api.datamuse.com/words?rel_rhy=" + encodeURIComponent(word) + "&max=60"); if (!res.ok) throw new Error("Rhyme service unavailable"); const data = await res.json(); setRhymes(data.map((item: {word:string})=>item.word)); if (!data.length) setRhymingError("No exact matches returned. Try a different word or phrase."); } catch { setRhymingError("Could not reach the rhyme service. Your draft stays on this device."); } finally { setRhyming(false); } }
  async function toggleRecording() { setRecordingError(""); if (recording && mediaRef.current) { mediaRef.current.stop(); setRecording(false); return; } if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setRecordingError("Voice recording is not supported in this browser."); return; } try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const recorder = new MediaRecorder(stream); chunksRef.current = []; recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); }; recorder.onstop = () => { const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }); if (recordingUrl) URL.revokeObjectURL(recordingUrl); setRecordingUrl(URL.createObjectURL(blob)); stream.getTracks().forEach((track) => track.stop()); }; recorder.start(); mediaRef.current = recorder; setRecording(true); } catch { setRecordingError("Microphone access was blocked. Check browser permissions and try again."); } }
  function addSection(kind: string) { setDraft((d) => ({ ...d, sections: [...d.sections, { id: crypto.randomUUID(), kind, text: "" }] })); }
  function updateSection(id: string, patch: Partial<Section>) { setDraft((d) => ({ ...d, sections: d.sections.map((s) => s.id === id ? { ...s, ...patch } : s) })); }
  function deleteSection(id: string) { setDraft((d) => ({ ...d, sections: d.sections.filter((s) => s.id !== id) })); }
  return <main className={styles.page}>
    <header className={styles.nav}><Link href="/" className={styles.brand}>ATTIKID<span>®</span></Link><nav><Link href="/music-room">Music Room</Link><Link href="/songs">Songs</Link><Link href="/supply-shop">Shop</Link></nav></header>
    <div className={styles.topline}><span>STUDIO / SONG DESK</span><span>{loaded ? "AUTOSAVE · THIS DEVICE" : "LOADING DRAFT…"}</span></div>
    <section className={styles.hero}><p>THE WRITING ROOM</p><h1>Get it down.<br/><em>Shape it later.</em></h1><p className={styles.deck}>A working space for unfinished thoughts. Your draft autosaves locally. Sign in to sync named projects across devices.</p></section>
    <section className={styles.workspace}>
      <div className={styles.editor}><label className={styles.label} htmlFor="song-title">PROJECT TITLE</label><input id="song-title" className={styles.titleInput} value={draft.title} onChange={(e)=>setDraft({...draft,title:e.target.value})} aria-label="Project title"/>
        <label className={styles.label} htmlFor="lyrics">LYRIC PAD</label><textarea id="lyrics" className={styles.lyrics} value={draft.lyrics} onChange={(e)=>setDraft({...draft,lyrics:e.target.value})} placeholder={"Start with the line you can’t get out of your head…"} spellCheck/>
        <div className={styles.metrics}><div><strong>{lines.filter((line)=>line.trim()).length}</strong><span>LINES</span></div><div><strong>{average}</strong><span>AVG SYLLABLES</span></div><div><strong>{draft.lyrics.trim() ? draft.lyrics.trim().split(/\s+/).length : 0}</strong><span>WORDS</span></div></div>
        <div className={styles.cadence}><div className={styles.panelHead}><h2>Cadence scan</h2><span>ESTIMATES · REVIEW BY EAR</span></div>{lines.slice(0,16).map((line,i)=><div className={styles.cadenceRow} key={i}><span>{String(i+1).padStart(2,"0")}</span><div className={styles.barTrack}><div className={styles.bar} style={{width: Math.min(100, syllables[i]*5.5)+"%"}}/></div><strong>{syllables[i]}</strong></div>)}</div>
        <div className={styles.structure}><div className={styles.panelHead}><h2>Song structure</h2><span>{draft.sections.length} SECTIONS</span></div>{draft.sections.map((section,index)=><article className={styles.section} key={section.id}><div className={styles.sectionTop}><span>{String(index+1).padStart(2,"0")}</span><input value={section.kind} onChange={(e)=>updateSection(section.id,{kind:e.target.value})} aria-label={"Section "+(index+1)+" name"}/><button onClick={()=>deleteSection(section.id)} aria-label={"Remove "+section.kind}>×</button></div><textarea value={section.text} onChange={(e)=>updateSection(section.id,{text:e.target.value})} placeholder={"Write or move lyrics into this section…"} aria-label={section.kind+" lyrics"}/></article>)}<div className={styles.addButtons}>{["Verse","Hook","Bridge","Intro","Outro"].map((kind)=><button key={kind} onClick={()=>addSection(kind)}>+ {kind}</button>)}</div><div className={styles.history}><div className={styles.panelHead}><h2>Draft history</h2><button onClick={saveVersion}>SAVE VERSION +</button></div><p className={styles.small}>Create checkpoints before major rewrites. Up to 30 snapshots stay in this browser.</p>{historyStatus && <p className={styles.small}>{historyStatus}</p>}{versions.length === 0 ? <p className={styles.small}>No checkpoints yet.</p> : versions.map((version) => <div className={styles.historyItem} key={version.id}><span>{new Date(version.savedAt).toLocaleString()}</span><strong>{version.draft.title || "Untitled draft"}</strong><button onClick={() => restoreVersion(version)}>RESTORE</button></div>)}</div></div>
      </div>
      <aside className={styles.sidebar}>
        <section className={styles.tool}><p className={styles.label}>01 / RHYME EXPLORER</p><h2>Find the sound.</h2><p>Look up end rhymes for the last word you enter. Results come from Datamuse; judge pronunciation and fit yourself.</p><form onSubmit={(e)=>{e.preventDefault();void findRhymes();}}><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Try: broken" aria-label="Word to rhyme" /><button disabled={rhyming||!query.trim()}>{rhyming?"SEARCHING…":"FIND RHYMES ↗"}</button></form>{rhymingError&&<p className={styles.error}>{rhymingError}</p>}<div className={styles.rhymeResults}>{rhymes.map((word)=><button key={word} onClick={()=>setDraft((d)=>({...d,lyrics:d.lyrics+(d.lyrics?"\n":"")+word}))}>{word}<span>+ add line</span></button>)}</div></section>
        <section className={styles.tool}><p className={styles.label}>02 / IDEA INBOX</p><h2>Catch it before it goes.</h2><p>Record a melody, rough hook, or passing thought. The audio stays in this browser session unless you download it.</p><button className={styles.recordButton} onClick={()=>void toggleRecording()}>{recording?"■ STOP RECORDING":"● RECORD A NOTE"}</button>{recording&&<p className={styles.recording}>RECORDING IN PROGRESS</p>}{recordingError&&<p className={styles.error}>{recordingError}</p>}{recordingUrl&&<div className={styles.audio}><audio controls src={recordingUrl}/><a href={recordingUrl} download="attikid-voice-note.webm">Download voice note ↗</a><label className={styles.label} htmlFor="idea-title">NOTE TITLE</label><input id="idea-title" value={ideaTitle} onChange={(e)=>setIdeaTitle(e.target.value)} /><label className={styles.label} htmlFor="idea-tags">TAGS · COMMA SEPARATED</label><input id="idea-tags" value={ideaTags} onChange={(e)=>setIdeaTags(e.target.value)} /><button className={styles.export} onClick={()=>void saveRecordedIdea()}>SAVE TO IDEA INBOX</button></div>}{ideaStatus&&<p className={styles.small}>{ideaStatus}</p>}<div className={styles.ideaList}><p className={styles.label}>SAVED IDEAS · THIS DEVICE</p>{ideas.length===0?<p className={styles.small}>Your saved voice notes will appear here.</p>:ideas.map((idea)=><article className={styles.ideaItem} key={idea.id}><button className={styles.ideaTitle} onClick={()=>openIdea(idea)}>{idea.title}</button><p>{idea.tags.map((tag)=>"#"+tag).join(" ")}</p><div><button onClick={()=>openIdea(idea)}>OPEN</button><button onClick={()=>void deleteIdea(idea.id)}>DELETE</button></div></article>)}</div></section>
        <section className={styles.tool}><p className={styles.label}>03 / CLOUD WORKSPACE</p><h2>Your work, wherever you are.</h2>{cloudUser ? <><p>Signed in as {cloudUser}. Cloud drafts are private to your account.</p><button className={styles.export} onClick={()=>void saveCloudDraft()} disabled={cloudBusy}>{cloudBusy ? "SAVING…" : cloudProjectId ? "UPDATE CLOUD DRAFT ↗" : "SAVE TO CLOUD ↗"}</button><button className={styles.export} onClick={()=>void refreshCloudProjects().then(()=>setCloudStatus("Cloud drafts refreshed.")).catch(()=>setCloudStatus("Could not refresh cloud drafts."))}>REFRESH CLOUD DRAFTS</button><div className={styles.ideaList}><p className={styles.label}>YOUR CLOUD DRAFTS</p>{cloudProjects.length===0?<p className={styles.small}>No cloud drafts yet. Save this draft to create one.</p>:cloudProjects.map((project)=><article className={styles.ideaItem} key={project.id}><button className={styles.ideaTitle} onClick={()=>void loadCloudDraft(project.id)}>{project.title}</button><p>{new Date(project.updated_at).toLocaleString()}</p><div><button onClick={()=>void loadCloudDraft(project.id)}>OPEN</button><button onClick={()=>{setCloudProjectId(project.id);localStorage.setItem("attikid.studio.cloud-project-id",project.id);setCloudStatus("Selected "+project.title+". Save to update it.");}}>SELECT TO UPDATE</button></div></article>)}</div><button className={styles.export} onClick={()=>void signOut()}>SIGN OUT</button></> : <><p>Sign in or create an account to sync drafts and private voice notes between devices.</p><div className={styles.addButtons}><Link href="/login">SIGN IN ↗</Link><Link href="/signup">CREATE ACCOUNT ↗</Link></div></>}{cloudStatus&&<p role="status" className={styles.small}>{cloudStatus}</p>}</section>
        <section className={styles.tool}><p className={styles.label}>04 / WORKING NOTES</p><h2>Leave yourself a note.</h2><textarea className={styles.notes} value={draft.notes} onChange={(e)=>setDraft({...draft,notes:e.target.value})} placeholder="Reference, feeling, beat idea, next step…"/><p className={styles.small}>Draft and notes are saved to local browser storage. They do not sync across devices.</p><button className={styles.export} onClick={()=>{const blob=new Blob([JSON.stringify(draft,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=(draft.title||"attikid-draft").toLowerCase().replace(/[^a-z0-9]+/g,"-")+".json";a.click();URL.revokeObjectURL(url);}}>EXPORT DRAFT JSON ↓</button></section>
      </aside>
    </section><footer className={styles.footer}><Link href="/studio">ALL STUDIO TOOLS ↗</Link><span>UNFINISHED IS A VALID PLACE TO START.</span></footer>
  </main>;
}
