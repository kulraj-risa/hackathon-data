import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RISA Denial Prevention Engine",
  description:
    "Predict pharmacy PA denials before submission · target 60% → 95% approval",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
