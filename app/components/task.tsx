import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppConfig, useTaskStore, getModelInfo } from "../store";
import { useMemo, useEffect } from "react";
import { Button } from "./shadcn/button";
import {
  Task as TaskType,
  TaskAction,
  TaskExecutionRecord,
  ChatModelInfo,
  ModelHeaderInfo,
  TaskTypeEnum,
} from "../typing";
import EditIcon from "../icons/edit.svg";
import TaskManagement from "./task-management";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";

import { getTaskExecutionRecords, switchTaskModel } from "@/app/services/task";
import clsx from "clsx";
import NotificationOnIcon from "../icons/notification-on.svg";
import NotificationOffIcon from "../icons/notification-off.svg";
import SuccessIcon from "../icons/success.svg";
import PendingIcon from "../icons/time.svg";
import FailedIcon from "../icons/close.svg";
import { Path } from "../constant";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chat";
import { ModelSelect } from "./model-select";
import { toast } from "sonner";
import useState from "react-usestateref";
import { getChatHeaders } from "../utils/chat";
dayjs.extend(advancedFormat);

interface TaskPanelProps {
  task: TaskType;
  setIsEdit: () => void;
}

interface TaskItemProps {
  taskInfo: TaskExecutionRecord;
  title: string;
}

function formatCustomTime(date: string, hour: number, minute: number): string {
  const full = dayjs(`${dayjs(date).format("YYYY-MM-DD")}T${hour}:${minute}`);
  const formatHour = hour <= 12 ? hour : hour - 12;
  const formatMinute = minute < 10 ? `0${minute}` : minute;
  const suffix = hour < 12 ? "am" : "pm";

  return `${formatHour}:${formatMinute} ${suffix}, ${full.format(
    "dddd, MMMM D, YYYY",
  )}`;
}

function TaskItem({ title, taskInfo }: TaskItemProps) {
  const { status } = taskInfo;
  const chatStore = useChatStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const StatusIcon = useMemo(() => {
    if (status === TaskAction.Pending) return PendingIcon;
    else if (status === TaskAction.Success) return SuccessIcon;
    else if (status === TaskAction.Failed) return FailedIcon;
    else return null;
  }, [status]);

  const handleDetailClick = () => {
    const { id, task_id, request_messages, response_data } = taskInfo;
    const isExist = chatStore.haveTaskSession(task_id);
    const singleKey = task_id + "-" + id;
    if (!isExist) {
      chatStore.newTaskSession({
        taskId: singleKey,
        // @ts-ignore
        requestData: request_messages,
        // @ts-ignore
        responseData: response_data,
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
                "text-[#F5BF4F]": status === TaskAction.Pending,
                "text-[#EF466F]": status === TaskAction.Failed,
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
  const date = new Date(isoString);

  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const hour12 = hours % 12 || 12;
  const ampm = hours >= 12 ? "pm" : "am";
  const paddedMinutes = String(minutes).padStart(2, "0");

  return `${hour12}:${paddedMinutes} ${ampm}, ${weekday}, ${month} ${day}, ${year}`;
}

function TaskRecords({ taskItem }: { taskItem: TaskType }) {
  const [recordList, setRecordList] = useState<TaskExecutionRecord[]>([]);

  useEffect(() => {
    const getRecord = async () => {
      if (!taskItem) return;
      const {
        backendData: { id },
      } = taskItem;
      const res = await getTaskExecutionRecords(id);
      const { code, data } = res;
      if (code === 0) {
        const { records } = data;
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
  }, [taskItem]);

  return (
    <div className="space-y-5 mt-5">
      {recordList.map((item) => (
        <TaskItem
          key={item.id}
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
  const { id } = useParams<{ id: string }>();
  const tasks = useTaskStore((state) => state.tasks);
  const setTask = useTaskStore((state) => state.setTask);
  const [model, setModel, modelRef] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const taskItem = tasks.find((task) => task.id === id);

  useEffect(() => {
    const { modelInfo } = (taskItem as TaskType) || {};
    if (!modelInfo) return;
    const {
      "Aiden-Model-Name": modelName,
      "Aiden-Model-Provider": provider,
      "Aiden-Model-Api-Key": apiKey,
    } = modelInfo;

    if (apiKey) {
      setModel(`${provider}:${modelName}`);
    } else {
      setModel(modelName);
    }
  }, [taskItem]);

  const groupedProviders = useAppConfig((state) => state.groupedProviders);
  const models = useAppConfig((state) => state.models);

  const updateTaskModelInfo = (id: string, modelInfo: ChatModelInfo) => {
    const modelHeaders = getChatHeaders(
      modelInfo,
    ) as unknown as ModelHeaderInfo;
    setTask(id, {
      ...(taskItem as TaskType),
      modelInfo: modelHeaders,
    });
  };

  const handleModelChange = async (value: string) => {
    setModel(value);
    const {
      id,
      backendData: { id: backendId },
    } = (taskItem as TaskType) || {};

    const modelInfo = getModelInfo(
      modelRef.current,
      groupedProviders,
      models,
    ) as ChatModelInfo;
    const res = await switchTaskModel(backendId, modelInfo);
    const { code } = res;
    if (code === 0) {
      toast.success("切换成功");
      updateTaskModelInfo(id, modelInfo);
    } else {
      console.error("qiehuan shibai");
    }
  };

  useEffect(() => {
    if (!taskItem) return;
    setIsEdit(false);
  }, [taskItem]);

  if (!taskItem) return null;

  return (
    <div
      className="flex flex-col h-screen min-h-0 gap-5 px-15 py-5"
      onClick={() => setIsEdit(false)}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <div className="w-fit mb-5">
          <ModelSelect
            mode="custom"
            onChange={handleModelChange}
            value={model}
          />
        </div>
        {isEdit ? (
          <TaskManagement
            task={taskItem}
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
            <TaskPanel task={taskItem} setIsEdit={() => setIsEdit(true)} />
            <TaskRecords taskItem={taskItem} />
          </>
        )}
      </div>
    </div>
  );
}
