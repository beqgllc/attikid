import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudioToolPage } from "@/components/studio/StudioToolPage";
import { studioTools, studioToolById } from "@/components/studio/studio-config";

export function generateStaticParams() {
  return studioTools.map((tool) => ({ tool: tool.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool: id } = await params;
  const tool = studioToolById(id);
  if (!tool) return { title: "Tool not found — ATTIKID Studio" };

  return {
    title: `${tool.name} — ATTIKID Studio`,
    description: tool.detail,
    alternates: { canonical: `https://www.attikid.com/studio/tools/${tool.id}` },
  };
}

export default async function StudioToolRoute({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool: id } = await params;
  const tool = studioToolById(id);
  if (!tool) notFound();
  return <StudioToolPage tool={tool.id} />;
}
