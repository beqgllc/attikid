import type { Metadata } from "next";
import { MusicDirectory } from "@/components/music/MusicDirectory";
import { SiteFooter, SiteHeader, SitePage } from "@/components/layout/SiteFrame";

export const metadata: Metadata = {
  title: "A to Z Song Directory | Attikid",
  description: "Search and listen to songs by Attikid in the A to Z directory.",
};

export default function SongListPage() {
  return (
    <SitePage>
      <SiteHeader
        leftLinks={[{ label: "Albums", href: "/albums" }]}
        rightLinks={[{ label: "Merch", href: "/supply-shop" }]}
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
