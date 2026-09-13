'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold">Something went wrong</h1>

      <p className="mt-4 text-gray-500">
        {error.message}
      </p>

      <button
        onClick={reset}
        className="mt-8 rounded-lg bg-black px-6 py-3 text-white"
      >
        Try Again
      </button>
    </main>
  );
}
