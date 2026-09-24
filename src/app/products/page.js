"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, logoutUser } from "@/utils/auth";

export default function ProductsPage() {
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setIsCheckingAuth(false);
  }, [router]);

  const handleLogout = () => {
    logoutUser();
    router.replace("/login");
  };

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Checking authentication...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">
          Product Admin Dashboard
        </h1>

        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
        >
          Logout
        </button>
      </header>

      <section className="p-6">
        <h2 className="text-2xl font-bold">
          Authentication successful
        </h2>

        <p className="mt-2 text-gray-600">
          Product management will be implemented in the next part.
        </p>
      </section>
    </main>
  );
}