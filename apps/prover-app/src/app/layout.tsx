import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProofVault — Prove your funds without revealing them",
  description:
    "Zero-knowledge proof-of-funds credentials on Midnight Network. Prove balance thresholds for visas, housing, and university enrollment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
