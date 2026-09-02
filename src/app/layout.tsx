import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mercadinho São Francisco",
  description: "Gestão de produtos, estoque e validades",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
