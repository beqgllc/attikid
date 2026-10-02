import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { footerCopy } from "@/content/site";

type SiteLink = {
  label: string;
  href: string;
};

export function AttikidLogo() {
  return (
    <Link className="ak-logo" href="/" aria-label="Attikid home">
      <Image
        alt=""
        className="ak-logo__image"
        height={420}
        preload
        src="/sites/www-ground-werk-com-fa8e55eb/root-8a5edab2/images/attikid-worddmark.svg"
        unoptimized
        width={952}
      />
    </Link>
  );
}

export function SiteHeader({
  leftLinks,
  rightLinks,
}: {
  leftLinks: SiteLink[];
  rightLinks: SiteLink[];
}) {
  const links = (items: SiteLink[], label: string, className: string) => (
    <nav aria-label={label} className={className}>
      {items.map((item) => (
        <Link href={item.href} key={item.label}>
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <header className="ak-header">
      {links(leftLinks, "Main navigation", "ak-nav ak-nav--left")}
      <AttikidLogo />
      {links(rightLinks, "More navigation", "ak-nav ak-nav--right")}
    </header>
  );
}

export function SiteFooter({
  leftLink,
  rightLink,
}: {
  leftLink: SiteLink;
  rightLink: SiteLink;
}) {
  return (
    <footer className="ak-footer" id="contact">
      <Link className="ak-footer__side ak-footer__left" href={leftLink.href}>
        {leftLink.label}
      </Link>
      <div className="ak-legal">
          <p>{footerCopy.copyright}</p>
        <p className="ak-legal__links">
          <Link href="https://app.websitepolicies.com/policies/view/3yyoytb8">{footerCopy.privacy}</Link>
          <span aria-hidden="true"> | </span>
          <Link href="https://app.websitepolicies.com/policies/view/e58g6wk9">{footerCopy.terms}</Link>
        </p>
      </div>
      <Link className="ak-footer__side ak-footer__right" href={rightLink.href}>
        {rightLink.label}
      </Link>
    </footer>
  );
}

export function SitePage({ children }: { children: ReactNode }) {
  return <main className="ak-page ak-page--scroll">{children}</main>;
}
