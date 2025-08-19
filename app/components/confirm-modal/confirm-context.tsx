import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../shadcn/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/shadcn/accordion";
import LoadingIcon from "../../icons/three-dots.svg";
import { Button } from "@/app/components/shadcn/button";
import { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import MapIcon from "../../icons/map.svg";
import Logo from "../../icons/logo.svg";
import LogoText from "../../icons/logo-text.svg";
import { t } from "i18next";
import dynamic from "next/dynamic";
import { prettyObject } from "@/app/utils/format";

const Markdown = dynamic(
  async () => (await import("@/app/components/markdown")).Markdown,
  {
    loading: () => <LoadingIcon />,
  },
);

export type ConfirmOptions = {
  title: string;
  description?: string;
  mcpInfo?: any;
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
        <AlertDialogFooter className="flex justify-between gap-2.5">
          <Button
            className="flex-1 h-8 text-xs bg-white hover:bg-[#F3F5F74D] dark:bg-[#141718] dark:hover:bg-[#141718]/8 text-[#6C7275] dark:text-white border border-[#6C7275]/10 dark:border-[#343839] flex-center gap-3 px-2.5 py-2 rounded-sm"
            onClick={() => {
              handleClose("cancel");
            }}
          >
            {t("dialog.cancel")}
          </Button>

          <Button
            className="flex-1 h-8 text-xs bg-[#EF466F] hover:bg-[#EF466F]/70 text-white dark:text-black dark:bg-[#EF466F] dark:hover:bg-[#EF466F]/70  flex-center gap-3 px-2.5 py-2 rounded-sm"
            onClick={() => {
              handleClose("confirm");
            }}
          >
            {t("dialog.delete")}
          </Button>
        </AlertDialogFooter>
      );
    }

    if (options?.type === "latestVersion") {
      return (
        <div className="flex items-center justify-center">
          <Button
            className="w-33 h-8 bg-main text-xs text-white dark:text-black flex-center gap-3 px-5 py-3 rounded-sm"
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
          className="h-7 bg-white hover:bg-[#F3F5F74D] dark:bg-[#141718] text-[#6C7275] text-sm border border-[#E8ECEF] dark:border-[#343839] flex-center gap-3 px-1.5 py-1 rounded-sm"
          onClick={() => {
            handleClose("decline");
          }}
        >
          {t("dialog.decline")}
        </Button>
        <div className="flex gap-2">
          <Button
            className="h-7 bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-main text-sm flex-center gap-3 px-1.5 py-1 rounded-sm"
            onClick={() => {
              handleClose("always");
            }}
          >
            {t("dialog.allowAlways")}
          </Button>
          <Button
            className="h-7 bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-main text-sm flex-center gap-3 px-1.5 py-1 rounded-sm"
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
        <AlertDialogDescription className="flex justify-center items-center text-xs font-normal text-[#141718] dark:text-white">
          {options.description}
        </AlertDialogDescription>
      );
    }

    if (options?.type === "latestVersion") {
      return (
        <AlertDialogDescription className="text-center gap-2 text-sm font-normal text-[#141718] dark:text-white mb-2">
          {options.description}
        </AlertDialogDescription>
      );
    }

    return (
      <AlertDialogDescription className="w-[278px] flex flex-col items-center gap-2.5 text-base font-normal text-[#141718] dark:text-white border border-[#E8ECEF] dark:border-[#232627] rounded-xl px-2.5 py-2 whitespace-nowrap">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value={options.title}>
            <AccordionTrigger className="!py-0">
              <div className="flex gap-2">
                <MapIcon className="size-[18px] shrink-0" />
                {options.description}
              </div>
            </AccordionTrigger>
            <AccordionContent className="!pb-0 w-full">
              <div className="mt-2.5 max-w-full overflow-x-auto">
                <Markdown content={prettyObject(options.mcpInfo || "")} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
            <AlertDialogContent className="!rounded-sm w-max min-w-80 p-5 gap-5">
              <div className="flex justify-center">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-[18px] font-medium text-black dark:text-white">
                    {options.title}
                  </AlertDialogTitle>
                </AlertDialogHeader>
                {/* {!options.noClose && (
                  <AlertDialogCancel
                    className="size-9 rounded-4xl border-0 hover:cursor-pointer hover:opacity-75 bg-[#F3F5F7] dark:bg-[#6C7275] hover:bg-[#F3F5F7]/75 dark:hover:bg-[#6C7275]/75"
                    onClick={() => handleClose("decline")}
                  >
                    <CloseIcon className="size-6" />
                  </AlertDialogCancel>
                )} */}
              </div>
              {options.withLogo && (
                <div className="flex items-end justify-center gap-2 w-full mb-2 -mt-[16px]">
                  <Logo className="size-[22px] text-[#00D47E]" />
                  <LogoText className="h-[17px] dark:text-white" />
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
