import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AudioTrackList } from "@/components/music/AudioTrackList";
import { SiteFooter, SiteHeader, SitePage } from "@/components/layout/SiteFrame";
import { albumBySlug, albums, songsForAlbum } from "@/content/music";

export function generateStaticParams() {
  return albums.map((album) => ({ slug: album.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const album = albumBySlug(slug);
  return album
    ? {
        title: `${album.title} | Attikid`,
        description: `Listen to tracks from ${album.title} by Attikid.`,
      }
    : { title: "Release not found | Attikid" };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = albumBySlug(slug);
  if (!album) notFound();

  const tracks = songsForAlbum(album.slug);

  return (
    <SitePage>
      <SiteHeader
        leftLinks={[{ label: "Albums", href: "/albums" }]}
        rightLinks={[{ label: "Songs", href: "/song-list" }]}
      />
      <section className="ak-interior ak-album-detail" aria-labelledby="album-title">
        <Link className="ak-back-link" href="/albums">← All releases</Link>
        <div className="ak-album-detail__layout">
          <Image
            alt={`${album.title} cover artwork`}
            className="ak-album-detail__cover"
            height={800}
            priority
            src={album.cover}
            width={800}
          />
          <div className="ak-album-detail__content">
            <p className="ak-eyebrow">Attikid · Release</p>
            <h1 className="ak-page-title" id="album-title">{album.title}</h1>
            <p className="ak-album-detail__count">{tracks.length} tracks</p>
            <AudioTrackList tracks={tracks} />
          </div>
        </div>
      </section>
      <SiteFooter
        leftLink={{ label: "Merch", href: "/supply-shop" }}
        rightLink={{ label: "Contact", href: "mailto:attikid.music@outlook.com" }}
      />
    </SitePage>
  );
}
