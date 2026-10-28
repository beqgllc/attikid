import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Music Room — Listen closer",
  description: "Explore Attikid's catalog, alternate versions, and the stories behind the songs.",
  alternates: { canonical: "/music-room" },
};

const sessions = [
  { no: "01", title: "Start here", note: "A first pass through the catalog.", href: "/songs" },
  { no: "02", title: "Read between the lines", note: "Songs built around the words.", href: "/songs" },
  { no: "03", title: "After hours", note: "The quieter, more inward-facing side.", href: "/albums" },
];

export default function MusicRoomPage() {
  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <Link className={styles.wordmark} href="/">ATTIKID<span>®</span></Link>
        <nav aria-label="Main navigation">
          <Link href="/albums">Albums</Link><Link href="/songs">Songs</Link>
          <Link href="/studio">Studio</Link><Link href="/supply-shop">Shop</Link>
        </nav>
      </header>
      <section className={styles.intro}>
        <p className={styles.kicker}>LISTENING ROOM / VOL. 01</p>
        <h1>Listen<br/><em>closer.</em></h1>
        <div className={styles.introBottom}>
          <p>A place for the songs, the versions that almost were, and the stories that stayed with them.</p>
          <Link className={styles.textLink} href="/songs">EXPLORE THE CATALOG <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
      <section className={styles.catalog} aria-labelledby="catalog-title">
        <div className={styles.sectionHead}><span>01 / THE ARCHIVE</span><h2 id="catalog-title">The catalog, unhurried.</h2></div>
        <div className={styles.archivePanel}>
          <div className={styles.archiveMark} aria-hidden="true">A—K</div>
          <div><p className={styles.kicker}>ALL RELEASES</p><h3>Every song has a place to start.</h3><p>Browse the available releases and return to a track whenever you need to hear it differently.</p><Link className={styles.textLink} href="/albums">BROWSE ALBUMS <span aria-hidden="true">↗</span></Link></div>
          <Link className={styles.archiveArrow} href="/songs" aria-label="Browse songs">↗</Link>
        </div>
      </section>
      <section className={styles.sessions} aria-labelledby="sessions-title">
        <div className={styles.sectionHead}><span>02 / GUIDED LISTENING</span><h2 id="sessions-title">Come in through a different door.</h2></div>
        <div className={styles.sessionList}>{sessions.map((session) => <Link href={session.href} className={styles.session} key={session.no}><span>{session.no}</span><div><h3>{session.title}</h3><p>{session.note}</p></div><span className={styles.sessionArrow}>↗</span></Link>)}</div>
        <p className={styles.note}>Listening sessions are starting points, not rankings. The catalog is the source of truth for currently available tracks.</p>
      </section>
      <section className={styles.versions}>
        <p className={styles.kicker}>03 / THE WORK IN PROGRESS</p><h2>Some songs have<br/>more than one life.</h2>
        <p>Alternate takes, demos, stripped versions, and notes from the writing room belong beside the finished release—not buried in a feed.</p>
        <div className={styles.versionFoot}><span>ALTERNATE VERSIONS / ARCHIVE IN PROGRESS</span><Link href="/studio">VISIT THE STUDIO ↗</Link></div>
      </section>
      <footer className={styles.footer}><Link className={styles.wordmark} href="/">ATTIKID<span>®</span></Link><span>INDEPENDENT MUSIC / MADE TO BE FELT</span><Link href="/studio">MAKE SOMETHING ↗</Link></footer>
    </main>
  );
}
