import type { Metadata } from "next";
import { Inter, Inter_Tight, Newsreader } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SITE_URL } from "@/lib/site";

// Search-engine ownership tags. Paste the code each tool gives you into the
// matching environment variable; nothing is rendered while they are unset.
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.BING_SITE_VERIFICATION;

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Shelf view fonts. next/font self-hosts them from our own domain (no
// third-party request, no layout shift) and `swap` shows text immediately.
const shelfSans = Inter_Tight({
  variable: "--font-shelf-sans",
  subsets: ["latin"],
  display: "swap",
});
const shelfSerif = Newsreader({
  variable: "--font-shelf-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(bingVerification
      ? { other: { "msvalidate.01": bingVerification } }
      : {}),
  },
  title: "True2Readers — Understand any book, fast",
  description:
    "True2Readers: type what you want to read, get real books from Google Books, and understand any book quickly with a clean preview and a quick-read breakdown.",
  keywords: [
    "True2Readers",
    "book search",
    "Google Books",
    "book preview",
    "reading",
    "book breakdown",
  ],
  authors: [{ name: "True2Readers" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "True2Readers — Understand any book, fast",
    description:
      "Type what you want to read → get books → select one → understand it quickly.",
    siteName: "True2Readers",
    type: "website",
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "True2Readers — Understand any book, fast",
    description:
      "Type what you want to read → get books → select one → understand it quickly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${shelfSans.variable} ${shelfSerif.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
