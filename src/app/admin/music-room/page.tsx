"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Session = { id:string; title:string; slug:string; description:string|null; editorial_note:string|null; is_published:boolean; sort_order:number };
type Song = { id:string; title:string; artist_name:string; slug:string };
type Version = { id:string; song_id:string; title:string; version_type:string; is_public:boolean };
type Track = { id:string; session_id:string; song_id:string|null; version_id:string|null; position:number; curator_note:string|null; songs?:{title:string;artist_name:string}|null; song_versions?:{title:string;version_type:string;songs?:{title:string;artist_name:string}|null}|null };
type Catalog = { songs:Song[]; versions:Version[] };

export default function MusicRoomAdminPage() {
  const [sessions,setSessions]=useState<Session[]>([]);
  const [catalog,setCatalog]=useState<Catalog>({songs:[],versions:[]});
  const [tracks,setTracks]=useState<Track[]>([]);
  const [selected,setSelected]=useState("");
  const [title,setTitle]=useState("");
  const [slug,setSlug]=useState("");
  const [description,setDescription]=useState("");
  const [selection,setSelection]=useState("");
  const [trackNote,setTrackNote]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  const request=useCallback(async (url:string, init?:RequestInit) => {
    const response=await fetch(url,{...init,headers:{"Content-Type":"application/json",...(init?.headers||{})},cache:"no-store"});
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||"Request failed.");
    return data;
  },[]);
  const loadSessions=useCallback(async()=>{
    const data=await request("/api/admin/music-room/sessions");
    const rows=(data.sessions||[]) as Session[];
    setSessions(rows);
    setSelected(current=>rows.some(row=>row.id===current)?current:(rows[0]?.id||""));
  },[request]);
  const loadTracks=useCallback(async(id:string)=>{
    if(!id){setTracks([]);return;}
    const data=await request("/api/admin/music-room/tracks?session_id="+encodeURIComponent(id));
    setTracks((data.tracks||[]) as Track[]);
  },[request]);
  useEffect(()=>{
    void Promise.all([loadSessions(),request("/api/admin/music-room/catalog").then(data=>setCatalog(data as Catalog))])
      .catch(error=>setMessage(error instanceof Error?error.message:"Administrator access required."));
  },[loadSessions,request]);
  useEffect(()=>{void loadTracks(selected).catch(error=>setMessage(error instanceof Error?error.message:"Could not load tracks."));},[selected,loadTracks]);

  async function createSession(event:FormEvent){
    event.preventDefault();setBusy(true);setMessage("");
    try{
      const data=await request("/api/admin/music-room/sessions",{method:"POST",body:JSON.stringify({title,slug,description,sort_order:sessions.length})});
      setTitle("");setSlug("");setDescription("");
      await loadSessions();setSelected(data.session.id);setMessage("Session created as a draft.");
    }catch(error){setMessage(error instanceof Error?error.message:"Could not create session.");}
    finally{setBusy(false);}
  }
  async function publish(session:Session){
    setBusy(true);setMessage("");
    try{await request("/api/admin/music-room/sessions/"+session.id,{method:"PATCH",body:JSON.stringify({is_published:!session.is_published})});await loadSessions();setMessage(session.is_published?"Session unpublished.":"Session published.");}
    catch(error){setMessage(error instanceof Error?error.message:"Could not change publish state.");}
    finally{setBusy(false);}
  }
  async function addTrack(event:FormEvent){
    event.preventDefault();if(!selected||!selection)return;setBusy(true);setMessage("");
    const [kind,id]=selection.split(":");
    try{await request("/api/admin/music-room/tracks",{method:"POST",body:JSON.stringify({session_id:selected,song_id:kind==="song"?id:null,version_id:kind==="version"?id:null,position:tracks.length,curator_note:trackNote})});setSelection("");setTrackNote("");await loadTracks(selected);setMessage("Track added to session.");}
    catch(error){setMessage(error instanceof Error?error.message:"Could not add track.");}
    finally{setBusy(false);}
  }
  async function moveTrack(track:Track,delta:number){
    const sorted=[...tracks].sort((a,b)=>a.position-b.position);
    const index=sorted.findIndex(row=>row.id===track.id);const target=index+delta;
    if(target<0||target>=sorted.length)return;
    setBusy(true);
    try{
      const other=sorted[target];
      await request("/api/admin/music-room/tracks/"+track.id,{method:"PATCH",body:JSON.stringify({position:other.position})});
      await request("/api/admin/music-room/tracks/"+other.id,{method:"PATCH",body:JSON.stringify({position:track.position})});
      await loadTracks(selected);
    }catch(error){setMessage(error instanceof Error?error.message:"Could not reorder track.");}
    finally{setBusy(false);}
  }
  async function removeTrack(track:Track){
    if(!window.confirm("Remove this item from the listening session?"))return;
    try{await request("/api/admin/music-room/tracks/"+track.id,{method:"DELETE"});await loadTracks(selected);setMessage("Track removed.");}
    catch(error){setMessage(error instanceof Error?error.message:"Could not remove track.");}
  }

  const currentSession=sessions.find(session=>session.id===selected);
  return <main className="min-h-screen bg-[#11110f] px-5 py-8 text-[#e9e3d8] md:px-10">
    <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-[#393833] pb-5"><Link href="/" className="font-bold tracking-[.18em]">ATTIKID®</Link><nav className="flex gap-5 text-xs"><Link href="/music-room">View Music Room ↗</Link><Link href="/studio">Studio</Link></nav></header>
    <div className="mx-auto max-w-6xl py-12">
      <p className="text-xs tracking-[.2em] text-[#aaa49a]">ADMIN / EDITORIAL CONTROL</p><h1 className="mt-4 text-5xl font-semibold tracking-[-.06em] md:text-7xl">Music Room<br/><em className="font-normal">Curator desk.</em></h1>
      <p className="mt-5 max-w-2xl text-sm leading-6 text-[#aaa49a]">Build guided listening sessions from existing ATTIKID songs and alternate versions. Sessions stay unpublished until you choose to publish them.</p>
      {message&&<p role="status" className="my-6 border border-[#393833] p-3 text-sm">{message}</p>}
      <div className="mt-10 grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <section className="min-w-0">
          <h2 className="mb-4 text-2xl">Create a session</h2>
          <form onSubmit={createSession} className="grid gap-3 border border-[#393833] p-5">
            <label className="grid gap-2 text-xs">Session title<input required value={title} onChange={e=>{setTitle(e.target.value);setSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""));}} className="border border-[#393833] bg-transparent p-3 text-sm"/></label>
            <label className="grid gap-2 text-xs">URL slug<input required value={slug} onChange={e=>setSlug(e.target.value)} pattern="[a-z0-9-]+" className="border border-[#393833] bg-transparent p-3 text-sm"/></label>
            <label className="grid gap-2 text-xs">Description<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} className="border border-[#393833] bg-transparent p-3 text-sm"/></label>
            <button disabled={busy} className="bg-[#e9e3d8] p-3 text-xs font-semibold tracking-[.1em] text-[#11110f] disabled:opacity-50">CREATE DRAFT SESSION</button>
          </form>
          <h2 className="mb-4 mt-8 text-2xl">All sessions</h2>
          <div className="grid gap-2">{sessions.map(session=><article key={session.id} className={"border p-4 "+(selected===session.id?"border-[#e9e3d8]":"border-[#393833]")}><button onClick={()=>setSelected(session.id)} className="block w-full text-left"><span className="text-xs text-[#aaa49a]">{session.is_published?"PUBLISHED":"DRAFT"} / {session.slug}</span><strong className="mt-2 block text-lg">{session.title}</strong></button><button disabled={busy} onClick={()=>void publish(session)} className="mt-3 border border-[#393833] px-3 py-2 text-[10px] tracking-[.1em]">{session.is_published?"UNPUBLISH":"PUBLISH"} ↗</button></article>)}</div>
        </section>
        <section className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs tracking-[.18em] text-[#aaa49a]">SESSION CONTENT</p><h2 className="mt-2 text-3xl">{currentSession?.title||"Select a session"}</h2></div><span className="text-xs text-[#aaa49a]">{tracks.length} ITEMS</span></div>
          {selected&&<form onSubmit={addTrack} className="mt-5 grid gap-3 border border-[#393833] p-5">
            <label className="grid gap-2 text-xs">Add song or version<select required value={selection} onChange={e=>setSelection(e.target.value)} className="border border-[#393833] bg-[#171714] p-3 text-sm"><option value="">Choose catalog item…</option><optgroup label="Songs">{catalog.songs.map(song=><option key={song.id} value={"song:"+song.id}>{song.title} — {song.artist_name}</option>)}</optgroup><optgroup label="Alternate versions">{catalog.versions.map(version=>{const song=catalog.songs.find(item=>item.id===version.song_id);return <option key={version.id} value={"version:"+version.id}>{song?.title||"Song"} — {version.title} ({version.version_type}{version.is_public?", public":", private"})</option>;})}</optgroup></select></label>
            <label className="grid gap-2 text-xs">Curator note (optional)<textarea value={trackNote} onChange={e=>setTrackNote(e.target.value)} rows={2} className="border border-[#393833] bg-transparent p-3 text-sm"/></label>
            <button disabled={busy||!selection} className="bg-[#e9e3d8] p-3 text-xs font-semibold tracking-[.1em] text-[#11110f] disabled:opacity-50">ADD TO SESSION</button>
          </form>}
          <div className="mt-5 grid gap-2">{[...tracks].sort((a,b)=>a.position-b.position).map((track,index)=>{const song=track.song_versions?.songs||track.songs;const name=track.song_versions?.title||track.songs?.title||"Track";return <article key={track.id} className="flex flex-wrap items-center gap-3 border border-[#393833] p-4"><span className="text-xs text-[#aaa49a]">{String(index+1).padStart(2,"0")}</span><div className="min-w-0 flex-1"><strong className="block">{name}</strong><p className="mt-1 text-xs text-[#aaa49a]">{track.song_versions?.version_type||"Original"}{song?.artist_name?" / "+song.artist_name:""}</p>{track.curator_note&&<p className="mt-2 text-xs">{track.curator_note}</p>}</div><div className="flex gap-1"><button onClick={()=>void moveTrack(track,-1)} disabled={busy||index===0} className="border border-[#393833] px-3 py-2 text-xs" aria-label="Move up">↑</button><button onClick={()=>void moveTrack(track,1)} disabled={busy||index===tracks.length-1} className="border border-[#393833] px-3 py-2 text-xs" aria-label="Move down">↓</button><button onClick={()=>void removeTrack(track)} disabled={busy} className="border border-[#393833] px-3 py-2 text-xs">REMOVE</button></div></article>;})}</div>
          <p className="mt-5 text-xs leading-5 text-[#aaa49a]">Only published sessions are visible in the public Music Room. Song/version availability remains governed by database RLS. Verify the public visibility of each selected version before publishing.</p>
        </section>
      </div>
    </div>
  </main>;
}
