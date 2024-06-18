"use client";

import "./globals.css";
import { AuthProvider } from '@/app/context/AuthContext'; // Import AuthProvider

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
