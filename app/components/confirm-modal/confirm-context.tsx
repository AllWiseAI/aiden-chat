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
import AidenIcon from "../../icons/logo-text.svg";
import { t } from "i18next";

export type ConfirmOptions = {
  title: string;
  description?: string;
  type?: "delete" | "latestVersion" | "setting";
  noClose?: boolean;
  withLogo?: boolean;
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

  const handleClose = useCallback(
    (key: string) => {
      setOpen(false);
      resolve?.(key);
      setTimeout(() => setOptions(null), 300);
    },
    [resolve],
  );

  const renderFooter = useCallback(() => {
    if (!options) return null;
    if (options?.type === "delete") {
      return (
        <AlertDialogFooter className="flex justify-start">
          <Button
            className="h-10 bg-white hover:bg-[#F3F5F74D] dark:bg-[#141718] dark:hover:bg-[#141718]/8 text-[#6C7275] dark:text-white border border-[#6C7275]/10 dark:border-[#6C7275] flex-center gap-3 px-5 py-3 rounded-xl"
            onClick={() => {
              handleClose("cancel");
            }}
          >
            {t("dialog.cancel")}
          </Button>
          <div className="flex gap-2">
            <Button
              className="h-10 bg-[#EF466F]/6 hover:bg-[#EF466F]/20 text-[#EF466F] dark:text-white dark:bg-[#EF466F] dark:hover:bg-[#EF466F]/70 flex-center gap-3 px-5 py-3 rounded-xl"
              onClick={() => {
                handleClose("confirm");
              }}
            >
              {t("dialog.confirm")}
            </Button>
          </div>
        </AlertDialogFooter>
      );
    }

    if (options?.type === "latestVersion") {
      return (
        <div className="flex items-center justify-center">
          <Button
            className="h-10 bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-main flex-center gap-3 px-5 py-3 rounded-xl"
            onClick={() => {
              handleClose("confirm");
            }}
          >
            {t("dialog.confirm")}
          </Button>
        </div>
      );
    }

    return (
      <AlertDialogFooter className="flex !justify-between">
        <Button
          className="h-10 bg-white hover:bg-[#F3F5F74D] dark:bg-[#141718] text-[#6C7275] border border-[#E8ECEF] dark:border-[#343839] flex-center gap-3 px-5 py-3 rounded-xl"
          onClick={() => {
            handleClose("decline");
          }}
        >
          {t("dialog.decline")}
        </Button>
        <div className="flex gap-2">
          <Button
            className="h-10 bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-main flex-center gap-3 px-5 py-3 rounded-xl"
            onClick={() => {
              handleClose("always");
            }}
          >
            {t("dialog.allowAlways")}
          </Button>
          <Button
            className="h-10 bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-main flex-center gap-3 px-5 py-3 rounded-xl"
            onClick={() => {
              handleClose("once");
            }}
          >
            {t("dialog.allowOnce")}
          </Button>
        </div>
      </AlertDialogFooter>
    );
  }, [options, handleClose]);

  const renderDescription = useCallback(() => {
    if (!options) return null;
    if (options?.type === "delete") {
      return (
        <AlertDialogDescription className="flex items-center text-lg font-normal text-[#141718] dark:text-white">
          {options.description}
        </AlertDialogDescription>
      );
    }

    if (options?.type === "latestVersion") {
      return (
        <AlertDialogDescription className="text-center gap-2 text-lg font-normal text-[#141718] dark:text-white mb-2">
          {options.description}
        </AlertDialogDescription>
      );
    }

    return (
      <AlertDialogDescription className="flex items-center gap-2 text-lg font-normal text-[#141718] dark:text-white border border-[#E8ECEF] dark:border-[#232627] rounded-xl px-4 py-3">
        <MapIcon />
        {options.description}
      </AlertDialogDescription>
    );
  }, [options]);

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
                  <AlertDialogTitle className="!text-[21px] text-black dark:text-white">
                    {options.title}
                  </AlertDialogTitle>
                </AlertDialogHeader>
                {!options.noClose && (
                  <AlertDialogCancel
                    className="size-9 rounded-4xl border-0 hover:cursor-pointer hover:opacity-75 bg-[#F3F5F7] dark:bg-[#6C7275] hover:bg-[#F3F5F7]/75 dark:hover:bg-[#6C7275]/75"
                    onClick={() => handleClose("decline")}
                  >
                    <CloseIcon className="size-6" />
                  </AlertDialogCancel>
                )}
              </div>
              {options.withLogo && (
                <div className="flex items-center justify-center w-full mb-2 -mt-[16px]">
                  <AidenIcon className="scale-75" />
                </div>
              )}
              {renderDescription()}
              {renderFooter()}
            </AlertDialogContent>
          </AlertDialog>,
          document.body,
        )}
    </ConfirmContext.Provider>
  );
};
