import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "../shadcn/alert-dialog";
import { Button } from "@/app/components/shadcn/button";
import { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import CloseIcon from "../../icons/close.svg";
import MapIcon from "../../icons/map.svg";

export type ConfirmOptions = {
  title: string;
  description?: string;
  type?: string;
};

type ConfirmContextType = (options: ConfirmOptions) => Promise<string>;

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx;
};

export const ConfirmProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolve, setResolve] = useState<(val: string) => void>();
  const [open, setOpen] = useState(false);

  const showConfirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<string>((res) => {
      setResolve(() => res);
    });
  }, []);

  const handleClose = (key: string) => {
    setOpen(false);
    resolve?.(key);
    setTimeout(() => setOptions(null), 300); // 清理 options
  };

  return (
    <ConfirmContext.Provider value={showConfirm}>
      {children}
      {options &&
        createPortal(
          <AlertDialog
            open={open}
            onOpenChange={(o) => !o && handleClose("decline")}
          >
            <AlertDialogContent className="!rounded-[18px] w-120">
              <div className="flex justify-between">
                <AlertDialogHeader>
                  <AlertDialogTitle className="!text-[21px]">
                    {options.title}
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogCancel
                  className="size-9 rounded-4xl border-0 hover:cursor-pointer hover:opacity-75 bg-[#F3F5F7] hover:bg-[#F3F5F7]/75"
                  onClick={() => handleClose("decline")}
                >
                  <CloseIcon className="size-6" />
                </AlertDialogCancel>
              </div>

              {options.type === "delete"
                ? options.description && (
                    <AlertDialogDescription className="flex items-center gap-2 text-lg font-normal text-[#141718]">
                      {options.description}
                    </AlertDialogDescription>
                  )
                : options.description && (
                    <AlertDialogDescription className="flex items-center gap-2 text-lg font-normal text-[#141718] border border-[#E8ECEF]  rounded-sm px-4 py-3">
                      <MapIcon />
                      {options.description}
                    </AlertDialogDescription>
                  )}

              {options.type === "delete" ? (
                <AlertDialogFooter className="flex justify-start">
                  <Button
                    className="h-10 bg-white hover:bg-[#F3F5F74D]  text-[#6C7275] dark:text-black border border-[#6C7275]/10 flex-center gap-3 px-5 py-3 rounded-xl"
                    onClick={() => {
                      handleClose("cancel");
                    }}
                  >
                    Cancel
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      className="h-10 bg-[#EF466F]/6 hover:bg-[#EF466F]/20 text-[#EF466F] dark:text-black flex-center gap-3 px-5 py-3 rounded-xl"
                      onClick={() => {
                        handleClose("confirm");
                      }}
                    >
                      Confirm
                    </Button>
                  </div>
                </AlertDialogFooter>
              ) : (
                <AlertDialogFooter className="flex justify-start">
                  <Button
                    className="h-10 bg-white hover:bg-[#F3F5F74D] text-[#6C7275] dark:text-black border border-[#6C7275]/10 flex-center gap-3 px-5 py-3 rounded-xl"
                    onClick={() => {
                      handleClose("decline");
                    }}
                  >
                    Decline
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      className="h-10 bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-[#00D47E] dark:text-black flex-center gap-3 px-5 py-3 rounded-xl"
                      onClick={() => {
                        handleClose("always");
                      }}
                    >
                      Allow always
                    </Button>
                    <Button
                      className="h-10 bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-[#00D47E] dark:text-black flex-center gap-3 px-5 py-3 rounded-xl"
                      onClick={() => {
                        handleClose("once");
                      }}
                    >
                      Allow once
                    </Button>
                  </div>
                </AlertDialogFooter>
              )}
            </AlertDialogContent>
          </AlertDialog>,
          document.body,
        )}
    </ConfirmContext.Provider>
  );
};
