import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Voice Crypto Assistant",
  description: "AI-powered cryptocurrency analysis with voice interface",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://unpkg.com/regenerator-runtime@0.13.9/runtime.js"></script>
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
