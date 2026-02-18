import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import { AppBar } from "@/components/layout/app-bar";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DBS Store - Boutique Electronique",
  description:
    "Boutique en ligne d'electronique en Côte d'Ivoire. Smartphones, tablettes, ordinateurs, montres connectées, audio et accessoires.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={nunitoSans.variable}>
      <body className="font-sans antialiased">
        <AppBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
