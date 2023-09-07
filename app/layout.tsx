import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Metabase Manager",
  description: "Manage your Metabase instance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
