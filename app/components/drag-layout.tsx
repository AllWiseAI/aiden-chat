"use client";

import { Outlet } from "react-router-dom";

export function DragLayout() {
  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 w-full h-10"
        data-tauri-drag-region
      ></div>
      <Outlet />
    </>
  );
}
