import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { getStoreCategories } from "@/lib/db/queries/categories";
import { safe } from "@/lib/db/safe";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  // 500 incluido: `font-medium` se usa en toda la app y sin este peso el
  // navegador caía a 400, así que el "medium" no se veía en ningún lado.
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Moreno Herramientas",
  description: "Todo para tu taller en un solo lugar",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const categories = await safe(() => getStoreCategories(), []);

  return (
    <html lang="es" className={poppins.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-on-surface antialiased font-sans">
        <Providers categories={categories}>{children}</Providers>
      </body>
    </html>
  );
}
