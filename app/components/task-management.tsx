import {
  useState,
  useRef,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
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
import { TaskTypeEnum, Task, TaskPayload, TaskFormType } from "../typing";
import { useAppConfig, useTaskStore } from "../store";
import dayjs from "dayjs";
import clsx from "clsx";
import NotificationOnIcon from "../icons/notification-on.svg";
import NotificationOffIcon from "../icons/notification-off.svg";
import ArrowDownIcon from "../icons/arrow-down.svg";
import CalendarIcon from "../icons/calendar.svg";
import { Path } from "../constant";
import { createTask, testTask, updateTask } from "../services/task";
import { toast } from "sonner";
import { getLang } from "../locales";
import { useTranslation } from "react-i18next";
import LoadingIcon from "../icons/loading-spinner.svg";

interface NotificationProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  children?: ReactNode;
}

interface TaskManagementProps {
  model: string;
  task?: Task;
  onCancel?: () => void;
  onChange?: (id: string, updatedTask: Task) => void;
}

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
      className="flex size-6.5 gap-1 p-1 cursor-pointer rounded-sm bg-[#E8ECEF] dark:bg-[#343839] hover:opacity-75"
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
  model,
}: TaskManagementProps) {
  const { t } = useTranslation("general");
  const [testTaskIds, setTestTaskIds] = useState<string[]>([]);
  const [newTask, setNewTask] = useState<TaskFormType>({
    name: "",
    date: "",
    hour: null,
    minute: null,
    type: TaskTypeEnum.Daily,
    notification: false,
    details: "",
    modelInfo: undefined,
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [timeErr, setTimeErr] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const setSelectedId = useTaskStore((state) => state.setCurrentTaskId);

  useEffect(() => {
    if (task) {
      const {
        original_info: {
          name,
          hour,
          minute,
          start_date,
          description,
          repeat_unit,
          enable_notification,
        },
      } = task;
      setNewTask({
        name,
        date: start_date,
        hour,
        minute,
        type: repeat_unit as TaskTypeEnum,
        notification: enable_notification,
        details: description,
      });
      setNotificationEnabled(enable_notification);
    }
  }, [task]);
  const navigate = useNavigate();
  const taskStore = useTaskStore();

  const getModelInfo = useAppConfig((s) => s.getModelInfo);
  useEffect(() => {
    if (!model) return;
    const modelInfo = getModelInfo(model);
    setNewTask((task) => {
      return {
        ...task,
        modelInfo: modelInfo,
      };
    });
  }, [model]);

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + 2 + "px"; // border: 2px
    }
  };

  const verifyTask = useCallback(
    (task: TaskFormType): boolean => {
      if (!task.date || task.hour === null || task.minute === null)
        return false;
      if (!task.type) return false;
      if (!task.details) return false;
      if (timeErr) return false;
      return true;
    },
    [timeErr],
  );

  const confirmBtn = useMemo(() => verifyTask(newTask), [verifyTask, newTask]);

  useEffect(() => {
    handleInput();
  }, [newTask.details]);

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
    const { code, message, data } = res;
    if (code === 0) {
      const { task_id } = data || {};
      if (task_id) {
        setTestTaskIds((ids) => [...ids, task_id]);
      }
      toast.success(t("task.testSuccess"), {
        className: "w-auto max-w-max",
      });
    } else {
      toast.error(message || t("task.testFailed"), {
        className: "w-auto max-w-max",
      });
    }
  };

  const handleConfirmClick = async () => {
    console.log("testTaskIds", testTaskIds);
    try {
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
        payload.task_id = task.id;
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
      setIsSubmitLoading(true);
      if (task) {
        res = await updateTask(payload, newTask);
      } else {
        res = await createTask(payload, newTask);
      }
      setIsSubmitLoading(false);
      const { code, data, detail } = res;
      if (code === 0) {
        toast.success(
          task ? t("task.updateSuccess") : t("task.createSuccess"),
          {
            className: "w-auto max-w-max",
          },
        );
        const updatedData = { ...data, modelInfo: newTask.modelInfo };
        if (task) {
          onChange?.(data.id, updatedData);
        } else {
          taskStore.addTask(updatedData);
        }
        setSelectedId(data.id);
        navigate(`${Path.Task}/${data.id}`);
      } else {
        toast.error(
          detail || (task ? t("task.updateFailed") : t("task.createFailed")),
        );
      }
    } catch (e: any) {
      setIsSubmitLoading(false);
      toast.error(e.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };
  return (
    <div className="flex flex-col gap-2.5 text-sm bg-[#F3F5F7] dark:bg-[#232627]/50 px-2.5 py-2 border border-[#E8ECEF] dark:border-[#343839] rounded-sm">
      <div className="flex flex-col gap-1.5">
        <span className="text-[#6C7275]">{t("task.name")}</span>
        <Input
          className="h-10 !text-left rounded-sm bg-white dark:bg-[#101213] border border-white dark:border-[#101213] hover:border-[#232627]/50 dark:hover:border-white focus:border-[#00AB66] dark:focus:border-[#00D47E] p-2.5"
          placeholder={t("task.enterTaskName")}
          value={newTask.name}
          onChange={(e) =>
            setNewTask((task) => {
              return { ...task, name: e.target.value };
            })
          }
        />
      </div>

      <div className="flex gap-2.5 h-16.5">
        <div className="flex flex-col gap-1.5 flex-1">
          <span className="text-[#6C7275]">{t("task.date")}</span>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <div className="h-full flex justify-between items-center pr-1.5 bg-white dark:bg-[#101213] border border-white dark:border-[#101213] hover:border-[#232627]/50 dark:hover:border-white data-[state=open]:border-[#00AB66] dark:data-[state=open]:border-[#00D47E] rounded-sm">
                <div
                  className={clsx(
                    "flex items-center gap-1 px-2.5 py-2 text-sm",
                    {
                      "text-[#6C7275]/50 dark:text-[#E8ECEF]/50": !newTask.date,
                    },
                  )}
                >
                  <CalendarIcon className="text-main shrink-0" />
                  {newTask.date
                    ? getLang() === "zh-CN"
                      ? dayjs(newTask.date).format("M月D日")
                      : dayjs(newTask.date).format("D, MMM")
                    : t("task.date")}
                </div>
                <ArrowDownIcon className="opacity-50" />
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
        </div>

        <div className="flex-1 flex flex-col gap-1.5">
          <span className="text-[#6C7275]">{t("task.time")}</span>
          <div className="bg-white dark:bg-[#101213] rounded-sm">
            <TimeSelect
              hour={newTask.hour}
              minute={newTask.minute}
              timeErr={timeErr}
              setTimeErr={setTimeErr}
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
      </div>

      {timeErr && (
        <div className="flex justify-end">
          <p className="w-1/2 pl-2.5 text-[#EF466F] text-sm">{timeErr}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-[#6C7275]">{t("task.type")}</span>
        <Select
          value={newTask.type}
          onValueChange={(type: TaskTypeEnum) => {
            setNewTask((task) => ({
              ...task,
              type,
            }));
          }}
        >
          <SelectTrigger className="!w-full !h-10 bg-white dark:bg-[#101213] hover:border-[#232627]/50 dark:hover:border-white rounded-sm border data-[state=open]:border-[#00AB66] dark:data-[state=open]:border-[#00D47E] !data-[placeholder]:text-black">
            <SelectValue placeholder={t("task.selectTaskType")} />
          </SelectTrigger>
          <SelectContent className="w-[var(--radix-select-trigger-width)]">
            {Object.values(TaskTypeEnum).map((type) => (
              <SelectItem
                value={type}
                key={type}
                className="hover:bg-[#F5F5F5] px-2.5 py-2 cursor-default [&_[data-select-item-indicator]]:hidden"
              >
                {t(`task.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[#6C7275]">{t("task.description")}</span>
        <textarea
          className="bg-white dark:bg-[#101213] placeholder:text-[#6C7275]/50 dark:placeholder:text-[#E8ECEF]/50 rounded-sm p-2.5 resize-none border border-white dark:border-[#101213] focus:border-[#00AB66] dark:focus:border-[#00AB66] hover:border-[#232627]/50 dark:hover:border-white overflow-y-auto max-h-[40vh]"
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
      </div>

      <Notification
        checked={notificationEnabled}
        onChange={() => {
          setNotificationEnabled(!notificationEnabled);
          setNewTask((task) => {
            return { ...task, notification: !notificationEnabled };
          });
        }}
      />
      <div className="flex justify-end gap-2.5 h-8.5">
        <Button
          className="h-full bg-transparent hover:bg-transparent hover:opacity-60 text-black dark:text-white font-normal border border-[#E8ECEF] dark:border-[#343839] rounded-sm w-34"
          onClick={handleTestClick}
          disabled={!confirmBtn || isTestLoading}
        >
          {isTestLoading ? (
            <LoadingIcon className="size-4 animate-spin" />
          ) : (
            t("task.test")
          )}
        </Button>
        <Button
          disabled={!confirmBtn || isSubmitLoading}
          className="h-full bg-main rounded-sm font-normal w-34"
          onClick={handleConfirmClick}
        >
          {isSubmitLoading ? (
            <LoadingIcon className="size-4 animate-spin" />
          ) : (
            t("task.confirm")
          )}
        </Button>
      </div>
    </div>
  );
}
