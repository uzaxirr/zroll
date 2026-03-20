"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ textAlign: "center", maxWidth: 400, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Something went wrong</h2>
            <p style={{ fontSize: 14, color: "#6B7280", marginTop: 8 }}>
              {error.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: 24,
                backgroundColor: "#059669",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
