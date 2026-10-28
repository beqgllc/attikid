import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Music Room — Listen closer",
  description: "Explore Attikid's catalog, alternate versions, and the stories behind the songs.",
  alternates: { canonical: "/music-room" },
};

export const dynamic = "force-dynamic";

export default async function MusicRoomPage() {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.from("listening_sessions")
    .select("id,title,slug,description,editorial_note,sort_order,published_at,listening_session_tracks(position,curator_note,songs(title,artist_name,slug),song_versions(title,version_type,story,songs(title,artist_name,slug)))")
    .eq("is_published", true).order("sort_order", { ascending: true });
  const sessions = (sessionData ?? []) as unknown as Array<{
    id: string; title: string; slug: string; description: string | null; editorial_note: string | null;
    listening_session_tracks?: Array<{
      position: number; curator_note: string | null;
      songs?: { title: string; artist_name: string; slug: string } | null;
      song_versions?: { title: string; version_type: string; story: string | null; songs?: { title: string; artist_name: string; slug: string } | null } | null;
    }> | null;
  }>;
  const { data: versionData } = await supabase.from("song_versions")
    .select("id,title,version_type,story,sort_order,songs(title,artist_name,slug)")
    .eq("is_public", true).order("sort_order", { ascending: true }).limit(30);
  const versions = (versionData ?? []) as unknown as Array<{
    id: string; title: string; version_type: string; story: string | null; sort_order: number;
    songs?: { title: string; artist_name: string; slug: string } | null;
  }>;

  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <Link className={styles.wordmark} href="/">ATTIKID<span>®</span></Link>
        <nav aria-label="Main navigation"><Link href="/albums">Albums</Link><Link href="/songs">Songs</Link><Link href="/studio">Studio</Link><Link href="/supply-shop">Shop</Link></nav>
      </header>
      <section className={styles.intro}>
        <p className={styles.kicker}>LISTENING ROOM / VOL. 01</p>
        <h1>Listen<br/><em>closer.</em></h1>
        <div className={styles.introBottom}><p>A place for the songs, the versions that almost were, and the stories that stayed with them.</p><Link className={styles.textLink} href="/songs">EXPLORE THE CATALOG <span aria-hidden="true">↗</span></Link></div>
      </section>
      <section className={styles.catalog} aria-labelledby="catalog-title">
        <div className={styles.sectionHead}><span>01 / THE ARCHIVE</span><h2 id="catalog-title">The catalog, unhurried.</h2></div>
        <div className={styles.archivePanel}><div className={styles.archiveMark} aria-hidden="true">A—K</div><div><p className={styles.kicker}>ALL RELEASES</p><h3>Every song has a place to start.</h3><p>Browse the available releases and return to a track whenever you need to hear it differently.</p><Link className={styles.textLink} href="/albums">BROWSE ALBUMS <span aria-hidden="true">↗</span></Link></div><Link className={styles.archiveArrow} href="/songs" aria-label="Browse songs">↗</Link></div>
      </section>
      <section className={styles.sessions} aria-labelledby="sessions-title">
        <div className={styles.sectionHead}><span>02 / GUIDED LISTENING</span><h2 id="sessions-title">Come in through a different door.</h2></div>
        <div className={styles.sessionList}>
          {sessions.length === 0 ? <article className={styles.session}><span>—</span><div><h3>Sessions are being prepared.</h3><p>Browse the current public catalog while new listening sessions are curated.</p></div><span className={styles.sessionArrow}>↗</span></article> : sessions.map((session, index) => <article className={styles.session} key={session.id}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{session.title}</h3><p>{session.description || session.editorial_note || "A guided listen through the ATTIKID catalog."}</p>{session.listening_session_tracks?.length ? <ul className={styles.sessionTracks}>{session.listening_session_tracks.slice().sort((a,b)=>a.position-b.position).map((track, i) => { const song = track.song_versions?.songs || track.songs; const title = track.song_versions?.title || track.songs?.title || song?.title || "Catalog track"; return <li key={String(track.position)+"-"+i}><span>{String(i+1).padStart(2,"0")}</span>{title}<small>{track.song_versions?.version_type ? " / "+track.song_versions.version_type : ""}{song?.artist_name ? " — "+song.artist_name : ""}</small>{track.curator_note && <p>{track.curator_note}</p>}</li>; })}</ul> : null}</div><span className={styles.sessionArrow}>↗</span></article>)}
        </div>
        <p className={styles.note}>Published sessions and ordered track lists are loaded from the ATTIKID catalog database.</p>
      </section>
      <section className={styles.versions}>
        <p className={styles.kicker}>03 / ALTERNATE VERSIONS</p><h2>Some songs have<br/>more than one life.</h2>
        <p>Public demos, stripped versions, live takes, remixes, and alternate edits from the catalog.</p>
        {versions.length ? <div className={styles.sessionList}>{versions.map((version, index) => <article className={styles.session} key={version.id}><span>{String(index+1).padStart(2,"0")}</span><div><h3>{version.songs?.title || "ATTIKID track"} — {version.title}</h3><p>{version.version_type}{version.songs?.artist_name ? " / "+version.songs.artist_name : ""}</p>{version.story && <p>{version.story}</p>}</div><span className={styles.sessionArrow}>↗</span></article>)}</div> : <p className={styles.note}>No alternate versions are currently published. Approved public versions will appear here.</p>}
        <div className={styles.versionFoot}><span>ALTERNATE VERSIONS / PUBLISHED ARCHIVE</span><Link href="/studio">VISIT THE STUDIO ↗</Link></div>
      </section>
      <footer className={styles.footer}><Link className={styles.wordmark} href="/">ATTIKID<span>®</span></Link><span>INDEPENDENT MUSIC / MADE TO BE FELT</span><Link href="/studio">MAKE SOMETHING ↗</Link><Link href="/admin/music-room">CURATOR ACCESS ↗</Link></footer>
    </main>
  );
}
