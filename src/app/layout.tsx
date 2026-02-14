import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TriageAI — Clinical Decision Support",
  description: "AI-powered Clinical Triage Decision Support Assistant for hospital workflow optimization and intelligent patient prioritization.",
  keywords: ["clinical triage", "decision support", "AI healthcare", "patient prioritization", "medical triage"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
