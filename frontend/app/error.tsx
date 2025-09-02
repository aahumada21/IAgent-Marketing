"use client";
export default function Error({ error }: { error: Error }) {
  return <pre className="p-6 text-red-700">Error: {error.message}</pre>;
}
