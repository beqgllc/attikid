import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteFrame";
import "./studio.css";

export default function StudioLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="ak-page ak-page--scroll ak-studio-shell" id="main-content">
      <SiteHeader
        leftLinks={[{ label: "Music", href: "/albums" }]}
        rightLinks={[{ label: "Studio", href: "/studio" }]}
        musicNavigation
      />
      <div className="ak-studio-app">{children}</div>
      <SiteFooter
        leftLink={{ label: "Merch", href: "/supply-shop" }}
        rightLink={{ label: "Contact", href: "mailto:attikid.music@outlook.com" }}
      />
    </main>
  );
}
