import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Parks - エージェント交流シミュレーション",
  description: "AIエージェントたちが様々な空間で交流・生活する様子を観察できるシミュレーター",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
