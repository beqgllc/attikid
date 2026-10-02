import Image from "next/image";
import type { Metadata } from "next";
import { SiteFooter, SiteHeader, SitePage } from "@/components/layout/SiteFrame";
import { albums, songsForAlbum } from "@/content/music";

export const metadata: Metadata = {
  title: "Albums | Attikid",
  description: "Explore Attikid's releases and album artwork.",
};

export default function AlbumsPage() {
  return (
    <SitePage>
      <SiteHeader
        leftLinks={[{ label: "Home", href: "/" }]}
        rightLinks={[{ label: "Songs", href: "/song-list" }]}
      />
      <section className="ak-interior ak-albums" aria-labelledby="albums-title">
        <h1 className="ak-page-title" id="albums-title">
          <span>Attikid&apos;s </span><span className="ak-title__outline">Releases</span>
        </h1>
        <div className="ak-album-grid">
          {albums.map((album) => (
            <a className="ak-album-card" href={`/albums/${album.slug}`} key={album.slug}>
              <Image
                alt={`${album.title} cover artwork`}
                className="ak-album-card__image"
                height={640}
                src={album.cover}
                width={640}
              />
              <span className="ak-album-card__title">“{album.title}”</span>
              <span className="ak-album-card__artist">Attikid</span>
              <span className="ak-album-card__count">
                {songsForAlbum(album.slug).length} tracks <span aria-hidden="true">↗</span>
              </span>
            </a>
          ))}
        </div>
      </section>
      <SiteFooter
        leftLink={{ label: "Merch", href: "/supply-shop" }}
        rightLink={{ label: "Contact", href: "mailto:attikid.music@outlook.com" }}
      />
    </SitePage>
  );
}
