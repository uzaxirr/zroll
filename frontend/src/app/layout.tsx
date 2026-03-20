import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zwage - Privacy-First Crypto Payroll",
  description: "Payroll that stays between you and your team. Built on Zcash.",
  metadataBase: new URL("https://zwage.app"),
  openGraph: {
    title: "Zwage - Privacy-First Crypto Payroll",
    description: "Payroll that stays between you and your team. Built on Zcash.",
    siteName: "Zwage",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zwage - Privacy-First Crypto Payroll",
    description: "Payroll that stays between you and your team. Built on Zcash.",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      >
        <body className="bg-bg text-primary font-body antialiased" suppressHydrationWarning>
          {children}
          <Toaster position="bottom-right" richColors />
        </body>
      </html>
    </AuthProvider>
  );
}
