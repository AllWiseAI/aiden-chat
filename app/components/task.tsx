import { useTranslation, Trans } from "react-i18next";
import { useTaskStore } from "../store";
import { useMemo, useEffect, useState, useRef } from "react";
import { Button } from "./shadcn/button";
import {
  Task as TaskType,
  TaskAction,
  TaskExecutionRecord,
  TaskTypeEnum,
} from "../typing";
import EditIcon from "../icons/edit.svg";
import TaskManagement from "./task-management";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { getTaskExecutionRecords } from "@/app/services/task";
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
import DetailIcon from "../icons/detail.svg";
import CalendarIcon from "../icons/calendar.svg";
import TimeCalendarIcon from "../icons/time-calendar.svg";
import TopRightIcon from "../icons/top-right.svg";
import { prettyObject } from "@/app/utils/format";
import { Path } from "../constant";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chat";
import { getLang } from "../locales";
import { Theme } from "../store";
import { formatMCPData } from "../utils/chat";
import { track, EVENTS } from "@/app/utils/analysis";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/shadcn/accordion";
import { Markdown } from "./markdown";
import { WindowHeader } from "./window-header";
dayjs.extend(advancedFormat);

interface TaskPanelProps {
  task: TaskType;
  setIsEdit: () => void;
}

interface TaskItemProps {
  taskInfo: TaskExecutionRecord;
  title: string;
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

export function TaskItem({ title, taskInfo }: TaskItemProps) {
  const {
    status,
    request_messages,
    response_data,
    error_message,
    id,
    task_id,
    execution_type,
  } = taskInfo;
  const singleKey = task_id + "-" + id;
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
    const isExist = chatStore.haveTaskSession(singleKey);
    const responseData =
      status === TaskAction.Success
        ? formatMCPData(response_data)
        : [
            {
              isError: true,
              role: "assistant",
              content: error_message,
              errorInfo:
                "\n\n" +
                prettyObject({
                  msg: error_message,
                  code: -1,
                }),
            },
          ];

    if (!isExist) {
      chatStore.newTaskSession({
        taskId: singleKey,
        // @ts-ignore
        requestData: request_messages,
        // @ts-ignore
        responseData,
      });
    } else {
      chatStore.selectTaskSession(singleKey);
    }
    navigate(Path.Chat);
  };
  if (status === TaskAction.Pending || status === TaskAction.Idle) {
    return (
      <div className="flex justify-between items-center px-4 py-2.5 bg-[#F3F5F7]/50 dark:bg-[#232627]/50 border border-[#E8ECEF] dark:border-[#343839] rounded-lg">
        <div className="w-full flex justify-between items-center gap-2">
          <p className="font-medium">{title}</p>
          {StatusIcon && (
            <StatusIcon
              className={clsx("size-6", {
                "text-[#F5BF4F]":
                  status === TaskAction.Pending || status === TaskAction.Idle,
                "animate-spin": status === TaskAction.Idle,
              })}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <AccordionItem
      value={singleKey}
      className="py-2.5 px-4 rounded-lg bg-[#F3F5F7]/50 dark:bg-[#232627]/50 border border-[#E8ECEF] dark:border-[#343839]"
    >
      <AccordionTrigger className="h-6 py-0">
        <div className="flex items-center gap-2.5">
          <span className="text-base font-medium">
            {title +
              (execution_type === "scheduled" ? "" : ` ${t("task.testTitle")}`)}
          </span>
          {StatusIcon && (
            <StatusIcon
              className={clsx("size-6", {
                "text-main": status === TaskAction.Success,
                "text-[#EF466F]": status === TaskAction.Failed,
              })}
            />
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="mt-2.5 flex flex-col gap-2.5 p-0">
        <div className="bg-[#FEFEFE] dark:bg-[#101213] text-sm rounded-lg p-2.5 max-h-55 overflow-y-auto">
          {status === TaskAction.Success ? (
            response_data?.length > 0 &&
            response_data.every((item) => item.message?.content === "") ? (
              <Markdown key="null-message" content={t("task.null")} />
            ) : (
              response_data?.map((item, index) => (
                <Markdown key={index} content={item.message?.content} />
              ))
            )
          ) : (
            <div>{error_message}</div>
          )}
        </div>
        {(status === TaskAction.Success || status === TaskAction.Failed) && (
          <div
            className="ml-auto text-main flex items-center gap-1 cursor-pointer hover:opacity-70 text-sm font-medium"
            onClick={handleDetailClick}
          >
            <span>{t("task.chat")}</span>
            <TopRightIcon className="size-5" />
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

export function formatDateToReadableString(isoString: string) {
  const date = dayjs(isoString);
  const hour = date.hour();
  const minute = date.minute();
  return formatCustomTime(date.toISOString(), hour, minute);
}

function TaskRecords({ currentTask }: { currentTask: TaskType }) {
  const [recordList, setRecordList] = useState<TaskExecutionRecord[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [activeKey, setActiveKey] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [viewMore, setViewMore] = useState(false);

  useEffect(() => {
    if (recordList.length && recordList.length <= 5) {
      setActiveKey(recordList[0].task_id + "-" + recordList[0].id);
    } else setActiveKey("");
  }, [recordList]);

  useEffect(() => {
    const getRecord = async () => {
      if (!currentTask) return;
      const { id } = currentTask;
      setLoading(true);
      const res = await getTaskExecutionRecords(id, 1, 5 * pageNum);
      const { code, data } = res;
      if (code === 0) {
        const { records, pagination } = data;
        console.log("records===", records);
        if (pagination.total_pages > pageNum) {
          setViewMore(true);
        } else {
          setViewMore(false);
        }
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
      setLoading(false);
    };
    getRecord();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentTask, pageNum]);

  return (
    <>
      {viewMore && (
        <Button
          variant="outline"
          className="w-30 h-9 text-sm font-medium rounded-sm border border-[#E8ECEF] dark:border-[#232627] mx-auto"
          onClick={() => setPageNum((state) => state + 1)}
        >
          {loading && <LoadingIcon className="animate-spin size-4" />}
          ViewMore
        </Button>
      )}
      {loading ? (
        <div className="flex-center flex-1 min-h-0 h-full">
          <LoadingIcon className="animate-spin size-6" />
        </div>
      ) : (
        <Accordion
          type="single"
          collapsible
          value={activeKey}
          onValueChange={setActiveKey}
          className="flex-1 min-h-0 space-y-2.5 h-max"
        >
          {recordList.map((item) => (
            <TaskItem
              key={item.id}
              taskInfo={item}
              title={formatDateToReadableString(
                item.next_run_at || item.created_at,
              )}
            />
          ))}
        </Accordion>
      )}
    </>
  );
}

function TaskPanel({ task, setIsEdit }: TaskPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-[#101213] sticky top-0 z-1">
      <div className="flex flex-col gap-5 py-3 px-5 text-sm bg-[#F3F5F7]/50 dark:bg-[#232627]/50 border border-[#E8ECEF] dark:border-[#343839] text-[#101213] dark:text-white rounded-lg">
        <div className="flex items-center gap-2">
          <span className="flex-1 min-w-0 text-lg truncate font-medium">
            {task.name}
          </span>
          <Button
            variant="ghost"
            className="size-8 hover:opacity-70"
            onClick={setIsEdit}
          >
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

            <div className="flex items-center justify-center gap-1 text-[#141718] dark:text-[#FEFEFE] bg-[#E8ECEF] dark:bg-[#343839] px-1.5 py-1 font-medium rounded-sm">
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
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <DetailIcon className="size-[18px]" />
              <span className="whitespace-nowrap">{t("task.details")}</span>
            </div>

            <div className="text-[#141718] dark:text-[#FEFEFE] max-h-30 overflow-y-auto flex-1 break-words font-medium">
              {task.original_info.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Task() {
  const { t } = useTranslation();
  const setTask = useTaskStore((state) => state.setTask);
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();
  const currentTask = useTaskStore().currentTask();
  const theme = useTheme();

  useEffect(() => {
    track(EVENTS.TASK_PAGE_EXPOSURE);
  }, []);
  useEffect(() => {
    if (!currentTask) return;
    setIsEdit(false);
  }, [currentTask]);

  return (
    <div className="flex flex-col h-screen">
      <WindowHeader />
      {!currentTask ? (
        <div className="flex-center flex-col flex-1 gap-7.5 -mt-15">
          {theme === Theme.Light ? <ResultLightIcon /> : <ResultDarkIcon />}
          <div className="flex flex-col text-center whitespace-nowrap text-sm">
            <span>
              <Trans
                i18nKey="task.emptyTip.1"
                components={{
                  onSchedule: <span className="font-semibold" />,
                }}
              />
            </span>
            <span>
              <Trans
                i18nKey="task.emptyTip.2"
                components={{
                  automate: <span className="font-semibold" />,
                  save: <span className="font-semibold" />,
                }}
              />
            </span>
          </div>
          <Button onClick={() => navigate(Path.NewTask)}>
            {t("task.emptyTip.create")}
          </Button>
        </div>
      ) : (
        <div
          className="flex-1 flex flex-col min-h-0 gap-5 pl-15 pr-13 scroll-container"
          onClick={() => setIsEdit(false)}
        >
          <div className="pb-5 h-max">
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col gap-2.5 min-h-0 h-full"
            >
              {isEdit ? (
                <TaskManagement
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
        </div>
      )}
    </div>
  );
}
