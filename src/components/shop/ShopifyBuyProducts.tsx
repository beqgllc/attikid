"use client";

import { useEffect, useState } from "react";

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
  { id: "9412689494171", componentId: "product-component-1791792548356" },
  { id: "9412652040347", componentId: "product-component-1791792608979" },
  { id: "9413723881627", componentId: "product-component-1791792647594" },
] as const;

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
        "text-align": "left",
        "background-color": "#0a0a0a",
        "border": "1px solid #444444",
        "padding": "24px",
      },
      title: {
        "font-family": "Montserrat, Arial, sans-serif",
        "font-size": "24px",
        "font-weight": "600",
        "color": "#f5f5f5",
        "letter-spacing": "0.08em",
        "text-transform": "uppercase",
      },
      button: {
        "border-radius": "0px",
        "padding-left": "18px",
        "padding-right": "18px",
        "background-color": "#ff4e00",
        "color": "#ffffff",
        "font-family": "Montserrat, Arial, sans-serif",
        "font-size": "12px",
        "font-weight": "600",
        "letter-spacing": "0.14em",
        "text-transform": "uppercase",
        ":hover": { "background-color": "#e74600" },
        ":focus": { "background-color": "#e74600" },
      },
      price: {
        "font-family": "Montserrat, Arial, sans-serif",
        "font-size": "17px",
        "font-weight": "500",
        "color": "#f5f5f5",
      },
      compareAt: {
        "font-family": "Montserrat, Arial, sans-serif",
        "font-size": "14px",
        "color": "#a3a3a3",
      },
      unitPrice: {
        "font-family": "Montserrat, Arial, sans-serif",
        "font-size": "14px",
        "color": "#a3a3a3",
      },
      quantityInput: {
        "font-family": "Montserrat, Arial, sans-serif",
        "font-size": "14px",
        "border-radius": "0px",
        "border-color": "#666666",
        "background-color": "#111111",
        "color": "#f5f5f5",
      },
    },
    layout: "horizontal",
    contents: {
      img: false,
      imgWithCarousel: true,
      button: false,
      buttonWithQuantity: true,
      description: true,
    },
    width: "100%",
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
          "margin-left": "0",
          "margin-bottom": "0",
        },
      },
      title: {
        "font-family": "Montserrat, Arial, sans-serif",
        "font-weight": "600",
        "font-size": "26px",
        "color": "#f5f5f5",
      },
      price: {
        "font-family": "Montserrat, Arial, sans-serif",
        "font-weight": "500",
        "font-size": "18px",
        "color": "#f5f5f5",
      },
      compareAt: {
        "font-family": "Montserrat, Arial, sans-serif",
        "font-weight": "400",
        "font-size": "15px",
        "color": "#a3a3a3",
      },
      unitPrice: {
        "font-family": "Montserrat, Arial, sans-serif",
        "font-weight": "400",
        "font-size": "15px",
        "color": "#a3a3a3",
      },
      button: {
        "border-radius": "0px",
        "background-color": "#ff4e00",
        "color": "#ffffff",
      },
    },
    text: { button: "Add to cart" },
  },
  option: {
    styles: {
      label: {
        "font-family": "Montserrat, Arial, sans-serif",
        "font-size": "11px",
        "font-weight": "600",
        "letter-spacing": "0.12em",
        "text-transform": "uppercase",
        "color": "#f5f5f5",
      },
      select: {
        "font-family": "Montserrat, Arial, sans-serif",
        "font-size": "13px",
        "border-radius": "0px",
        "border-color": "#666666",
        "background-color": "#111111",
        "color": "#f5f5f5",
      },
    },
  },
  cart: {
    styles: {
      button: {
        "border-radius": "0px",
        "background-color": "#ff4e00",
        "color": "#ffffff",
      },
    },
    text: { total: "Subtotal", button: "Checkout" },
  },
  toggle: {
    styles: {
      toggle: {
        "border-radius": "0px",
        "background-color": "#ff4e00",
        ":hover": { "background-color": "#e74600" },
      },
    },
  },
};

export function ShopifyBuyProducts() {
  const [loadError, setLoadError] = useState(false);

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

  return (
    <div className="ak-shopify-products" aria-label="K!D Supply Co. products">
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
      {loadError ? (
        <p className="ak-shopify-error" role="alert">
          The product options couldn’t load. Refresh the page to try again, or{" "}
          <a href="https://efg117-cy.myshopify.com">visit the K!D Supply Co. store</a>.
        </p>
      ) : null}
    </div>
  );
}
