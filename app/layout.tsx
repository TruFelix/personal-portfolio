import { routing } from '@/i18n/routing';
import type { Metadata } from "next";
import { Locale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from 'next-intl/server';
import { Fahkwang, Geist, Geist_Mono, Smooch_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const smoochSans = Smooch_Sans({
  variable: "--font-smooch-sans",
  subsets: ["latin"],
});
const fahkwang = Fahkwang({
  variable: "--font-fahkwang",
  subsets: ["latin"],
  weight: "400"
});
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "trufelix portfolio",
  description: "Portfolio",
  openGraph: {
    title: "truFelix",
    siteName: "truFelix",
    countryName: "Austria",
    type: 'website',
    url: "https://trufelix.at",
    description: "Portfolio",
    images: {
      href: "https://trufelix",
      url: "https://trufelix/opengraph-image.png",
    }
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout(props: LayoutProps<"/">) {
  return <InternationalizationLayout {...props} locale='en'/>
}

export function InternationalizationLayout({children, locale}: LayoutProps<"/"> & {locale: Locale}) {
  // Enable static rendering
  setRequestLocale(locale);

  return <html>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
}