import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        />
        {/* ✅ Kakao Map SDK 로드 */}
        <Script
          id="kakao-map-sdk"
          strategy="beforeInteractive"
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`}
        />
      </head>
      <body className="min-h-screen bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}