"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  BpmPlannerTool,
  EpkBuilderTool,
  LyricPadTool,
  LyricFormatterTool,
  PromptBuilderTool,
  ReleaseChecklistTool,
  RhymeFinderTool,
  SplitSheetTool,
  BarCounterTool,
} from "@/components/studio/StudioToolBodies";
import { studioTools, type StudioToolId } from "@/components/studio/studio-config";

const RECENT_KEY = "attikid.studio.recent-tools.v1";

const relatedTools: Record<StudioToolId, StudioToolId[]> = {
  "rhyme-finder": ["lyric-pad", "lyric-formatter"],
  "bar-counter": ["bpm-planner", "lyric-pad"],
  "prompt-builder": ["lyric-formatter", "bpm-planner"],
  "lyric-formatter": ["rhyme-finder", "lyric-pad"],
  "bpm-planner": ["bar-counter", "prompt-builder"],
  "split-sheet": ["release-checklist", "epk-builder"],
  "release-checklist": ["epk-builder", "split-sheet"],
  "epk-builder": ["release-checklist", "split-sheet"],
  "lyric-pad": ["rhyme-finder", "bar-counter", "lyric-formatter"],
};

export function StudioToolPage({ tool }: { tool: StudioToolId }) {
  const metadata = studioTools.find((item) => item.id === tool)!;
  const related = relatedTools[tool].map((id) => studioTools.find((item) => item.id === id)!);

  useEffect(() => {
    try {
      const currentRaw = window.localStorage.getItem(RECENT_KEY);
      const current: unknown = currentRaw ? JSON.parse(currentRaw) : [];
      const valid = Array.isArray(current)
        ? current.filter(
            (item): item is { id: string; title: string; usedAt: number } =>
              typeof item === "object" &&
              item !== null &&
              typeof item.id === "string" &&
              typeof item.title === "string" &&
              typeof item.usedAt === "number" &&
              studioTools.some((candidate) => candidate.id === item.id),
          )
        : [];
      const next = [
        { id: tool, title: metadata.name, usedAt: Date.now() },
        ...valid.filter((item) => item.id !== tool),
      ].slice(0, 4);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Recent history is optional; the tools remain fully usable if storage is disabled.
    }
  }, [tool, metadata.name]);

  return (
    <section className="ak-studio-tool-page" aria-labelledby="ak-studio-tool-title">
      <nav className="ak-studio-breadcrumb" aria-label="Breadcrumb">
        <Link href="/studio">STUDIO</Link>
        <span aria-hidden="true">/</span>
        <span>{metadata.name.toUpperCase()}</span>
      </nav>
      <header className="ak-studio-tool-header">
        <p className="ak-studio-eyebrow">{metadata.category} / ATTIKID STUDIO</p>
        <h1 id="ak-studio-tool-title">{metadata.name}</h1>
        <p>{metadata.detail}</p>
      </header>

      <div className="ak-studio-tool-content">
        {tool === "lyric-pad" && <LyricPadTool />}
        {tool === "rhyme-finder" && <RhymeFinderTool />}
        {tool === "bar-counter" && <BarCounterTool />}
        {tool === "prompt-builder" && <PromptBuilderTool />}
        {tool === "lyric-formatter" && <LyricFormatterTool />}
        {tool === "bpm-planner" && <BpmPlannerTool />}
        {tool === "split-sheet" && <SplitSheetTool />}
        {tool === "release-checklist" && <ReleaseChecklistTool />}
        {tool === "epk-builder" && <EpkBuilderTool />}
      </div>

      <aside className="ak-studio-related" aria-labelledby="related-tools-title">
        <div>
          <p className="ak-studio-eyebrow">KEEP THE WORK MOVING</p>
          <h2 id="related-tools-title">NEXT IN THE WORKFLOW</h2>
        </div>
        <div className="ak-studio-related__links">
          {related.map((item) => (
            <Link href={`/studio/tools/${item.id}`} key={item.id}>
              <span>{item.category}</span><strong>{item.name}</strong><span aria-hidden="true">↗</span>
            </Link>
          ))}
          <Link href="/studio">
            <span>ALL TOOLS</span><strong>Back to Studio</strong><span aria-hidden="true">↗</span>
          </Link>
        </div>
      </aside>
    </section>
  );
}
