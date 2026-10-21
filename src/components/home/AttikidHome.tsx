import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteFrame";
import { homeCopy } from "@/content/site";

export function AttikidHome() {
  return (
    <main className="ak-page" id="home">
      <SiteHeader
        leftLinks={[{ label: homeCopy.navigation.albums, href: "/albums" }]}
        rightLinks={[{ label: "Studio", href: "/studio" }]}
        musicNavigation
      />

      <section className="ak-hero" aria-labelledby="ak-title">
        <div className="ak-hero__content">
          <h1 className="ak-title" id="ak-title">
            {homeCopy.title.map((line) => (
              <span className="ak-title__line" key={line.solid}>
                <span>{line.solid}</span>
                <span className="ak-title__outline">{line.outlined}</span>
              </span>
            ))}
          </h1>
          <p className="ak-subtitle">{homeCopy.subtitle}</p>
          <Link className="ak-home-studio-link" href="/studio">
            <span>FOR THE PEOPLE MAKING THE MUSIC</span>
            <strong>ENTER ATTIKID STUDIO <span aria-hidden="true">↗</span></strong>
          </Link>
        </div>
      </section>

      <SiteFooter
        leftLink={{ label: homeCopy.navigation.merch, href: "/supply-shop" }}
        rightLink={{ label: homeCopy.navigation.contact, href: "mailto:attikid.music@outlook.com" }}
      />
    </main>
  );
}
