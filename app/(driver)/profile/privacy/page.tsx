//app\(driver)\profile\privacy\page.tsx
"use client";

import { useEffect, useState } from "react";
import DriverPrivacyCard from "../components/DriverPrivacyCard";

export default function DriverPrivacyPage() {
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setForceOpen(true);
    }, 120);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full bg-slate-50 p-0">
      <div className="mx-0 w-full max-w-md px-0 pb-24 pt-0 space-y-4">
        <DriverPrivacyCard
          autoOpen={forceOpen}
          onAcceptedRedirect="/"
        />
      </div>
    </div>
  );
}