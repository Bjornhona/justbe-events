import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// TODO — LAUNCH DAY: revisit this together with `src/app/robots.ts`. The two
// are a matched pair. robots.txt asks crawlers not to look; this meta tag tells
// the ones that looked anyway not to index. Preview deploys need both, the live
// site needs neither. After the first production deploy, view source on
// https://b-vents.com and confirm there is no `noindex` robots meta tag.
const isProduction = process.env.VERCEL_ENV === "production";

export const metadata: Metadata = {
  title: "B Vents",
  description: "Eventos y Experiencias",
  // Anything that is not demonstrably production — preview deploys, and local
  // dev, where VERCEL_ENV is undefined — is kept out of the index.
  ...(isProduction ? {} : { robots: { index: false, follow: false } }),
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Opts the segment into static rendering; without it next-intl reads the
  // locale from headers() and every page under [locale] becomes dynamic.
  // next-intl marks this deprecated in favour of next/root-params, but that
  // needs [locale] to sit *above* the root layout — and app/layout.tsx now
  // sits above it so /studio can have its own document shell.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      // Opts into Next's handling of the `scroll-behavior: smooth` in
      // globals.css: anchor clicks glide, but route changes still jump to the
      // top instantly instead of scrolling the whole page.
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <Header />
          {/* The header is `position: fixed`, so it does not reserve space.
              A page whose first section is not a full-bleed hero needs to
              clear it itself with `pt-18`. */}
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
