/* eslint-disable @next/next/no-page-custom-font */
import "./styles/globals.scss";
import "./styles/markdown.scss";
import "./styles/highlight.scss";
import "./global.css";
import "../i18n";
import { getClientConfig } from "./config/client";
import type { Metadata, Viewport } from "next";
import { Toaster } from "@/app/components/shadcn/sonner";

export const metadata: Metadata = {
  title: "AidenChat",
  description: "Your personal ChatGPT Chat Bot.",
  appleWebApp: {
    title: "AidenChat",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#151515" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-US">
      <head>
        <meta name="config" content={JSON.stringify(getClientConfig())} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <link
          rel="manifest"
          href="/site.webmanifest"
          crossOrigin="use-credentials"
        ></link>
      </head>
      <body>
        <div
          className="absolute h-8 top-0 left-0 right-0 z-1000"
          data-tauri-drag-region
        ></div>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
