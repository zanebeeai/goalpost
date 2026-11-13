import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { getPublicEnv } from "@/lib/env";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const description =
  "Pick something to learn every Sunday. Get interviewed about it on Friday.";

export const metadata: Metadata = {
  metadataBase: new URL(getPublicEnv().siteUrl),
  title: { default: "Goalpost", template: "%s · Goalpost" },
  description,
  applicationName: "Goalpost",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Goalpost", statusBarStyle: "default" },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    siteName: "Goalpost",
    title: "Goalpost",
    description,
  },
  twitter: { card: "summary", title: "Goalpost", description },
};

export const viewport: Viewport = {
  themeColor: "#fbfaf5",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} h-full`}
    >
      <body className="min-h-full">
        <a
          href="#content"
          className="sr-only rounded-xl bg-forest-900 font-semibold text-cream focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-3"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
