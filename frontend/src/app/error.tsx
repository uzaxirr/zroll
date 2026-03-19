"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg">
      <div className="text-center max-w-md px-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-error text-xl font-bold">!</span>
        </div>
        <h2 className="text-lg font-headline font-bold text-primary">Something went wrong</h2>
        <p className="text-sm text-secondary mt-2">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          className="mt-6 bg-green text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
