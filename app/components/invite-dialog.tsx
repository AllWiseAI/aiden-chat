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
  const isVip = useMemo(() => {
    const item = inviteArr.at(-1);
    if (item?.usage_limit === 1000) {
      return true;
    } else return false;
  }, [inviteArr]);

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
    copyToClipboard(inviteArr.at(index ?? -1)!.code, t("invite.copy"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className={clsx(
          "flex flex-col max-w-xl w-150 h-95 rounded-sm p-5 pb-2 bg-[#FEFEFE] dark:bg-black",
          isVip ? "gap-15" : "gap-5",
        )}
        closeIcon
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg text-center dark:text-[#FEFEFE] font-normal">
            {isVip ? t("invite.vip.title") : t("invite.title")}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex-center flex-1">
            <LoadingIcon className="size-6 animate-spin" />
          </div>
        ) : isVip ? (
          <div className="flex flex-col gap-8 flex-1">
            <div className="relative flex-center">
              <p className="text-main text-6xl">{inviteArr.at(-1)?.code}</p>
              <ShareIcon
                className={clsx(
                  "absolute right-16 text-[#6C7275]",
                  inviteArr.at(-1)!.current_usage_count <
                    inviteArr.at(-1)!.usage_limit
                    ? "light:hover:opacity-70 dark:hover:text-white cursor-pointer"
                    : "opacity-40",
                )}
                onClick={() => {
                  if (
                    inviteArr.at(-1)!.current_usage_count <
                    inviteArr.at(-1)!.usage_limit
                  ) {
                    handleClick();
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-5 px-8 text-sm">
              <div className="flex justify-between bg-[#FAFAFA] dark:bg-[#0F0F0F] px-3">
                <span>{t("invite.vip.count")}</span>
                <div className="w-7 flex-center">
                  <span>{inviteArr.at(-1)?.current_usage_count}</span>
                </div>
              </div>
              <div className="flex justify-between bg-[#FAFAFA] dark:bg-[#0F0F0F] px-3">
                <span>{t("invite.vip.max")}</span>
                <span>{inviteArr.at(-1)?.usage_limit}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-[#FEFEFE] dark:bg-black border-b-[14px] border-b-transparent">
                <tr className="h-[22px]">
                  <th className="w-1/3 h-full px-2 text-center font-normal">
                    {t("invite.table.1")}
                  </th>
                  <th className="w-1/3 h-full px-2 text-center font-normal">
                    {t("invite.table.2")}
                  </th>
                  <th className="w-1/3 h-full px-2 text-center font-normal">
                    {t("invite.table.3")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {inviteArr.map((item, index) => (
                  <tr
                    className="h-[46px] leading-8 border-b-[14px] border-b-transparent"
                    key={item.id}
                  >
                    <td className="text-center">{item.code}</td>
                    <td>
                      {item.current_usage_count < item.usage_limit ? (
                        <div className="flex-center text-main">
                          {t("invite.unused")}
                        </div>
                      ) : (
                        <div className="flex-center opacity-40 text-[#101213] dark:text-[#FEFEFE]">
                          {t("invite.used")}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex-center">
                        <ShareIcon
                          className={clsx(
                            "text-[#6C7275]",
                            item.current_usage_count < item.usage_limit
                              ? "light:hover:opacity-70 dark:hover:text-white cursor-pointer"
                              : "opacity-40",
                          )}
                          onClick={() => {
                            if (item.current_usage_count < item.usage_limit) {
                              handleClick(index);
                            }
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter className="!justify-center text-xs font-medium text-main">
          {isVip ? t("invite.vip.tip") : t("invite.tip")}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
