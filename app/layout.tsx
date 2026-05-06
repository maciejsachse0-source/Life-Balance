import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Życie w równowadze",
  description: "Świadome zarządzanie czasem i celami życiowymi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
