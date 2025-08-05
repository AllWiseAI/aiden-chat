"use client";

import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/app/components/shadcn/dialog";
import { Button } from "@/app/components/shadcn/button";
import { t } from "i18next";
import { useTranslation } from "react-i18next";

import { addOAuthCredential, revokeCredential } from "@/app/services/oauth";
import { useAppConfig } from "@/app/store";
import EmailIcon from "@/app/icons/email.svg";
import DeleteIcon from "@/app/icons/delete.svg";
import AddIcon from "@/app/icons/add.svg";
import AddOutlineIcon from "@/app/icons/add-outline.svg";
import { AccountItem, McpItemInfo } from "@/app/typing";
import DeleteDialog from "@/app/components/delete-dialog";
import { toast } from "sonner";

interface McpOauthModalProps {
  mcpInfo: McpItemInfo;
  open: boolean;
  onConfirm: () => void;
  onOpenChange?: (open: boolean) => void;
}

export function McpOauthModal({
  mcpInfo,
  open,
  onConfirm,
  onOpenChange,
}: McpOauthModalProps) {
  if (mcpInfo.mcp_key === "aiden-outlook") {
    console.log(mcpInfo);
  }
  const { t: tInner } = useTranslation("settings");

  const oauthAccounts = useAppConfig((state) => state.oauthAccounts);
  const updateOauthAccount = useAppConfig((state) => state.updateOauthAccount);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<AccountItem>();

  const handleDeleteAccount = (item: AccountItem) => {
    setCurrentAccount(item);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (currentAccount) {
      resolveDeleteAccount(currentAccount);
    }
    setIsDeleteOpen(false);
  };

  const resolveDeleteAccount = async (item: AccountItem) => {
    const { mcp_key } = mcpInfo;
    try {
      const res = await revokeCredential({
        server_name: mcp_key,
        service: item.service,
        account: item.account,
      });

      if (res?.message === "Credential revoked") {
        updateOauthAccount(
          oauthAccounts.filter((i) => i.account !== item.account),
        );
        toast.success(tInner("mcp.delete.success"));
      } else {
        toast.error(tInner("mcp.delete.fail"));
      }
    } catch {
      toast.error(tInner("mcp.delete.fail"));
    }
  };

  const handleConfirm = useCallback(() => {
    onConfirm();
    onOpenChange?.(false);
  }, [onConfirm, onOpenChange]);

  const handleAddAcount = useCallback(async () => {
    const { aiden_credential } = mcpInfo;
    if (aiden_credential && aiden_credential.type === "oauth") {
      try {
        const res = await addOAuthCredential(mcpInfo.mcp_key);

        if (res?.message === "Credential added completed") {
          const merged = [...oauthAccounts, ...res.data.accounts];
          const unique = Array.from(
            new Map(merged.map((item) => [item.account, item])).values(),
          );
          updateOauthAccount(unique);
          toast.success(tInner("mcp.add.success"));
        } else {
          toast.error(tInner("mcp.add.fail"));
        }
      } catch (err: any) {
        if (err?.status === 400) {
          toast.error(tInner("mcp.add.fail"));
        } else {
          toast.error(tInner("mcp.add.fail"));
        }
      }
    }
  }, []);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl w-80 rounded-sm gap-5 p-5"
        closeIcon={false}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg text-center dark:text-[#FEFEFE]">
            {t("dialog.outlookAccount")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {oauthAccounts.map((item) => (
            <div
              key={item.account}
              className="flex justify-between items-center  border border-[#E8ECEF] dark:border-[#232627] rounded-sm px-2.5 py-2"
            >
              <div className="flex gap-2 items-center text-xs">
                <EmailIcon size={5} />
                <span>{item.account}</span>
              </div>
              <Button
                variant="ghost"
                className="size-6 text-[#EF466F]"
                onClick={() => handleDeleteAccount(item)}
              >
                <DeleteIcon className="size-4" />
              </Button>
            </div>
          ))}
          {oauthAccounts.length ? (
            <Button
              variant="ghost"
              className="h-9 text-main flex justify-start items-center gap-1 !px-1.5 py-1.5 rounded-sm"
              onClick={handleAddAcount}
            >
              <AddIcon className="size-5 text-main" />
              <span className="text-main font-medium select-none">
                {tInner("mcp.addAccount")}
              </span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="h-9 text-sm w-full text-center border border-[#E8ECEF] dark:border-[#232627] bg-transparent hover:bg-transparent text-main flex justify-center items-center gap-1 !px-1.5 py-1.5 rounded-sm"
              onClick={handleAddAcount}
            >
              <AddOutlineIcon className="size-5" />
              <span className="text-main font-medium select-none">
                {tInner("mcp.addAccountTips")}
              </span>
            </Button>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild className="flex-1">
            <Button
              className="bg-white h-8 rounded-sm hover:bg-[#F3F5F74D] dark:bg-[#141718] dark:border-[#343839] dark:hover:bg-[#141718]/8 text-[#6C7275] dark:text-[#FEFEFE] border border-[#6C7275]/10 px-2.5 py-2"
              type="button"
              onClick={() => onOpenChange?.(false)}
            >
              {t("dialog.cancel")}
            </Button>
          </DialogClose>
          <DialogClose asChild className="flex-1">
            <Button
              className="h-8 rounded-sm bg-[#00D47E] text-white dark:text-black px-2.5 py-2"
              onClick={handleConfirm}
              type="button"
            >
              {t("dialog.save")}
            </Button>
          </DialogClose>
          <DeleteDialog
            title={tInner("mcp.delete.title")}
            description={tInner("mcp.delete.description")}
            onConfirm={confirmDelete}
            onCancel={() => setIsDeleteOpen(false)}
            isOpen={isDeleteOpen}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
