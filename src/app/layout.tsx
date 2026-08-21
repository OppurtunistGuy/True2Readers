import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
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
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
