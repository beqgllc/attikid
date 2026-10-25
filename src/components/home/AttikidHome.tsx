import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteFrame";
import { homeCopy } from "@/content/site";

export const metadata = {
  title: "Attikid | Independent Music, Albums & Songwriting Tools",
  description:
    "Listen to Attikid's independent music and explore albums, songs, and free songwriting tools. Same kid, different demons — you are not alone.",
  alternates: { canonical: "/" },
};

export function AttikidHome() {
  return (
    <main className="ak-page" id="main-content">
      <SiteHeader
        leftLinks={[{ label: homeCopy.navigation.albums, href: "/albums" }]}
        rightLinks={[{ label: "Studio", href: "/studio" }]}
        musicNavigation
      />

      <section className="ak-hero" aria-labelledby="ak-title">
        <div className="ak-hero__content">
          <h1 className="ak-title" id="ak-title">
            {homeCopy.title.map((line) => (
              <span className="ak-title__line" key={line.solid}>
                <span>{line.solid}</span>
                <span className="ak-title__outline">{line.outlined}</span>
              </span>
            ))}
          </h1>
          <p className="ak-subtitle">{homeCopy.subtitle}</p>
          <Link className="ak-home-studio-link" href="/studio">
            <span>FOR THE PEOPLE MAKING THE MUSIC</span>
            <strong>ENTER ATTIKID STUDIO <span aria-hidden="true">↗</span></strong>
          </Link>
        </div>
      </section>

      <section className="ak-home-discovery" aria-labelledby="ak-discovery-title">
        <div className="ak-home-discovery__inner">
          <p className="ak-eyebrow">Independent artist · Music · Creation</p>
          <h2 id="ak-discovery-title">Music for the parts you don’t always say out loud.</h2>
          <p>
            Attikid is an independent music project built around honest expression,
            difficult emotions, and the experiences that shape us. Explore original
            releases, listen through the song directory, and find the track or project
            that speaks to where you are right now.
          </p>
          <div className="ak-home-discovery__links">
            <Link href="/albums">Explore Attikid albums</Link>
            <Link href="/song-list">Browse every song A to Z</Link>
          </div>
          <h2>Make something of your own with Attikid Studio.</h2>
          <p>
            Attikid Studio brings practical music-making resources together in one place.
            Use songwriting and lyric tools to develop ideas, explore rhymes, organize
            song structure, shape music-generation prompts, and prepare for a release.
            Whether you are starting with a blank page or refining a track, the tools
            are designed to help turn an unfinished idea into a more focused creative
            direction.
          </p>
          <div className="ak-home-discovery__links">
            <Link href="/studio">Explore free music creator tools</Link>
            <Link href="/supply-shop">Visit K!D Supply Co.</Link>
          </div>
        </div>
      </section>

      <SiteFooter
        leftLink={{ label: homeCopy.navigation.merch, href: "/supply-shop" }}
        rightLink={{ label: homeCopy.navigation.contact, href: "mailto:attikid.music@outlook.com" }}
      />
    </main>
  );
}
