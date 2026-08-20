import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { NativeOnlyGate } from "@/components/NativeOnlyGate";
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
  themeColor: "#0c1420",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const build = process.env.NEXT_PUBLIC_TOURNAMENT_BUILD;
  return (
    <html lang="de">
      <body className={`${outfit.variable} antialiased`}>
        <NativeOnlyGate>{children}</NativeOnlyGate>
        {build ? <p className="t-build-id">{build}</p> : null}
      </body>
    </html>
  );
}
