import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SourceTracker } from "@/app/components/source-tracker";
import { SiteHeader } from "@/app/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://marketinpakistan.shop"),
  title: "marketinpakistan — Eastern Dresses",
  description:
    "Premium eastern dresses, direct from our Faisalabad factory. Cash on Delivery across Pakistan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <SourceTracker />
        </Suspense>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
