import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zwage - Privacy-First Crypto Payroll",
  description: "Payroll that stays between you and your team. Built on Zcash.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="bg-bg text-primary font-body antialiased" suppressHydrationWarning>
          {children}
        </body>
      </html>
    </AuthProvider>
  );
}
