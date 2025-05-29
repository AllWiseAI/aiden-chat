import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";

import { DEFAULT_TOPIC, useChatStore } from "../store";
import MoreIcon from "../icons/more.svg";
import EditIcon from "../icons/edit.svg";
import DeleteIcon from "../icons/delete.svg";
import CloseIcon from "../icons/close.svg";
import Locale from "../locales";
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

  const { pathname: currentPath } = useLocation();
  const [isEdit, setIsEdit] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [openMenu, setOpenMenu] = useState(false);
  const chatStore = useChatStore();
  const session = chatStore.sessions.find((s) => s.id === props.id)!;

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
            "p-2.5 rounded-xl group my-1",
            props.selected &&
              (currentPath === Path.Chat || currentPath === Path.Home)
              ? "bg-gray-200"
              : openMenu
              ? "bg-gray-100"
              : "hover:bg-gray-100",
          )}
          onClick={props.onClick}
          ref={(ele) => {
            draggableRef.current = ele;
            provided.innerRef(ele);
          }}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          title={`${props.title}\n${Locale.ChatItem.ChatItemCount(
            props.count,
          )}`}
        >
          {!props.narrow && (
            <>
              {isEdit ? (
                <Input
                  ref={inputRef}
                  className="!text-start text-[#232627] text-sm font-semibold"
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
                          (session) => (session.topic = DEFAULT_TOPIC),
                        );
                      }
                      setIsEdit(false);
                    }
                  }}
                  onBlur={() => {
                    if (props.title === "") {
                      chatStore.updateTargetSession(
                        session,
                        (session) => (session.topic = DEFAULT_TOPIC),
                      );
                    }
                    setIsEdit(false);
                  }}
                />
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex justify-start items-center gap-4 leading-6">
                    <div className="text-[#232627] cursor-default text-sm font-semibold w-full line-clamp-1">
                      {props.title}
                    </div>
                  </div>

                  <DropdownMenu open={openMenu} onOpenChange={setOpenMenu}>
                    <DropdownMenuTrigger
                      className="size-6 flex-center cursor-pointer "
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
                      className="flex flex-col p-2"
                      onCloseAutoFocus={(e) => {
                        e.preventDefault();
                      }}
                    >
                      <DropdownMenuRadioGroup>
                        <DropdownMenuRadioItem
                          value="rename"
                          className="flex justify-start gap-4 !pl-1 !py-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setIsEdit(true);
                            setOpenMenu(false);
                          }}
                        >
                          <EditIcon className="size-4" />
                          <span className="-ml-1 font-xs">Rename</span>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                          value="delete"
                          className="!text-[#D84C10] flex justify-start gap-4 !pl-1 !py-2"
                          onClick={() => {
                            setShowDeleteDialog(true);
                          }}
                        >
                          <DeleteIcon className="size-4" />
                          <span className="-ml-1 font-xs">Delete</span>
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
                  <AlertDialogContent className="!rounded-[18px] w-120">
                    <div className="flex justify-between">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="!text-[21px]">
                          Delete chat?
                        </AlertDialogTitle>
                      </AlertDialogHeader>

                      <AlertDialogCancel className="size-9 rounded-4xl border-0 hover:cursor-pointer hover:opacity-75 bg-[#F3F5F7] hover:bg-[#F3F5F7]/75">
                        <CloseIcon className="size-6" />
                      </AlertDialogCancel>
                    </div>
                    <AlertDialogDescription className="text-lg font-normal text-[#141718]">
                      Are you sure you want to delete chat?
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={props.onDelete}
                        className="bg-[#EF466F] hover:bg-[#EF466F]/75"
                      >
                        Delete
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
              className="select-none"
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
                      (await showConfirm(Locale.Home.DeleteChat))
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
