import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Hitachi Sans is the product face; served from /public so no network fetch.
const hitachiSans = localFont({
  variable: "--font-hitachi",
  display: "swap",
  src: [
    { path: "../../public/hitachi-sans/HitachiSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/hitachi-sans/HitachiSans-Italic.woff2", weight: "400", style: "italic" },
    { path: "../../public/hitachi-sans/HitachiSans-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../public/hitachi-sans/HitachiSans-SemiBoldItalic.woff2", weight: "600", style: "italic" },
    { path: "../../public/hitachi-sans/HitachiSans-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../public/hitachi-sans/HitachiSans-BoldItalic.woff2", weight: "700", style: "italic" },
  ],
});

export const metadata: Metadata = {
  title: "HMAX Unified",
  description: "HMAX Unified",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${hitachiSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Extensions (password managers, Grammarly and the like) add their own
          attributes to <body> before React hydrates, which reads as a mismatch.
          Suppressing covers this element's own attributes only - a real
          mismatch anywhere inside the tree still surfaces. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
