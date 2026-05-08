import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupplyLink — 批量询盘系统",
  description: "供应链厂商高效批量询盘管理平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
