import Image from "next/image";
import Link from "next/link";
import { featuredProducts, shopAccessories, shopCollections, shopCopy } from "@/content/shop";

const merchPath = "/images/merch";

export function SupplyShop() {
  return (
    <main className="ak-page ak-page--scroll ak-shop">
      <header className="ak-shop-header">
        <a href="#collections">Collections</a>
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
        <span className="ak-shop-header__cart" aria-label="Cart, under construction">Cart (0)</span>
      </header>

      <section className="ak-shop-hero" id="about" aria-labelledby="shop-title">
        <h1 className="ak-visually-hidden" id="shop-title">Supply Your Truth</h1>
        <Image
          alt="K!D Supply Co. streetwear campaign featuring the Supply Your Truth collection."
          className="ak-shop-hero__image"
          height={941}
          preload
          src="/images/merch/storefront-hero.png"
          width={1671}
        />
        <a className="ak-shop-hero__cta" href="#collections" aria-label="Shop the collections" />
      </section>

      <section className="ak-shop-section" id="collections" aria-labelledby="collections-title">
        <div className="ak-shop-section__heading">
          <h2 id="collections-title">{shopCopy.collectionsHeading}</h2>
          <span>{shopCopy.collectionsSubheading}</span>
        </div>
        <div className="ak-collection-grid">
          {shopCollections.map((collection) => (
            <a className="ak-collection-card" href="#new-essentials" key={collection.name}>
              <div className="ak-collection-card__image-wrap">
                <Image
                  alt={`${collection.name} collection apparel`}
                  className="ak-collection-card__image"
                  height={800}
                  src={`${merchPath}/collections/${collection.image}`}
                  width={600}
                />
              </div>
              <div className="ak-collection-card__copy">
                <h3>{collection.name}</h3>
                <p>{collection.theme}</p>
                <span>Shop collection <span aria-hidden="true">→</span></span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="ak-shop-section" id="new-essentials" aria-labelledby="new-title">
        <div className="ak-shop-section__heading">
          <h2 id="new-title">{shopCopy.productsHeading}</h2>
          <span>{shopCopy.productsSubheading}</span>
        </div>
        <div className="ak-product-grid">
          {featuredProducts.map((product) => (
            <article className="ak-product-card" key={product.name}>
              <div className="ak-product-card__image-wrap">
                <Image
                  alt={product.name}
                  className="ak-product-card__image"
                  height={500}
                  src={`${merchPath}/new-essentials/${product.image}`}
                  width={600}
                />
              </div>
              <div className="ak-product-card__details">
                <h3>{product.name}</h3>
                <p>Price announced at launch</p>
                <button disabled type="button">Add to cart · Coming soon</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ak-shop-section ak-accessories" aria-labelledby="accessories-title">
        <div className="ak-shop-section__heading">
          <h2 id="accessories-title">{shopCopy.accessoriesHeading}</h2>
          <span>{shopCopy.accessoriesSubheading}</span>
        </div>
        <div className="ak-accessory-grid">
          {shopAccessories.map((item) => (
            <article className="ak-accessory" key={item.name}>
              <Image
                alt={item.name}
                className="ak-accessory__image"
                height={320}
                src={`${merchPath}/accessories/${item.image}`}
                width={360}
              />
              <h3>{item.name}</h3>
              <p>Coming soon</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="ak-shop-footer" id="contact">
        <a href="#about">About</a>
        <div className="ak-shop-footer__center">
          <strong>K!D <small>Supply Co.</small></strong>
          <span>Wear your truth.</span>
          <span>Privacy / Terms</span>
          <span>© 2026 K!D Supply Co.</span>
        </div>
        <Link href="mailto:attikid.music@outlook.com">Contact</Link>
      </footer>
    </main>
  );
}
