// app/(driver)/orders/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DriverOrdersAliasPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-600">Redirigiendo…</p>
    </div>
  );
}
