"use client";
import TaskManagement from "./task-management";
import { useState } from "react";

interface Task {
  name: string;
  schedule: {
    date: Date | undefined;
    time: string;
  };
  type: string;
  notification: boolean;
  details: string;
}

export function NewTask() {
  const [task, setTask] = useState<Task>({
    name: "",
    schedule: {
      date: undefined,
      time: "",
    },
    type: "",
    notification: false,
    details: "",
  });
  return (
    <div className="flex flex-col gap-5 px-15 py-5">
      <span className="text-lg">Task Management</span>
      <TaskManagement task={task} onChange={setTask} />
    </div>
  );
}
