import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attikid",
  description: "Same kid, different demons. You are not alone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
