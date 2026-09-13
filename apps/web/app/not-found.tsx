import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-lg">Page not found.</p>
      <p className="mt-2 text-gray-500">
        The page you are looking for does not exist.
      </p>

      <Link
        href="/"
        className="mt-8 rounded-lg bg-black px-6 py-3 text-white"
      >
        Back to Home
      </Link>
    </main>
  );
}
