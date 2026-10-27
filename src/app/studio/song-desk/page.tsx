"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

type Section = { id: string; kind: string; text: string };
type Draft = { title: string; lyrics: string; sections: Section[]; notes: string; updatedAt: number };
const KEY = "attikid.studio.song-desk.v1";
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
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  useEffect(() => { try { const raw = localStorage.getItem(KEY); if (raw) setDraft({ ...initial, ...JSON.parse(raw) }); } catch {} setLoaded(true); }, []);
  useEffect(() => { if (!loaded) return; const id = window.setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify({ ...draft, updatedAt: Date.now() })); } catch {} }, 350); return () => window.clearTimeout(id); }, [draft, loaded]);
  const lines = useMemo(() => draft.lyrics.split("\n"), [draft.lyrics]);
  const syllables = useMemo(() => lines.map((line) => lineSyllables(line)), [lines]);
  const average = useMemo(() => { const nonempty = syllables.filter((n) => n > 0); return nonempty.length ? (nonempty.reduce((a,b)=>a+b,0)/nonempty.length).toFixed(1) : "—"; }, [syllables]);
  async function findRhymes() { const word = query.trim().split(/\s+/).pop(); if (!word) return; setRhyming(true); setRhymingError(""); try { const res = await fetch("https://api.datamuse.com/words?rel_rhy=" + encodeURIComponent(word) + "&max=60"); if (!res.ok) throw new Error("Rhyme service unavailable"); const data = await res.json(); setRhymes(data.map((item: {word:string})=>item.word)); if (!data.length) setRhymingError("No exact matches returned. Try a different word or phrase."); } catch { setRhymingError("Could not reach the rhyme service. Your draft stays on this device."); } finally { setRhyming(false); } }
  async function toggleRecording() { setRecordingError(""); if (recording && mediaRef.current) { mediaRef.current.stop(); setRecording(false); return; } if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setRecordingError("Voice recording is not supported in this browser."); return; } try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const recorder = new MediaRecorder(stream); chunksRef.current = []; recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); }; recorder.onstop = () => { const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }); if (recordingUrl) URL.revokeObjectURL(recordingUrl); setRecordingUrl(URL.createObjectURL(blob)); stream.getTracks().forEach((track) => track.stop()); }; recorder.start(); mediaRef.current = recorder; setRecording(true); } catch { setRecordingError("Microphone access was blocked. Check browser permissions and try again."); } }
  function addSection(kind: string) { setDraft((d) => ({ ...d, sections: [...d.sections, { id: crypto.randomUUID(), kind, text: "" }] })); }
  function updateSection(id: string, patch: Partial<Section>) { setDraft((d) => ({ ...d, sections: d.sections.map((s) => s.id === id ? { ...s, ...patch } : s) })); }
  function deleteSection(id: string) { setDraft((d) => ({ ...d, sections: d.sections.filter((s) => s.id !== id) })); }
  return <main className={styles.page}>
    <header className={styles.nav}><Link href="/" className={styles.brand}>ATTIKID<span>®</span></Link><nav><Link href="/music-room">Music Room</Link><Link href="/songs">Songs</Link><Link href="/supply-shop">Shop</Link></nav></header>
    <div className={styles.topline}><span>STUDIO / SONG DESK</span><span>{loaded ? "AUTOSAVE · THIS DEVICE" : "LOADING DRAFT…"}</span></div>
    <section className={styles.hero}><p>THE WRITING ROOM</p><h1>Get it down.<br/><em>Shape it later.</em></h1><p className={styles.deck}>A working space for unfinished thoughts. Your draft saves in this browser; no account required.</p></section>
    <section className={styles.workspace}>
      <div className={styles.editor}><label className={styles.label} htmlFor="song-title">PROJECT TITLE</label><input id="song-title" className={styles.titleInput} value={draft.title} onChange={(e)=>setDraft({...draft,title:e.target.value})} aria-label="Project title"/>
        <label className={styles.label} htmlFor="lyrics">LYRIC PAD</label><textarea id="lyrics" className={styles.lyrics} value={draft.lyrics} onChange={(e)=>setDraft({...draft,lyrics:e.target.value})} placeholder={"Start with the line you can’t get out of your head…"} spellCheck/>
        <div className={styles.metrics}><div><strong>{lines.filter((line)=>line.trim()).length}</strong><span>LINES</span></div><div><strong>{average}</strong><span>AVG SYLLABLES</span></div><div><strong>{draft.lyrics.trim() ? draft.lyrics.trim().split(/\s+/).length : 0}</strong><span>WORDS</span></div></div>
        <div className={styles.cadence}><div className={styles.panelHead}><h2>Cadence scan</h2><span>ESTIMATES · REVIEW BY EAR</span></div>{lines.slice(0,16).map((line,i)=><div className={styles.cadenceRow} key={i}><span>{String(i+1).padStart(2,"0")}</span><div className={styles.barTrack}><div className={styles.bar} style={{width: Math.min(100, syllables[i]*5.5)+"%"}}/></div><strong>{syllables[i]}</strong></div>)}</div>
        <div className={styles.structure}><div className={styles.panelHead}><h2>Song structure</h2><span>{draft.sections.length} SECTIONS</span></div>{draft.sections.map((section,index)=><article className={styles.section} key={section.id}><div className={styles.sectionTop}><span>{String(index+1).padStart(2,"0")}</span><input value={section.kind} onChange={(e)=>updateSection(section.id,{kind:e.target.value})} aria-label={"Section "+(index+1)+" name"}/><button onClick={()=>deleteSection(section.id)} aria-label={"Remove "+section.kind}>×</button></div><textarea value={section.text} onChange={(e)=>updateSection(section.id,{text:e.target.value})} placeholder={"Write or move lyrics into this section…"} aria-label={section.kind+" lyrics"}/></article>)}<div className={styles.addButtons}>{["Verse","Hook","Bridge","Intro","Outro"].map((kind)=><button key={kind} onClick={()=>addSection(kind)}>+ {kind}</button>)}</div></div>
      </div>
      <aside className={styles.sidebar}>
        <section className={styles.tool}><p className={styles.label}>01 / RHYME EXPLORER</p><h2>Find the sound.</h2><p>Look up end rhymes for the last word you enter. Results come from Datamuse; judge pronunciation and fit yourself.</p><form onSubmit={(e)=>{e.preventDefault();void findRhymes();}}><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Try: broken" aria-label="Word to rhyme" /><button disabled={rhyming||!query.trim()}>{rhyming?"SEARCHING…":"FIND RHYMES ↗"}</button></form>{rhymingError&&<p className={styles.error}>{rhymingError}</p>}<div className={styles.rhymeResults}>{rhymes.map((word)=><button key={word} onClick={()=>setDraft((d)=>({...d,lyrics:d.lyrics+(d.lyrics?"\n":"")+word}))}>{word}<span>+ add line</span></button>)}</div></section>
        <section className={styles.tool}><p className={styles.label}>02 / IDEA INBOX</p><h2>Catch it before it goes.</h2><p>Record a melody, rough hook, or passing thought. The audio stays in this browser session unless you download it.</p><button className={styles.recordButton} onClick={()=>void toggleRecording()}>{recording?"■ STOP RECORDING":"● RECORD A NOTE"}</button>{recording&&<p className={styles.recording}>RECORDING IN PROGRESS</p>}{recordingError&&<p className={styles.error}>{recordingError}</p>}{recordingUrl&&<div className={styles.audio}><audio controls src={recordingUrl}/><a href={recordingUrl} download="attikid-voice-note.webm">Download voice note ↗</a></div>}</section>
        <section className={styles.tool}><p className={styles.label}>03 / WORKING NOTES</p><h2>Leave yourself a note.</h2><textarea className={styles.notes} value={draft.notes} onChange={(e)=>setDraft({...draft,notes:e.target.value})} placeholder="Reference, feeling, beat idea, next step…"/><p className={styles.small}>Draft and notes are saved to local browser storage. They do not sync across devices.</p><button className={styles.export} onClick={()=>{const blob=new Blob([JSON.stringify(draft,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=(draft.title||"attikid-draft").toLowerCase().replace(/[^a-z0-9]+/g,"-")+".json";a.click();URL.revokeObjectURL(url);}}>EXPORT DRAFT JSON ↓</button></section>
      </aside>
    </section><footer className={styles.footer}><Link href="/studio">ALL STUDIO TOOLS ↗</Link><span>UNFINISHED IS A VALID PLACE TO START.</span></footer>
  </main>;
}
