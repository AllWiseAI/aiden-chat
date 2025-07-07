import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";

import { defaultTopic, useChatStore } from "../store";
import MoreIcon from "../icons/more.svg";
import EditIcon from "../icons/edit.svg";
import DeleteIcon from "../icons/delete.svg";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Path } from "../constant";

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
import { Mask } from "../store/mask";
import { useRef, useEffect, useMemo, useState } from "react";
import { showConfirm } from "./ui-lib";
import { useMobileScreen } from "../utils";
import clsx from "clsx";
import { Input } from "./shadcn/input";

export function ChatItem(props: {
  onClick?: () => void;
  onDelete?: () => void;
  title: string;
  count: number;
  time: string;
  selected: boolean;
  id: string;
  index: number;
  narrow?: boolean;
  mask: Mask;
}) {
  const draggableRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (props.selected && draggableRef.current) {
      draggableRef.current?.scrollIntoView({
        block: "center",
      });
    }
  }, [props.selected]);

  const renderTitle = useMemo(() => {
    if (props.title === "") {
      return defaultTopic();
    }
    return props.title;
  }, [props.title]);

  const { pathname: currentPath } = useLocation();
  const [isEdit, setIsEdit] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [openMenu, setOpenMenu] = useState(false);
  const chatStore = useChatStore();
  const session = chatStore.sessions.find((s) => s.id === props.id)!;
  const { t } = useTranslation("general");

  useEffect(() => {
    if (isEdit && inputRef.current) {
      inputRef.current?.focus();
    }
  }, [isEdit]);

  return (
    <Draggable draggableId={`${props.id}`} index={props.index}>
      {(provided) => (
        <div
          className={clsx(
            "rounded-sm group h-7.5 flex flex-col justify-center",
            props.selected &&
              (currentPath === Path.Chat || currentPath === Path.Home)
              ? "bg-[#E8ECEF]/50 dark:bg-[#232323]"
              : openMenu
              ? "bg-bg-[#E8ECEF]/50 dark:bg-[#2F2F2F]"
              : "hover:bg-[#E8ECEF]/50 dark:hover:bg-[#2F2F2F]",
            !isEdit && "p-1.5",
          )}
          onClick={props.onClick}
          ref={(ele) => {
            draggableRef.current = ele;
            provided.innerRef(ele);
          }}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          title={`${props.title}\n${t("chatItem.chatItemCount", {
            count: props.count,
          })}`}
        >
          {!props.narrow && (
            <>
              {isEdit ? (
                <Input
                  ref={inputRef}
                  className="!h-full !text-start text-[#232627] dark:text-white !text-[13px] font-semibold border-main dark:border-main"
                  value={props.title}
                  onChange={(e) =>
                    chatStore.updateTargetSession(
                      session,
                      (session) => (session.topic = e.currentTarget.value),
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (props.title === "") {
                        chatStore.updateTargetSession(
                          session,
                          (session) => (session.topic = defaultTopic()),
                        );
                      }
                      setIsEdit(false);
                    }
                  }}
                  onBlur={() => {
                    if (props.title === "") {
                      chatStore.updateTargetSession(
                        session,
                        (session) => (session.topic = defaultTopic()),
                      );
                    }
                    setIsEdit(false);
                  }}
                />
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex justify-start items-center gap-4 leading-6">
                    <div
                      className={clsx(
                        "text-[#232627] dark:text-[#6C7275] cursor-default text-xs w-full line-clamp-1",
                        props.selected
                          ? "font-semibold dark:text-white"
                          : "font-normal",
                      )}
                    >
                      {renderTitle}
                    </div>
                  </div>

                  <DropdownMenu open={openMenu} onOpenChange={setOpenMenu}>
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
                          value="rename"
                          className="flex justify-start gap-2 !pl-1 !py-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setIsEdit(true);
                            setOpenMenu(false);
                          }}
                        >
                          <EditIcon className="size-[18px]" />
                          <span className="-ml-1 font-xs">
                            {t("chat.rename")}
                          </span>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                          value="delete"
                          className="!text-[#EF466F] flex justify-start gap-2 !pl-1 !py-2"
                          onClick={() => {
                            setShowDeleteDialog(true);
                          }}
                        >
                          <DeleteIcon className="size-[18px]" />
                          <span className="-ml-1 font-xs">
                            {t("chat.delete")}
                          </span>
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {
                <AlertDialog
                  open={showDeleteDialog}
                  onOpenChange={setShowDeleteDialog}
                >
                  <AlertDialogContent className="rounded-sm w-80 dark:text-white gap-5">
                    <div className="flex justify-center">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-sm">
                          {t("dialog.deleteTitle")}
                        </AlertDialogTitle>
                      </AlertDialogHeader>

                      {/* <AlertDialogCancel className="size-9 rounded-4xl border-0 hover:cursor-pointer hover:opacity-75 bg-[#F3F5F7] dark:bg-[#6C7275] hover:bg-[#F3F5F7]/75 dark:hover:bg-[#6C7275]/75">
                        <CloseIcon className="size-6" />
                      </AlertDialogCancel> */}
                    </div>
                    <AlertDialogDescription className="text-xs text-center font-normal text-[#141718] dark:text-white">
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
            </>
          )}
        </div>
      )}
    </Draggable>
  );
}

export function ChatList(props: { narrow?: boolean; searchValue?: string }) {
  const [sessions, selectedIndex, selectSession, moveSession] = useChatStore(
    (state) => [
      state.sessions,
      state.currentSessionIndex,
      state.selectSession,
      state.moveSession,
    ],
  );
  const chatStore = useChatStore();
  const navigate = useNavigate();
  const isMobileScreen = useMobileScreen();
  const { t } = useTranslation("general");

  const filteredSessions = useMemo(() => {
    if (!props.searchValue)
      return sessions.map((item, index) => ({ ...item, originIndex: index }));
    return sessions
      .map((item, index) => ({ ...item, originIndex: index }))
      .filter((item) =>
        item.topic.toLowerCase().includes(props.searchValue!.toLowerCase()),
      );
  }, [sessions, props.searchValue]);

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;
    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveSession(source.index, destination.index);
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="chat-list">
          {(provided) => (
            <div
              className="flex flex-col gap-[8px] select-none"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {filteredSessions.map((item) => (
                <ChatItem
                  title={item.topic}
                  time={new Date(item.lastUpdate).toLocaleString()}
                  count={item.messages.length}
                  key={item.id}
                  id={item.id}
                  index={item.originIndex}
                  selected={item.originIndex === selectedIndex}
                  onClick={() => {
                    navigate(Path.Chat);
                    selectSession(item.originIndex);
                  }}
                  onDelete={async () => {
                    if (
                      (!props.narrow && !isMobileScreen) ||
                      (await showConfirm(t("home.deleteChat")))
                    ) {
                      chatStore.deleteSession(item.originIndex);
                    }
                  }}
                  narrow={props.narrow}
                  mask={item.mask}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
}
