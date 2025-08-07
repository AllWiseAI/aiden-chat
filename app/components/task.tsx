import { useTranslation } from "react-i18next";
import { useTaskStore } from "../store";
import { useMemo, useEffect, useState } from "react";
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
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { getTaskExecutionRecords, switchTaskModel } from "@/app/services/task";
import clsx from "clsx";
import NotificationOnIcon from "../icons/notification-on.svg";
import NotificationOffIcon from "../icons/notification-off.svg";
import SuccessIcon from "../icons/success.svg";
import PendingIcon from "../icons/time.svg";
import LoadingIcon from "../icons/loading-spinner.svg";
import FailedIcon from "../icons/close.svg";
import { Path } from "../constant";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chat";
import { getLang } from "../locales";
import { ModelSelect } from "../components/model-select";
import { useAppConfig } from "../store";
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

function formatCustomTime(date: string, hour: number, minute: number): string {
  const locale = getLang();
  dayjs.locale(locale);
  const full = dayjs(`${dayjs(date).format("YYYY-MM-DD")}T${hour}:${minute}`);

  const formatMinute = minute < 10 ? `0${minute}` : minute;

  if (locale === "zh-CN") {
    let suffix = "";
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
    const formatHour = hour <= 12 ? hour : hour - 12;
    return `${full.format(
      "YYYY年 M月D日 dddd",
    )} ${suffix}${formatHour}:${formatMinute}`;
  } else {
    const formatHour = hour % 12 || 12;
    const suffix = hour < 12 ? "am" : "pm";
    return `${formatHour}:${formatMinute} ${suffix}, ${full.format(
      "dddd, MMMM D, YYYY",
    )}`;
  }
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
    const isExist = chatStore.haveTaskSession(task_id);
    const singleKey = task_id + "-" + id;

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
      <div className="flex justify-between items-center px-5 py-3 bg-[#F3F5F7] dark:bg-[#232627] rounded-xl">
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

  useEffect(() => {
    const getRecord = async () => {
      if (!currentTask) return;
      const {
        backendData: { id },
      } = currentTask;
      const res = await getTaskExecutionRecords(id);
      const { code, data } = res;
      if (code === 0) {
        const { records } = data;
        console.log("records", records);
        if (records && records.length) {
          setRecordList(records);
        } else {
          setRecordList([]);
        }
      } else {
        setRecordList([]);
      }
    };
    getRecord();
  }, [currentTask]);

  return (
    <div className="space-y-5 mt-5">
      {recordList.map((item) => (
        <TaskItem
          key={item.id}
          modelInfo={currentTask.modelInfo}
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
        <span className="text-[#979797]">
          {task.type === TaskTypeEnum.Daily
            ? t("task.daily")
            : task.type === TaskTypeEnum.Weekly
            ? t("task.weekly")
            : task.type === TaskTypeEnum.Monthly
            ? t("task.monthly")
            : t("task.once")}
        </span>
      </div>

      <div className="flex gap-3">
        <span>{t("task.notification")}</span>

        <div className="flex items-center justify-center gap-1 text-[#979797]">
          {task.notification ? (
            <>
              <NotificationOnIcon className="size-5" />
              {t("task.on")}
            </>
          ) : (
            <>
              <NotificationOffIcon className="size-5" />
              {t("task.off")}
            </>
          )}
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
  const { t } = useTranslation();
  const setTask = useTaskStore((state) => state.setTask);
  const [isEdit, setIsEdit] = useState(false);
  const currentTask = useTaskStore().currentTask();
  const taskStore = useTaskStore();
  const updateTargetTask = taskStore.updateTargetTask;

  useEffect(() => {
    if (!currentTask) return;
    setIsEdit(false);
  }, [currentTask]);

  const [model, setModel] = useState<string>(
    currentTask?.modelInfo?.model || "",
  );
  const getModelInfo = useAppConfig((s) => s.getModelInfo);
  const handleModelChange = async (model: string) => {
    setModel(model);
    const modelInfo = getModelInfo(model);
    console.log("currentTask", currentTask);
    const res = await switchTaskModel(currentTask?.backendData?.id, modelInfo);
    console.log("res", res);
    const { code } = res;
    if (code === 0) {
      updateTargetTask(currentTask!, (task) => {
        task.modelInfo = modelInfo;
      });
      toast.success(t("task.updateSuccess"));
    } else {
      toast.error(t("task.updateFailed"));
    }
  };
  if (!currentTask) return null;
  return (
    <div
      className="flex flex-col h-screen min-h-0 gap-5 px-15 py-5"
      onClick={() => setIsEdit(false)}
    >
      <div className="w-fit mb-5">
        <ModelSelect mode="custom" onChange={handleModelChange} value={model} />
      </div>
      <div onClick={(e) => e.stopPropagation()}>
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
            <TaskPanel task={currentTask} setIsEdit={() => setIsEdit(true)} />
            <TaskRecords currentTask={currentTask} />
          </>
        )}
      </div>
    </div>
  );
}
