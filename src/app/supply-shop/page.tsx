import type { Metadata } from "next";
import { SupplyShop } from "@/components/shop/SupplyShop";

export const metadata: Metadata = {
  title: "K!D Supply Co. — Wear Your Truth | Attikid",
  description:
    "Explore K!D Supply Co. streetwear by Attikid, with graphic apparel and designs built around identity, resilience, and self-expression.",
  alternates: { canonical: "/supply-shop" },
};

export default function SupplyShopPage() {
  return <SupplyShop />;
}
