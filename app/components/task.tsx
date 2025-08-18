import { useTranslation } from "react-i18next";
import { useTaskStore } from "../store";
import { useMemo, useEffect, useState, useRef } from "react";
import { Button } from "./shadcn/button";
import {
  Task as TaskType,
  TaskAction,
  TaskExecutionRecord,
  TaskTypeEnum,
  ProviderOption,
} from "../typing";
import EditIcon from "../icons/edit.svg";
import TaskManagement from "./task-management";
import { WindowHeader } from "./window-header";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { getTaskExecutionRecords, switchTaskModel } from "@/app/services/task";
import clsx from "clsx";
import { useTheme } from "../hooks/use-theme";
import NotificationOnIcon from "../icons/notification-on.svg";
import NotificationOffIcon from "../icons/notification-off.svg";
import SuccessIcon from "../icons/success.svg";
import PendingIcon from "../icons/time.svg";
import LoadingIcon from "../icons/loading-spinner.svg";
import FailedIcon from "../icons/close.svg";
import ResultLightIcon from "../icons/result-light.svg";
import ResultDarkIcon from "../icons/result-dark.svg";
import TimeIcon from "../icons/time.svg";
import RepeatIcon from "../icons/repeat.svg";
import ClockIcon from "../icons/clock.svg";
import CalendarIcon from "../icons/calendar.svg";
import TimeCalendarIcon from "../icons/time-calendar.svg";
import { Path } from "../constant";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chat";
import { getLang } from "../locales";
import { ModelSelect } from "../components/model-select";
import { useAppConfig, Theme } from "../store";
import { toast } from "sonner";
import { formatMCPData } from "../utils/chat";
dayjs.extend(advancedFormat);

interface TaskPanelProps {
  task: TaskType;
  setIsEdit: () => void;
}

interface TaskItemProps {
  taskInfo: TaskExecutionRecord;
  title: string;
  modelInfo: ProviderOption;
}

function formatDate(date: string): string {
  const locale = getLang();
  dayjs.locale(locale);
  const full = dayjs(date);

  if (locale === "zh-CN") {
    return full.format("YYYY年M月D日 dddd");
  } else {
    return full.format("dddd, YYYY.MM.DD");
  }
}

function formatTime(hour: number, minute: number): string {
  const locale = getLang();
  const formatMinute = minute < 10 ? `0${minute}` : minute;

  let suffix = "";
  let formatHour = hour;

  if (locale === "zh-CN") {
    if (hour < 6) {
      suffix = "凌晨";
    } else if (hour < 12) {
      suffix = "上午";
    } else if (hour === 12) {
      suffix = "中午";
    } else if (hour < 18) {
      suffix = "下午";
    } else {
      suffix = "晚上";
    }
    formatHour = hour <= 12 ? hour : hour - 12;
    return `${suffix}${formatHour}:${formatMinute}`;
  } else {
    formatHour = hour % 12 || 12;
    suffix = hour < 12 ? "am" : "pm";
    return `${formatHour}:${formatMinute} ${suffix}`;
  }
}

function formatCustomTime(date: string, hour: number, minute: number): string {
  const datePart = formatDate(date);
  const timePart = formatTime(hour, minute);
  return `${datePart} ${timePart}`;
}

function TaskItem({ title, taskInfo, modelInfo }: TaskItemProps) {
  const { status } = taskInfo;
  const chatStore = useChatStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const StatusIcon = useMemo(() => {
    if (status === TaskAction.Pending) return PendingIcon;
    else if (status === TaskAction.Success) return SuccessIcon;
    else if (status === TaskAction.Failed) return FailedIcon;
    else if (status === TaskAction.Idle) return LoadingIcon;
    else return null;
  }, [status]);

  const handleDetailClick = () => {
    const { id, task_id, request_messages, response_data } = taskInfo;
    const singleKey = task_id + "-" + id;
    const isExist = chatStore.haveTaskSession(singleKey);

    if (!isExist) {
      chatStore.newTaskSession({
        taskId: singleKey,
        modelInfo: modelInfo,
        // @ts-ignore
        requestData: request_messages,
        // @ts-ignore
        responseData: formatMCPData(response_data),
      });
    } else {
      chatStore.selectTaskSession(singleKey);
    }
    navigate(Path.Chat);
  };

  return (
    <div>
      <div className="flex justify-between items-center px-5 py-3 bg-[#F3F5F7]/50 dark:bg-[#232627]/50 rounded-xl">
        <div className="flex items-center gap-2">
          <p>{title}</p>
          {StatusIcon && (
            <StatusIcon
              className={clsx("size-[18px]", {
                "text-main": status === TaskAction.Success,
                "text-[#F5BF4F]":
                  status === TaskAction.Pending || status === TaskAction.Idle,
                "text-[#EF466F]": status === TaskAction.Failed,
                "animate-spin": status === TaskAction.Idle,
              })}
            />
          )}
        </div>
        {status === TaskAction.Success && (
          <div
            className="text-main select-none cursor-pointer hover:opacity-75"
            onClick={handleDetailClick}
          >
            {t("task.details")}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDateToReadableString(isoString: string) {
  const date = dayjs(isoString);
  const hour = date.hour();
  const minute = date.minute();
  return formatCustomTime(date.toISOString(), hour, minute);
}

function TaskRecords({ currentTask }: { currentTask: TaskType }) {
  const [recordList, setRecordList] = useState<TaskExecutionRecord[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const getRecord = async () => {
      if (!currentTask) return;
      const { id } = currentTask;
      const res = await getTaskExecutionRecords(id);
      const { code, data } = res;
      if (code === 0) {
        const { records } = data;
        if (records && records.length) {
          setRecordList(records);
          const shouldPoll = records.some(
            (r: TaskExecutionRecord) => r.status === TaskAction.Idle,
          );
          if (shouldPoll) {
            timerRef.current = setTimeout(getRecord, 5000);
          } else {
            timerRef.current = null;
          }
        } else {
          setRecordList([]);
        }
      } else {
        setRecordList([]);
      }
    };
    getRecord();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentTask]);

  return (
    <div className="flex-1 min-h-0 space-y-5 overflow-y-auto">
      {recordList.map((item) => (
        <TaskItem
          key={item.id}
          modelInfo={currentTask.modelInfo!}
          taskInfo={item}
          title={formatDateToReadableString(
            item.next_run_at || item.completed_at || item.created_at,
          )}
        />
      ))}
    </div>
  );
}

function TaskPanel({ task, setIsEdit }: TaskPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-5 py-3 px-5 text-sm bg-[#F3F5F7]/50 dark:bg-[#232627]/50 text-[#101213] dark:text-white rounded-xl">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-lg">{task.name}</span>
        <Button variant="ghost" className="size-7" onClick={setIsEdit}>
          <EditIcon className="size-6 text-main" />
        </Button>
      </div>

      <div className="flex flex-col gap-4 text-[#6C7275] dark:text-[#E8ECEF]/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <TimeIcon className="size-[18px]" />
            <span>{t("task.time")}</span>
          </div>

          <div className="flex items-center gap-1 text-[#141718] dark:text-[#FEFEFE] font-medium bg-[#E8ECEF] dark:bg-[#343839] px-1.5 py-1 rounded-sm">
            <CalendarIcon className="text-main" />
            {formatDate(task.original_info.start_date)}
          </div>
          <div className="flex items-center gap-1 text-[#141718] dark:text-[#FEFEFE] font-medium bg-[#E8ECEF] dark:bg-[#343839] px-1.5 py-1 rounded-sm">
            <TimeCalendarIcon className="text-main" />
            {formatTime(task.original_info.hour!, task.original_info.minute!)}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <RepeatIcon className="size-[18px]" />
            <span>{t("task.recurrence")}</span>
          </div>

          <span className="text-[#141718] dark:text-[#FEFEFE] font-medium">
            {task.original_info.repeat_unit === TaskTypeEnum.Daily
              ? t("task.daily")
              : task.original_info.repeat_unit === TaskTypeEnum.Weekly
              ? t("task.weekly")
              : task.original_info.repeat_unit === TaskTypeEnum.Monthly
              ? t("task.monthly")
              : t("task.once")}
          </span>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <ClockIcon className="size-[18px]" />
            <span>{t("task.notification")}</span>
          </div>

          <div className="flex items-center justify-center gap-1 text-[#141718] dark:text-[#FEFEFE] bg-[#E8ECEF] dark:bg-[#343839] px-1.5 py-1 font-medium">
            {task.original_info.enable_notification ? (
              <>
                <NotificationOnIcon className="size-5 text-main" />
                {t("task.on")}
              </>
            ) : (
              <>
                <NotificationOffIcon className="size-5 text-main" />
                {t("task.off")}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <span className="whitespace-nowrap">{t("task.details")}</span>
        <div className="text-[#979797] max-h-30 overflow-y-auto flex-1 break-words">
          {task.original_info.description}
        </div>
      </div>
    </div>
  );
}

export function Task() {
  const { t } = useTranslation();
  const setTask = useTaskStore((state) => state.setTask);
  const [isEdit, setIsEdit] = useState(false);
  const currentTask = useTaskStore().currentTask();
  const taskStore = useTaskStore();
  const updateTargetTask = taskStore.updateTargetTask;
  const theme = useTheme();
  const [model, setModel] = useState<string>(
    currentTask?.modelInfo?.model || "",
  );
  useEffect(() => {
    console.log("currentTask===", currentTask);
    if (!currentTask) return;
    setIsEdit(false);
    setModel(currentTask.modelInfo?.model || "");
  }, [currentTask]);

  const getModelInfo = useAppConfig((s) => s.getModelInfo);
  const handleModelChange = async (model: string) => {
    if (!currentTask) return;
    setModel(model);
    const modelInfo = getModelInfo(model);
    const res = await switchTaskModel(currentTask.id, modelInfo);
    const { code } = res;
    if (code === 0) {
      updateTargetTask(currentTask!, (task) => {
        task.modelInfo = modelInfo;
      });
      taskStore.setTaskModelMap(currentTask!.id, modelInfo);
      toast.success(t("task.updateSuccess"));
    } else {
      toast.error(t("task.updateFailed"));
    }
  };
  return (
    <div className="flex flex-col h-screen">
      <WindowHeader>
        {currentTask && (
          <ModelSelect
            mode="custom"
            onChange={handleModelChange}
            value={model}
          />
        )}
      </WindowHeader>
      {!currentTask ? (
        <div className="flex-center flex-1">
          {theme === Theme.Light ? <ResultLightIcon /> : <ResultDarkIcon />}
        </div>
      ) : (
        <div
          className="flex-1 flex flex-col min-h-0 gap-5 px-15 py-5 border-t border-[#E8ECEF] dark:border-[#232627]/50"
          onClick={() => setIsEdit(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col gap-2.5 min-h-0"
          >
            {isEdit ? (
              <TaskManagement
                model={model}
                task={currentTask}
                onCancel={() => {
                  setIsEdit(false);
                }}
                onChange={(id, updatedTask) => {
                  setTask(id, updatedTask);
                  setIsEdit(false);
                }}
              />
            ) : (
              <>
                <TaskPanel
                  task={currentTask}
                  setIsEdit={() => setIsEdit(true)}
                />
                <TaskRecords currentTask={currentTask} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
