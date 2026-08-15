import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-tournament",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#102033",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className={`${outfit.variable} antialiased`}>{children}</body>
    </html>
  );
}
