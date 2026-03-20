import Link from "next/link";
import { WalletLogo } from "@/components/WalletLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      <WalletLogo size={48} />
      <h1 className="font-headline font-bold text-4xl tracking-tight mt-6 text-primary">
        Page not found
      </h1>
      <p className="text-secondary text-sm mt-3 max-w-sm text-center">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 bg-green text-white text-sm font-medium px-6 py-2.5 rounded-btn hover:bg-green/90 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
