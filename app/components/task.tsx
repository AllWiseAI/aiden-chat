import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTaskStore } from "../store";
import { useState, useMemo } from "react";
import { Button } from "./shadcn/button";
import { Task as TaskType, TaskAction } from "../typing";
import EditIcon from "../icons/edit.svg";
import TaskManagement, { Notification } from "./task-management";
import dayjs from "dayjs";
import clsx from "clsx";
import SuccessIcon from "../icons/success.svg";
import PendingIcon from "../icons/time.svg";
import FailedIcon from "../icons/close.svg";

interface TaskPanelProps {
  task: TaskType;
  setIsEdit: () => void;
  updateNotification: (id: string) => void;
}

interface TaskItemProps {
  status: TaskAction;
}

function formatCustomTime(date: string, hour: number, minute: number): string {
  const full = dayjs(`${dayjs(date).format("YYYY-MM-DD")}T${hour}:${minute}`);
  const formatHour = hour % 12 === 0 ? hour : hour % 12;
  const formatMinute = minute < 10 ? `0${minute}` : minute;
  const suffix = hour < 12 ? "am" : "pm";

  return `${full.format("dddd, MMM D")} ${formatHour}:${formatMinute}${suffix}`;
}

function TaskItem({ status }: TaskItemProps) {
  const { t } = useTranslation();
  const StatusIcon = useMemo(() => {
    if (status === TaskAction.Pending) return PendingIcon;
    else if (status === TaskAction.Success) return SuccessIcon;
    else if (status === TaskAction.Failed) return FailedIcon;
    else return null;
  }, [status]);

  return (
    <div>
      <div className="flex justify-between items-center px-5 py-3 bg-[#F3F5F7] dark:bg-[#232627] rounded-xl">
        <div className="flex items-center gap-2">
          <p>Schedule for May 28, 10:00 am</p>
          <StatusIcon
            className={clsx("size-[18px]", {
              "text-main": status === TaskAction.Success,
              "text-[#F5BF4F]": status === TaskAction.Pending,
              "text-[#EF466F]": status === TaskAction.Failed,
            })}
          />
        </div>
        <div className="text-main select-none cursor-pointer hover:opacity-75">
          {t("task.details")}
        </div>
      </div>
    </div>
  );
}

function TaskPanel({ task, setIsEdit, updateNotification }: TaskPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2 py-3 px-5 text-sm bg-[#F3F5F7] dark:bg-[#232627] text-[#101213] dark:text-white rounded-xl">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-lg">{task.name}</span>
        <Button variant="ghost" className="size-7" onClick={setIsEdit}>
          <EditIcon className="size-6 text-main" />
        </Button>
      </div>

      <div className="flex gap-3">
        <span>{t("task.time")}</span>
        <span className="text-[#979797]">
          {formatCustomTime(task.date, task.hour!, task.minute!)}
        </span>
      </div>

      <div className="flex gap-3">
        <span>{t("task.recurrence")}</span>
        <span className="text-[#979797]">{task.type + " task"}</span>
      </div>

      <div className="flex gap-3">
        <span>{t("task.notification")}</span>
        <div className="flex gap-1 text-main">
          <Notification
            checked={task.notification}
            onChange={() => updateNotification(task.id)}
          >
            <span className="select-none">
              {task.notification ? t("task.on") : t("task.off")}
            </span>
          </Notification>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <span className="whitespace-nowrap">{t("task.details")}</span>
        <div className="text-[#979797] max-h-30 overflow-y-auto flex-1 break-words">
          {task.details}
        </div>
      </div>
    </div>
  );
}

export function Task() {
  const { id } = useParams<{ id: string }>();
  const tasks = useTaskStore((state) => state.tasks);
  const setTask = useTaskStore((state) => state.setTask);
  const updateNotification = useTaskStore((state) => state.setNotification);

  const [isEdit, setIsEdit] = useState(false);
  const taskItem = tasks.find((task) => task.id === id);

  if (!taskItem) return null;

  return (
    <div className="flex flex-col min-h-0 gap-5 px-15 pb-10">
      {isEdit ? (
        <TaskManagement
          task={taskItem}
          onCancel={() => setIsEdit(false)}
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
      <div className="flex flex-col flex-1 overflow-y-auto gap-5">
        <TaskItem status={TaskAction.Success} />
        <TaskItem status={TaskAction.Failed} />
        <TaskItem status={TaskAction.Pending} />
      </div>
    </div>
  );
}
