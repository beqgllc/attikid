import rawSongs from "./songs.json";

export type Album = {
  slug: string;
  title: string;
  cover: string;
};

export type Track = {
  slug: string;
  title: string;
  albumSlug: string;
  albumTitle: string;
  trackNumber: number | null;
  duration: string;
  src: string;
  cover: string;
};

export const albums: Album[] = [
  {
    slug: "misery-motel",
    title: "Misery Motel",
    cover: "/images/albums/misery-motel-cover-artwork.webp",
  },
  {
    slug: "trauma-and-shit",
    title: "Trauma & Shit",
    cover: "/images/albums/trauma-and-shit-cover-artwork.webp",
  },
  {
    slug: "dead-flowers-still-bloom",
    title: "Dead Flowers Still Bloom",
    cover: "/images/albums/dead-flowers-still-bloom-cover-artwork.webp",
  },
  {
    slug: "more-trauma-and-shit",
    title: "More Trauma & Shit",
    cover: "/images/albums/more-trauma-and-shit-cover-artwork.webp",
  },
  {
    slug: "cloudy-with-a-chance",
    title: "Cloudy With a Chance",
    cover: "/images/albums/cloudy-with-a-chance-cover-artwork.webp",
  },
];

export const songs = rawSongs as Track[];

export function albumBySlug(slug: string) {
  return albums.find((album) => album.slug === slug);
}

export function songsForAlbum(slug: string) {
  return songs
    .filter((song) => song.albumSlug === slug)
    .sort((first, second) => {
      if (first.trackNumber === null) return 1;
      if (second.trackNumber === null) return -1;
      return first.trackNumber - second.trackNumber || first.title.localeCompare(second.title);
    });
}
