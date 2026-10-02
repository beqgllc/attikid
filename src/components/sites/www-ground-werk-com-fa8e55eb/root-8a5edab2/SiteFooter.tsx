import Image from "next/image";

const imageRoot =
  "/sites/www-ground-werk-com-fa8e55eb/root-8a5edab2/images";

const footerLinkClass =
  "inline-flex min-h-10 items-center px-4 font-[Montserrat,sans-serif] text-[16px] leading-6 font-normal tracking-[1px] text-white uppercase outline-offset-4 transition-colors duration-150 hover:text-[#bfa12f] focus-visible:text-[#bfa12f] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#bfa12f]";

const legalLinkClass =
  "outline-offset-2 transition-colors duration-150 hover:text-[#bfa12f] focus-visible:text-[#bfa12f] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#bfa12f]";

export function SiteFooter() {
  return (
    <footer className="gw-footer fixed inset-x-0 bottom-0 z-[99] flex h-[49px] items-center justify-center px-9 text-white md:h-[106px] md:justify-between">
      <a
        href="https://www.ground-werk.com/featured-roster"
        className={`gw-footer__roster hidden md:inline-flex ${footerLinkClass}`}
      >
        ROSTER
      </a>

      <div className="gw-footer__legal flex flex-col items-center justify-center font-[Montserrat,sans-serif] text-[8px] leading-[12px] font-normal text-white md:absolute md:left-1/2 md:-translate-x-1/2 md:text-[10px] md:leading-[14px]">
        <p className="m-0">© 2026 Groundwērk. All rights reserved.</p>
        <nav aria-label="Legal links" className="flex items-center gap-2">
          <a href="https://www.ground-werk.com/privacy-policy" className={legalLinkClass}>
            Privacy Policy
          </a>
          <span aria-hidden="true">|</span>
          <a href="https://www.ground-werk.com/terms-and-conditions" className={legalLinkClass}>
            Terms &amp; Conditions
          </a>
        </nav>
      </div>

      <div className="gw-footer__actions absolute right-10 hidden items-center gap-8 md:flex">
        <a href="mailto:info@ground-werk.com" className={footerLinkClass}>
          CONTACT
        </a>
        <a
          href="https://www.instagram.com/groundwerk"
          target="_blank"
          rel="noopener"
          aria-label="Groundwērk on Instagram"
          className="gw-footer__instagram block h-6 w-6 outline-offset-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#bfa12f]"
        >
          <Image src={`${imageRoot}/instagram-white.svg`} alt="" className="h-full w-full" width={24} height={24} />
        </a>
      </div>
    </footer>
  );
}
