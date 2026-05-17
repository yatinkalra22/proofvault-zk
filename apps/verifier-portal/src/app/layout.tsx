import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProofVault Verifier Portal",
  description:
    "Verify a ProofVault credential. Open a proof URL to see the public fields the student chose to disclose, and nothing else.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
