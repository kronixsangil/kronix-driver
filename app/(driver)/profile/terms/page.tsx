//app\(driver)\profile\terms\page.tsx
"use client";

import DriverLegalCard from "../components/DriverLegalCard";

export default function DriverTermsPage() {
  return (
    <div className="w-full bg-slate-50 p-0">
      <div className="mx-auto w-full max-w-md px-0 pb-24 pt-0 space-y-4">
        <DriverLegalCard />
      </div>
    </div>
  );
}