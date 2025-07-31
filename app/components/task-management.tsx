import { useState, useRef, useEffect, ReactNode, useMemo } from "react";
import { Input } from "./shadcn/input";
import { Button } from "./shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "./shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./shadcn/select";
import { Calendar } from "./shadcn/calendar";
import TimeSelect from "./time-select";
import { useNavigate } from "react-router-dom";
import { TaskTypeEnum, Task, TaskPayload } from "../typing";
import { createDefaultTask, useTaskStore } from "../store";
import dayjs from "dayjs";
import clsx from "clsx";
import NotificationOnIcon from "../icons/notification-on.svg";
import NotificationOffIcon from "../icons/notification-off.svg";
import { Path } from "../constant";
import { createTask, testTask, updateTask } from "../services/task";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface NotificationProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  children?: ReactNode;
}

interface TaskManagementProps {
  task?: Task;
  onCancel?: () => void;
  onChange?: (id: string, updatedTask: Task) => void;
}

const TaskTypeLabels: Record<TaskTypeEnum, string> = {
  [TaskTypeEnum.Once]: "单次任务",
  [TaskTypeEnum.Daily]: "每日任务",
  [TaskTypeEnum.Weekly]: "每周任务",
  [TaskTypeEnum.Monthly]: "每月任务",
};

function getCurrentDateObj(startDate: string) {
  const date = new Date(startDate);

  const dayIndex = date.getDay();

  const daysMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  const dayString = daysMap[dayIndex];
  const dayOfMonth = date.getDate();

  return { dayString, dayOfMonth };
}

export function Notification({
  checked,
  onChange,
  children,
}: NotificationProps) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="flex gap-1 cursor-pointer hover:opacity-75"
    >
      <div className="flex items-center justify-center size-5 text-main">
        {checked ? (
          <NotificationOnIcon className="size-5" />
        ) : (
          <NotificationOffIcon className="size-5" />
        )}
      </div>
      {children}
    </div>
  );
}

export default function TaskManagement({
  task,
  onChange,
}: TaskManagementProps) {
  const { t } = useTranslation("general");
  const [newTask, setNewTask] = useState<Task>({
    ...createDefaultTask(),
    ...task,
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(
    task?.notification ?? false,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  // const { t } = useTranslation();
  const taskStore = useTaskStore();

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  };

  const verifyTask = (task: Task): boolean => {
    if (!task.date || task.hour === null || task.minute === null) return false;
    if (!task.type) return false;
    if (!task.details) return false;
    return true;
  };

  const confirmBtn = useMemo(() => verifyTask(newTask), [newTask]);

  useEffect(() => {
    handleInput();
  }, []);

  const handleTestClick = async () => {
    const { name, date, hour, minute, type, notification, details } = newTask;

    const payload: TaskPayload = {
      description: details,
      repeat_every: 1,
      repeat_unit: type,
      start_date: date,
      enable_notification: notification,
      hour,
      minute,
      name,
    };
    setIsTestLoading(true);
    const res = await testTask(payload);
    setIsTestLoading(false);
    const { code, detail } = res;
    if (code === 0) {
      toast.success(t("task.testSuccess"));
    } else {
      toast.error(detail || t("task.testFailed"));
    }
  };

  const handleConfirmClick = async () => {
    const { name, date, hour, minute, type, notification, details } = newTask;

    const payload: TaskPayload = {
      description: details,
      repeat_every: 1,
      repeat_unit: type,
      start_date: date,
      enable_notification: notification,
      hour,
      minute,
      name,
    };

    if (task) {
      payload.task_id = task.backendData.id;
    }

    const { dayString, dayOfMonth } = getCurrentDateObj(date);
    if (type === TaskTypeEnum.Weekly) {
      payload.repeat_on = {
        weekdays: [dayString],
      };
    }
    if (type === TaskTypeEnum.Monthly) {
      payload.repeat_on = {
        days_of_month: [dayOfMonth],
      };
    }
    let res;
    if (task) {
      res = await updateTask(payload);
    } else {
      res = await createTask(payload);
    }

    const { code, data, detail } = res;
    if (code === 0) {
      toast.success(task ? t("task.updateSuccess") : t("task.createSuccess"));
      if (task) {
        onChange?.(newTask.id, { ...newTask, backendData: { ...data } });
      } else {
        taskStore.createTask({ ...newTask, backendData: { ...data } });
      }
      navigate(`${Path.Task}/${newTask.id}`);
    } else {
      toast.error(
        detail || (task ? t("task.updateFailed") : t("task.createFailed")),
      );
    }
  };

  return (
    <div className="flex flex-col gap-2.5 text-sm bg-[#F3F5F7] dark:bg-[#202121] px-2.5 py-2 border border-[#E8ECEF] rounded-sm">
      <Input
        className="h-10 !text-left rounded-sm bg-white dark:bg-[#101213] !border-0 p-2.5"
        placeholder={t("task.enterTaskName")}
        value={newTask.name}
        onChange={(e) =>
          setNewTask((task) => {
            return { ...task, name: e.target.value };
          })
        }
      />

      <div className="flex gap-2.5 h-10">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <div
              className={clsx(
                "flex-1 flex items-center px-2.5 py-2 bg-white dark:bg-[#101213] rounded-sm text-sm",
                {
                  "text-[#6C7275]/50 dark:text-[#343839]": !newTask.date,
                },
              )}
            >
              {newTask.date
                ? dayjs(newTask.date).format("D, MMM")
                : t("task.date")}
            </div>
          </PopoverTrigger>
          <PopoverContent asChild align="start">
            <div className="dark:bg-black">
              <Calendar
                mode="single"
                className="w-full h-full p-0 pb-4"
                selected={new Date(newTask.date)}
                required
                onSelect={(date: Date) => {
                  setNewTask((task) => {
                    return {
                      ...task,
                      date: date.toLocaleDateString(),
                    };
                  });
                  setCalendarOpen(false);
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex-1 bg-white dark:bg-[#101213] rounded-sm">
          <TimeSelect
            hour={newTask.hour}
            minute={newTask.minute}
            onChange={(time) =>
              setNewTask((task) => {
                const [hour, minute] = time
                  .split(":")
                  .map((item) => Number(item));
                return {
                  ...task,
                  hour,
                  minute,
                };
              })
            }
          />
        </div>
      </div>
      <Select
        value={newTask.type}
        onValueChange={(type) => {
          setNewTask((task) => ({
            ...task,
            type,
          }));
          console.log(type);
        }}
      >
        <SelectTrigger className="!w-full !h-10 bg-white dark:bg-[#101213] rounded-sm border-0">
          <SelectValue placeholder={t("task.selectTaskType")} />
        </SelectTrigger>
        <SelectContent className="w-[var(--radix-select-trigger-width)]">
          {Object.values(TaskTypeEnum).map((type) => (
            <SelectItem
              value={type}
              key={type}
              className="hover:bg-[#F5F5F5] px-2.5 py-2 cursor-default [&_[data-select-item-indicator]]:hidden"
            >
              {TaskTypeLabels[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <textarea
        className="bg-white dark:bg-[#101213] placeholder:text-[#6C7275]/50 dark:placeholder:text-[#343839] rounded-sm p-2.5 resize-none overflow-auto max-h-[60vh]"
        ref={textareaRef}
        rows={1}
        placeholder={t("task.taskDesp")}
        value={newTask.details}
        onChange={(e) => {
          setNewTask((task) => {
            return { ...task, details: e.target.value };
          });
          handleInput();
        }}
      ></textarea>
      <div className="flex justify-between items-center h-8.5 pl-2.5">
        <Notification
          checked={notificationEnabled}
          onChange={() => {
            setNotificationEnabled(!notificationEnabled);
            setNewTask((task) => {
              return { ...task, notification: !notificationEnabled };
            });
          }}
        />
        <div className="flex gap-2.5 h-full">
          <Button
            className="h-full bg-transparent hover:bg-transparent hover:opacity-60 text-black dark:text-white font-normal border border-[#343839] rounded-sm"
            onClick={handleTestClick}
            disabled={!confirmBtn || isTestLoading}
          >
            {t("task.test")}
          </Button>
          <Button
            disabled={!confirmBtn}
            className="h-full bg-main rounded-sm font-normal"
            onClick={handleConfirmClick}
          >
            {t("task.confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}
