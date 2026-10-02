"use client";

import { useMemo, useState } from "react";
import { AudioTrackList } from "@/components/music/AudioTrackList";
import { songs } from "@/content/music";

export function MusicDirectory() {
  const [query, setQuery] = useState("");
  const filteredSongs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return [...songs]
      .filter((song) =>
        `${song.title} ${song.albumTitle}`.toLocaleLowerCase().includes(normalizedQuery),
      )
      .sort((first, second) => first.title.localeCompare(second.title));
  }, [query]);

  return (
    <>
      <label className="ak-search">
        <span className="ak-search__icon" aria-hidden="true">⌕</span>
        <span className="ak-visually-hidden">Search songs or albums</span>
        <input
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search songs or albums..."
          type="search"
          value={query}
        />
        {query && (
          <button onClick={() => setQuery("")} type="button" aria-label="Clear search">
            ×
          </button>
        )}
      </label>
      <p className="ak-result-count" aria-live="polite">
        {filteredSongs.length} {filteredSongs.length === 1 ? "song" : "songs"}
      </p>
      {filteredSongs.length ? (
        <AudioTrackList grouped tracks={filteredSongs} />
      ) : (
        <p className="ak-empty-state">No songs match “{query}”.</p>
      )}
    </>
  );
}
