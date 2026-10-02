"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { Track } from "@/content/music";
import { albums } from "@/content/music";

export function AudioTrackList({
  tracks,
  grouped = false,
}: {
  tracks: Track[];
  grouped?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const groups = useMemo(() => {
    if (!grouped) return [{ label: "", items: tracks }];

    const byLetter = new Map<string, Track[]>();
    for (const track of tracks) {
      const initial = track.title[0]?.toUpperCase() ?? "#";
      const label = /[A-Z]/.test(initial) ? initial : "#";
      byLetter.set(label, [...(byLetter.get(label) ?? []), track]);
    }

    return [...byLetter.entries()]
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([label, items]) => ({ label, items }));
  }, [grouped, tracks]);

  function toggleTrack(track: Track) {
    const audio = audioRef.current;
    if (!audio) return;

    if (activeTrack === track.slug && !audio.paused) {
      audio.pause();
      return;
    }

    setActiveTrack(track.slug);
    audio.src = track.src;
    audio.load();
    void audio.play().then(
      () => setIsPlaying(true),
      () => setIsPlaying(false),
    );
  }

  return (
    <>
      <audio
        aria-label="Selected Attikid song"
        hidden
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        ref={audioRef}
      />
      {grouped && (
        <nav className="ak-letter-nav" aria-label="Jump to a song letter">
          {"#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => {
            const target = letter === "#" ? "letter-number" : `letter-${letter}`;
            return groups.some((group) => group.label === letter) ? (
              <a aria-label={letter === "#" ? "Numbers" : letter} href={`#${target}`} key={letter}>
                {letter}
              </a>
            ) : (
              <span aria-disabled="true" className="ak-letter-nav__empty" key={letter}>
                {letter}
              </span>
            );
          })}
        </nav>
      )}
      <div className={grouped ? "ak-track-groups" : "ak-track-groups ak-track-groups--flat"}>
        {groups.map((group) => (
          <section
            aria-label={group.label ? `Songs starting with ${group.label}` : undefined}
            className="ak-track-group"
            id={group.label ? (group.label === "#" ? "letter-number" : `letter-${group.label}`) : undefined}
            key={group.label || "all-tracks"}
          >
            {group.label && (
              <h2 className="ak-track-group__heading">
                <span>{group.label}</span>
              </h2>
            )}
            <ul className="ak-track-list">
              {group.items.map((track) => {
                const album = albums.find((item) => item.slug === track.albumSlug);
                const playing = activeTrack === track.slug && isPlaying;

                return (
                  <li className="ak-track" key={track.slug}>
                    {album ? (
                      <Image
                        alt=""
                        className="ak-track__cover"
                        height={48}
                        src={album.cover}
                        width={48}
                      />
                    ) : (
                      <span className="ak-track__cover ak-track__cover--single" aria-hidden="true">
                        AK
                      </span>
                    )}
                    <div className="ak-track__copy">
                      <span className="ak-track__title">{track.title}</span>
                      <span className="ak-track__album">{track.albumTitle}</span>
                    </div>
                    <span className="ak-track__duration">{track.duration}</span>
                    <button
                      aria-label={`${playing ? "Pause" : "Play"} ${track.title}`}
                      className={`ak-track__play${playing ? " is-playing" : ""}`}
                      onClick={() => toggleTrack(track)}
                      type="button"
                    >
                      {playing ? "Ⅱ" : "▶"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
