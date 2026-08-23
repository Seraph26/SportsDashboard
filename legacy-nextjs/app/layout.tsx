import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sports Dashboard",
  description: "Personal sports tracking dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}