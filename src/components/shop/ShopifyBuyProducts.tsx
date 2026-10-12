"use client";

import { useEffect, useRef, useState } from "react";

type ShopifyBuyUI = {
  createComponent: (
    type: "product",
    config: {
      id: string;
      node: HTMLElement;
      moneyFormat: string;
      options: Record<string, unknown>;
    },
  ) => unknown;
};

type ShopifyBuyGlobal = {
  buildClient: (config: {
    domain: string;
    storefrontAccessToken: string;
  }) => unknown;
  UI?: {
    onReady: (client: unknown) => Promise<ShopifyBuyUI>;
  };
};

declare global {
  interface Window {
    ShopifyBuy?: ShopifyBuyGlobal;
  }
}

const STORE_DOMAIN = "efg117-cy.myshopify.com";
const STOREFRONT_ACCESS_TOKEN = "ce9a4537b9f2e5c2e3399bed3f0ec455";
const SCRIPT_URL =
  "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js";
const MONEY_FORMAT = "%24%7B%7Bamount%7D%7D";

const products = [
  { id: "9413812093083", componentId: "product-component-1791801970853" },
  { id: "9412689494171", componentId: "product-component-1791802096187" },
  { id: "9413760221339", componentId: "product-component-1791802128373" },
  { id: "9413788172443", componentId: "product-component-1791802175555" },
  { id: "9412652040347", componentId: "product-component-1791802202791" },
  { id: "9413723881627", componentId: "product-component-1791802227131" },
  { id: "9413879595163", componentId: "product-component-1791802248819" },
] as const;

const latestMerchProduct = {
  id: "9413879595163",
  componentId: "product-component-1791800992199",
} as const;

const initializedNodes = new WeakSet<HTMLElement>();
let sdkPromise: Promise<void> | null = null;
let uiPromise: Promise<ShopifyBuyUI> | null = null;

function loadShopifySDK(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Shopify can only load in a browser."));
  }

  if (window.ShopifyBuy?.UI) {
    return Promise.resolve();
  }

  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-shopify-buy-sdk="true"]',
    );
    const script = existingScript ?? document.createElement("script");

    const handleLoad = () => {
      if (window.ShopifyBuy?.UI) {
        resolve();
      } else {
        sdkPromise = null;
        reject(new Error("Shopify loaded without its Buy Button interface."));
      }
    };

    const handleError = () => {
      sdkPromise = null;
      reject(new Error("The Shopify Buy Button script could not be loaded."));
    };

    if (!existingScript) {
      script.src = SCRIPT_URL;
      script.async = true;
      script.dataset.shopifyBuySdk = "true";
      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });
      document.head.appendChild(script);
      return;
    }

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
  });

  return sdkPromise;
}

async function getShopifyUI(): Promise<ShopifyBuyUI> {
  if (!uiPromise) {
    uiPromise = loadShopifySDK().then(async () => {
      const shopify = window.ShopifyBuy;
      if (!shopify?.UI) {
        throw new Error("Shopify Buy Button is unavailable.");
      }

      const client = shopify.buildClient({
        domain: STORE_DOMAIN,
        storefrontAccessToken: STOREFRONT_ACCESS_TOKEN,
      });

      return shopify.UI.onReady(client);
    });
  }

  return uiPromise;
}

const productOptions = {
  product: {
    styles: {
      product: {
        "@media (min-width: 601px)": {
          "max-width": "100%",
          "margin-left": "0",
          "margin-bottom": "0",
        },
      },
      button: {
        "border-radius": "40px",
        "padding-left": "18px",
        "padding-right": "18px",
      },
    },
    text: { button: "Add to cart" },
  },
  productSet: {
    styles: { products: { "@media (min-width: 601px)": { "margin-left": "0" } } },
  },
  modalProduct: {
    contents: {
      img: false,
      imgWithCarousel: true,
      button: false,
      buttonWithQuantity: true,
    },
    styles: {
      product: {
        "@media (min-width: 601px)": {
          "max-width": "100%",
          "margin-left": "0px",
          "margin-bottom": "0px",
        },
      },
      button: {
        "border-radius": "40px",
        "padding-left": "18px",
        "padding-right": "18px",
      },
    },
    text: { button: "Add to cart" },
  },
  option: {},
  cart: {
    styles: { button: { "border-radius": "40px" } },
    text: { total: "Subtotal", button: "Checkout" },
  },
  toggle: {},
};

const latestMerchOptions = {
  ...productOptions,
  product: {
    ...productOptions.product,
    styles: {
      ...productOptions.product.styles,
      product: {
        ...productOptions.product.styles.product,
        "@media (min-width: 601px)": {
          "max-width": "100%",
          "margin-left": "0",
          "margin-bottom": "0",
        },
        "text-align": "left",
        "background-color": "#0a0a0a",
        "border": "1px solid #444444",
        "padding": "24px",
      },
      title: {
        "font-family": "Montserrat, Arial, sans-serif",
        "font-weight": "600",
        "font-size": "26px",
        color: "#f5f5f5",
      },
      button: {
        ...productOptions.product.styles.button,
        "border-radius": "40px",
        "padding-left": "18px",
        "padding-right": "18px",
      },
      price: {
        "font-family": "Montserrat, Arial, sans-serif",
        "font-weight": "500",
        "font-size": "18px",
        color: "#f5f5f5",
      },
    },
    buttonDestination: "checkout",
    contents: {
      img: false,
      imgWithCarousel: true,
      description: true,
    },
    width: "100%",
    text: { button: "Buy now" },
  },
};

export function ShopifyBuyProducts() {
  const [loadError, setLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("any");
  const productsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    getShopifyUI()
      .then((ui) => {
        if (!active) return;

        products.forEach((product) => {
          const node = document.getElementById(product.componentId);
          if (!node || initializedNodes.has(node)) return;

          initializedNodes.add(node);
          ui.createComponent("product", {
            id: product.id,
            node,
            moneyFormat: MONEY_FORMAT,
            options: productOptions,
          });
        });
      })
      .catch(() => {
        if (active) setLoadError(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const root = productsRef.current;
    if (!root) return;

    const applyFilters = () => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      root.querySelectorAll<HTMLElement>(".ak-shopify-product").forEach((card) => {
        const embed = card.querySelector<HTMLElement>(".ak-shopify-product__embed");
        const text = (embed?.innerText ?? "").toLowerCase();
        const searchMatches = !normalizedSearch || text.includes(normalizedSearch);
        const soldOut = /sold out|out of stock|unavailable/.test(text);
        const availabilityMatches =
          availabilityFilter === "all" ||
          (availabilityFilter === "available" && !soldOut) ||
          (availabilityFilter === "sold-out" && soldOut);

        const prices = [...(embed?.innerText ?? "").matchAll(/\$\s?([\d,]+(?:\.\d{2})?)/g)]
          .map((match) => Number(match[1].replace(/,/g, "")))
          .filter(Number.isFinite);
        const price = prices.length ? Math.min(...prices) : null;
        const priceMatches =
          priceFilter === "any" ||
          (price !== null && priceFilter === "under-25" && price < 25) ||
          (price !== null && priceFilter === "25-50" && price >= 25 && price <= 50) ||
          (price !== null && priceFilter === "over-50" && price > 50);

        card.hidden = !(searchMatches && availabilityMatches && priceMatches);
      });
    };

    applyFilters();
    const observer = new MutationObserver(applyFilters);
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [searchTerm, availabilityFilter, priceFilter]);

  return (
    <>
      <div className="ak-shop-product-tools" aria-label="Search and filter products">
        <label className="ak-shop-product-search">
          <span>Search products</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by product name…"
            aria-label="Search products by name"
          />
        </label>
        <label className="ak-shop-product-filter">
          <span>Availability</span>
          <select
            value={availabilityFilter}
            onChange={(event) => setAvailabilityFilter(event.target.value)}
            aria-label="Filter by availability"
          >
            <option value="all">All products</option>
            <option value="available">Available</option>
            <option value="sold-out">Sold out</option>
          </select>
        </label>
        <label className="ak-shop-product-filter">
          <span>Price</span>
          <select
            value={priceFilter}
            onChange={(event) => setPriceFilter(event.target.value)}
            aria-label="Filter by price"
          >
            <option value="any">Any price</option>
            <option value="under-25">Under $25</option>
            <option value="25-50">$25–$50</option>
            <option value="over-50">Over $50</option>
          </select>
        </label>
      </div>

      <div
        className="ak-shopify-products"
        aria-label="K!D Supply Co. products"
        ref={productsRef}
      >
        {products.map((product, index) => (
          <article className="ak-shopify-product" key={product.id}>
            <span className="ak-shopify-product__index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div
              className="ak-shopify-product__embed"
              id={product.componentId}
              aria-label={`Product option ${index + 1}`}
            >
              <span className="ak-shopify-loading">Loading product options…</span>
            </div>
          </article>
        ))}
      </div>
      {loadError ? (
        <p className="ak-shopify-error" role="alert">
          The product options couldn’t load. Refresh the page to try again, or{" "}
          <a href="https://efg117-cy.myshopify.com">visit the K!D Supply Co. store</a>.
        </p>
      ) : null}
    </>
  );
}

export function ShopifyLatestMerch() {
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    getShopifyUI()
      .then((ui) => {
        if (!active) return;

        const node = document.getElementById(latestMerchProduct.componentId);
        if (!node || initializedNodes.has(node)) return;

        initializedNodes.add(node);
        ui.createComponent("product", {
          id: latestMerchProduct.id,
          node,
          moneyFormat: MONEY_FORMAT,
          options: latestMerchOptions,
        });
      })
      .catch(() => {
        if (active) setLoadError(true);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="ak-shopify-latest">
      <div
        className="ak-shopify-latest__embed"
        id={latestMerchProduct.componentId}
        aria-label="Latest merch featured product"
      >
        <span className="ak-shopify-loading">Loading latest merch…</span>
      </div>
      {loadError ? (
        <p className="ak-shopify-error" role="alert">
          The featured product couldn’t load. Refresh the page to try again, or{" "}
          <a href="https://efg117-cy.myshopify.com">visit the K!D Supply Co. store</a>.
        </p>
      ) : null}
    </div>
  );
}

