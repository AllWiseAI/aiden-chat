import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTaskStore } from "../store";
import { useState, useMemo, useEffect } from "react";
import { Button } from "./shadcn/button";
import { Task as TaskType, TaskAction, TaskExecutionRecord } from "../typing";
import EditIcon from "../icons/edit.svg";
import TaskManagement, { Notification } from "./task-management";
import dayjs from "dayjs";
import { getTaskExecutionRecords } from "@/app/services/task";
import clsx from "clsx";
import SuccessIcon from "../icons/success.svg";
import PendingIcon from "../icons/time.svg";
import FailedIcon from "../icons/close.svg";
import { Path } from "../constant";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chat";

interface TaskPanelProps {
  task: TaskType;
  setIsEdit: () => void;
  updateNotification: (id: string) => void;
}

interface TaskItemProps {
  taskInfo: TaskExecutionRecord;
  title: string;
}

function formatCustomTime(date: string, hour: number, minute: number): string {
  const full = dayjs(`${dayjs(date).format("YYYY-MM-DD")}T${hour}:${minute}`);
  const formatHour = hour % 12 === 0 ? hour : hour % 12;
  const formatMinute = minute < 10 ? `0${minute}` : minute;
  const suffix = hour < 12 ? "am" : "pm";

  return `${full.format("dddd, MMM D")} ${formatHour}:${formatMinute}${suffix}`;
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
    const { task_id, request_messages, response_data } = taskInfo;
    // const { task_id, created_at, completed_at } = taskInfo;
    // const response_data = {
    //   message: {
    //     date: completed_at,
    //     role: "assistant",
    //     content:
    //       "我目前无法直接发送信息给小明。你可以通过你的通讯软件（如微信、QQ、短信等）直接联系他，并问他是否愿意一起去打球。",
    //   },
    //   id: "813aeee4-89e0-4e93-af4f-daaa6eaf322f",
    //   extra: {
    //     mcp: null,
    //   },
    // };
    // const request_messages = [
    //   {
    //     date: created_at,
    //     role: "user",
    //     content: "发信息给小明，问他要不要去打球",
    //   },
    // ];
    console.log("detailData", request_messages, response_data, task_id);
    const isExist = chatStore.haveTaskSession(task_id);
    if (!isExist) {
      chatStore.newTaskSession({
        taskId: task_id,
        // @ts-ignore
        requestData: request_messages,
        // @ts-ignore
        responseData: response_data,
      });
    } else {
      chatStore.selectTaskSession(task_id);
    }
    navigate(Path.Chat);
  };

  return (
    <div>
      <div className="flex justify-between items-center px-5 py-3 bg-[#F3F5F7] dark:bg-[#232627] rounded-xl">
        <div className="flex items-center gap-2">
          <p>{title}</p>
          <StatusIcon
            className={clsx("size-[18px]", {
              "text-main": status === TaskAction.Success,
              "text-[#F5BF4F]": status === TaskAction.Pending,
              "text-[#EF466F]": status === TaskAction.Failed,
            })}
          />
        </div>
        {status !== TaskAction.Pending && (
          <div
            className="text-main select-none cursor-pointer hover:opacity-75"
            onClick={handleDetailClick}
          >
            {t("task.details")}
          </div>
        )}{" "}
        {/* <div
          className="text-main select-none cursor-pointer hover:opacity-75"
          onClick={handleDetailClick}
        >
          {t("task.details")}
        </div> */}
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
        console.log("records", records);
        setRecordList(records);
      } else {
        setRecordList([]);
      }
    };
    getRecord();
  }, [taskItem]);

  if (!taskItem) return null;

  const renderTaskDetail = async () => {
    const { date, hour, minute } = taskItem || {};
    return recordList.map((record) => (
      <TaskItem
        key={record.id}
        taskInfo={record}
        title={formatCustomTime(date, hour!, minute!)}
      />
    ));
  };

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
        <>
          <TaskPanel
            task={taskItem}
            setIsEdit={() => setIsEdit(true)}
            updateNotification={updateNotification}
          />
          {renderTaskDetail()}
        </>
      )}
    </div>
  );
}
