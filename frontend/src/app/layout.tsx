import type { Metadata } from "next";
import { Inter, Poppins, Source_Sans_3 } from "next/font/google";
import "../ds/css/fonts.css";
import "../ds/css/dsColors.css";
import "../ds/css/tailwind.css";
import "../ds/css/variables.css";

import "../ds/animations/gradient/gradientBg.css";
import "../ds/animations/gradient/gradientBorder.css";

// import { NextIntlClientProvider } from "next-intl";
// import { getMessages } from "next-intl/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",

  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Agentic Scraper",
  description:
    "Sistema multiagente para coletar, enriquecer, visualizar e consultar dados de bolsistas CNPq em Ciência da Computação.",
};

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={"pt"}>
      <body
        suppressHydrationWarning
        className={`${sourceSans.variable} ${inter.variable} ${poppins.variable} not_show_scrollbar bg-[--ds-global-background] relative overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
