import type { Metadata } from "next";
import { SupplyShop } from "@/components/shop/SupplyShop";

export const metadata: Metadata = {
  title: "K!D Supply Co. — Wear Your Truth | Attikid",
  description:
    "Shop K!D Supply Co. streetwear: pieces built from what we survived, for those who feel everything and keep going.",
};

export default function SupplyShopPage() {
  return <SupplyShop />;
}
