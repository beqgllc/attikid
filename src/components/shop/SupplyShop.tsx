"use client";

import Image from "next/image";
import Link from "next/link";
import { shopCopy } from "@/content/shop";
import { ShopifyBuyProducts, ShopifyLatestMerch } from "@/components/shop/ShopifyBuyProducts";

export function SupplyShop() {
  return (
    <main className="ak-page ak-page--scroll ak-shop">
      <header className="ak-shop-header">
        <Link className="ak-shop-header__nav" href="/">Home</Link>
        <a className="ak-shop-header__brand" href="/supply-shop" aria-label="K!D Supply Co. home">
          <span className="ak-shop-header__tagline">{shopCopy.tagline}</span>
          <Image
            alt="K!D Supply Co."
            className="ak-shop-header__logo"
            height={428}
            src="/images/merch/kid-supply-logo.webp"
            width={642}
            priority
          />
        </a>
        <a className="ak-shop-header__shop-link" href="#shop-products">
          Shop the drop <span aria-hidden="true">↘</span>
        </a>
      </header>

      <section className="ak-shop-manifesto" id="mission" aria-labelledby="mission-title">
        <p className="ak-shop-eyebrow">Built from what we survived</p>
        <div className="ak-shop-manifesto__body">
          <h1 id="mission-title">Wear what you made it through.</h1>
          <p>
            K!D Supply Co. is for the ones who feel everything and keep going.
            Pieces with a point of view, made to carry a little of your story
            out into the world.
          </p>
        </div>
        <span className="ak-shop-manifesto__mark" aria-hidden="true">K!D<br />SC.</span>
      </section>

      <section className="ak-shop-section ak-shop-section--latest-merch" id="latest-merch" aria-labelledby="latest-merch-title">
        <div className="ak-shop-section__heading">
          <div>
            <h2 id="latest-merch-title">Latest merch</h2>
          </div>
          <span>Latest release</span>
        </div>
        <ShopifyLatestMerch />
      </section>

      <section className="ak-shop-section ak-shop-section--products" id="shop-products" aria-labelledby="products-title">
        <div className="ak-shop-section__heading">
          <div>
            <h2 id="products-title">Shop the drop</h2>
          </div>
          <span>Choose your piece. Make it yours.</span>
        </div>
        <ShopifyBuyProducts />
        <p className="ak-shop-product-note">
          Select your size and available options. Secure checkout and order processing are handled by Shopify.
        </p>
      </section>

      <footer className="ak-shop-footer" id="contact">
        <a href="#mission">Back to top ↑</a>
        <div className="ak-shop-footer__center">
          <strong>K!D <small>Supply Co.</small></strong>
          <span>Built from what we survived.</span>
          <span>© 2026 K!D Supply Co.</span>
        </div>
        <Link href="mailto:attikid.music@outlook.com">Contact ↗</Link>
      </footer>
    </main>
  );
}
