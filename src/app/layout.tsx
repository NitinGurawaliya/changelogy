import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import { authOptions } from "@/lib/auth";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}>
        <AuthSessionProvider session={session}>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
