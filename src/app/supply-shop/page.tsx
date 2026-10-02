import type { Metadata } from "next";
import { SupplyShop } from "@/components/shop/SupplyShop";

export const metadata: Metadata = {
  title: "K!D Supply Co. | Attikid",
  description: "Wear your truth. The K!D Supply Co. storefront is coming soon.",
};

export default function SupplyShopPage() {
  return <SupplyShop />;
}
