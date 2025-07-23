import { useState, useRef, useEffect } from "react";
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
import { TaskTypeEnum, TaskType, Task } from "../typing";
import { createDefaultTask, useTaskStore } from "../store";
import dayjs from "dayjs";
import NotificationOnIcon from "../icons/notification-on.svg";
import NotificationOffIcon from "../icons/notification-off.svg";

interface NotificationProps {
  checked: boolean;
  onChange: (val: boolean) => void;
}

interface TaskManagementProps {
  task?: Task;
}

const TaskTypeLabels: Record<TaskType, string> = {
  "one-time": "单次任务",
  daily: "每日任务",
  weekly: "每周任务",
  monthly: "每月任务",
};

export function Notification({ checked, onChange }: NotificationProps) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="cursor-pointer flex items-center justify-center size-5 text-main"
    >
      {checked ? (
        <NotificationOnIcon className="size-5" />
      ) : (
        <NotificationOffIcon className="size-5" />
      )}
    </div>
  );
}

export default function TaskManagement({ task }: TaskManagementProps) {
  const [newTask, setNewTask] = useState<Task>({
    ...createDefaultTask(),
    ...task,
  });
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const taskStore = useTaskStore();

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  };

  useEffect(() => {
    handleInput();
  }, []);

  return (
    <div className="flex flex-col gap-2.5 bg-[#F3F5F7] dark:bg-[#202121] px-2.5 py-2">
      <Input
        className="h-10 !text-left bg-white dark:bg-[#101213] !border-0"
        placeholder="Enter Task Name"
        value={newTask.name}
        onChange={(e) =>
          setNewTask((task) => {
            return { ...task, name: e.target.value };
          })
        }
      />

      <div className="flex gap-2.5 h-10">
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex-1 px-2.5 py-2 bg-white dark:bg-[#101213] rounded-sm">
              {newTask.schedule.date
                ? dayjs(newTask.schedule.date).format("D, MMM")
                : "Select a date"}
            </div>
          </PopoverTrigger>
          <PopoverContent asChild align="start">
            <div>
              <Calendar
                mode="single"
                className="w-full h-full p-0 pb-4"
                selected={newTask.schedule.date}
                onSelect={(date: Date | undefined) => {
                  if (!date) return;
                  setNewTask((task) => {
                    return {
                      ...task,
                      schedule: {
                        ...task.schedule,
                        date,
                      },
                    };
                  });
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex-1 bg-white dark:bg-[#101213] rounded-sm">
          <TimeSelect
            value={newTask.schedule.time}
            onChange={(time) =>
              setNewTask((task) => {
                return {
                  ...task,
                  schedule: {
                    ...task.schedule,
                    time,
                  },
                };
              })
            }
          />
        </div>
      </div>
      {/* <Popover>
        <PopoverTrigger>
          <div className="flex items-center gap-2.5 p-2.5 h-10 bg-white dark:bg-[#101213] rounded-sm">
            <span className="flex-1"></span>
            <GeneralIcon className="text-main size-[18px]" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)]">
          {Object.values(TaskTypeEnum).map((type) => (
            <div
              key={type}
              className="hover:bg-[#F5F5F5] px-2.5 py-2 cursor-default"
              onClick={() => {
                console.log("clicked type:", type);
              }}
            >
              {TaskTypeLabels[type]}
            </div>
          ))}
        </PopoverContent>
      </Popover> */}
      <Select>
        <SelectTrigger className="!w-full bg-white dark:bg-[#101213] rounded-sm border-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="w-[var(--radix-select-trigger-width)]">
          {Object.values(TaskTypeEnum).map((type) => (
            <SelectItem
              value={type}
              key={type}
              className="hover:bg-[#F5F5F5] px-2.5 py-2 cursor-default"
              onClick={() => {
                console.log("clicked type:", type);
              }}
            >
              {TaskTypeLabels[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <textarea
        className="bg-white dark:bg-[#101213] placeholder:text-sm placeholder:text-[#6C7275]/50 dark:placeholder:text-[#343839] rounded-sm p-2.5 resize-none overflow-auto max-h-[60vh]"
        ref={textareaRef}
        rows={1}
        placeholder="Task Description"
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
          onChange={setNotificationEnabled}
        />
        <div className="flex gap-2.5 h-full">
          <Button
            className="h-full bg-transparent hover:bg-transparent hover:opacity-60 text-black dark:text-white font-normal border border-[#343839] rounded-sm"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            className="h-full bg-main rounded-sm font-normal"
            onClick={() => taskStore.createTask(newTask)}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
