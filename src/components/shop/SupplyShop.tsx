"use client";

import Image from "next/image";
import Link from "next/link";
import { shopAccessories, shopCollections, shopCopy } from "@/content/shop";
import { ShopifyBuyProducts } from "@/components/shop/ShopifyBuyProducts";

const merchPath = "/images/merch";

export function SupplyShop() {
  return (
    <main className="ak-page ak-page--scroll ak-shop">
      <header className="ak-shop-header">
        <a className="ak-shop-header__nav" href="#collections">Collections</a>
        <a className="ak-shop-header__brand" href="/supply-shop" aria-label="K!D Supply Co. home">
          <span className="ak-shop-header__tagline">{shopCopy.tagline}</span>
          <Image
            alt=""
            className="ak-shop-header__logo"
            height={428}
            src="/images/merch/kid-supply-logo.webp"
            width={642}
          />
        </a>
        <a className="ak-shop-header__shop-link" href="#shop-products">
          Shop the drop <span aria-hidden="true">↘</span>
        </a>
      </header>

      <section className="ak-shop-hero" id="about" aria-labelledby="shop-title">
        <h1 className="ak-visually-hidden" id="shop-title">K!D Supply Co. — Supply Your Truth</h1>
        <Image
          alt="K!D Supply Co. streetwear campaign featuring the Supply Your Truth collection."
          className="ak-shop-hero__image"
          height={941}
          preload
          sizes="(max-width: 700px) 100vw, 1400px"
          src="/images/merch/storefront-hero.png"
          width={1671}
        />
        <a className="ak-shop-hero__cta" href="#collections" aria-label="Explore K!D Supply Co. collections">
          <span>Explore the collections</span>
          <span aria-hidden="true">↗</span>
        </a>
      </section>

      <section className="ak-shop-manifesto" id="mission" aria-labelledby="mission-title">
        <p className="ak-shop-eyebrow">Built from what we survived</p>
        <div className="ak-shop-manifesto__body">
          <h2 id="mission-title">Wear what you made it through.</h2>
          <p>
            K!D Supply Co. is for the ones who feel everything and keep going.
            Pieces with a point of view, made to carry a little of your story
            out into the world.
          </p>
        </div>
        <span className="ak-shop-manifesto__mark" aria-hidden="true">K!D<br />SC.</span>
      </section>

      <section className="ak-shop-section" id="collections" aria-labelledby="collections-title">
        <div className="ak-shop-section__heading">
          <div>
            <p className="ak-shop-eyebrow">01 / Find your chapter</p>
            <h2 id="collections-title">{shopCopy.collectionsHeading}</h2>
          </div>
          <span>{shopCopy.collectionsSubheading}</span>
        </div>
        <div className="ak-collection-grid">
          {shopCollections.map((collection, index) => (
            <a className="ak-collection-card" href="#shop-products" key={collection.name}>
              <div className="ak-collection-card__image-wrap">
                <Image
                  alt={`${collection.name} collection apparel`}
                  className="ak-collection-card__image"
                  height={800}
                  sizes="(max-width: 700px) 44vw, (max-width: 1050px) 29vw, 15vw"
                  src={`${merchPath}/collections/${collection.image}`}
                  width={600}
                />
                <span className="ak-collection-card__number">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="ak-collection-card__copy">
                <h3>{collection.name}</h3>
                <p>{collection.theme}</p>
                <span>Explore chapter <span aria-hidden="true">↗</span></span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="ak-shop-section ak-shop-section--products" id="shop-products" aria-labelledby="products-title">
        <div className="ak-shop-section__heading">
          <div>
            <p className="ak-shop-eyebrow">02 / The supply line</p>
            <h2 id="products-title">Shop the drop</h2>
          </div>
          <span>Choose your piece. Make it yours.</span>
        </div>
        <ShopifyBuyProducts />
        <p className="ak-shop-product-note">
          Select your size and available options above. Checkout and order processing are handled by Shopify.
        </p>
      </section>

      <section className="ak-shop-section ak-accessories" aria-labelledby="accessories-title">
        <div className="ak-shop-section__heading">
          <div>
            <p className="ak-shop-eyebrow">03 / Small things, same meaning</p>
            <h2 id="accessories-title">{shopCopy.accessoriesHeading}</h2>
          </div>
          <span>{shopCopy.accessoriesSubheading}</span>
        </div>
        <div className="ak-accessory-grid">
          {shopAccessories.map((item, index) => (
            <article className="ak-accessory" key={item.name}>
              <Image
                alt={item.name}
                className="ak-accessory__image"
                height={320}
                sizes="(max-width: 700px) 38vw, 150px"
                src={`${merchPath}/accessories/${item.image}`}
                width={360}
              />
              <span className="ak-accessory__number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.name}</h3>
              <p>In the works</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="ak-shop-footer" id="contact">
        <a href="#about">Back to top ↑</a>
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
