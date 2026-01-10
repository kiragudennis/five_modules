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
      <body className="flex h-screen items-center justify-center bg-gray-50 w-full">
        <div className="text-center p-6 rounded-lg shadow-md bg-white max-w-sm">
          <h2 className="text-2xl font-bold mb-2">🚨 Something broke</h2>
          <p className="mb-4 text-gray-600">
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-black text-white rounded-lg hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
