// app/layout.tsx
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import PwaRegister from "./pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "KroniX Driver",
  description: "App de conductores KroniX",

  manifest: "/manifest.webmanifest",

  icons: {
    icon: "/kronix-icon.png",
    apple: "/kronix-icon.png",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KroniX Driver",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}