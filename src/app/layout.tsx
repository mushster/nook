import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Similar Places - Find Places Like Your Favorites",
  description: "Discover locations around the world that are similar to your favorite places.",
  openGraph: {
    title: "Similar Places - Find Places Like Your Favorites",
    description: "Discover locations around the world that are similar to your favorite places.",
    url: "https://your-deployed-domain.com",
    siteName: "Similar Places",
    images: [
      {
        url: "https://your-deployed-domain.com/og-image.jpg",
        width: 1200,
        height: 630,
      }
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
