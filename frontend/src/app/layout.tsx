import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import BfcacheGuard from "@/components/BfcacheGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VibeLRS",
  description: "대학생을 위한 RAG 기반 AI 학습 보조 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <BfcacheGuard />
        {children}
      </body>
    </html>
  );
}
