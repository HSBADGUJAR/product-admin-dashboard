"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/utils/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();

    if (token) {
      router.replace("/products");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p>Redirecting...</p>
    </main>
  );
}