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
  title: "TrueRead — Understand any book, fast",
  description:
    "TrueRead: type what you want to read, get real books from Google Books, and understand any book quickly with a clean preview and a quick-read breakdown.",
  keywords: [
    "TrueRead",
    "book search",
    "Google Books",
    "book preview",
    "reading",
    "book breakdown",
  ],
  authors: [{ name: "TrueRead" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "TrueRead — Understand any book, fast",
    description:
      "Type what you want to read → get books → select one → understand it quickly.",
    siteName: "TrueRead",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrueRead — Understand any book, fast",
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
