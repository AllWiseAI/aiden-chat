import { useParams } from "react-router-dom";
import { useTaskStore } from "../store";
import { useState } from "react";
import { Button } from "./shadcn/button";
import { Task as TaskType } from "../typing";
import EditIcon from "../icons/edit.svg";
import TaskManagement, { Notification } from "./task-management";
import dayjs from "dayjs";

interface TaskPanelProps {
  task: TaskType;
  setIsEdit: () => void;
  updateNotification: (id: string) => void;
}

function formatCustomTime(date: string, hour: number, minute: number): string {
  const full = dayjs(`${dayjs(date).format("YYYY-MM-DD")}T${hour}:${minute}`);
  const formatHour = hour % 12 === 0 ? hour : hour % 12;
  const formatMinute = minute < 10 ? `0${minute}` : minute;
  const suffix = hour < 12 ? "am" : "pm";

  return `${full.format("dddd, MMM D")} ${formatHour}:${formatMinute}${suffix}`;
}

function TaskPanel({ task, setIsEdit, updateNotification }: TaskPanelProps) {
  return (
    <div className="flex flex-col gap-2 py-3 px-5 text-sm bg-[#F3F5F7] dark:bg-[#232627] rounded-xl">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-lg">{task.name}</span>
        <Button variant="ghost" className="size-7" onClick={setIsEdit}>
          <EditIcon className="size-6 text-main" />
        </Button>
      </div>

      <div className="flex gap-3 text-[#101213]">
        <span>Time</span>
        <span className="text-[#979797]">
          {formatCustomTime(task.date, task.hour!, task.minute!)}
        </span>
      </div>

      <div className="flex gap-3">
        <span>Recurrence</span>
        <span className="text-[#979797]">{task.type + " task"}</span>
      </div>

      <div className="flex gap-3">
        <span>Notification</span>
        <Notification
          checked={task.notification}
          onChange={() => updateNotification(task.id)}
        />
      </div>

      <div className="flex gap-3">
        <span>Details</span>
        <span className="text-[#979797]">{task.details}</span>
      </div>
    </div>
  );
}

export function Task() {
  const { id } = useParams<{ id: string }>();
  const getTask = useTaskStore((state) => state.getTask);
  const setTask = useTaskStore((state) => state.setTask);

  const updateNotification = useTaskStore((state) => state.setNotification);

  const [isEdit, setIsEdit] = useState(false);
  const taskItem = id ? getTask(id) : null;
  if (!taskItem) return null;

  return (
    <div className="px-15">
      {isEdit ? (
        <TaskManagement
          task={taskItem}
          onChange={(id, updatedTask) => {
            setTask(id, updatedTask);
            setIsEdit(false);
          }}
        />
      ) : (
        <TaskPanel
          task={taskItem}
          setIsEdit={() => setIsEdit(true)}
          updateNotification={updateNotification}
        />
      )}
    </div>
  );
}
