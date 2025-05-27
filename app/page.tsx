"use client";
import { Home } from "./components/home";
import { ConfirmProvider } from "./components/confirm-modal/confirm-context";
import { ConfirmAPIProvider } from "./components/confirm-modal/confirm-api-provider";

// only run in production, not in development, because logger will be run in tarui console in development
if (process.env.NODE_ENV === "production") {
  import("./utils/logger").then((module) => {
    module.default();
  });
}

export default function App() {
  return (
    <ConfirmProvider>
      <ConfirmAPIProvider></ConfirmAPIProvider>
      <Home />
    </ConfirmProvider>
  );
}
