import { useTaskStore, useAppConfig } from "../store";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { useLocation, useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { Task, ModelHeaderInfo } from "../typing";
import { getTaskList } from "../services/task";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/app/components/shadcn/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/shadcn/alert-dialog";
import MoreIcon from "../icons/more.svg";
import DeleteIcon from "../icons/delete.svg";
import ArrowDownIcon from "../icons/arrow-down.svg";
import { deleteTask as deleteTaskService } from "../services/task";
import { toast } from "sonner";

export function TaskItem(props: {
  selected: boolean;
  name: string;
  isUpdate: boolean;
  className: string;
  onClick: () => void;
  onDelete: () => void;
}) {
  const location = useLocation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const { t } = useTranslation("general");

  return (
    <div
      onClick={props.onClick}
      className={clsx(
        "rounded-sm group h-7.5 p-1.5 flex flex-col justify-center cursor-default",
        props.selected && location.pathname !== Path.NewTask
          ? "bg-[#E8ECEF] dark:bg-[#343839]"
          : "hover:bg-[#E8ECEF]/50 dark:hover:bg-[#232627]/50",
      )}
    >
      <div className="flex justify-between items-center">
        <div
          className={clsx(
            "flex justify-start items-center gap-2 leading-6 cursor-default text-sm w-full line-clamp-1",
            props.selected && location.pathname !== Path.NewTask
              ? "text-[#141718] dark:text-white font-medium"
              : props.className
              ? props.className
              : "text-[#343839] dark:text-[#FEFEFE] font-normal",
          )}
        >
          {props.name}
          {props.isUpdate && (
            <div className="size-[5px] bg-[#EF466F] rounded-full"></div>
          )}
        </div>

        <DropdownMenu open={openMenu} onOpenChange={setOpenMenu} modal={false}>
          <DropdownMenuTrigger
            className="size-4 flex-center cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreIcon
              className={clsx(
                "transition-opacity",
                openMenu ? "block" : "hidden group-hover:block",
              )}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            asChild
            className="flex flex-col p-2 min-w-max"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
            }}
          >
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem
                value="delete"
                className="!text-[#EF466F] flex justify-start gap-2 !pl-1 !py-2"
                onClick={() => {
                  setShowDeleteDialog(true);
                }}
              >
                <DeleteIcon className="size-[18px]" />
                <span className="-ml-1 font-xs">{t("chat.delete")}</span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {
          <AlertDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <AlertDialogContent className="rounded-sm w-80 dark:text-white gap-5">
              <div className="flex justify-center">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-[18px]">
                    {t("dialog.deleteTaskTitle")}
                  </AlertDialogTitle>
                </AlertDialogHeader>
              </div>
              <AlertDialogDescription className="text-sm text-center font-normal text-[#141718] dark:text-white">
                {t("dialog.alertTask")}
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel className="flex-1 rounded-sm hover:bg-[#F3F5F74D] border border-[#E8ECEF] dark:border-[#343839] font-medium">
                  {t("dialog.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={props.onDelete}
                  className="flex-1 bg-[#EF466F] hover:bg-[#EF466F]/75 rounded-sm font-medium"
                >
                  {t("dialog.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      </div>
    </div>
  );
}

export function TaskList(props: { searchValue?: string }) {
  const { searchValue } = props;
  const { t } = useTranslation("general");
  const tasks = useTaskStore((state) => state.tasks);
  const initTasks = useTaskStore((state) => state.initTasks);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const selectedId = useTaskStore((state) => state.currentTaskId);
  const setSelectedId = useTaskStore((state) => state.setCurrentTaskId);
  const navigate = useNavigate();
  const getModelInfo = useAppConfig((state) => state.getModelInfo);
  const [taskList, setTaskList] = useState<(Task & { isUpdate: boolean })[]>(
    [],
  );

  useEffect(() => {
    if (tasks) {
      setTaskList(tasks.map((t) => ({ ...t, isUpdate: t.show_unread })));
    }
  }, [tasks]);

  const resolveModelInfo = (modelInfo: ModelHeaderInfo) => {
    const apiKey = modelInfo["Aiden-Model-Api-Key"];
    const modelName = modelInfo["Aiden-Model-Name"];
    const providerName = modelInfo["Aiden-Model-Provider"];
    if (apiKey) {
      return getModelInfo(`${providerName}:${modelName}`);
    }
    return getModelInfo(modelName);
  };

  useEffect(() => {
    async function getBackendTasks() {
      const res = await getTaskList();
      const { code, data } = res;
      if (code === 0 && data && data.length) {
        const formatTaskList = data.map((item: Task) => ({
          ...item,
          modelInfo: resolveModelInfo(item.model_info),
        }));
        initTasks(formatTaskList);
      }
    }
    getBackendTasks();
  }, []);

  const renderTaskList = useMemo(() => {
    if (!taskList) return [];
    return taskList.sort((a, b) => {
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }, [taskList]);

  const handleDeleteTask = async (item: Task) => {
    const { id } = item || {};
    const res = await deleteTaskService(id);
    const { code } = res;
    if (code === 0) {
      deleteTask(id);
      if (item.id === selectedId) {
        setSelectedId(tasks[0]?.id || "");
        navigate(`${Path.Task}/${tasks[0]?.id || ""}`);
      }
    } else {
      toast.error(t("task.deleteFailed"));
    }
  };

  const [showMore, setShowMore] = useState(false);
  const filteredTasks = useMemo(() => {
    if (!searchValue) {
      const expiredIndex = renderTaskList.findIndex(
        (item) => item.next_run_time === null,
      );
      const length = renderTaskList.length;
      if (expiredIndex + 5 >= length) {
        setShowMore(true);
      }
      return showMore
        ? renderTaskList.slice(0, Math.min(expiredIndex + 5, length))
        : renderTaskList;
    }
    const lowerSearch = searchValue.toLowerCase();
    return renderTaskList.filter((task) =>
      task.name.toLowerCase().includes(lowerSearch),
    );
  }, [renderTaskList, searchValue, showMore]);

  return (
    <div className="flex flex-col gap-2">
      {filteredTasks.map((item) => (
        <TaskItem
          key={item.id}
          name={item.name}
          className={
            item.next_run_time === null
              ? "text-[#6C7275]/75 dark:text-[#E8ECEF]/50"
              : ""
          }
          isUpdate={item.isUpdate}
          selected={item.id === selectedId}
          onClick={() => {
            setTaskList((prev) =>
              prev.map((t) =>
                t.id === item.id ? { ...t, isUpdate: false } : t,
              ),
            );
            setSelectedId(item.id);
            navigate(`${Path.Task}/${item.id}`);
          }}
          onDelete={() => handleDeleteTask(item)}
        />
      ))}
      {!searchValue && showMore && (
        <div
          className="text-sm text-[#6C7275]/75 dark:text-[#E8ECEF]/50 rounded-sm group h-7.5 p-1.5 flex justify-between cursor-default hover:bg-[#E8ECEF]/50 dark:hover:bg-[#232627]/50"
          onClick={() => setShowMore(false)}
        >
          {t("task.viewMore")}
          <ArrowDownIcon />
        </div>
      )}
    </div>
  );
}
