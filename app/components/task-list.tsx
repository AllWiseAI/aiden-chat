import { useTaskStore } from "../store";
import { useState } from "react";
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
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import MoreIcon from "../icons/more.svg";
import DeleteIcon from "../icons/delete.svg";

export function TaskItem(props: {
  selected: boolean;
  name: string;
  onDelete: () => void;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const { t } = useTranslation("general");

  return (
    <div
      className={clsx(
        "rounded-sm group h-7.5 p-1.5 flex flex-col justify-center cursor-default",
        props.selected
          ? "bg-[#E8ECEF]/50 dark:bg-[#232323]"
          : "hover:bg-[#E8ECEF]/50 dark:hover:bg-[#232627]/50",
      )}
    >
      <div className="flex justify-between items-center">
        <div className="flex justify-start items-center gap-4 leading-6">
          <div
            className={clsx(
              "text-[#232627] dark:text-[#6C7275] cursor-default text-xs w-full line-clamp-1",
            )}
          >
            {props.name}
          </div>
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
                  console.log(111);
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
                    {t("dialog.deleteTitle")}
                  </AlertDialogTitle>
                </AlertDialogHeader>
              </div>
              <AlertDialogDescription className="text-sm text-center font-normal text-[#141718] dark:text-white">
                {t("dialog.alert")}
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
//{}: { narrow?: string; searchValue?: string }
export function TaskList() {
  const tasks = useTaskStore((state) => state.tasks);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  // const selectedIndex = useState();
  console.log(122, tasks);
  return (
    <div className="flex flex-col gap-[8px]">
      {tasks.map((item, index) => (
        <TaskItem
          key={item.id}
          name={item.name}
          onDelete={() => deleteTask(index)}
        />
      ))}
    </div>
  );
}
