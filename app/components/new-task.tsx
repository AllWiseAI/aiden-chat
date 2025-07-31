"use client";
import TaskManagement from "./task-management";

export function NewTask() {
  // const [task, setTask] = useState<Task>({
  //   name: "",
  //   schedule: {
  //     date: undefined,
  //     time: "",
  //   },
  //   type: "",
  //   notification: false,
  //   details: "",
  // });
  return (
    <div className="flex flex-col gap-5 px-15 pb-5">
      <TaskManagement />
    </div>
  );
}
