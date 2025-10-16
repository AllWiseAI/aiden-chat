import { Dispatch, useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "./shadcn/dialog";
import clsx from "clsx";
import { apiGetInviteCode } from "../services";
import { copyToClipboard } from "../utils";
import { useTranslation } from "react-i18next";
import LoadingIcon from "../icons/loading-spinner.svg";
import ShareIcon from "../icons/share.svg";
import ShareDisabledIcon from "../icons/share-disabled.svg";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: Dispatch<React.SetStateAction<boolean>>;
}

type inviteArrayItem = {
  benefit_months: number;
  code: string;
  created_at: string;
  creator_user_id: number;
  current_usage_count: number;
  expires_at: number;
  id: number;
  is_active: boolean;
  usage_limit: number;
};

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
  const [inviteArr, setInviteArr] = useState<inviteArrayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation("general");

  const vipItem = useMemo(() => {
    return inviteArr.find((item) => item.usage_limit === 1000);
  }, [inviteArr]);
  const isVip = useMemo(() => {
    return vipItem === undefined ? false : true;
  }, [vipItem]);

  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = (await apiGetInviteCode()) as inviteArrayItem[];
        setInviteArr(data);
      } catch (error) {
        console.error("Failed to fetch invite codes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open]);

  const handleClick = (index?: number) => {
    copyToClipboard(
      t(`invite.${isVip ? "textVip" : "text"}`, {
        inviteCode:
          index !== undefined ? inviteArr.at(index)!.code : vipItem?.code,
      }),
      t("invite.copy"),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        closeIconClass={isVip ? "text-[#6C7275] hover:text-white" : ""}
        className={clsx(
          "flex flex-col max-w-xl w-150 h-95 rounded-sm p-5 bg-[#FEFEFE] dark:bg-black overflow-hidden",
          isVip
            ? "gap-8 border-0 bg-black bg-[url('https://static.aidenai.io/static/1755670652.png')] bg-cover bg-center"
            : "gap-8",
        )}
        closeIcon
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle
            className={clsx(
              "text-lg text-center font-normal",
              isVip ? "text-[#FEFEFE]" : "text-[#141718] dark:text-[#FEFEFE]",
            )}
          >
            {isVip ? t("invite.vip.title") : t("invite.title")}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex-center flex-1">
            <LoadingIcon className="size-6 animate-spin" />
          </div>
        ) : !isVip ? (
          <div className="flex flex-col gap-8 flex-1">
            <div className="flex-center flex-col gap-5">
              <p className="text-main text-6xl">{vipItem?.code}</p>
              <div
                className={clsx(
                  "w-30 h-12 flex-center text-[#FEFEFE] bg-[#000000]/49 backdrop-blur-xl border-3 border-[#00D47E] rounded-4xl",
                  vipItem && vipItem.current_usage_count < vipItem.usage_limit
                    ? "hover:bg-[#000000]/75 cursor-pointer"
                    : "opacity-40",
                )}
                onClick={() => {
                  if (
                    vipItem &&
                    vipItem.current_usage_count < vipItem.usage_limit
                  ) {
                    handleClick();
                  }
                }}
              >
                <span>Share</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 px-8 text-sm font-light">
              <div className="h-9 flex justify-between items-center rounded-4xl backdrop-blur-xl text-white bg-[#000000]/17 px-3">
                <span>{t("invite.vip.count")}</span>
                <div className="w-7 flex-center">
                  <span>{vipItem?.current_usage_count}</span>
                </div>
              </div>
              <div className="h-9 flex justify-between items-center rounded-4xl backdrop-blur-xl text-white bg-[#000000]/17 px-3">
                <span>{t("invite.vip.max")}</span>
                <span>{vipItem?.usage_limit}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <div className="w-full font-light">
              <div className="sticky top-0 z-10 bg-[#FEFEFE] dark:bg-black border-b-[14px] border-b-transparent">
                <div className="h-[22px] flex">
                  <div className="w-1/3 h-full px-2 text-center font-normal">
                    {t("invite.table.1")}
                  </div>
                  <div className="w-1/3 h-full px-2 text-center font-normal">
                    {t("invite.table.2")}
                  </div>
                  <div className="w-1/3 h-full px-2 text-center font-normal">
                    {t("invite.table.3")}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {inviteArr.map((item, index) => (
                  <div
                    className="h-8 leading-8 flex justify-between rounded-full bg-[#FAFAFA] dark:bg-[#151718]"
                    key={item.id}
                  >
                    <div
                      className={clsx(
                        "text-center flex-1",
                        item.current_usage_count < item.usage_limit
                          ? "text-main"
                          : "opacity-40 text-[#101213] dark:text-[#FEFEFE]",
                      )}
                    >
                      {item.code}
                    </div>
                    <div className="flex-1">
                      {item.current_usage_count < item.usage_limit ? (
                        <div className="flex-center text-[#101213] dark:text-[#FEFEFE]">
                          {t("invite.unused")}
                        </div>
                      ) : (
                        <div className="flex-center opacity-40 text-[#101213] dark:text-[#FEFEFE]">
                          {t("invite.used")}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex-center">
                      {item.current_usage_count < item.usage_limit ? (
                        <ShareIcon
                          className="hover:opacity-80 text-black dark:text-[#00FF98] cursor-pointer"
                          onClick={() => handleClick(index)}
                        />
                      ) : (
                        <ShareDisabledIcon className="text-[#6C7275] opacity-40 dark:text-[#FEFEFE]" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="!justify-center text-xs font-medium text-main">
          {isVip ? t("invite.vip.tip") : t("invite.tip")}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
