"use client";
import TaskManagement from "./task-management";

export function NewTask() {
  return (
    <div className="flex flex-col gap-5 px-15 py-5 border-t border-[#E8ECEF] dark:border-[#232627]/50">
      <TaskManagement />
    </div>
  );
}
