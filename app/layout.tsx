import type { Metadata } from "next";
import { EB_Garamond, Geist, Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import { LandingNav } from "@/components/landing/LandingNav";
import { Providers } from "@/app/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
});

export const metadata: Metadata = {
  title: "Repertoire",
  description: "Your sheet music library, with taste — organize, tag, and discover pieces to learn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${inter.variable} ${garamond.variable} min-h-screen bg-sheet-canvas font-inter text-sheet-ink antialiased`}
      >
        <Providers>
          <LandingNav />
          <div className="min-h-screen pt-20">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
