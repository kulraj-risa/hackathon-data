import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-lato",
  display: "swap",
});

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
    <html lang="en" className={`h-full antialiased ${lato.variable}`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
