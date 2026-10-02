export type ShopCollection = {
  name: string;
  image: string;
  theme: string;
};

export type ShopProduct = {
  name: string;
  image: string;
};

export const shopCopy = {
  title: "K!D Supply Co.",
  tagline: "Wear your truth.",
  heroTitle: ["Supply", "Your", "Truth."],
  heroDescription: ["Not just clothing.", "A supply line for the soul."],
  storefrontStatus: "K!D Supply Co. / Storefront under construction",
  collectionsHeading: "The collections",
  collectionsSubheading: "Six chapters. One mission.",
  productsHeading: "New / Essentials",
  productsSubheading: "Coming soon",
  accessoriesHeading: "Low-cost essentials",
  accessoriesSubheading: "Small pieces. Bigger meaning.",
} as const;

export const shopCollections: ShopCollection[] = [
  { name: "Inhuman", image: "INHUMAN.png", theme: "The uniform for the scream." },
  { name: "Essentials", image: "ESSENTIALS.png", theme: "Foundational. Clean. Built to last." },
  { name: "Arrow", image: "ARROW.png", theme: "Directional. Sharp. Forward-moving." },
  { name: "Fatigued", image: "FATIGUED.png", theme: "Soft. Comfortable. Quiet resilience." },
  { name: "Relic", image: "RELIC.png", theme: "Timeless. Vintage. Authentic." },
  { name: "Anarchy Supply", image: "ANARCHY-SUPPLY.png", theme: "Unfiltered. Controlled chaos." },
];

export const featuredProducts: ShopProduct[] = [
  { name: "Essentials Tee", image: "ESSENTIALS-TEE.png" },
  { name: "Slim Straight Jean", image: "SLIM-STRAIGHT-JEAN.png" },
  { name: "Fleece Jogger", image: "FLEECE-JOGGER.png" },
  { name: "Baseball Cap", image: "BASEBALL-CAP.png" },
];

export const shopAccessories: ShopProduct[] = [
  { name: "Enamel Pin", image: "ENAMEL-PIN.png" },
  { name: "Sticker Pack", image: "STICKER-PACK.png" },
  { name: "Woven Patch", image: "WOVEN-PATCH.png" },
  { name: "Phone Grip", image: "PHONE-GRIP.png" },
];
