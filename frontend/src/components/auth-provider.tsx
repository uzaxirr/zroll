"use client";

import { ClerkProvider } from "@clerk/nextjs";

const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (BYPASS_AUTH) {
    return <>{children}</>;
  }
  return <ClerkProvider>{children}</ClerkProvider>;
}
