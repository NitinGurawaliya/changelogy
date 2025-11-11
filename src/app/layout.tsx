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
  title: "Changelogy",
  description:
    "Beautiful changelog pages in seconds. Paste your updates and share a polished public changelog instantly.",
  metadataBase: new URL("https://changelogy.app"),
  openGraph: {
    title: "Changelogy",
    description:
      "Beautiful changelog pages in seconds. Paste your updates and share a polished public changelog instantly.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelogy",
    description:
      "Beautiful changelog pages in seconds. Paste your updates and share a polished public changelog instantly.",
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
          className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}
        >
        {children}
      </body>
    </html>
  );
}
