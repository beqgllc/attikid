import type { Metadata } from "next";
import { StudioHome } from "@/components/studio/StudioHome";

export const metadata: Metadata = {
  title: "ATTIKID Studio — Free Music Creator Tools",
  description: "Free tools for songwriting, rhyme mapping, music prompts, song structure, release planning, and artist press kits.",
  alternates: { canonical: "/studio" },
};

export default function StudioPage() {
  return <StudioHome />;
}
