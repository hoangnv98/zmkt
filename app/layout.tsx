import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin", "vietnamese"], variable: "--font-archivo", display: "swap" });

export const metadata: Metadata = { title: "Z.MKT", description: "Z.MKT nhận phần marketing thay thương hiệu." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
