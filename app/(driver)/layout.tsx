//app/(diver)/layout.tsx
import type { ReactNode } from "react";
import DriverShell from "./components/DriverShell";
import { DriverCityProvider } from "./components/DriverCityContext";

export const metadata = {
  title: {
    default: "KroniX Driver",
    template: "%s | KroniX Driver",
  },
  description: "App de conductores KroniX",
  icons: {
    icon: "/kronix-icon.png",
    shortcut: "/kronix-icon.png",
    apple: "/kronix-icon.png",
  },
};

export default function DriverLayout({ children }: { children: ReactNode }) {
  return (
    <DriverCityProvider>
      <DriverShell>{children}</DriverShell>
    </DriverCityProvider>
  );
}