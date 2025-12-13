import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SLCM Community Impact Dashboard",
  description: "Track South Louisville's top community needs and see how your support makes a difference.",
  keywords: ["SLCM", "South Louisville", "community", "donation", "volunteer", "nonprofit"],
  openGraph: {
    title: "SLCM Community Impact Dashboard",
    description: "See how you can make a difference in South Louisville today",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
