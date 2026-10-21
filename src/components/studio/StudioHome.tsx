"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { studioTools } from "@/components/studio/studio-config";

type RecentTool = { id: string; title: string; usedAt: number };

const RECENT_KEY = "attikid.studio.recent-tools.v1";
const categories = ["WRITE", "CREATE", "PRODUCE", "ORGANIZE"] as const;
const EMPTY_RECENT: RecentTool[] = [];
const getServerRecentSnapshot = () => EMPTY_RECENT;
let cachedRecentStorage: string | null | undefined;
let cachedRecentSnapshot: RecentTool[] = EMPTY_RECENT;

function getRecentToolsSnapshot(): RecentTool[] {
  if (typeof window === "undefined") return EMPTY_RECENT;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(RECENT_KEY);
  } catch {
    return EMPTY_RECENT;
  }
  if (raw === cachedRecentStorage) return cachedRecentSnapshot;

  cachedRecentStorage = raw;
  if (!raw) {
    cachedRecentSnapshot = EMPTY_RECENT;
    return cachedRecentSnapshot;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    cachedRecentSnapshot = Array.isArray(parsed)
      ? parsed.filter(
          (item): item is RecentTool =>
            typeof item === "object" &&
            item !== null &&
            typeof item.id === "string" &&
            typeof item.title === "string" &&
            typeof item.usedAt === "number" &&
            studioTools.some((tool) => tool.id === item.id),
        ).slice(0, 4)
      : EMPTY_RECENT;
  } catch {
    cachedRecentSnapshot = EMPTY_RECENT;
  }
  return cachedRecentSnapshot;
}

function subscribeToRecentTools(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("attikid:studio-recent-tools", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("attikid:studio-recent-tools", onStoreChange);
  };
}

export function StudioHome() {
  const recent = useSyncExternalStore(
    subscribeToRecentTools,
    getRecentToolsSnapshot,
    getServerRecentSnapshot,
  );

  return (
    <div className="ak-studio-home">
      <section className="ak-studio-hero" aria-labelledby="studio-title">
        <p className="ak-studio-eyebrow">ATTIKID / CREATOR WORKSPACE</p>
        <h1 id="studio-title">MAKE SOMETHING WORTH HEARING.</h1>
        <p className="ak-studio-hero__copy">
          Tools for the words, prompts, and work behind the music.
        </p>
        <div className="ak-studio-actions">
          <a className="ak-studio-button ak-studio-button--primary" href="#studio-tools">
            EXPLORE THE TOOLS <span aria-hidden="true">↘</span>
          </a>
          <Link className="ak-studio-button" href="/studio/tools/lyric-pad">
            START WRITING <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="ak-studio-hero__index" aria-hidden="true">
          <span>WORDS</span><i /><span>SOUND</span><i /><span>PROCESS</span>
        </div>
      </section>

      <section className="ak-studio-section" id="studio-tools" aria-labelledby="studio-tools-title">
        <div className="ak-studio-section__heading">
          <div>
            <p className="ak-studio-eyebrow">THE WORKBENCH</p>
            <h2 id="studio-tools-title">TOOLS FOR THE PROCESS.</h2>
          </div>
          <p>FREE TO USE · NO ACCOUNT REQUIRED</p>
        </div>
        {categories.map((category) => {
          const categoryTools = studioTools.filter((tool) => tool.category === category);
          return (
            <div className="ak-studio-tool-group" key={category}>
              <h3>{category}</h3>
              <div className="ak-studio-tool-grid">
                {categoryTools.map((tool, index) => (
                  <Link
                    className="ak-studio-tool-card"
                    href={`/studio/tools/${tool.id}`}
                    key={tool.id}
                  >
                    <div className="ak-studio-tool-card__top">
                      <span className="ak-studio-tool-card__symbol" aria-hidden="true">{tool.symbol}</span>
                      <span className="ak-studio-tool-card__number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h4>{tool.name}</h4>
                    <p>{tool.description}</p>
                    <span className="ak-studio-tool-card__action">OPEN TOOL <span aria-hidden="true">↗</span></span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="ak-studio-workflow" aria-labelledby="studio-workflow-title">
        <div>
          <p className="ak-studio-eyebrow">A CONNECTED WORKFLOW</p>
          <h2 id="studio-workflow-title">FROM FIRST LINE TO RELEASE DAY.</h2>
        </div>
        <ol>
          <li><span>01</span><div><strong>Write and refine</strong><p>Find rhymes, inspect cadence, and shape the draft.</p></div></li>
          <li><span>02</span><div><strong>Build the sound</strong><p>Turn a concept into a structured music prompt.</p></div></li>
          <li><span>03</span><div><strong>Plan the record</strong><p>Map tempo, sections, bars, and approximate runtime.</p></div></li>
          <li><span>04</span><div><strong>Get it organized</strong><p>Prepare collaborator splits, release tasks, and press materials.</p></div></li>
        </ol>
      </section>

      <section className="ak-studio-recent" aria-labelledby="studio-recent-title">
        <div className="ak-studio-section__heading">
          <div>
            <p className="ak-studio-eyebrow">PICK UP WHERE YOU LEFT OFF</p>
            <h2 id="studio-recent-title">RECENT TOOLS.</h2>
          </div>
          <p>BROWSER-LOCAL HISTORY</p>
        </div>
        {recent.length ? (
          <div className="ak-studio-recent__list">
            {recent.map((item) => {
              const tool = studioTools.find((candidate) => candidate.id === item.id);
              if (!tool) return null;
              return (
                <Link href={`/studio/tools/${tool.id}`} key={tool.id}>
                  <span>{tool.category}</span><strong>{tool.name}</strong><span>REOPEN ↗</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="ak-studio-empty">
            <span className="ak-studio-empty__mark" aria-hidden="true">+</span>
            <div><strong>No tools opened yet.</strong><p>Your recent tools will appear here on this browser. Lyrics and drafts are not saved to this history.</p></div>
            <Link href="/studio/tools/lyric-pad">OPEN LYRIC PAD ↗</Link>
          </div>
        )}
        <p className="ak-studio-local-note">
          Recent tool names stay in this browser only. This history does not sync and does not store lyric drafts.
        </p>
      </section>
    </div>
  );
}
