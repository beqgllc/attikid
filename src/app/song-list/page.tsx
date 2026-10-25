import type { Metadata } from "next";
import { MusicDirectory } from "@/components/music/MusicDirectory";
import { SiteFooter, SiteHeader, SitePage } from "@/components/layout/SiteFrame";

export const metadata: Metadata = {
  title: "A to Z Song Directory | Attikid",
  description: "Browse the Attikid song directory from A to Z. Find original tracks and listen to music by independent artist Attikid.",
  alternates: { canonical: "/song-list" },
};

export default function SongListPage() {
  return (
    <SitePage>
      <SiteHeader
        leftLinks={[{ label: "Music", href: "/albums" }]}
        rightLinks={[{ label: "Studio", href: "/studio" }]}
        musicNavigation
      />
      <section className="ak-interior ak-song-page" aria-labelledby="song-title">
        <div className="ak-song-page__intro">
          <h1 className="ak-page-title" id="song-title">
            A to <span className="ak-title__outline">Z</span>
            <br />Song Directory
          </h1>
          <p className="ak-song-page__strapline">All tracks. All alphabetical.</p>
          <p className="ak-eyebrow">Browse every song from A to Z</p>
        </div>
        <MusicDirectory />
      </section>
      <SiteFooter
        leftLink={{ label: "Merch", href: "/supply-shop" }}
        rightLink={{ label: "Contact", href: "mailto:attikid.music@outlook.com" }}
      />
    </SitePage>
  );
}
