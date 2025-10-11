"use client";
import TaskManagement from "./task-management";
import { WindowHeader } from "./window-header";

export function NewTask() {
  return (
    <>
      <WindowHeader />
      <div className="flex flex-col gap-5 px-15 pb-5">
        <TaskManagement />
      </div>
    </>
  );
}
