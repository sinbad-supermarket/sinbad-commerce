import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sinbad Commerce Lab",
  description: "A phased commerce architecture learning project.",
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
